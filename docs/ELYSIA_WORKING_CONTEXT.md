# ELYSIA — Working Context (baca ini dulu di sesi baru)

Update: 2026-11-13 · Branch: `dev-rh` · Fase: Phase B (pembersihan) selesai sebagian; deploy belum dilakukan.

## Identitas
ELYSIA adalah AI analyst di **Robinhood Chain mainnet (chain ID 4663)**. Membaca peluncuran Pons V2 dan Stock Token, meng-commit setiap prediksi on-chain sebelum dipublikasikan, lalu mempublikasikannya setelah persetujuan manusia. Persona: tenang, hangat ke komunitas, tegas ke rug dan bundler. Konten publik berbahasa Inggris dan memuat "Not affiliated with Robinhood" (teks final menunggu konfirmasi). Akun X: `@ElysiaSealed` (mode `dry`). Logo dan aset brand: **pending**; jangan membuat placeholder.

## Arahan (developer, 2026-11-13)
- Branch `dev-rh` adalah jalur Robinhood dan naik ke `main` saat pindah. Langsung mainnet, tanpa testnet.
- Rebrand penuh ke Elysia; token **$ELYS**; kontrak baru (`ElysiaLedger`), di-deploy ulang dengan wallet baru.
- Fitur gratis: feed publik, Prediction of the Day, Proof of Intelligence, Rug radar, Ask, Burn tracker. Fitur berbayar (USDG): Pro, Signals API, Sponsored.
- Harga sementara dan dapat diedit lewat env: Pro $5 per 30 hari, Ask gratis, Signals API $499 per 30 hari, Sponsored $750 per laporan. `GET /pricing` menyajikannya.
- Tanpa BurnVault dan splitter fee kreator. Halaman Burn membaca riwayat dari CA yang diberikan PM.
- Tampilan dan palet warna sama dengan yang ada sekarang (`apps/web/src/styles/tokens.css`).
- Wallet, API key, bot Telegram, Supabase, dan Railway semuanya baru. Supabase memakai paket free: hemat egress dan ukuran database.
- Komentar kode dan commit message dalam Bahasa Inggris. Push `dev-rh` hanya dengan perintah "push dev-rh" (`pnpm push:dev-rh`).

## Ringkasan arsitektur
Indexer Pons V2 → DB → worker (LLM → RiskGuard kode → commit hash ke `ElysiaLedger` → antrian persetujuan manual → X/Telegram) → API → web. Detail: `ELYSIA_ARCHITECTURE.md`. Kontrak: `ELYSIA_SMART_CONTRACT_PLAN.md`.

## Status
- Selesai: Phase A (lihat roadmap). Rename ledger dan token, default chain mainnet, burn dari CA PM (migrasi 0012), teks web dan persona Robinhood, RiskGuard untuk Robinhood dan Pons, `GET /pricing`, `.env.example`, dokumen inti.
- Terverifikasi: `forge test` 25 lulus, typecheck, build produksi, dan test non-DB lulus. Test DB belum dijalankan.
- Belum: deploy `ElysiaLedger`, pembayaran terverifikasi (`PAID_FEATURES_ENABLED=false`), CA burn dan ABI event dari PM, alamat token $ELYS, resource cloud baru, kunci LLM, bot Telegram, logo.

## Data on-chain (mainnet 4663, diverifikasi baca-saja)
USDG (6 desimal, kemungkinan proxy), Pons V2 factory/hook/graduation executor, Uniswap v4 PoolManager, feed Chainlink `RHNVDA / USD` dan `ETH / USD` (8 desimal), NVDA Stock Token dan WETH (18 desimal). Alamat dan sumbernya ada di `packages/shared/src/chains.ts`.

## Wallet (alamat publik)
Deployer `0x30E12875b1cc04cE06c4a889CDA435f475678D82`, Agent `0x399c038d0946b358A94F3DDdeE64A87df051a9fC`, Treasury `0x582660f6C3D5560D7797e1BC79DbB571Dd5a8121`. Keeper tidak diperlukan di mainnet. Private key tidak pernah ditulis di repo atau chat.

## Keputusan PENDING
Konfirmasi tertulis Head Dev untuk `dev-rh`; teks disclaimer; definisi "menang" (`minMoveBps`); aturan alamat sama antar peran di kontrak; aturan umur token dan URL di post; format event burn dan CA dari PM; rencana peluncuran $ELYS; harga final; tinjauan hukum; nama final, domain, logo. Daftar blocker: `ELYSIA_BLOCKERS.md`; keputusan: `ELYSIA_DECISIONS.md` (catatan historis, tidak ditulis ulang).

## Batasan kerja
Tidak ada deploy atau transaksi tanpa persetujuan eksplisit per tindakan. Tidak membaca atau menulis secret. Tidak memakai resource, wallet, atau kredensial proyek sumber. Perubahan skema memakai migrasi baru. Commit dan push hanya atas persetujuan.

## Rujukan
`CLAUDE.md`, `ELYSIA_IMPLEMENTATION_ROADMAP.md`, `ELYSIA_INFRASTRUCTURE_CHECKLIST.md`, `ELYSIA_ARCHITECTURE.md`, `ELYSIA_SMART_CONTRACT_PLAN.md`, `ELYSIA_DATABASE_OPTIMIZATION.md`, `ELYSIA_BRIEF.md`, `ELYSIA_MIGRATION_PLAN.md`, `ELYSIA_BLOCKERS.md`.
