# ELYSIA

**Gatekeeper of Elysium.** ELYSIA assesses token launches on Elysium, commits each assessment on-chain before it is published, and provides proof anyone can verify.

> Not affiliated with Kinetiq or Elysium.

ELYSIA is a free service and an independent project. It was developed from an existing codebase, but it is a separate product with its own wallets, infrastructure and decisions.

## Status

Planning is complete. Implementation has not started. Phases and approval gates are in [docs/ELYSIA_IMPLEMENTATION_ROADMAP.md](docs/ELYSIA_IMPLEMENTATION_ROADMAP.md).

Some names in the code are inherited and pending a rename (for example the `NexaLedger` contract and the `NEXA_*` environment variable names). Do not run a global replace; see [docs/ELYSIA_MIGRATION_PLAN.md](docs/ELYSIA_MIGRATION_PLAN.md).

## Scope

- Target chain: **Elysium Testnet, chain ID 99801**. No other chain.
- Free service: no payments, subscriptions or treasury.
- Three operational wallets, each with its own private key: Deployer, Agent and Keeper. None exist yet.
- Public content is in English.

## Pipeline

AI -> RiskGuard (plain code, fail-closed) -> confirmed on-chain commit -> human approval queue -> publish.

1. Nothing is published before it passes RiskGuard.
2. Nothing is published before its commit is confirmed on-chain.
3. Posting to X stays in `dry` mode until explicitly enabled. Replies are manual.

## Repository layout

```
apps/
  api/        Fastify + zod + OpenAPI
  indexer/    Launchpad and chain indexer
  worker/     data -> LLM -> RiskGuard -> commit -> approval queue -> publish
  web/        Next.js site
contracts/    Solidity (Foundry)
packages/
  api-client/ Typed API client
  contracts-abi/ ABIs and per-network addresses
  db/         Drizzle schema and migrations
  riskguard/  Content rules (code, not AI)
  shared/     Shared types, scoring, commit-reveal helpers
docs/         ELYSIA planning documents
```

## Getting started

Requirements: Node 22 or newer, pnpm, and Foundry for the contracts.

```bash
# Run in: ROOT
pnpm install
pnpm typecheck
pnpm test

# Run in: ROOT/apps/web
pnpm dev
```

Copy `.env.example` to `.env` and fill it in locally. Never commit real values.

## Rules

- Never commit `.env` files, private keys, keystores or database dumps.
- Do not broadcast any transaction, including deployments, without explicit approval.
- Use only ELYSIA-owned repositories, projects, databases and credentials.

## Documents

Start with [docs/ELYSIA_WORKING_CONTEXT.md](docs/ELYSIA_WORKING_CONTEXT.md). Decisions (FINAL and PENDING) are in [docs/ELYSIA_DECISIONS.md](docs/ELYSIA_DECISIONS.md), and the product brief is [docs/ELYSIA_BRIEF.md](docs/ELYSIA_BRIEF.md).

## License

MIT. See [LICENSE](LICENSE).
