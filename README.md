# FirstChance

> **Your first experience, proven on-chain.**

FirstChance connects people looking for their first professional experience with real needs of civil society organizations (OSCs, *Organizações da Sociedade Civil*). Volunteers deliver real, remote tasks; the organization reviews the work and issues a **certificate signed by its own wallet on Solana**. Anyone (a recruiter, a company, a donor) can verify that certificate on-chain without trusting the platform.

Built in one day at the **3rd WoHackathon RJ** (October 3, 2026, FIAP Botafogo), on the *Track 04 – Trilha Livre* of the Solana challenge.

---

## Table of contents

- [Why this project exists](#why-this-project-exists)
- [How it works](#how-it-works)
- [Why Solana](#why-solana)
- [Features](#features)
- [Business rules](#business-rules)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [API](#api)
- [Demo script](#demo-script)
- [Roadmap](#roadmap)
- [Team](#team)

---

## Why this project exists

> *"I need experience to get an opportunity, but I need an opportunity to get experience."*

- **People starting out**: students, career changers and women returning to the job market have skills but no way to **prove** they have applied them. A course certificate shows someone *studied*, not that they *delivered*.
- **Civil society organizations**: they have real technical and administrative needs (dashboards, simple systems, financial reports, social media) and a hard time finding people to do them.
- **Companies**: they want to hire people who have already shown they can deliver, not just a list of skills on a résumé.

FirstChance turns a **social need into a first professional experience**, and that experience into a **verifiable credential**.

## How it works

```
OSC publishes a task → volunteer delivers (remote) → OSC reviews → certificate signed on Solana → company verifies
```

1. **The organization publishes a task** describing the problem, what needs to be done, deliverables, skills, estimated hours, a due date and a revision window.
2. **A volunteer takes the task** ("Quero ajudar"). One volunteer per task; the conversation happens outside the platform.
3. **The volunteer submits** a link to the work (repository, Drive, Figma...).
4. **The organization reviews**: it can request revisions within the window, validate the work, or reject it after at least one revision request.
5. **The organization issues the certificate**, choosing the competencies actually applied, and signs it with its Phantom wallet on Solana: **full** (work validated) or **partial** (revisions never resubmitted).
6. **Anyone verifies**: the volunteer's public profile lists the certificates with a **"Verificar autenticidade"** button and a link to Solana Explorer.

The volunteer does **not** need a crypto wallet. Only the organization signs.

## Why Solana

| | |
|---|---|
| **Low cost** | Registering a certificate costs a fraction of a cent, viable even for small organizations. |
| **Fast** | The organization signs and the certificate is confirmed in seconds. |
| **Traceable** | Each certificate is tied to the wallet of the organization that issued it and to a public transaction. |
| **Auditable** | Anyone can check who issued it, when, and whether the content was tampered with, without depending on our database. |

### What goes on-chain (and what does not)

| On the platform (Postgres) | On Solana |
|---|---|
| Volunteer name and profile, task details, submission link, contact data | Only the **SHA-256 hash** of the certificate, inside a transaction **signed by the organization's wallet** |

**Issuing:** the server builds a canonical certificate payload (version, kind, volunteer, organization and wallet, task, competencies) and its hash. The organization's Phantom wallet signs a transaction carrying the memo `FirstChance|certificate|v1|<hash>` (SPL Memo Program). Before storing the certificate, the server fetches the transaction on devnet and checks that it exists, did not fail, **was signed by the organization's registered wallet** and carries **exactly** that memo.

**Verifying:** "Verificar autenticidade" rebuilds the payload from stored data, recomputes the hash and checks the signed memo on Solana again. Any change to the stored certificate breaks the verification.

No personal data goes on-chain (LGPD-friendly). The blockchain does not judge whether the work was good; the organization does. Solana makes **who certified, when and what** verifiable.

## Features

- Task board with filters by type and skill
- Sign-up for organizations and volunteers (validated with zod on client and server)
- Detailed task form with programming and administrative examples
- "Quero ajudar" with concurrency-safe assignment (one volunteer per task)
- Submission and resubmission of work
- Revision requests, rejection, due date extension and reopening of overdue tasks
- Full and partial certificates signed with Phantom on Solana devnet
- Public, on-chain certificate verification
- Organization dashboard with an automatic block when certificates are overdue
- Public profiles for volunteers (certificates) and organizations (certificates issued)
- Responsive layout (mobile, tablet, desktop)

## Business rules

| Rule | Detail |
|---|---|
| One volunteer per task | Enforced by a partial unique index in Postgres plus a conditional update, so two simultaneous clicks cannot take the same task. |
| One active task per volunteer | A volunteer can hold only one task at a time. Once the revision window expires, the pending action belongs to the organization and the volunteer is free to take another task. |
| Due date | Required, cannot be in the past. Can be **extended once**, before it expires. If it expires before submission, the task becomes **overdue** and the organization reopens it with a new date. |
| Revision window | 1–30 days, counted from the **first submission**. Within it the organization can request revisions and the volunteer must resubmit. |
| Full certificate | The organization validates a submission. |
| Partial certificate | The revision window expired and the volunteer never resubmitted. |
| Rejection | Only after at least one revision request, with a reason. No certificate; the task goes back to the board. |
| Withdrawal | The volunteer can withdraw before submitting; the task reopens with the same due date. |
| Organization block | An organization **cannot publish new tasks** while it owes a certificate whose revision window has expired. Volunteers never wait forever. |

Deadlines are applied lazily (no cron): a Nitro middleware syncs expired due dates on every API request.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3), SSR disabled for the local MVP |
| API | Nitro server routes (`server/api`) |
| UI | [Nuxt UI 4](https://ui.nuxt.com) + Tailwind CSS 4 |
| Validation | [zod 4](https://zod.dev), schemas shared between client and server (`shared/`) |
| Database | PostgreSQL 17 (Docker) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) + `pg`, schema pushed with drizzle-kit |
| Blockchain | Solana **devnet**, [`@solana/web3.js`](https://solana-labs.github.io/solana-web3.js/), SPL Memo Program |
| Wallet | [Phantom](https://phantom.com) (organizations only) |
| Language | TypeScript |

## Project structure

```
first-chance/
├── app/                      # Frontend (Vue / Nuxt UI)
│   ├── pages/                # Task board, sign-ups, dashboards, profiles
│   ├── components/           # AssignmentReview, CertificateCard, SessionSwitcher
│   ├── composables/          # usePhantom (memo signing), useSession
│   └── plugins/              # Buffer polyfill for @solana/web3.js
├── server/
│   ├── api/                  # REST endpoints (organizations, tasks, volunteers, assignments)
│   ├── database/             # Drizzle schema and demo seed
│   ├── middleware/           # Deadline sync on every API request
│   └── utils/                # Business rules, certificates, Solana verification, db
├── shared/utils/             # zod schemas and constants used by client and server
├── scripts/                  # Smoke test (business rules) and on-chain e2e test
└── docker-compose.yml        # Postgres
```

The codebase is in English; the user interface is in Brazilian Portuguese.

## Getting started

### Prerequisites

- Node.js 22+
- Docker
- [Phantom](https://phantom.com/download) browser extension set to **Solana Devnet** (Settings → Developer Settings → Testnet Mode), with some test SOL from [faucet.solana.com](https://faucet.solana.com)

### Environment variables

Copy the example file and fill it in. Secrets live only in `.env`, which is git-ignored.

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credentials used by the Postgres container |
| `POSTGRES_PORT` | Host port for Postgres (default `5433`) |
| `DATABASE_URL` | Connection string used by the app, e.g. `postgres://user:password@localhost:5433/first_chance` |
| `NUXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC endpoint (default devnet) |
| `DEMO_WALLET_ADDRESS` | Phantom wallet (devnet) set as the issuer wallet of the demo organizations in the seed |

### Run

```bash
npm install
npm run setup   # starts Postgres, creates the tables and seeds demo data
npm run dev     # http://localhost:3000
```

There is no real login in the MVP: use **"Entrar como..."** in the header to act as any organization or volunteer.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts the app in development mode |
| `npm run setup` | `db:up` + `db:push` + `db:seed` |
| `npm run db:up` | Starts the Postgres container |
| `npm run db:push` | Applies the Drizzle schema to the database |
| `npm run db:seed` | Loads the demo scenarios |
| `npm run db:reset` | Drops everything and reloads the demo data |
| `npm run db:studio` | Opens Drizzle Studio to browse the data |
| `npm run test:smoke` | Checks every business rule through the API (run on a fresh seed) |
| `npm run test:e2e` | Issues and verifies a real certificate on devnet using a throwaway keypair instead of Phantom |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |

## API

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/tasks?type=&skill=` | Task board |
| `POST` | `/api/organizations` | Create organization |
| `GET` | `/api/organizations/:id` | Public profile and certificates issued |
| `GET` | `/api/organizations/:id/dashboard` | Tasks, assignments and overdue pendings |
| `PATCH` | `/api/organizations/:id/wallet` | Register the issuer wallet |
| `POST` | `/api/organizations/:id/tasks` | Create task (blocked while certificates are overdue) |
| `POST` | `/api/tasks/:id/assign` | Volunteer takes a task |
| `POST` | `/api/tasks/:id/extend` | Extend the due date once |
| `POST` | `/api/tasks/:id/reopen` | Reopen an overdue task with a new due date |
| `POST` | `/api/volunteers` | Create volunteer |
| `GET` | `/api/volunteers/:id` | Volunteer profile, assignments and certificates |
| `PATCH` | `/api/assignments/:id/submission` | Submit or resubmit work |
| `POST` | `/api/assignments/:id/revision` | Request revisions |
| `POST` | `/api/assignments/:id/reject` | Reject the submission |
| `POST` | `/api/assignments/:id/withdraw` | Volunteer withdraws |
| `POST` | `/api/assignments/:id/certificate/prepare` | Build the certificate and the memo to sign |
| `POST` | `/api/assignments/:id/certificate` | Verify the signed transaction on Solana and issue |
| `GET` | `/api/assignments/:id/verify` | Public on-chain verification |

## Demo script

`npm run db:reset` loads these scenarios:

1. **Task board**: open, in-progress and overdue tasks; filter by type or skill.
2. **Entrar como → Instituto Esperança**: Ana's dashboard submission is waiting. Request a revision or click **Validar e emitir certificado**, pick the competencies and sign in Phantom.
3. **Entrar como → Ana Souza**: the certificate shows up on her profile; **Verificar autenticidade** checks it on-chain; open it in Solana Explorer.
4. **Entrar como → Casa Criança Feliz**: blocked from publishing. Issue Carla's full certificate and Daniela's partial one to unblock.
5. **Entrar como → Coletivo Mulheres na Tech**: Beatriz missed the due date; reopen the task with a new date.
6. **Entrar como → Eduarda Alves**: take the "Sistema de cadastro" task, submit a link, then switch to Instituto Esperança to review it.

## Roadmap

- **Hiring layer**: companies search and hire volunteers with verified experience, financing the platform.
- **On-chain donations** to organizations via Solana Pay, with stablecoins in production.
- **Solana Attestation Service (SAS)** as the certificate standard.
- Real authentication and CNPJ verification for organizations.
- Partnerships with universities and companies (ESG) to sponsor tasks.

## Team

- Cintia Maria Belem
- Cassiana Soares
- Mariana Bastos
- Vanessa Marcia de Paula
