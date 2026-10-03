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

Other scripts: `npm run db:reset` (clean demo data), `npm run test:smoke` (business rules), `npm run test:e2e` (real certificate on devnet without Phantom).

## Business rules

- One volunteer per task; a volunteer holds one active task at a time.
- Tasks have a due date (extendable once) and a revision window counted from the first submission.
- Within the window the organization can request revisions; after a revision request it can also reject (no certificate, task reopens).
- **Full certificate**: organization validates the submission. **Partial certificate**: the volunteer did not resubmit within the revision window.
- An organization cannot publish new tasks while it owes a certificate whose revision window has expired.
- Missed due date: the task becomes overdue and the organization reopens it with a new due date. Volunteers can withdraw before submitting.

## Certificates on Solana

The organization marks the competencies actually applied; the server builds a canonical payload and its SHA-256 hash. The organization wallet signs a transaction carrying the memo `FirstChance|certificate|v1|<hash>`. Before issuing, the server checks on devnet that the transaction exists, was signed by the organization's registered wallet and carries exactly that memo. Only the hash goes on-chain (no personal data). Anyone can click **Verificar autenticidade** to recompute the hash and check it on Solana again.

## Demo script

Seed data (`npm run db:reset`) ships with these scenarios:

1. **Task board**: open tasks with deadlines, filter by type/skill.
2. **Entrar como → Instituto Esperança**: Ana's dashboard submission is waiting. Request a revision or click **Validar e emitir certificado**, pick competencies and sign in Phantom.
3. **Entrar como → Ana Souza**: profile shows the certificate; **Verificar autenticidade** checks it on-chain; open it in Solana Explorer.
4. **Entrar como → Casa Criança Feliz**: blocked from publishing. Issue Carla's full certificate and Daniela's partial one to unblock.
5. **Entrar como → Coletivo Mulheres na Tech**: Beatriz missed the due date; reopen the task with a new date.
6. **Entrar como → Eduarda Alves**: take the "Sistema de cadastro" task, submit a link, then switch back to Instituto Esperança to review it.

The Phantom wallet must be on **devnet** with some test SOL ([faucet](https://faucet.solana.com)).
