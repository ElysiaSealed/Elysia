# ELYSIA — Database dan Optimasi (Supabase Free Plan)

Status: 2026-11-13, untuk `dev-rh`. Project Supabase baru khusus ELYSIA. Batas kuota Supabase Free **tidak ditulis di sini**: wajib diverifikasi ke dokumentasi resmi sebelum implementasi (ukuran database, egress, koneksi, auto-pause project idle).

## 1. Tabel saat ini (`packages/db/src/schema.ts`, migrasi 0000–0012)
| Kelompok | Tabel | Retensi dan catatan |
|---|---|---|
| Indexer | `indexer_state`, `pons_tokens`, `pons_trades`, `token_holders`, `whale_transfers` | `pons_trades`, `token_holders`, `whale_transfers`: data mentah turunan, boleh dipangkas atau diagregasi setelah dipakai laporan |
| Burn | `burns` | Hanya event dari CA PM; kolom `elys_burned`; ringkas, tanpa data mentah tambahan |
| Harga | `price_snapshots` | Down-sample (mis. satu titik per jam setelah N hari); jangan hapus titik yang dirujuk reveal |
| Bukti | `predictions` | **Permanen**: hash, tx commit/reveal, preimage terenkripsi, hasil |
| Konten | `post_queue`, `riskguard_log` | `post_queue` final dipangkas setelah N hari kecuali yang menautkan bukti; `riskguard_log` menyimpan hash konten, bukan teks |
| KOL | `kol_accounts`, `kol_calls` | Ringan |
| Akun berbayar | `api_keys`, `auth_nonces`, `auth_sessions`, `pro_subscriptions`, `pro_payments`, `pro_alerts`, `telegram_links`, `telegram_link_codes` | `pro_payments` dan `pro_subscriptions` permanen (bukti pembayaran); nonce dan sesi kedaluwarsa dipangkas; `pro_alerts` dipangkas |
| Ask | `ask_payments`, `ask_credit_uses` | Pembayaran permanen; kredit per bulan dapat diagregasi |
| Konten berbayar | `sponsored_reports` | Permanen (audit label sponsor) |
| Biaya | `cost_log` | Agregasi harian, detail dipangkas |

Prinsip: bukti (hash, tx hash, blok, teks yang diungkap, skor, keputusan RiskGuard, pembayaran) **tidak pernah dihapus otomatis**; hanya data mentah turunan dan sementara yang boleh dipangkas.

## 2. Pola query dan optimasi egress
| Endpoint | Optimasi |
|---|---|
| `GET /proof` | Agregat dibaca ringkas; daftar dengan keyset pagination; kolom terpilih, tanpa `SELECT *` |
| `GET /rug-radar`, `GET /market` | Jendela waktu terbatas; cache memori pendek |
| `GET /burn` | Total dihitung di SQL; hanya `RECENT_LIMIT` baris terbaru; cache 60 detik per instance |
| `GET /pricing` | Tidak menyentuh DB; cache 15 detik |
| `GET /leaderboard`, `GET /signals` | Paginasi, batas baris, kolom terpilih |

1. **Respons ringkas:** daftar tidak memuat teks panjang; detail diambil per id.
2. **Cache:** `Cache-Control` pada endpoint publik; ETag untuk `/proof`; invalidasi saat worker menulis commit atau reveal.
3. **Tanpa realtime subscription** ke Supabase dan tanpa polling rapat di web; interval refresh minimum dipertahankan (mis. `AutoRefresh` 15 detik hanya pada halaman yang perlu).
4. **Backend memakai koneksi Postgres langsung**, bukan REST Supabase, sehingga egress REST tidak terpakai; egress API ke klien tetap dihitung.
5. **Batch write:** indexer menulis per batch `getLogs`; simpan trade hanya untuk token yang berpotensi dievaluasi, bukan semua token.
6. **Idempotensi:** penulisan worker memakai kunci deterministik (`txHash-logIndex`, hash) dengan `ON CONFLICT`; kursor blok di `indexer_state` ditulis dalam transaksi yang sama dengan batch.
7. **Tanpa duplikasi:** teks laporan disimpan sekali; hash dihitung, bukan disimpan ganda di banyak tabel.
8. **Log hemat:** simpan hash konten dan alasan, bukan seluruh payload LLM.
9. **Index** berdasarkan query nyata; hindari index spekulatif.
10. **Free Plan:** project dapat di-pause saat idle dan batas ukuran dan egress berlaku; worker 24/7 menjaga aktif tetapi angka dan kebijakan harus diverifikasi, dan keputusan upgrade ditandai untuk Head Dev. Backup bukti (`predictions`, `pro_payments`) diekspor berkala ke penyimpanan terpisah.
11. **Region:** pilih berdasarkan lokasi worker di Railway (keputusan).

## 3. Migrasi
Migrasi 0000–0012 dijalankan ke project baru. Perubahan skema memakai migrasi baru (contoh: `0012_rename_burn_column`), bukan mengedit migrasi lama. Tidak ada data dari proyek sumber yang diimpor. Tidak ada migrasi destruktif tanpa persetujuan.

## 4. Monitoring
- Cek berkala ukuran DB per tabel (`pg_total_relation_size`) dan jumlah baris `pons_trades`, `price_snapshots`, `whale_transfers`.
- Pantau egress dari dashboard Supabase dan ukuran respons API (log ukuran, bukan isi).
- Catat biaya LLM dan infrastruktur di `cost_log`; alarm sederhana pada ambang ukuran DB.

## 5. Yang belum dapat dipastikan
- Kuota resmi Supabase Free saat ini.
- Volume event Pons V2 di mainnet (untuk ukuran `pons_trades`).
- Skema event burn dari PM.

## 6. Anggaran egress dan ukuran (Supabase Free: 5 GB egress per bulan, database 500 MB)
Target: egress database **di bawah 150 MB per hari** (batas bulanan 5 GB setara sekitar 166 MB per hari) dan ukuran database di bawah 420 MB. Egress dihitung sebagai byte yang dikirim Postgres ke klien (api, worker, indexer), bukan trafik pengunjung ke web.

### Temuan dan perbaikan
| Sumber egress | Sebelum | Sesudah |
|---|---|---|
| `/proof`, `/leaderboard`, `/predictions/:id` | `select` seluruh tabel prediksi, termasuk kolom preimage terenkripsi, tiap request; tumbuh sekitar 1,4 KB per prediksi per request | Agregat dihitung di SQL, hanya 10 baris terbaru dan satu baris berjalan, tanpa kolom preimage; cache memori 150 detik (satu prediksi 1 jam) |
| `/rug-radar`, `/market` | Query DB tiap request | Kolom terpilih; cache 120 detik dan 600 detik (snapshot harga hanya ditulis tiap 10 menit) |
| `/signals` | Satu query kunci dan satu query posting per request; satu kunci di batas laju (60 per menit) bisa memicu ribuan query per jam | Cache pencarian kunci 30 detik dan daftar posting 150 detik |
| Stream alert Pro (SSE) | Tiap koneksi memanggil DB tiap 3 detik, ditambah cek sesi tiap 30 detik | Satu poller bersama untuk semua koneksi dan hanya saat ada koneksi; cek sesi tiap 5 menit |
| Ask gratis | Batas per IP saja | Ditambah batas global `ASK_GLOBAL_PER_DAY` (2000) |
| Indexer | Baca kursor dari DB tiap 5 detik | Kursor di memori; polling 10 detik |

### Hasil ukur (Postgres lokal dengan data seed: 365 prediksi, 500 token, 1152 snapshot)
| Endpoint | Byte DB per request tanpa cache | Segar ulang per hari | Egress per hari |
|---|---|---|---|
| `/proof` (data skor) | 13,9 KB (termasuk handshake koneksi pertama; sekitar 6 KB sesudahnya) | 576 (tiap 150 dtk) | 8,0 MB (batas atas) |
| `/leaderboard` | 6,0 KB | 576 | 3,5 MB |
| `/rug-radar` | 8,9 KB | 720 (tiap 120 dtk) | 6,4 MB |
| `/market` | 87 KB pada data seed (sekitar 44 KB pada data nyata) | 144 (tiap 600 dtk) | 12,6 MB (seed) |
| `/predictions/:id` | 0,9 KB | paling banyak 24 per id, 256 id | 5,5 MB (batas atas) |
| Worker, idle | 11,8 KB per 90 detik pada siklus 10 detik | siklus bawaan 60 detik | sekitar 2 MB |
| Indexer, setelah perbaikan | 22 KB per 85 detik pada mainnet nyata (termasuk handshake sekitar 8 KB dan 29 trade yang diproses) | | proyeksi kasar 22 MB; pengukuran pendek, tergantung aktivitas Pons, ukur ulang beberapa jam |

Perkiraan total per hari pada pemakaian tinggi: skor, leaderboard, radar, dan market sekitar 30,5 MB; prediksi 5,5 MB; Signals 17 MB bila satu kunci memakainya terus (30 KB per segar ulang); stream Pro sekitar 3 MB; Ask 30 MB pada batas global (asumsi 15 KB per Ask, **belum diukur**); worker 10 MB; indexer 25 MB. Jumlahnya sekitar 121 MB, sisa sekitar 29 MB di bawah 150 MB. Angka asumsi harus diverifikasi dengan data nyata.

Byte dari cache dilayani tanpa menyentuh database, berapa pun jumlah pengunjung.

### Ukuran database (500 MB)
- Worker menjalankan `housekeeping` sekali sehari: menghapus `pons_trades` dan `whale_transfers` lebih tua dari 30 hari, `price_snapshots` lebih tua dari 7 hari, `pro_alerts` yang sudah terkirim lebih tua dari 30 hari, dan nonce atau sesi login yang kedaluwarsa. **Tidak pernah** menghapus `predictions`, `post_queue`, pembayaran, langganan, atau `riskguard_log`. Batas hari diatur lewat `RETAIN_*`.
- Housekeeping mencatat ukuran database; peringatan di `DB_SIZE_WARN_MB` (350 MB). Indexer berhenti menulis di `DB_SIZE_LIMIT_MB` (420 MB) supaya database tidak mencapai 500 MB dan berubah menjadi read-only. Ukuran yang dilaporkan Supabase mencakup skema sistem, jadi sisakan margin.

### Cara mengukur sendiri
```bash
# Jalankan di: ROOT (database lokal saja)
node scripts/measure-egress.mjs 55434 55433 120
# lalu jalankan service dengan DATABASE_URL yang menunjuk localhost:55434
```
Setelah deploy, bandingkan angka ini dengan grafik Egress di dashboard Supabase setiap hari selama seminggu pertama.
