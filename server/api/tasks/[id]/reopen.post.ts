import { and, eq } from 'drizzle-orm'

// Overdue task goes back to the board with a new due date
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const { dueDate } = await readValidatedBody(event, newDueDateSchema.parse)

  const [task] = await db.update(schema.tasks)
    .set({ status: 'open', dueDate, extended: false })
    .where(and(eq(schema.tasks.id, id), eq(schema.tasks.status, 'overdue')))
    .returning()
  if (!task) badRequest('Só é possível reabrir uma demanda com prazo vencido')
  return task
})
