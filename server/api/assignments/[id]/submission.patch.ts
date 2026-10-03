import { eq } from 'drizzle-orm'

// Volunteer submits the work, or resubmits after a revision request.
// The first submission opens the organization's revision window.
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const { submissionUrl } = await readValidatedBody(event, submissionSchema.parse)
  const { assignment, task } = await findAssignmentContext(id)

  if (assignment.status === 'in_progress') {
    if (task.dueDate < todayISO()) badRequest('O prazo de entrega já passou')
    const submittedAt = new Date()
    const [updated] = await db.update(schema.assignments).set({
      status: 'submitted',
      submissionUrl,
      submittedAt,
      revisionDeadline: revisionDeadlineFrom(submittedAt, task.revisionWindowDays)
    }).where(eq(schema.assignments.id, id)).returning()
    return updated!
  }

  if (assignment.status === 'revision_requested') {
    if (isPast(assignment.revisionDeadline)) badRequest('O prazo de ajustes já venceu')
    const [updated] = await db.update(schema.assignments)
      .set({ status: 'submitted', submissionUrl })
      .where(eq(schema.assignments.id, id))
      .returning()
    return updated!
  }

  badRequest('Esta participação não aceita entregas no momento')
})
