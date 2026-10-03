import { and, eq } from 'drizzle-orm'

// "Quero ajudar": the first volunteer to click takes the task
export default defineEventHandler(async (event) => {
  const taskId = routeId(event)
  const { volunteerId } = await readValidatedBody(event, assignSchema.parse)

  const volunteer = await db.query.volunteers.findFirst({ where: eq(schema.volunteers.id, volunteerId) })
  if (!volunteer) notFound('Voluntário')
  if (await hasActiveAssignment(volunteerId)) {
    conflict('Você já tem uma demanda em andamento. Conclua ou desista dela antes de assumir outra.')
  }

  try {
    return await db.transaction(async (tx) => {
      // Conditional update: only one request can move the task from "open" to "in_progress"
      const [task] = await tx.update(schema.tasks)
        .set({ status: 'in_progress' })
        .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.status, 'open')))
        .returning()
      if (!task) conflict('Esta demanda não está mais disponível')

      const [assignment] = await tx.insert(schema.assignments).values({ taskId, volunteerId }).returning()
      return assignment!
    })
  } catch (err) {
    rethrowDuplicate(err, 'Esta demanda já tem um voluntário')
  }
})
