import { and, desc, eq, inArray, ne } from 'drizzle-orm'

// Public profile: organization data, tasks still in progress or open, and the certificates it issued
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const organization = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, id) })
  if (!organization) notFound('OSC')

  const tasks = await db.select().from(schema.tasks)
    .where(and(eq(schema.tasks.organizationId, id), ne(schema.tasks.status, 'completed')))
    .orderBy(desc(schema.tasks.createdAt))

  const certificates = await db.select({
    assignmentId: schema.assignments.id,
    status: schema.assignments.status,
    certifiedAt: schema.assignments.certifiedAt,
    txSignature: schema.assignments.txSignature,
    task: { id: schema.tasks.id, title: schema.tasks.title },
    volunteer: { id: schema.volunteers.id, name: schema.volunteers.name }
  })
    .from(schema.assignments)
    .innerJoin(schema.tasks, eq(schema.assignments.taskId, schema.tasks.id))
    .innerJoin(schema.volunteers, eq(schema.assignments.volunteerId, schema.volunteers.id))
    .where(and(
      eq(schema.tasks.organizationId, id),
      inArray(schema.assignments.status, ['certified_full', 'certified_partial'])
    ))
    .orderBy(desc(schema.assignments.certifiedAt))

  const { cnpj, email, phone, ...publicData } = organization
  return { ...publicData, tasks, certificates }
})
