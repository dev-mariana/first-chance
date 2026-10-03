import { eq } from 'drizzle-orm'

// Step 2: checks the signed transaction on devnet and only then issues the certificate
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const { competencies, txSignature } = await readValidatedBody(event, issueCertificateSchema.parse)
  const ctx = await findAssignmentContext(id)
  const kind = certificateKindFor(ctx)
  const { hash, memo, issuerWallet } = buildCertificate(ctx, kind, competencies)

  const check = await verifyMemoOnChain(txSignature, issuerWallet, memo)
  if (!check.ok) badRequest(check.reason)

  const [updated] = await db.update(schema.assignments).set({
    status: kind === 'full' ? 'certified_full' : 'certified_partial',
    certificateCompetencies: [...competencies].sort(),
    certificateHash: hash,
    txSignature,
    certifiedAt: new Date()
  }).where(eq(schema.assignments.id, id)).returning()

  await db.update(schema.tasks).set({ status: 'completed' }).where(eq(schema.tasks.id, ctx.task.id))
  return updated!
})
