import { eq } from 'drizzle-orm'

// Organization rejects the work: only after at least one revision request, with a reason. No certificate.
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const { reason } = await readValidatedBody(event, rejectionSchema.parse)
  const { assignment, task } = await findAssignmentContext(id)

  if (assignment.status !== 'submitted') badRequest('Só é possível reprovar uma entrega aguardando avaliação')
  if (assignment.revisionCount < 1) badRequest('Peça ajustes ao menos uma vez antes de reprovar')

  const [updated] = await db.update(schema.assignments)
    .set({ status: 'rejected', rejectionReason: reason })
    .where(eq(schema.assignments.id, id))
    .returning()
  await db.update(schema.tasks).set({ status: reopenedTaskStatus(task.dueDate) }).where(eq(schema.tasks.id, task.id))
  return updated!
})
