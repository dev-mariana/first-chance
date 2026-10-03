# FirstChance

> Your first experience, proven on-chain.

Civil society organizations (OSCs) publish real, remote tasks. Volunteers deliver them, the organization reviews the work and issues a **certificate signed by its wallet on Solana** (full or partial). Anyone can verify the certificate on-chain.

Built during the 3rd WoHackathon RJ (Oct 3, 2026).

## Stack

- Nuxt 4 (Vue) + Nuxt UI, SSR disabled, API on Nitro (`server/api`)
- PostgreSQL (Docker) + Drizzle ORM
- zod schemas shared between client and server
- Solana devnet (`@solana/web3.js`) + Phantom wallet, certificate hash stored via the Memo Program

## Running locally

Requirements: Node 22+, Docker, Phantom wallet on **devnet** with test SOL ([faucet](https://faucet.solana.com)).

```bash
cp .env.example .env
npm install
npm run setup   # starts Postgres, creates tables and seeds demo data
npm run dev     # http://localhost:3000
```
