import { Buffer } from 'buffer'

// @solana/web3.js relies on Buffer, which browsers do not provide
export default defineNuxtPlugin(() => {
  globalThis.Buffer ??= Buffer
})
