// Step 1: returns the memo the organization wallet must sign on Solana
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const { competencies } = await readValidatedBody(event, competenciesSchema.parse)
  const ctx = await findAssignmentContext(id)
  return buildCertificate(ctx, certificateKindFor(ctx), competencies)
})
