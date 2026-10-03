import { eq } from 'drizzle-orm'

// Due date can be extended once, before it expires, while a volunteer is working on the task
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const { dueDate } = await readValidatedBody(event, newDueDateSchema.parse)

  const task = await db.query.tasks.findFirst({ where: eq(schema.tasks.id, id) })
  if (!task) notFound('Demanda')
  if (task.status !== 'in_progress') badRequest('Só é possível prorrogar uma demanda em andamento')
  if (task.extended) badRequest('O prazo desta demanda já foi prorrogado uma vez')
  if (task.dueDate < todayISO()) badRequest('O prazo já venceu e não pode mais ser prorrogado')
  if (dueDate <= task.dueDate) badRequest('A nova data precisa ser depois do prazo atual')

  const [updated] = await db.update(schema.tasks)
    .set({ dueDate, extended: true })
    .where(eq(schema.tasks.id, id))
    .returning()
  return updated!
})
