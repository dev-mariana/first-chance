// End-to-end certificate on Solana devnet without Phantom: a throwaway keypair plays the organization wallet.
// Usage (fresh seed): npm run db:reset && node scripts/certificate-e2e.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000/api'
const ASSIGNMENT_ID = Number(process.env.ASSIGNMENT_ID ?? 1) // Ana's dashboard for Instituto Esperança
const ORGANIZATION_ID = Number(process.env.ORGANIZATION_ID ?? 1)
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

const api = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) })
  const data = await res.json()
  if (!res.ok) throw new Error(`${method} ${path}: ${data.message}`)
  return data
}

// Throwaway keypair kept out of git so it can be funded once and reused
const WALLET_FILE = 'scripts/.e2e-wallet.json'
const wallet = existsSync(WALLET_FILE)
  ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(WALLET_FILE, 'utf8'))))
  : Keypair.generate()
writeFileSync(WALLET_FILE, JSON.stringify([...wallet.secretKey]))

process.loadEnvFile()
const connection = new Connection(process.env.NUXT_PUBLIC_SOLANA_RPC_URL, 'confirmed')
console.log('wallet', wallet.publicKey.toBase58())

if (await connection.getBalance(wallet.publicKey) < 0.001 * LAMPORTS_PER_SOL) {
  try {
    const airdrop = await connection.requestAirdrop(wallet.publicKey, 0.05 * LAMPORTS_PER_SOL)
    await connection.confirmTransaction(airdrop, 'confirmed')
  } catch {
    console.log('Airdrop unavailable. Send ~0.01 devnet SOL to the wallet above (e.g. from Phantom) and run again.')
    process.exit(1)
  }
}

await api('PATCH', `/organizations/${ORGANIZATION_ID}/wallet`, { walletAddress: wallet.publicKey.toBase58() })

const competencies = ['Excel', 'Power BI']
const { memo, payload } = await api('POST', `/assignments/${ASSIGNMENT_ID}/certificate/prepare`, { competencies })
console.log('certificate kind', payload.kind)

const tx = new Transaction().add(new TransactionInstruction({
  programId: MEMO_PROGRAM_ID,
  keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: false }],
  data: Buffer.from(memo, 'utf8')
}))
const txSignature = await sendAndConfirmTransaction(connection, tx, [wallet])
console.log('tx', `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)

const issued = await api('POST', `/assignments/${ASSIGNMENT_ID}/certificate`, { competencies, txSignature })
console.log('status', issued.status)

const verification = await api('GET', `/assignments/${ASSIGNMENT_ID}/verify`)
console.log('authentic', verification.authentic)
process.exit(verification.authentic ? 0 : 1)
