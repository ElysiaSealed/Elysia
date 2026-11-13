# ELYSIA

**An AI analyst on Robinhood Chain.** ELYSIA reads Pons V2 launches and Stock Tokens, commits each prediction on-chain before it is published, and provides proof anyone can verify.

> Not affiliated with Robinhood.

ELYSIA is an independent project. It was developed from an existing codebase, but it is a separate product with its own wallets, infrastructure and decisions.

## Status

This is the `dev-rh` branch: Elysia on **Robinhood Chain mainnet (chain ID 4663)**. The `main` branch still carries the earlier Elysium Testnet variant. Phases and approval gates are in [docs/ELYSIA_IMPLEMENTATION_ROADMAP.md](docs/ELYSIA_IMPLEMENTATION_ROADMAP.md). Nothing is deployed yet.

## Product

- Free: the public feed, Prediction of the Day, Proof of Intelligence, Rug radar, Ask and the Burn tracker.
- Paid in USDG: Pro (earlier alerts), the Signals API and Sponsored reports. Prices are temporary and editable through environment variables; `GET /pricing` serves them. Payments stay off (`PAID_FEATURES_ENABLED=false`) until they are verified end to end.
- Token: **$ELYS**, with a new contract (address pending). The Burn tracker reads the history of a burn contract provided by the PM.
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
  indexer/    Pons V2 and chain indexer
  worker/     data -> LLM -> RiskGuard -> commit -> approval queue -> publish
  web/        Next.js site
contracts/    Solidity (Foundry): ElysiaLedger
packages/
  api-client/ Typed API client
  contracts-abi/ ABIs and per-network addresses
  db/         Drizzle schema and migrations
  riskguard/  Content rules (code, not AI)
  shared/     Chain registry, scoring and commit-reveal helpers
docs/         Planning documents, decisions and API fixtures
```

## Getting started

Requirements: Node 22 or newer, pnpm, and Foundry for the contracts.

```bash
# Run in: ROOT
pnpm install
pnpm typecheck
pnpm test:non-db

# Run in: ROOT/contracts
forge test

# Run in: ROOT/apps/web
pnpm dev
```

Copy `.env.example` to `.env` and fill it in locally. Never commit real values. Database tests only run when `TEST_DATABASE_URL` points to a local database named `elysia_test`.

## Rules

- Never commit `.env` files, private keys, keystores or database dumps.
- Do not broadcast any transaction, including deployments and test payments, without explicit approval.
- Use only Elysia-owned repositories, projects, databases and credentials.
- Pushing `dev-rh` is `pnpm push:dev-rh`; the pre-push hook allows only `main` and `dev-rh`.

## Documents

Start with [docs/ELYSIA_WORKING_CONTEXT.md](docs/ELYSIA_WORKING_CONTEXT.md). The roadmap is [docs/ELYSIA_IMPLEMENTATION_ROADMAP.md](docs/ELYSIA_IMPLEMENTATION_ROADMAP.md), infrastructure is [docs/ELYSIA_INFRASTRUCTURE_CHECKLIST.md](docs/ELYSIA_INFRASTRUCTURE_CHECKLIST.md), and decisions (FINAL and PENDING) are in [docs/ELYSIA_DECISIONS.md](docs/ELYSIA_DECISIONS.md).

## License

MIT. See [LICENSE](LICENSE).
