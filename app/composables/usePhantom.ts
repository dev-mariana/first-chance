import { Buffer } from 'buffer'
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

interface PhantomProvider {
  isPhantom?: boolean
  connect: () => Promise<{ publicKey: PublicKey }>
  signTransaction: (tx: Transaction) => Promise<Transaction>
}

function getProvider(): PhantomProvider {
  const provider = (window as { phantom?: { solana?: PhantomProvider } }).phantom?.solana
  if (!provider?.isPhantom) throw new Error('Instale a extensão da Phantom (phantom.com) e recarregue a página')
  return provider
}

export function usePhantom() {
  const connection = new Connection(useRuntimeConfig().public.solanaRpcUrl, 'confirmed')

  async function connect() {
    const { publicKey } = await getProvider().connect()
    return publicKey.toBase58()
  }

  // The organization wallet signs a transaction carrying the certificate memo (only the hash goes on-chain)
  async function signMemo(memo: string, expectedWallet: string) {
    const provider = getProvider()
    const { publicKey } = await provider.connect()
    if (publicKey.toBase58() !== expectedWallet) {
      throw new Error('A carteira conectada na Phantom não é a carteira cadastrada desta OSC')
    }

    const tx = new Transaction().add(new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
      data: Buffer.from(memo, 'utf8')
    }))
    tx.feePayer = publicKey
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash

    const signed = await provider.signTransaction(tx)
    try {
      const signature = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
      return signature
    } catch (err) {
      if (String(err).includes('no record of a prior credit')) {
        throw new Error('A carteira está sem SOL de teste. Pegue em faucet.solana.com (rede devnet) e tente de novo.')
      }
      throw err
    }
  }

  return { connect, signMemo }
}
