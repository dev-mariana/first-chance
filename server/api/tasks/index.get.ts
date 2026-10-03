import { and, arrayOverlaps, desc, eq, ne } from 'drizzle-orm'
import { z } from 'zod'

const querySchema = z.object({
  type: z.string().optional(),
  skill: z.string().optional()
})

// Task board: everything not completed yet, filterable by type and skill
export default defineEventHandler(async (event) => {
  const { type, skill } = await getValidatedQuery(event, querySchema.parse)

  const filters = [ne(schema.tasks.status, 'completed')]
  if (type) filters.push(eq(schema.tasks.type, type as TaskType))
  if (skill) filters.push(arrayOverlaps(schema.tasks.skills, [skill]))

  const rows = await db.select({
    task: schema.tasks,
    organization: { id: schema.organizations.id, name: schema.organizations.name, cause: schema.organizations.cause }
  })
    .from(schema.tasks)
    .innerJoin(schema.organizations, eq(schema.tasks.organizationId, schema.organizations.id))
    .where(and(...filters))
    .orderBy(desc(schema.tasks.createdAt))

  return rows.map(r => ({ ...r.task, organization: r.organization }))
})
