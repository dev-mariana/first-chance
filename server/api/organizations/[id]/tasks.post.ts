import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const organizationId = routeId(event)
  const organization = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, organizationId) })
  if (!organization) notFound('OSC')

  const pendings = await overduePendings(organizationId)
  if (pendings.length) {
    conflict(`Emita primeiro os certificados pendentes com prazo de ajustes vencido: ${pendings.map(p => `"${p.title}"`).join(', ')}`)
  }

  const input = await readValidatedBody(event, taskSchema.parse)
  const [task] = await db.insert(schema.tasks).values({ ...input, organizationId }).returning()
  return task!
})
