import { eq, sql } from 'drizzle-orm'

// Organization asks for changes, only while the revision window is open
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const { comment } = await readValidatedBody(event, revisionSchema.parse)
  const { assignment } = await findAssignmentContext(id)

  if (assignment.status !== 'submitted') badRequest('Só é possível pedir ajustes em uma entrega aguardando avaliação')
  if (isPast(assignment.revisionDeadline)) badRequest('O prazo de ajustes já venceu. Agora a OSC precisa emitir o certificado.')

  const [updated] = await db.update(schema.assignments).set({
    status: 'revision_requested',
    revisionComment: comment,
    revisionCount: sql`${schema.assignments.revisionCount} + 1`
  }).where(eq(schema.assignments.id, id)).returning()
  return updated!
})
