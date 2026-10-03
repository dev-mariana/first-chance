import { desc, eq } from 'drizzle-orm'

// Volunteer profile: public data, assignments (with the organization contact) and certificates
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const volunteer = await db.query.volunteers.findFirst({ where: eq(schema.volunteers.id, id) })
  if (!volunteer) notFound('Voluntário')

  const rows = await db.select({
    assignment: schema.assignments,
    task: {
      id: schema.tasks.id,
      title: schema.tasks.title,
      type: schema.tasks.type,
      dueDate: schema.tasks.dueDate,
      deliverables: schema.tasks.deliverables
    },
    organization: {
      id: schema.organizations.id,
      name: schema.organizations.name,
      email: schema.organizations.email,
      phone: schema.organizations.phone
    }
  })
    .from(schema.assignments)
    .innerJoin(schema.tasks, eq(schema.assignments.taskId, schema.tasks.id))
    .innerJoin(schema.organizations, eq(schema.tasks.organizationId, schema.organizations.id))
    .where(eq(schema.assignments.volunteerId, id))
    .orderBy(desc(schema.assignments.createdAt))

  const { email, phone, ...publicData } = volunteer
  return {
    ...publicData,
    assignments: rows.map(r => ({ ...r.assignment, task: r.task, organization: r.organization }))
  }
})
