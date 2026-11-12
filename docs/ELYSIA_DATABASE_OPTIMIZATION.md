# ELYSIA — Rancangan Database & Optimasi (Supabase Free Plan)

Status: DRAFT planning (2026-11-11). Tidak ada migrasi atau schema yang dibuat. Batas kuota Supabase Free **tidak dicantumkan di sini**: wajib diverifikasi ke dokumentasi resmi Supabase sebelum implementasi (database size, egress, jumlah koneksi, auto-pause project idle).

## 1. Kondisi schema NEXA (verifikasi `packages/db/src/schema.ts`, 358 baris, 12 migrasi)
Tabel yang terlihat: `pons_tokens`, `pons_trades`, `indexer_state`, `burns`, `token_holders`, `whale_transfers`, `price_snapshots`, `predictions`, `post_queue`, `api_keys`, `kol_accounts`, `kol_calls`, `auth_nonces`, `auth_sessions`, `ask_credit_uses`, `ask_payments`, `riskguard_log`, `cost_log`, `pro_subscriptions`, `pro_payments`, `pro_alerts`, tabel Telegram/sponsored (baris > 330 belum saya baca penuh: INVESTIGATE).

Relevan untuk ELYSIA: `predictions` (commit-reveal), `post_queue`, `riskguard_log`, `indexer_state`, `cost_log`, `price_snapshots` (diadaptasi). `pons_*` menjadi tabel launchpad Elysium (desain baru, bukan data NEXA).

**Di luar ruang lingkup ELYSIA (keputusan Head Dev 2026-11-12: layanan gratis):**
| Kelompok tabel NEXA | Alasan tidak termasuk desain ELYSIA |
|---|---|
| `pro_subscriptions`, `pro_payments`, `pro_alerts` | Tidak ada paket Pro/subscription/pembayaran |
| `ask_payments`, `ask_credit_uses` | Tidak ada Ask berbayar/kredit |
| `auth_nonces`, `auth_sessions` | SIWE/login wallet hanya untuk fitur berbayar dan benefit holder |
| `api_keys` | Signals API berbayar tidak dibawa |
| `sponsored_reports` | Tidak ada konten sponsor |
| Tabel penautan Telegram pelanggan (berbasis alamat langganan) | Notifikasi gratis tanpa tautan wallet |
| `burns`, `whale_transfers`, `token_holders` (versi NEXA), `kol_*` | Burn/Stock Token/KOL bukan bagian brief ELYSIA |

**Membedakan dua hal (penting):**
1. *Mengeluarkan dari desain ELYSIA* = tabel di atas tidak masuk baseline schema ELYSIA dan tidak diberi migrasi di repo ELYSIA. Ini keputusan desain, sudah final.
2. *Menghapus tabel/migrasi* = tindakan teknis terhadap file/database. **Tidak dilakukan sekarang.** `packages/db` dan migrasi 0000–0011 di salinan ini dibiarkan utuh. Tidak ada `DROP`, tidak ada perubahan `schema.ts`. Pembersihan hanya dilakukan di repo ELYSIA baru setelah persetujuan (lihat `ELYSIA_MIGRATION_PLAN.md`), dan tidak pernah menyentuh database NEXA.

## 2. Tabel target (usulan; perlu review sebelum migrasi)
| Tabel | Tujuan | Kunci/Index utama | Retensi |
|---|---|---|---|
| `launches` | token launchpad (address, launchpad, creator, `launched_at`, `age_ok_at`, status tahap AMM/HyperCore/HIP-3) | PK address; index `launched_at`, `(stage, updated_at)` | Permanen (ringan) |
| `launch_trades` | hanya trade token yang sedang dievaluasi (untuk bundling: blok, wallet) | PK `tx-logIndex`; index `(token, block)` | **Boleh dipangkas** setelah laporan final (data turunan tersimpan di `gate_reports.evidence`) |
| `gate_reports` | laporan: ringkas terstruktur, `report_hash`, `commit_tx`, `commit_block`, status, hasil RiskGuard | PK id; unique `report_hash`; index `(status, created_at)` | **Permanen** (bukti) |
| `predictions` | HYPE Daily Call; preimage terenkripsi, hash, tx commit/reveal, hasil | unique `hash`; index status | **Permanen** (bukti) |
| `post_queue` | antrian persetujuan/posting | index `(status, scheduled_at)` | Pangkas yang berstatus final setelah N hari **kecuali** yang menautkan bukti (pertahankan referensi ke commit) |
| `riskguard_log` | keputusan (simpan hash konten, bukan teks) | index `created_at` | Permanen untuk audit; agregasi bila besar |
| `price_snapshots` | harga HYPE dari keeper | index `(asset, at)` | Pangkas/down-sample (mis. simpan 1 titik per jam setelah N hari). **Jangan** hapus titik yang dirujuk reveal |
| `indexer_state` | kursor blok | PK name | — |
| `cost_log` | biaya LLM/X/infra | index `(category, created_at)` | Agregasi harian, detail dipangkas |
| `telegram_subscribers` (opsional) | pengikut bot ELYSIA (gratis, hanya `chat_id` + preferensi), tanpa alamat wallet/langganan | PK chat_id | Hapus saat berhenti (`/stop`); bukan data bukti |

Prinsip: bukti (hash, tx hash, blok, teks yang diungkap, skor, keputusan RiskGuard) **tidak pernah dihapus otomatis**; yang boleh dipangkas hanya data mentah turunan dan sementara. Retensi otomatis atas data historis penting **tidak direkomendasikan**.

## 3. Pola query (dari 3 endpoint brief)
| Endpoint | Query | Optimasi |
|---|---|---|
| `GET /proof` | statistik + daftar commit | counter/agregat dibaca dari kontrak atau tabel agregat kecil; daftar dengan **keyset pagination** (`id < :cursor`, `limit`), kolom terpilih saja |
| `GET /gate-report` | daftar & detail | filter server-side (`status`, `from`), keyset pagination, tanpa `SELECT *`, tanpa kolom `evidence` pada daftar |
| `GET /graduations` | transisi tahap | index `(stage, updated_at)`; jendela waktu terbatas |

## 4. Optimasi egress dan resource
1. **Respons ringkas:** daftar tidak memuat teks panjang/evidence; detail diambil per id.
2. **Cache:** `Cache-Control` + ETag untuk `/proof` (data berubah hanya saat commit/reveal), cache memori pendek untuk `/graduations`. Invalidasi saat worker menulis commit/reveal.
3. **Tanpa realtime subscription** ke Supabase pada fase ini; frontend tidak melakukan polling cepat (interval minimum ditetapkan saat desain; SSE NEXA tidak dibawa).
4. **Backend memakai koneksi Postgres langsung** (pola NEXA), bukan REST Supabase, sehingga egress REST tidak terpakai; tetap hitung egress API → klien.
5. **Batch write:** indexer menulis per batch `getLogs` (blok ~130 ms → volume tinggi). Simpan trade hanya untuk token yang berpotensi dievaluasi (usia ≥ 1 jam), bukan semua token.
6. **Idempotensi:** semua penulisan worker memakai kunci deterministik (`tx-logIndex`, `report_hash`) dengan `ON CONFLICT DO NOTHING/UPDATE`; kursor blok di `indexer_state` ditulis dalam transaksi yang sama dengan batch.
7. **Pencegahan duplikasi:** teks laporan disimpan sekali; hash dihitung, bukan disimpan ganda di banyak tabel.
8. **Log hemat:** simpan hash konten dan alasan, bukan seluruh payload LLM.
9. **Index berdasar query nyata** di atas; hindari index spekulatif (setiap index menambah storage/tulis).
10. **Keterbatasan Free Plan:** project dapat di-pause saat idle dan batas ukuran/egress berlaku; worker 24/7 menjaga aktif tetapi **angka dan kebijakan harus diverifikasi** dan keputusan upgrade ditandai (Head Dev). Backup bukti: ekspor berkala `gate_reports`/`predictions` ke penyimpanan terpisah, karena Free Plan memiliki opsi backup terbatas (verifikasi).
11. **Region:** NEXA memakai `us-east-1` (BLOCKERS NEXA) sementara rencana awal `ap-southeast-1`; pilih berdasar lokasi worker/Railway (keputusan).

## 5. Monitoring
- Cek berkala ukuran DB per tabel (`pg_total_relation_size`) dan jumlah baris `launch_trades`/`price_snapshots`.
- Pantau egress dari dashboard Supabase dan ukuran respons API (log ukuran, bukan isi).
- Alarm sederhana: ambang ukuran DB dan jumlah query lambat; catat di `cost_log`.

## 6. Migrasi dari NEXA
Tidak membawa migrasi 0000–0011. Baseline baru dibuat satu kali saat implementasi (Drizzle sudah ada) dan hanya memuat tabel §2. Tidak ada data NEXA yang diimpor (pemisahan wajib). Tabel pembayaran/auth NEXA tidak pernah ada di database ELYSIA, sehingga tidak ada kebutuhan retensi, egress, atau backup untuk data pembayaran. Integritas bukti (hash, tx, blok, skor, keputusan RiskGuard) dan histori audit tetap dijaga walau fitur lain dikeluarkan.

## 7. Yang belum dapat dipastikan
- Isi lengkap schema setelah baris ~330 dan kolom tabel yang belum dibaca.
- Volume event launchpad Elysium (alamat/ABI belum diverifikasi).
- Kuota resmi Supabase Free saat ini.
