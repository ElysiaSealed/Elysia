# ELYSIA — Checklist Infrastruktur

Status: DRAFT planning (2026-11-11). Semua item masih **belum dibuat**. Tidak ada koneksi ke infrastruktur NEXA. Nilai rahasia tidak ditulis di dokumen.

| Item | Status | Catatan |
|---|---|---|
| GitHub private repo baru | Belum dibuat | |
| Railway project baru | Belum dibuat | |
| Supabase project baru (Free) | Belum dibuat | |
| Vercel project baru | Belum dibuat | Menunggu desain web |
| Domain | Belum tersedia | Bergantung nama final |
| Logo/aset brand | Belum tersedia | Jangan buat placeholder |
| Wallet deployer, agent, keeper (3 wallet, 3 key berbeda) | Belum dibuat | Final Head Dev 2026-11-12. File addresses saat ini memakai alamat NEXA: **dilarang** |
| Wallet treasury | **Tidak ada** | ELYSIA gratis: tanpa Pro/subscription/pembayaran |
| Penyedia pembayaran/USDG | **Tidak ada** | Tidak dibawa |
| Telegram bot | Belum | |
| X API credentials | Belum | |
| LLM API key | Belum | |

## 1. Pra-syarat pemisahan (lakukan sebelum membuat apa pun)
- [ ] Verifikasi akun yang login di CLI (`gh`, `supabase`, `railway`, `vercel`): BLOCKERS NEXA mencatat semuanya login ke akun NEXA di mesin ini. Logout atau gunakan profil terpisah sebelum membuat resource ELYSIA.
- [ ] `supabase/.temp/linked-project.json` tertaut ke project NEXA: jangan jalankan perintah `supabase` dari salinan ini sebelum relink.
- [ ] Salinan ini tidak punya `.git`/remote: jangan inisialisasi dengan remote NEXA.

## 2. GitHub
- Repo **private** baru; branch `main` + `testnet` (satu environment on-chain: testnet). Tidak ada branch `mainnet` sampai Phase 5.
- Conventional Commits (bahasa Inggris), PR wajib review; `commit-msg` dan `pre-push` hook dipertahankan. Tidak ada `.github/` saat ini: tambahkan CI (lint, typecheck, vitest, forge test) pada fase implementasi.
- Secret scanning dan push protection aktif; `.env*` di `.gitignore` (sudah, kecuali `.env.example`).
- Developer 2 tidak diberi akses ke repo/secret NEXA.

## 3. Railway
Tiga service (api, worker, indexer) dari repo baru. Health check `/healthz` (pola sudah ada di `apps/api/railway.json`). Restart `ON_FAILURE`. Variabel diisi manusia; tidak ada nilai di repo. Pantau biaya (catat di `cost_log`). Tidak ada deploy sampai G3/perintah eksplisit.

## 4. Supabase (Free Plan)
Project baru, koneksi Postgres langsung dari backend (tanpa service role key di backend). Verifikasi kuota resmi sebelum memilih region/ukuran (lihat `ELYSIA_DATABASE_OPTIMIZATION.md`). Backup bukti (`gate_reports`, `predictions`) disiapkan terpisah.

## 5. Vercel
Project baru, Root Directory `apps/web`, `NEXT_PUBLIC_API_URL` ke API ELYSIA. Preview dari branch `testnet`. Hanya setelah desain dan perintah deploy.

## 6. Wallet
- Tepat **tiga** wallet baru, independen dari NEXA, dengan tiga private key berbeda: Deployer (deploy/admin kontrak, owner), Agent (commit/reveal/atestasi), Keeper (operasi oracle/feed). Tidak ada wallet lain.
- Private key tidak ke repo/`.env` repo/log/chat. Key agent dan keeper diisi manusia di dashboard Railway; deployer lewat Foundry keystore dengan nama baru (bukan `deployer`/`nexa-agent` NEXA). Claude tidak membuat wallet dan tidak menerima private key.
- **Tidak ada Treasury Wallet.** ELYSIA tidak memiliki paket Pro, subscription, atau pembayaran. Jangan membawa `TREASURY_ADDRESS`, `ASK_*`, `PRO_*`, `PAYMENT_*`, USDG, atau mekanisme burn/fee.
- Saldo: hanya HYPE testnet (faucet) untuk gas; tidak ada dana lain.
- Faucet HYPE (`chains.ts`): dilakukan manusia.
- `check-wallets.mjs` harus disesuaikan agar tidak menegakkan alamat NEXA.

## 7. Telegram dan X
- Bot Telegram baru (token baru, chat/channel baru). Tidak berbagi dengan bot NEXA.
- Akun X ELYSIA: label **Automated**, tertaut akun founder, bio memuat "Not affiliated with Kinetiq or Elysium." Mode `X_POST_MODE=dry` sampai G4. Balasan manual; tanpa auto-reply. Pantau harga X API resmi (angka NEXA bukan dasar).

## 8. Environment variable (nama saja)
Dibawa/diadaptasi: `CHAIN_ENV`, `RPC_URL`, `DATABASE_URL`, `X_POST_MODE`, `X_API_KEY|SECRET`, `X_ACCESS_TOKEN|SECRET`, `X_LIVE_POST_CAP`, `APPROVAL_MODE`, `LLM_PROVIDER|BASE_URL|API_KEY|MODEL_SMALL|MODEL_LARGE`, `LLM_PRICE_*`, `WEB_ORIGIN`, `PREIMAGE_KEY`, `DEPLOYER_ADDRESS`, `AGENT_ADDRESS`, `KEEPER_ADDRESS`, `KEEPER_PRIVATE_KEY`, `AGENT_PRIVATE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `INDEXER_*`, `NEXT_PUBLIC_*`.
Diganti nama: `NEXA_LEDGER_ADDRESS` → alamat ElysiaLedger.
Tidak dibawa (final: layanan gratis, tanpa Treasury): `TREASURY_ADDRESS`, `PAIR_ASSET`, `NEXA_TOKEN_ADDRESS`, `BURN_*`, `PAYMENT_*`, `ASK_*`, `PRO_*`, `HOLDER_*`, `DEX_*`, `WHALE_*`, `PAID_FEATURES_ENABLED`, `NEXT_PUBLIC_ASK_PAYMENT_ADDRESS`, `NEXT_PUBLIC_API_URL_ELYSIUM`.
Nilai semuanya baru; mengganti nama variabel saja bukan pemisahan.

## 9. Kesiapan deploy
- [ ] G0–G3 disetujui; [ ] wallet/akun/kunci baru; [ ] pemindaian secret bersih; [ ] test hijau; [ ] dry run kontrak sukses; [ ] keeper berjalan sebelum reveal pertama.

## 10. Menunggu keputusan
Nama final/handle dan domain; pemegang kunci tiap dari tiga wallet dan akun X; region/plan Supabase; penyedia LLM; apakah dev lokal Anvil diperbolehkan; alamat launchpad Elysium; desain dan logo.
