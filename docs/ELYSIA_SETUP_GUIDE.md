# ELYSIA — Panduan Setup Supabase, Railway, dan Vercel

Status: 2026-11-13. Panduan untuk developer. Semua langkah membuat resource **baru** khusus ELYSIA; jangan memakai project, database, atau secret dari proyek sumber. Nilai rahasia diketik manusia di dashboard dan tidak pernah ditulis di repo, chat, atau dokumen.

## 0. Kesiapan database (terverifikasi)
- Skema dan migrasi 0000–0012 diterapkan bersih ke Postgres 16 kosong (lokal, port 55433).
- Test DB lulus untuk api, indexer, dan worker (180 test, 3 dilewati). `drizzle-kit generate` melaporkan tidak ada perubahan skema.
- Belum diuji: koneksi ke Supabase nyata, kuota free plan, dan beban indexer pada mainnet.

## 1. Sebelum mulai
1. Pastikan akun GitHub, Supabase, Railway, dan Vercel yang login adalah akun ELYSIA. Cek project dan organisasi target pada setiap langkah.
2. Jangan menjalankan perintah CLI (`supabase`, `railway`, `vercel`) dari folder repo ini sebelum relink; folder `supabase/.temp` dapat menunjuk ke project lama. Memakai dashboard web lebih aman.
3. Siapkan password manager untuk semua nilai rahasia.

## 2. Supabase (Free)
1. Buat project baru bernama `elysia`. Pilih region yang dekat dengan region Railway yang akan dipakai (mis. Singapore untuk keduanya). Simpan **database password** di password manager.
2. Ambil connection string: Project Settings → Database → Connection string → **Session pooler** (host `aws-...pooler.supabase.com`, port `5432`, user `postgres.<project-ref>`). Pakai session pooler: bukan direct connection (hanya IPv6) dan bukan transaction pooler (port 6543), karena worker dan indexer memakai koneksi jangka panjang.
3. Tambahkan `?sslmode=require` di akhir URL. Hasilnya `postgresql://postgres.<ref>:<password>@aws-...pooler.supabase.com:5432/postgres?sslmode=require`. Ini nilai `DATABASE_URL`.
4. Jalankan migrasi **dari mesin Anda**, satu kali, ke project baru itu:
   ```bash
   # Jalankan di: ROOT
   export DATABASE_URL="<URL session pooler dari langkah 3>"
   pnpm --filter @elysia/db migrate
   ```
   Hasil yang benar: `migrasi selesai`. Verifikasi di Table Editor: tabel `predictions`, `post_queue`, `pons_tokens`, `burns` (kolom `elys_burned`), dan lainnya ada.
5. Batas koneksi: tiga service (api, worker, indexer) masing-masing memakai `DB_POOL_MAX` koneksi (bawaan 4). Set `DB_POOL_MAX=3` di semua service agar total 9 koneksi.
6. Free plan: project di-pause setelah idle lama dan ada batas ukuran database dan egress. Verifikasi angka terbaru di dokumentasi Supabase dan pantau ukuran DB dan egress dari dashboard setiap minggu. Jangan mengaktifkan Realtime atau memakai REST API untuk data aplikasi; backend memakai koneksi Postgres langsung.
7. Jangan menyalin **service role key** ke mana pun; backend tidak membutuhkannya.

## 3. Railway
Satu project Railway baru dengan **tiga service** dari repo `ElysiaSealed/Elysia`, branch `main`:

| Service | Config-as-code path | Perintah start | Health check |
|---|---|---|---|
| api | `/apps/api/railway.json` | `pnpm --filter @elysia/api start` | `/healthz` |
| worker | `/apps/worker/railway.json` | `pnpm --filter @elysia/worker start` | tidak ada |
| indexer | `/apps/indexer/railway.json` | `pnpm --filter @elysia/indexer start` | tidak ada |

Langkah:
1. Railway → New Project → Deploy from GitHub repo → pilih repo ELYSIA (izinkan akses Railway ke repo itu saja).
2. Buat tiga service dari repo yang sama. Untuk tiap service: Settings → Config-as-code path (isi sesuai tabel) dan Root Directory dikosongkan (monorepo pnpm butuh akar repo).
3. Isi variabel di tab Variables tiap service (lihat di bawah). **Jangan deploy worker sebelum variabelnya lengkap.**
4. Service api: Settings → Networking → Generate Domain. Catat URL publiknya untuk `NEXT_PUBLIC_API_URL`.
5. Pantau biaya: Railway berbayar per pemakaian. Pasang batas pengeluaran di Settings.

### Variabel per service (nama saja)
Semua service:
- `DATABASE_URL` (dari Supabase), `DB_POOL_MAX=3`

api:
- `CHAIN_ID=4663`, `EXPLORER_URL=https://robinhoodchain.blockscout.com`, `EXPLORER_TX_PATH=/tx/`, `TOKEN_EXPLORER_URL=https://robinhoodchain.blockscout.com`
- `WEB_ORIGIN=https://<domain-vercel>` (tanpa slash akhir; pisahkan dengan koma bila lebih dari satu)
- `TRUST_PROXY_HOPS=1` (Railway ada satu proxy di depan; tanpa ini semua klien dianggap satu IP untuk batas laju)
- `PAID_FEATURES_ENABLED=false` (tetap sampai gate R4)
- Harga (opsional, sudah ada nilai bawaan): `PRO_PRICE_USDG_MICROS`, `PRO_DAYS`, `ASK_PRICE_USDG_MICROS`, `SIGNALS_PRICE_USDG_MICROS`, `SIGNALS_PERIOD_DAYS`, `SPONSORED_PRICE_USDG_MICROS`
- Tunda sampai pembayaran dibuka: `PAYMENT_CHAIN_ID`, `TREASURY_ADDRESS`

worker:
- `RPC_URL=https://rpc.mainnet.chain.robinhood.com`, `ORACLE_RPC_URL=https://rpc.mainnet.chain.robinhood.com`, `CHAIN_ID=4663`
- `X_POST_MODE=dry`, `APPROVAL_MODE=all`
- `PREIMAGE_KEY`: buat sendiri dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` dan **simpan cadangan**; tanpa kunci ini preimage lama tidak dapat dibuka.
- `LLM_PROVIDER=mimo`, `LLM_BASE_URL`, `LLM_MODEL_SMALL`, `LLM_MODEL_LARGE`, `LLM_API_KEY` (kunci baru milik ELYSIA; kosong berarti mock)
- Setelah deploy kontrak disetujui: `ELYSIA_LEDGER_ADDRESS` dan `AGENT_PRIVATE_KEY` (diketik manusia; tanpa keduanya commit dan reveal nonaktif)
- Opsional: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_PRO_CHAT_ID`, kredensial `X_*` (hanya untuk mode `live`)

indexer:
- `CHAIN_ENV=mainnet`
- `INDEXER_START_BLOCK`: biarkan kosong agar indexer mulai dari blok terkini. **Jangan** mengisi blok lama; backfill besar menghabiskan ukuran DB free plan.
- `BURN_CONTRACT_ADDRESS` kosong sampai PM memberi CA.

## 4. Vercel (web)
1. Project baru dari repo ELYSIA, Root Directory `apps/web`, Framework Next.js. Pastikan opsi "Include source files outside of the Root Directory" aktif (paket workspace `@elysia/*` ada di luar `apps/web`).
2. Variabel: `NEXT_PUBLIC_API_URL=https://<domain-api-railway>`, `NEXT_PUBLIC_USE_FIXTURES=false`, `NEXT_PUBLIC_SITE_URL=https://<domain-web>`, `NEXT_PUBLIC_X_HANDLE=ElysiaSealed`.
3. Setelah domain Vercel ada, isi `WEB_ORIGIN` di service api di Railway, lalu redeploy api.

## 5. Urutan kerja yang disarankan
1. Supabase: buat project, ambil URL, jalankan migrasi (bagian 2).
2. Railway: buat project dan service api saja dulu, isi variabel, deploy, lalu cek `https://<api>/healthz` dan `https://<api>/pricing`.
3. Vercel: deploy web, cek halaman utama memuat harga dari API.
4. Railway: tambah service indexer, lalu worker (X dan LLM tetap aman: `dry`, kunci LLM kosong atau baru).
5. Pantau log tiga service dan dashboard Supabase satu hari penuh sebelum langkah berikutnya.
6. Deploy `ElysiaLedger` dan pembayaran mengikuti gate R3 dan R4 di roadmap, bukan bagian panduan ini.

## 6. Verifikasi dan keselamatan
- `GET /healthz` menjawab `{"ok":true,"chainId":4663,"chain":"robinhood"}`.
- Tidak ada secret di repo; `.env` tidak di-commit.
- Tabel kosong itu normal: indexer hanya mengisi data baru dari blok terkini.
- Bila ada yang gagal, kirim ke asisten hanya pesan error (tanpa URL, password, atau key).

## 7. Database lokal untuk pengembangan
```bash
# Jalankan di: ROOT
docker compose up -d --wait
docker exec elysia-postgres psql -U elysia -d elysia -c "create database elysia_test"
export TEST_DATABASE_URL=postgres://elysia:elysia@localhost:55433/elysia_test
DATABASE_URL=$TEST_DATABASE_URL pnpm --filter @elysia/db migrate
pnpm test:db
```
