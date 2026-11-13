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
