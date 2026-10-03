import { Connection, clusterApiUrl } from '@solana/web3.js'

export const connection = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed')

// Checks on devnet that the transaction exists, was signed by the expected wallet and carries the expected memo
export async function verifyMemoOnChain(signature: string, expectedSigner: string, expectedMemo: string) {
  const tx = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' })
  if (!tx || tx.meta?.err) return { ok: false as const, reason: 'Transação não encontrada ou com erro na devnet' }

  const signedByIssuer = tx.transaction.message.accountKeys.some(k => k.signer && k.pubkey.toBase58() === expectedSigner)
  if (!signedByIssuer) return { ok: false as const, reason: 'A transação não foi assinada pela carteira da OSC' }

  const hasMemo = tx.transaction.message.instructions.some(ix => 'parsed' in ix && ix.program === 'spl-memo' && ix.parsed === expectedMemo)
  if (!hasMemo) return { ok: false as const, reason: 'O memo da transação não confere com o certificado' }

  return { ok: true as const }
}
