# ELYSIA — Checklist Infrastruktur (Robinhood Chain)

Status: rencana akhir untuk branch `dev-rh` (2026-11-13). Nilai rahasia tidak pernah ditulis di dokumen ini. Kolom status hanya memuat apa yang terbukti; sisanya "Belum dikonfirmasi" sampai developer memberi tahu.

| Item | Status | Catatan |
|---|---|---|
| GitHub repo | Remote `origin` = `ElysiaSealed/Elysia` | Private di GitHub Organization; dikonfirmasi lewat `git remote -v` dan hook pre-push |
| Branch | `main` dan `dev-rh` | `dev-rh` naik ke `main` saat pindah ke Robinhood. Push `dev-rh` hanya lewat `pnpm push:dev-rh` |
| Supabase (Free) | Belum dikonfirmasi | Project baru khusus ELYSIA; wajib hemat egress dan ukuran DB |
| Railway | Belum dikonfirmasi | Project baru; tiga service: api, worker, indexer (`railway.json` sudah ada) |
| Vercel | Belum dikonfirmasi | Project baru; Root Directory `apps/web` (`vercel.json` sudah ada) |
| Domain | Belum tersedia | Bergantung keputusan final |
| Logo dan aset brand | Belum tersedia | Jangan membuat placeholder |
| Wallet Deployer | `0x30E12875b1cc04cE06c4a889CDA435f475678D82` | Alamat publik; deploy dan admin kontrak |
| Wallet Agent | `0x399c038d0946b358A94F3DDdeE64A87df051a9fC` | Alamat publik; commit dan reveal |
| Wallet Treasury | `0x582660f6C3D5560D7797e1BC79DbB571Dd5a8121` | Alamat publik; penerima pembayaran USDG |
| Wallet Keeper | Tidak diperlukan di mainnet | Ledger membaca feed Chainlink langsung; Keeper hanya untuk mirror feed testnet |
| Saldo ETH untuk gas (mainnet) | Belum dikonfirmasi | Deployer dan Agent perlu ETH di Robinhood Chain |
| Akun X | `@ElysiaSealed` | Mode `dry`; label Automated |
| Bot Telegram | Belum dikonfirmasi | Bot baru; username di `TELEGRAM_BOT_USERNAME` |
| LLM | Xiaomi MiMo: `mimo-v2.6-flash` dan `mimo-v2.6-pro` | Kunci API baru milik ELYSIA belum diisi; tanpa kunci worker memakai mock |
| RPC | `https://rpc.mainnet.chain.robinhood.com` | Publik; chain ID 4663 diverifikasi |
| Explorer | `https://robinhoodchain.blockscout.com` | |

## 1. Pra-syarat pemisahan (sebelum membuat resource)
- [ ] Verifikasi akun yang login di CLI (`gh`, `supabase`, `railway`, `vercel`) dan project target pada **setiap** perintah cloud. Login ke akun yang benar tidak berarti project target sudah benar.
- [ ] `supabase/.temp/linked-project.json` tidak boleh menunjuk ke project proyek sumber; relink ke project baru sebelum menjalankan perintah `supabase`.
- [ ] Tidak ada repository, project, database, variabel lingkungan, secret, atau deployment target dari proyek sumber.
- [ ] Jangan membuat repository, project, database, domain, atau layanan eksternal sebelum developer memintanya secara eksplisit.

## 2. GitHub
- Conventional Commits (bahasa Inggris); hook `commit-msg` dan `pre-push` dipertahankan. `pre-push` menjalankan typecheck, build, test non-DB, dan `forge test`; hanya `main -> main` dan `dev-rh -> dev-rh` yang diizinkan.
- Belum ada `.github/`: tambahkan CI (typecheck, vitest, forge test) pada Phase B.
- Secret scanning dan push protection aktif; `.env*` di `.gitignore` kecuali `.env.example`.

## 3. Railway
Tiga service (api, worker, indexer). Health check `/healthz`. Restart `ON_FAILURE`. Variabel diisi manusia di dashboard. Semua harga fitur berbayar dan konfigurasi chain diatur lewat env (lihat bagian 8). Pantau biaya LLM dan infrastruktur lewat `cost_log`. Tidak ada deploy sebelum perintah eksplisit.

## 4. Supabase (Free Plan)
- Project baru dengan koneksi Postgres langsung dari backend (tanpa service role key).
- Hemat egress dan ukuran DB: tanpa `select *`, paginasi keyset, cache API (`Cache-Control` dan ETag), tanpa realtime subscription dan polling rapat, tulis per batch dengan `ON CONFLICT`, agregasi atau pangkas data mentah turunan. Bukti (hash commit, tx hash, prediksi, pembayaran) tidak dipangkas otomatis. Rujukan: `ELYSIA_DATABASE_OPTIMIZATION.md`.
- Verifikasi kuota resmi sebelum memilih region; siapkan cadangan bukti terpisah.
- Migrasi dijalankan ke project baru saja, termasuk `0012_rename_burn_column`; tidak ada migrasi destruktif tanpa persetujuan.

## 5. Vercel
Project baru, Root Directory `apps/web`, `NEXT_PUBLIC_API_URL` ke API ELYSIA, `NEXT_PUBLIC_USE_FIXTURES=false` di produksi. Web membaca harga dari `GET /pricing`, jadi perubahan harga tidak memerlukan deploy web.

## 6. Wallet dan dana
- Tiga wallet operasional di atas, dengan private key berbeda. Private key tidak pernah ke repo, `.env`, log, chat, atau dokumen; Claude tidak membuat wallet dan tidak menerima private key.
- Key Agent diisi manusia di dashboard Railway; Deployer memakai keystore Foundry dengan nama baru dan password diketik manusia.
- Mainnet memakai dana nyata: saldo ETH untuk gas dijaga seminimal yang dibutuhkan. Treasury menerima USDG dan tidak dipakai menandatangani apa pun oleh aplikasi.
- Verifikasi tiga alamat berbeda dengan `pnpm check:wallets` setelah skrip itu disesuaikan (Phase B).

## 7. Telegram dan X
- Bot Telegram baru (token baru, chat dan channel baru), tidak berbagi dengan proyek sumber. Chat Pro privat; channel publik cadangan.
- Akun X `@ElysiaSealed` berlabel Automated, tertaut akun founder, bio memuat "Not affiliated with Robinhood." `X_POST_MODE=dry` sampai R5. Balasan manual, tanpa auto-reply.

## 8. Environment variable (nama saja; nilai default ada di `.env.example`)
- Chain dan RPC: `CHAIN_ID=4663`, `CHAIN_ENV=mainnet`, `RPC_URL`, `ORACLE_RPC_URL`, `EXPLORER_URL`, `EXPLORER_TX_PATH`, `TOKEN_EXPLORER_URL`.
- Wallet dan kontrak: `DEPLOYER_ADDRESS`, `AGENT_ADDRESS`, `TREASURY_ADDRESS`, `ELYSIA_LEDGER_ADDRESS` (setelah R3), `AGENT_PRIVATE_KEY` (hanya di dashboard), `PREIMAGE_KEY`.
- Harga (USDG micros, bisa diedit): `PRO_PRICE_USDG_MICROS`, `PRO_DAYS`, `ASK_PRICE_USDG_MICROS`, `SIGNALS_PRICE_USDG_MICROS`, `SIGNALS_PERIOD_DAYS`, `SPONSORED_PRICE_USDG_MICROS`. Pembayaran: `PAID_FEATURES_ENABLED` (tetap `false` sampai R4), `PAYMENT_CHAIN_ID`, `PAYMENT_USDG_ADDRESS`, `ASK_PAYMENT_RECIPIENT`, `PRO_PAYMENT_RECIPIENT`.
- Token dan burn: `ELYS_TOKEN_ADDRESS`, `HOLDER_THRESHOLD`, `BURN_CONTRACT_ADDRESS` (CA dari PM), `BURN_FROM_ADDRESS`, `BURN_MIN_ELYS`.
- Layanan: `DATABASE_URL`, `X_POST_MODE`, kredensial `X_*`, `TELEGRAM_*`, `LLM_*`, `WEB_ORIGIN`, `NEXT_PUBLIC_*`, `INDEXER_*`.
- Nilai semuanya baru; mengganti nama variabel saja bukan pemisahan dari proyek sumber.

## 9. Kesiapan deploy mainnet
- [ ] R0 sampai R2 disetujui; [ ] wallet, akun, dan kunci baru; [ ] pemindaian secret bersih; [ ] `forge test` dan test lainnya hijau; [ ] simulasi skrip deploy tanpa broadcast sukses; [ ] saldo ETH Deployer cukup; [ ] alamat aset dan feed diverifikasi ulang dengan pemeriksaan baca-saja; [ ] persetujuan eksplisit untuk deploy.

## 10. Menunggu keputusan atau data
Konfirmasi tertulis Head Dev untuk `dev-rh`; teks disclaimer; CA burn dan ABI event dari PM; harga final; tinjauan hukum untuk pembayaran dan token; domain, logo, dan handle final; region dan plan Supabase; status resource Railway, Vercel, Supabase, dan bot Telegram.
