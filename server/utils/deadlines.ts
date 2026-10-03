import { and, eq, gte, inArray, lt, or, sql } from 'drizzle-orm'

const DAY_MS = 24 * 60 * 60 * 1000

export function revisionDeadlineFrom(submittedAt: Date, revisionWindowDays: number) {
  return new Date(submittedAt.getTime() + revisionWindowDays * DAY_MS)
}

export const isPast = (date: Date | null) => !!date && date.getTime() < Date.now()

// No cron in the MVP: expired due dates are applied lazily on every API request
export async function syncDeadlines() {
  const today = todayISO()

  const expired = await db.execute<{ task_id: number }>(sql`
    update assignments a set status = 'expired'
    from tasks t
    where a.task_id = t.id and a.status = 'in_progress' and t.due_date < ${today}
    returning a.task_id`)

  const expiredTaskIds = expired.rows.map(r => r.task_id)
  await db.update(schema.tasks).set({ status: 'overdue' }).where(or(
    expiredTaskIds.length ? inArray(schema.tasks.id, expiredTaskIds) : sql`false`,
    and(eq(schema.tasks.status, 'open'), lt(schema.tasks.dueDate, today))
  ))
}

// Pending items owned by the organization whose revision window has expired.
// While any exists, the organization cannot publish new tasks.
export function overduePendings(organizationId: number) {
  return db.select({
    assignmentId: schema.assignments.id,
    taskId: schema.tasks.id,
    title: schema.tasks.title,
    status: schema.assignments.status,
    revisionDeadline: schema.assignments.revisionDeadline
  })
    .from(schema.assignments)
    .innerJoin(schema.tasks, eq(schema.assignments.taskId, schema.tasks.id))
    .where(and(
      eq(schema.tasks.organizationId, organizationId),
      inArray(schema.assignments.status, ['submitted', 'revision_requested']),
      lt(schema.assignments.revisionDeadline, new Date())
    ))
}

// A volunteer can only hold one task at a time. Once the revision window expires the volunteer
// cannot act on the task anymore (only the organization can certify), so it no longer counts.
export async function hasActiveAssignment(volunteerId: number) {
  const [active] = await db.select({ id: schema.assignments.id })
    .from(schema.assignments)
    .where(and(
      eq(schema.assignments.volunteerId, volunteerId),
      or(
        eq(schema.assignments.status, 'in_progress'),
        and(
          inArray(schema.assignments.status, ['submitted', 'revision_requested']),
          gte(schema.assignments.revisionDeadline, new Date())
        )
      )
    ))
    .limit(1)
  return !!active
}
