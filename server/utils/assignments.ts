import { eq } from 'drizzle-orm'

// Assignment with its task, volunteer and organization: the context every business rule needs
export async function findAssignmentContext(id: number) {
  const [row] = await db.select({
    assignment: schema.assignments,
    task: schema.tasks,
    volunteer: schema.volunteers,
    organization: schema.organizations
  })
    .from(schema.assignments)
    .innerJoin(schema.tasks, eq(schema.assignments.taskId, schema.tasks.id))
    .innerJoin(schema.volunteers, eq(schema.assignments.volunteerId, schema.volunteers.id))
    .innerJoin(schema.organizations, eq(schema.tasks.organizationId, schema.organizations.id))
    .where(eq(schema.assignments.id, id))

  if (!row) notFound('Participação')
  return row
}

// Rejecting or withdrawing frees the task again, unless its due date has already passed
export function reopenedTaskStatus(dueDate: string) {
  return dueDate < todayISO() ? 'overdue' as const : 'open' as const
}
