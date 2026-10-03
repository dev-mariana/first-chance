// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  // Local MVP: client-side only (window.phantom only exists in the browser)
  ssr: false,

  devtools: {
    enabled: false
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // overridden by NUXT_PUBLIC_SOLANA_RPC_URL
      solanaRpcUrl: 'https://api.devnet.solana.com'
    }
  },

  compatibilityDate: '2026-06-30',

  vite: {
    optimizeDeps: {
      include: ['buffer', '@solana/web3.js']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
