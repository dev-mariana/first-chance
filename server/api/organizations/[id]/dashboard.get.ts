import { desc, eq, inArray } from 'drizzle-orm'

// Organization dashboard: its tasks with every assignment (and volunteer contact) plus overdue pendings
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const organization = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, id) })
  if (!organization) notFound('OSC')

  const tasks = await db.select().from(schema.tasks)
    .where(eq(schema.tasks.organizationId, id))
    .orderBy(desc(schema.tasks.createdAt))

  const taskIds = tasks.map(t => t.id)
  const rows = taskIds.length
    ? await db.select({ assignment: schema.assignments, volunteer: schema.volunteers })
        .from(schema.assignments)
        .innerJoin(schema.volunteers, eq(schema.assignments.volunteerId, schema.volunteers.id))
        .where(inArray(schema.assignments.taskId, taskIds))
        .orderBy(desc(schema.assignments.createdAt))
    : []

  return {
    organization,
    pendings: await overduePendings(id),
    tasks: tasks.map(task => ({
      ...task,
      assignments: rows
        .filter(r => r.assignment.taskId === task.id)
        .map(r => ({ ...r.assignment, volunteer: r.volunteer }))
    }))
  }
})
