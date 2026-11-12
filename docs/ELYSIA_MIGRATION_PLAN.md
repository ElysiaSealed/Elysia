# ELYSIA — Rencana Migrasi dari NEXA

Status: DRAFT planning (2026-11-11). Klasifikasi: KEEP / ADAPT / REMOVE / REPLACE / DEFER / INVESTIGATE. Semua REMOVE hanya dilakukan setelah persetujuan eksplisit. Tidak ada global find-and-replace; penggantian dilakukan per modul dengan test.

## 1. Pemisahan: temuan keamanan dan independensi (prioritas tertinggi)

| # | Temuan | Lokasi | Tingkat | Tindakan |
|---|---|---|---|---|
| S1 | `elysium-testnet.json` memakai **deployer, agent, dan treasury yang sama persis dengan NEXA** (identik dengan `testnet.json` dan `mainnet.json`; terverifikasi). Brief + Head Dev mewajibkan wallet ELYSIA sendiri | `packages/contracts-abi/addresses/elysium-testnet.json` | KRITIS | REPLACE: buat **tiga** wallet baru (deployer, agent, keeper); **field `treasury` dihapus** (ELYSIA gratis, tanpa Treasury). Jangan pakai alamat lama. Alamat `keeper` di file itu belum terverifikasi kepemilikannya: perlakukan sebagai milik NEXA/tidak diketahui, jangan dipakai |
| S1b | Model layanan: NEXA memiliki jalur pembayaran (USDG, Pro, Ask, sponsor, `TREASURY_ADDRESS`, `PRO_*`, `ASK_*`, `PAYMENT_*`) yang menerima dana ke wallet treasury. ELYSIA gratis | worker (`pro.ts`, `sponsored.ts`), api (`pro.ts`, `ask.ts`, `ask-signals.ts`, `auth.ts`, `payment-network.ts`), DB (`pro_*`, `ask_*`, `api_keys`, `sponsored_reports`, `auth_*`) | TINGGI | REMOVE dari repo ELYSIA setelah persetujuan; jangan dianggap fitur ELYSIA |
| S2 | Konvensi keystore dan skrip: `deployer`, `nexa-agent`; `check-wallets.mjs` menegakkan alamat deployer NEXA | `scripts/check-wallets.mjs`, skill `deploy-contracts` | TINGGI | REPLACE dengan nama keystore dan alamat ELYSIA |
| S3 | Supabase CLI tertaut ke project NEXA (`supabase/.temp/linked-project.json`, berisi project ref dan org id) | `supabase/.temp/` | TINGGI | REMOVE (setelah persetujuan); jangan pernah `supabase db push` dari salinan ini sebelum direlink |
| S4 | Settings mengizinkan `gh`, `git`, `railway`, `vercel`, `supabase` tanpa prompt; BLOCKERS NEXA mencatat CLI itu sudah login ke akun NEXA | `.claude/settings.json` | TINGGI | ADAPT: ketatkan (tahap implementasi, perlu persetujuan); verifikasi akun login sebelum perintah apa pun |
| S5 | Riwayat deploy NEXA: `contracts/broadcast/*` (chain 4663 dst.), alamat kontrak dan `NexaToken` di `mainnet.json`/`testnet.json` | `contracts/broadcast`, `addresses/` | SEDANG | REMOVE dari repo ELYSIA (arsip di repo NEXA) |
| S6 | Dokumen operasional NEXA (BLOCKERS, PROGRESS, DECISIONS, report, README, brief NEXA) memuat alamat, nama akun, region, dan status infra NEXA. Tidak ditemukan nilai rahasia | `docs/`, `README.md`, `report.md`, `nexa-ai_report.md` | SEDANG | REMOVE/arsip sebelum repo ELYSIA dibuat; developer 2 tidak perlu detail operasional NEXA |
| S7 | `.env.example` memuat nama variabel NEXA (mis. `NEXA_LEDGER_ADDRESS`, `BURN_VAULT_ADDRESS`, `ASK_*`, `PRO_*`, `PAIR_ASSET`) dan default `DEPLOYER_ADDRESS` NEXA | `.env.example` | SEDANG | REPLACE. Mengganti nama variabel saja tidak cukup; nilai dan akun juga harus baru |
| S8 | Pola kunci/token pada pemindaian: hanya terdeteksi di test dan skrip (nama `token`), tidak ada nilai rahasia terdeteksi. File `.env` tidak ada; `apps/web/.env.local` hanya berisi 4 variabel publik/fixture (`NEXT_PUBLIC_*`, `FIXTURE_PROOF`) | beberapa file test | RENDAH | Tidak ada tindakan; ulangi pemindaian saat repo baru dibuat |
| S9 | Tidak ada `.git`: remote dan riwayat tidak dapat diaudit di salinan ini | root | INFO | Saat repo baru dibuat, mulai dari snapshot bersih tanpa riwayat NEXA, atau audit riwayat dulu |

## 2. Klasifikasi modul

### Kontrak (`contracts/`)
| Modul | Kelas | Alasan / rencana |
|---|---|---|
| `NexaLedger.sol` | ADAPT → `ElysiaLedger` | Bukan rename saja. Lihat `ELYSIA_SMART_CONTRACT_PLAN.md` |
| `BurnVault`, `FeeSplitter`, `CreatorFeeSplitter`, `ProtocolFeeSplitter`, `ISwapper`, rasio 30/20 | REMOVE (setelah persetujuan) / jangan dibawa | Brief: tidak dipakai. Head Dev: jangan dibawa otomatis |
| `MockAggregator` | ADAPT | Dipakai untuk testnet (brief). Perketat akses `push` (saat ini terbuka untuk siapa pun) |
| `MockTokens`, `TestUSDG` | REMOVE | Khusus fee/USDG |
| `DeployNexaLedger`, `DeployTestnetMocks`, `DeployElysiumMocks` | ADAPT (digabung jadi script ELYSIA tunggal) | Hapus asumsi nonce/alamat NEXA |
| `DeployFees`, `DeployTestUsdg` | REMOVE | Fee/USDG |
| Test `NexaLedger.t.sol` | ADAPT | Pertahankan unit + fuzz; tambah kasus baru |
| `BurnVault.t.sol`, `FeeSplitters.t.sol` | REMOVE | |
| `lib/`, `out/`, `cache/` | INVESTIGATE | Artefak build; pasang ulang dari `install-contract-libs.sh` di repo baru |

### Backend
| Modul | Kelas | Rencana |
|---|---|---|
| `packages/shared/commit-reveal.ts`, `test-vectors` | KEEP/ADAPT | Skema hash NEXA adalah kandidat (status PENDING di `ELYSIA_DECISIONS.md`, bukan final); ganti nama; vektor dipakai bersama `forge test` bila skema disetujui |
| `packages/shared/chains.ts` | ADAPT | Sisakan hanya `elysiumTestnet` (99801) + konfigurasi dev lokal bila disetujui. Hapus `robinhood*`, Pons, Uniswap v4, USDG |
| `packages/shared/scoring.ts` | KEEP | Verifikasi dengan definisi "menang" ELYSIA |
| `packages/riskguard` | ADAPT | Lihat §4 |
| `packages/db` | ADAPT | Lihat `ELYSIA_DATABASE_OPTIMIZATION.md`. Migrasi NEXA (0000–0011) tidak dibawa; mulai dari baseline baru |
| `packages/contracts-abi` | ADAPT | Ekspor ABI `ElysiaLedger` saja |
| `packages/api-client` | ADAPT | Selaraskan dengan 3 endpoint brief |
| `apps/worker` `cycle`, `queue`, `ledger`, `crypto`, `keys`, `llm`, `telegram`, `x`, `cli/approve` | KEEP/ADAPT | Inti pipeline; ganti nama, persona, kredensial |
| `apps/worker` `keeper`, `oracle` | ADAPT | Sumber harga HYPE (Hyperliquid) sudah ada; hapus mirror Chainlink NVDA/ETH |
| `apps/worker` `daily` | ADAPT | HYPE Daily Call; aset prediksi HYPE saja |
| `apps/worker` `sponsored`, `pro` | REMOVE | ELYSIA gratis: tanpa sponsor/Pro/subscription/pembayaran |
| `apps/worker` `pulse`, `reports`, `market`, `dex`, `mention`, `kol` | DEFER/REMOVE | Fitur NEXA di luar brief ELYSIA (mention auto-reply bertentangan dengan "balasan manual"; `dex` = Uniswap v4/NVDA milik NEXA; `kol` bukan di brief) |
| `apps/indexer` (Pons, burn, holder) | REPLACE | Indexer launchpad Elysium; kerangka `process.ts`/state bisa jadi referensi |
| `apps/api` `/proof`, `/predictions/:id`, `/healthz` | KEEP/ADAPT | Dasar `/proof` |
| `apps/api` `/rug-radar` | ADAPT → `/gate-report` | |
| `apps/api` `/graduations` | REPLACE (baru) | |
| `apps/api` `/ask`, `/ask/plan`, `/pro/*`, `/signals*`, `/alerts/stream`, `/auth/*`, `/me` | REMOVE (setelah persetujuan) | Bagian dari model berbayar NEXA (Pro, Ask, Signals, SIWE, SSE pelanggan); ELYSIA gratis |
| `apps/api` `/burn`, `/leaderboard`, `/market` | REMOVE/DEFER | Burn tidak dibawa; leaderboard/market bukan di brief |
| Lapisan `?chain=` dan multi-chain di `app.ts`/`chains.ts` | REMOVE/ADAPT | Bertentangan dengan arahan "jangan multichain"; sisakan satu chain via env |
| `apps/web` | REPLACE (menunggu desain) | Semua teks/ikon/mascot/OG NEXA harus diganti. Logo ELYSIA belum ada: tandai pending, jangan buat placeholder |
| `scripts/nexa-terminal.mjs`, `html-to-jsx`, `review-testnet`, `indexer-local`, `telegram-test`, `export-abi`, `install-contract-libs` | INVESTIGATE (cek satu per satu); `nexa-terminal` kemungkinan REMOVE | |
| `docker-compose.yml`, `turbo.json`, `pnpm-*`, `railway.json` | KEEP/ADAPT | Ganti nama package dan service |
| `.githooks/` | KEEP | `commit-msg` dan `pre-push` generik; aktifkan di repo baru |

### Konfigurasi Claude Code
| Item | Kelas | Catatan |
|---|---|---|
| Root `CLAUDE.md` | REPLACE (tahap berikutnya) | §3 |
| `.claude/CLAUDE.md` (graphify) | KEEP | Aturan Graphify masih relevan; graph baru sudah menggambarkan kode salinan ini |
| `.claude/settings.json` | ADAPT | Hook Graphify `PreToolUse` (`graphify hook-guard search|read`) berfungsi dan dipertahankan; ketatkan izin deploy (S4) |
| `.claude/settings.json.graphify-bak` | KEEP sementara | Cadangan sebelum hook; tidak direstore otomatis |
| Skill `graphify`, `caveman`, `ponytail` | KEEP | Generik |
| Skill `commit-reveal`, `contract-change`, `deploy-contracts`, `riskguard-rule`, `post-pipeline`, `new-endpoint`, `integrate-html`, `progress-log` | ADAPT | Masing-masing 5 baris dan hard-code NEXA (30/20, alamat deployer NEXA, `@nexa-ai/*`, "sinkron dengan CLAUDE.md bagian 9"). Skill tidak dijalankan pada planning ini |
| Agent `contract-reviewer` | ADAPT | Hanya baca (`Read, Grep, Glob, Bash`); isi menyebut 30/20, BurnVault, Chainlink |
| Agent `riskguard-reviewer` | ADAPT | Punya `Write, Edit`, terbatas pada test `packages/riskguard`; aturan menyebut `$NEXA`. Tidak dijalankan |

## 3. Root CLAUDE.md NEXA: apa yang dibawa
- **Pertahankan:** urutan kerja berhenti-hanya-untuk-hal-wajib, konvensi (TS strict, zod, `bigint` untuk uang, UTC, rahasia hanya di `.env`), larangan force-push, "jangan broadcast ke mainnet", private key tidak di repo/log, aturan pemisahan wallet (kini tiga: deployer/agent/keeper, tanpa treasury), Conventional Commits, HITL (persetujuan manual).
- **Adaptasi:** tabel environment (satu chain), tahap roadmap (sesuai brief ELYSIA), prosedur skill.
- **Ganti:** identitas, tagline, Chain ID 4663/46630, the legacy NEXA repository, wallet (jadi tiga wallet ELYSIA: deployer, agent, keeper), Pons V2, stack LLM (MiMo) bila diganti, Supabase region.
- **Buang:** semua alur fee dan tokenomics 30/20, `BurnVault`, mekanisme burn, USDG, Stock Token, NVDA, **wallet treasury** (`TREASURY_ADDRESS`), seluruh model bisnis (Pro $19/Ask/Signals/Sponsored, `PAID_FEATURES_ENABLED`, SIWE), bagian 9 NEXA.
- **Konflik:** CLAUDE.md memerintahkan "langsung mulai setelah Mulai" dan lanjut tanpa konfirmasi; untuk ELYSIA perlu approval gate (§Roadmap).

## 4. RiskGuard: perubahan yang diperlukan (belum dilakukan)
Verifikasi source: `packages/riskguard/src/rules.ts`, `types.ts`. Tipe konten sekarang: `daily_summary, prediction, mention_reply, risk_report, technical_announcement, burn_report, sponsored`.
- Ganti aturan `$NEXA` menjadi aturan "tidak membahas token milik sendiri/ELYSIA" (brief). Aturan evasi (homoglyph/leet/spasi) dipertahankan.
- Tambah: wajib "Not affiliated with Kinetiq or Elysium" di bio/profil (brief), larang klaim "official Elysium/Kinetiq".
- Tambah tipe `gate_report`, `graduation_watch`, `hype_daily_call`, `weekly_recap`; hapus `burn_report`, `mention_reply` (balasan manual).
- Pertahankan: larangan beli/jual/price target, token < 1 jam (default `minTokenAgeSeconds: 3600`), label "Sponsored" (aturan pengaman dari brief 9.1; ELYSIA tidak menjual konten sponsor, jadi alur sponsor tidak dibawa dan aturan ini hanya defensif), tanpa URL.
- Aturan lama berbahasa ID: tetap boleh, tapi konten publik berbahasa Inggris; uji adversarial EN diperkuat.

## 5. Strategi migrasi (urutan)
1. Persetujuan keputusan §Roadmap (wallet, nama, scope).
2. Repo baru (private) dari snapshot bersih; arsipkan dokumen operasional NEXA.
3. Pisahkan identitas dan konfigurasi (nama package → `@elysia/*` atau pilihan lain; `.env.example` baru).
4. Hapus modul REMOVE yang disetujui; tiap penghapusan dikuatkan test hijau.
5. Adaptasi inti (shared, riskguard, db, worker, api) → kontrak → indexer → web.
6. Pemindaian secret ulang dan pemeriksaan batas independensi.

## 6. Checklist verifikasi
- [ ] Tidak ada alamat/kunci/akun NEXA di repo baru (grep terarah + pemindaian secret).
- [ ] `grep -ri nexa` pada kode runtime nol, kecuali rujukan historis yang disetujui.
- [ ] `pnpm test` dan `forge test` hijau setelah tiap tahap.
- [ ] Hanya `chainId` 99801 di konfigurasi.
- [ ] Tidak ada perintah deploy/push dijalankan dari salinan ini.

## 7. Risiko migrasi
- Rename massal merusak ABI/schema/api-client sekaligus (kopling NexaLedger tinggi: worker, api, api-client, web).
- Menghapus modul fee yang masih diimpor test/script lain → kegagalan build; gunakan graph + `grep` per modul.
- Mengambil alamat `keeper` yang tidak jelas pemiliknya.
