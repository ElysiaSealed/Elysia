# ELYSIA

**An AI analyst on Robinhood Chain.** ELYSIA reads Pons V2 launches and Stock Tokens, commits every prediction on-chain before it is published, and gives anyone the proof to verify it.

X: [@ElysiaSealed](https://x.com/ElysiaSealed)

> Not affiliated with Robinhood.

ELYSIA is an independent project. It grew from an existing codebase but is a separate product with its own wallets, infrastructure and decisions.

## Status

Branch `main` targets **Robinhood Chain mainnet (chain ID 4663)**.

- `ElysiaLedger` is deployed on mainnet: `0x89D5E9A903af6dA38977BaD6954E0Bd380429B53` ([explorer](https://robinhoodchain.blockscout.com/address/0x89D5E9A903af6dA38977BaD6954E0Bd380429B53)). Addresses live in [packages/contracts-abi/addresses/mainnet.json](packages/contracts-abi/addresses/mainnet.json).
- Live mode is being enabled. The automated X account is `@ElysiaSealed`.
- Paid features are on (`PAID_FEATURES_ENABLED=true`, gate R4 passed).
- The `$ELYS` token contract and the burn contract address are not set yet.

Phases and approval gates: [docs/ELYSIA_IMPLEMENTATION_ROADMAP.md](docs/ELYSIA_IMPLEMENTATION_ROADMAP.md).

## Product

- **Free:** public feed, Prediction of the Day, Proof of Intelligence, Rug radar, Ask, Burn tracker.
- **Paid in USDG:** Pro (earlier alerts), Signals API, Sponsored reports. Prices are editable through env vars and served by `GET /pricing`. Payments are live.
- **Token:** `$ELYS`. The Burn tracker reads history from a burn contract supplied by the PM.
- Public content is in English.

## How a prediction is published

AI -> RiskGuard (plain code, fail-closed) -> confirmed on-chain commit -> human approval queue -> publish.

1. Nothing is published before it passes RiskGuard.
2. Nothing is published before its commit is confirmed on-chain.
3. Replies on X are manual. There is no auto-reply.
4. Incomplete data means "unknown". No buy or sell calls, no price targets.

## Repository layout

```
apps/
  api/        Fastify + zod + OpenAPI
  indexer/    Pons V2 and chain indexer
  worker/     data -> LLM -> RiskGuard -> commit -> approval queue -> publish
  web/        Next.js site
contracts/    Solidity (Foundry): ElysiaLedger
packages/
  api-client/     Typed API client
  contracts-abi/  ABIs and per-network addresses
  db/             Drizzle schema and migrations
  riskguard/      Content rules (code, not AI)
  shared/         Chain registry, scoring and commit-reveal helpers
docs/         Decisions, roadmap, infrastructure and API fixtures
```

## Getting started

Requires Node 22+, pnpm, and Foundry for contracts.

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

Copy `.env.example` to `.env` and fill it locally. Never commit real values. Database tests run only when `TEST_DATABASE_URL` points to a local database named `elysia_test`.

## Rules

- Never commit `.env` files, private keys, keystores or database dumps.
- Do not broadcast any transaction, including deploys and test payments, without explicit approval.
- Use only Elysia-owned repositories, projects, databases and credentials.
- Push `main` with `pnpm push`. The pre-push hook allows only `main` and `dev-rh`.

## Documents

- [docs/ELYSIA_IMPLEMENTATION_ROADMAP.md](docs/ELYSIA_IMPLEMENTATION_ROADMAP.md): phases and gates
- [docs/ELYSIA_INFRASTRUCTURE_CHECKLIST.md](docs/ELYSIA_INFRASTRUCTURE_CHECKLIST.md): infrastructure
- [docs/ELYSIA_DECISIONS.md](docs/ELYSIA_DECISIONS.md): decisions (FINAL and PENDING)

## License

MIT. See [LICENSE](LICENSE).
