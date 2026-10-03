// Public verification: rebuilds the certificate from stored data and checks the signed memo on Solana
export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const ctx = await findAssignmentContext(id)
  const { assignment } = ctx

  const kind = assignment.status === 'certified_full' ? 'full' : assignment.status === 'certified_partial' ? 'partial' : null
  if (!kind || !assignment.txSignature) return { authentic: false, reason: 'Esta participação não tem certificado' }

  const { hash, memo, payload, issuerWallet } = buildCertificate(ctx, kind, assignment.certificateCompetencies ?? [])
  if (hash !== assignment.certificateHash) return { authentic: false, reason: 'Os dados do certificado foram alterados' }

  const check = await verifyMemoOnChain(assignment.txSignature, issuerWallet, memo)
  return check.ok
    ? { authentic: true, hash, payload, txSignature: assignment.txSignature }
    : { authentic: false, reason: check.reason }
})
