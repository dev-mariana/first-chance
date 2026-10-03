import { eq } from 'drizzle-orm'

// Volunteer gives up before submitting: the task becomes available again with the same due date
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const { assignment, task } = await findAssignmentContext(id)
  if (assignment.status !== 'in_progress') badRequest('Só é possível desistir antes de enviar a entrega')

  await db.update(schema.assignments).set({ status: 'withdrawn' }).where(eq(schema.assignments.id, id))
  const [updated] = await db.update(schema.tasks)
    .set({ status: reopenedTaskStatus(task.dueDate) })
    .where(eq(schema.tasks.id, task.id))
    .returning()
  return updated!
})
