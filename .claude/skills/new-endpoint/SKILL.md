---
name: new-endpoint
description: Dipakai saat mengusulkan atau menambah endpoint API ELYSIA. Memeriksa kebutuhan terhadap brief, lalu urutan teknis zod, route Fastify, OpenAPI, api-client, fixture, dan test. Tidak otomatis menyetujui endpoint mana pun.
---
# new-endpoint (ELYSIA)

Skill ini untuk API **ELYSIA**. API di repo ini masih warisan NEXA (sekitar 20 route); **jangan menganggap endpoint NEXA dibutuhkan ELYSIA** dan jangan menjadikannya acuan kebutuhan.

Sumber kebenaran: `CLAUDE.md`, `docs/ELYSIA_BRIEF.md`, `docs/ELYSIA_DECISIONS.md` (FINAL/PENDING), `docs/ELYSIA_ARCHITECTURE.md`, `docs/ELYSIA_WORKING_CONTEXT.md`. Konflik dengan NEXA: ikuti ELYSIA.

## 0. Gerbang sebelum menyentuh API
- Perubahan hanya dimulai setelah permintaan eksplisit developer. Skill ini bukan izin untuk memulai.
- Brief menyebut tiga endpoint kandidat: `/proof`, `/gate-report`, `/graduations`. Itu **kandidat dari brief, belum disetujui untuk implementasi**. Jangan menganggap salah satunya sudah disetujui, dan jangan menambah endpoint di luar daftar itu tanpa kebutuhan yang jelas dalam brief/arsitektur dan persetujuan developer.
- Untuk setiap endpoint, tulis dulu: kebutuhan (kutip brief atau arsitektur), konsumen (web/Telegram/lainnya), sumber data, dan keputusan PENDING yang memengaruhi bentuk responsnya. Lalu minta persetujuan.
- **Bentuk kontrak API yang bergantung pada keputusan PENDING tidak boleh ditetapkan.** Contoh: isi `/gate-report` bergantung pada jalur Gate Report on-chain dan skema hash; statistik `/proof` bergantung pada desain `ElysiaLedger` dan definisi "menang"; `/graduations` bergantung pada alamat/ABI launchpad Elysium yang belum terverifikasi. Berhenti dan tanya, jangan memilih sendiri.
- Jangan mengasumsikan tabel database, kontrak, atau layanan eksternal yang belum disetujui. Skema DB rujukan: `docs/ELYSIA_DATABASE_OPTIMIZATION.md` (usulan, belum disetujui).

## 1. Ruang lingkup (FINAL)
- Satu chain: Elysium Testnet 99801. Tidak ada parameter `?chain=`, multichain, Robinhood, atau Solana.
- **Layanan gratis:** endpoint publik, baca saja, tanpa login wallet (SIWE), tanpa API key berbayar, tanpa verifikasi pembayaran, tanpa Pro/subscription, tanpa kredit, tanpa USDG, tanpa fitur burn. Jangan membawa `/ask`, `/pro/*`, `/signals*`, `/alerts/stream`, `/auth/*`, `/me`, `/burn`, `/leaderboard`, `/market` dari NEXA.
- Rate limit tetap diperlukan untuk melindungi biaya dan egress; bukan sebagai paket berbayar.

## 2. Aturan isi endpoint
- **Integritas bukti:** hanya tampilkan item yang tx commit-nya terkonfirmasi (tx hash tersimpan). Draft atau item yang belum ter-commit tidak pernah tampil. Salt dan preimage terenkripsi tidak pernah ada di respons atau log.
- **RiskGuard fail-closed:** hanya konten yang sudah lolos RiskGuard yang boleh tampil. Token berumur < 1 jam tidak ditampilkan sebagai laporan. Data tidak lengkap menghasilkan "tidak tahu"/field kosong yang jujur, bukan tebakan.
- Setiap angka dapat dilacak ke sumber (indexer/oracle/tx); tidak ada data karangan. Respons tidak memuat instruksi beli/jual atau target harga.
- Hemat egress (lihat dokumen database): pagination keyset, filter di server, kolom terpilih (bukan `SELECT *`), daftar tanpa payload panjang, cache/ETag bila datanya jarang berubah.
- Nilai uang/harga sebagai `bigint` dengan desimal eksplisit; waktu UTC.

## 3. Langkah teknis (setelah endpoint disetujui)
1. **Zod:** skema permintaan dan respons; input eksternal divalidasi.
2. **Route Fastify** di `apps/api`, memakai pola yang sudah ada (validasi, penanganan galat, `WEB_ORIGIN` untuk CORS).
3. **OpenAPI:** perbarui `docs/api/openapi.json` (lewat generator yang sudah ada bila ada).
4. **Api-client:** tambah fungsi bertipe di `packages/api-client` (browser dan server).
5. **Fixture** di `docs/api/fixtures/`: bentuk **identik** dengan respons asli; tanpa nilai rahasia atau data NEXA.
6. **Test:** keberhasilan, validasi input, keadaan kosong, item yang belum ter-commit tidak tampil, token < 1 jam tidak tampil, pagination, dan tidak ada kebocoran salt/preimage.
7. Respons memuat nilai **mentah dan terformat**, plus **link explorer** untuk tiap commit. Elysium memakai path `/transaction/<hash>` (bukan `/tx/`); bangun dari konfigurasi chain, jangan menulis URL di kode.

## 4. Di luar skill ini
Pembuatan tabel/migrasi, kontrak, indexer, deployment, dan layanan eksternal bukan bagian skill ini dan butuh persetujuan sendiri. Jalankan test lokal saja; jangan menjalankan perintah yang menghubungkan ke layanan eksternal.

## Referensi historis NEXA (bukan aturan aktif)
Versi lama skill ini tidak membatasi endpoint dan mengikuti API NEXA (termasuk Pro, Ask, Signals, SIWE, dan burn). Semua itu di luar ruang lingkup ELYSIA.
