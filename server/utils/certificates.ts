import { createHash } from 'node:crypto'

export type CertificateKind = 'full' | 'partial'

type AssignmentContext = Awaited<ReturnType<typeof findAssignmentContext>>

// full: submission waiting for the organization. partial: revision never resubmitted within the window.
export function certificateKindFor({ assignment }: AssignmentContext): CertificateKind {
  if (assignment.status === 'submitted') return 'full'
  if (assignment.status === 'revision_requested' && isPast(assignment.revisionDeadline)) return 'partial'
  if (assignment.status === 'revision_requested') badRequest('O voluntário ainda está dentro do prazo de ajustes')
  badRequest('Não há entrega aguardando certificado')
}

// Canonical payload: the same input always produces the same hash, so anyone can recompute it
// and compare with the memo signed by the organization on Solana. Only the hash goes on-chain.
export function buildCertificate(ctx: AssignmentContext, kind: CertificateKind, competencies: string[]) {
  const { assignment, task, volunteer, organization } = ctx
  if (!organization.walletAddress) badRequest('Conecte a carteira da OSC antes de emitir certificados')

  const payload = {
    version: 1,
    kind,
    assignmentId: assignment.id,
    volunteer: { id: volunteer.id, name: volunteer.name },
    organization: { id: organization.id, name: organization.name, wallet: organization.walletAddress },
    task: { id: task.id, title: task.title },
    competencies: [...competencies].sort()
  }
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  return { payload, hash, memo: `${MEMO_PREFIX}${hash}`, issuerWallet: organization.walletAddress }
}
