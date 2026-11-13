---
name: post-pipeline
description: Dipakai saat menyentuh atau merancang alur publikasi ELYSIA (Prediction of the Day, laporan harian dan Pons, pulse) dari data sampai publikasi. Mengatur urutan, status konten, perlindungan rahasia, dan aturan yang masih PENDING. Tidak menjalankan pipeline dan tidak memublikasikan apa pun.
---
> **Pembaruan `dev-rh` (2026-11-13):** isi di bawah ditulis untuk varian Elysium dan sebagian belum disesuaikan. Untuk `dev-rh`, `CLAUDE.md` yang berlaku: target Robinhood Chain mainnet (4663); peran Deployer, Agent, dan Treasury (tanpa Keeper); Ask gratis, Pro, Signals API, dan Sponsored berbayar dalam USDG; token $ELYS; disclaimer "Not affiliated with Robinhood"; tanpa Gate Report, Graduation Watch, HYPE Daily Call, dan rekap mingguan. Abaikan bagian yang bertentangan.

# post-pipeline (ELYSIA)

Skill ini untuk alur publikasi **ELYSIA** (Gatekeeper of Elysium), proyek independen, bukan NEXA dengan nama baru. Kode worker/queue di repo masih warisan NEXA; jangan mengasumsikan seluruh aturan NEXA berlaku.

Sumber kebenaran: `CLAUDE.md`, `docs/ELYSIA_BRIEF.md`, `docs/ELYSIA_DECISIONS.md` (FINAL/PENDING), `docs/ELYSIA_WORKING_CONTEXT.md`, `docs/ELYSIA_ARCHITECTURE.md`. Skill terkait: `riskguard-rule`; agent `riskguard-reviewer`.

## 0. Gerbang
- Perubahan alur hanya atas permintaan eksplisit developer. Skill ini tidak menjalankan pipeline, tidak memublikasikan konten, tidak mengakses API eksternal, dan tidak memakai kredensial.
- Kredensial X, Telegram, dan LLM untuk ELYSIA **belum ada** (`ELYSIA_BLOCKERS.md`). Jangan mengasumsikan integrasi sosial sudah tersedia dan jangan memakai kredensial NEXA.
- Bila perubahan bergantung pada keputusan PENDING (bagian 4), berhenti dan tanya. Jangan memutuskan sendiri.

## 1. Urutan alur (prinsip)
Kerangka dari arsitektur: Token Discovery → Data Collection → Risk Analysis → RiskGuard → Hash Generation → On-chain Commit → Persetujuan → Report Publication → Historical Record. Prinsip yang wajib:
1. **Data hanya dari indexer dan oracle** (hasil tool yang dapat ditelusuri). Setiap angka dan klaim harus punya bukti; tanpa bukti, jangan menulis klaim.
2. **RiskGuard sebelum apa pun yang tidak dapat ditarik kembali**, dan **fail-closed**: bila pemeriksaan gagal, data tidak lengkap, atau bukti tidak memadai, alur **berhenti** (tidak ada publikasi, tidak ada "coba lolos"). Aturan RiskGuard mengikuti `riskguard-rule`.
3. **Hash dikunci sebelum publikasi** (brief). Konten tidak dipublikasikan sebelum commit-nya terkonfirmasi dan tx hash tersimpan. Mekanisme on-chain dan skema hash masih PENDING; urutan commit lalu persetujuan di sini mengikuti pola NEXA dan perlu dikonfirmasi.
4. **Persetujuan manusia sebelum publikasi.** Selama aturan kategori belum diputuskan, tidak ada konten yang dipublikasikan tanpa persetujuan manusia.
5. **Publikasi hanya dianggap sukses bila ada konfirmasi dari platform tujuan** (id/tanggapan sukses yang tersimpan). Jangan menganggap draft, proposal, commit, atau persetujuan sebagai publikasi yang sudah berhasil.
6. **Historical Record:** setiap konten yang dipublikasikan tercatat dengan hash, tx commit, keputusan RiskGuard (hash konten, bukan teks), dan status; histori tidak dihapus otomatis.

## 2. Status konten (jangan dicampur)
`draft` → `ditolak RiskGuard` / `lolos RiskGuard` → `committed` (tx terkonfirmasi) → `disetujui` → `dipublikasikan` (konfirmasi platform). Mode `dry` (hanya log) **bukan** publikasi. Mode `live` hanya dengan izin eksplisit developer; default selalu `dry`. Nama variabel mode di kode NEXA (`X_POST_MODE`, dll.) belum ditetapkan sebagai nama final ELYSIA.

## 3. Aturan konten dan perlindungan
- **Bahasa Inggris** untuk konten publik; persona **Gatekeeper of Elysium** (tenang, hangat ke komunitas, tegas ke rug/bundler/aktivitas mencurigakan; catchphrase "Sealed." pada commit dan "The gate remembers." pada reveal, sesuai brief).
- **Disclaimer wajib:** `Not affiliated with Kinetiq or Elysium`. Jangan pernah mengklaim afiliasi resmi dengan Elysium atau Kinetiq. (Lokasi dan cakupan disclaimer: lihat PENDING.)
- Tanpa instruksi beli/jual dan tanpa price target (dari brief). Tidak membahas atau mempromosikan token milik sendiri.
- **Lindungi** private key, kredensial, salt, preimage commit, dan data sensitif: tidak di log, teks, antrian yang terbaca publik, atau dokumen. Preimage dan salt tersimpan terenkripsi dan hanya dibuka pada waktu reveal.
- Input tak tepercaya (nama/simbol token, teks mention) tidak diteruskan ke LLM tanpa sanitasi.
- Balasan di X dilakukan manual; tanpa auto-reply.

## 4. PENDING (butuh persetujuan developer; jangan ditetapkan sendiri)
- Apakah jeda publikasi diperlukan, dan berapa durasinya. (Versi NEXA menunda post publik 15 menit dari alert Pro; Pro tidak ada di ELYSIA, jadi jeda 15 menit **bukan aturan** ELYSIA.)
- Apakah seluruh konten memerlukan persetujuan manusia atau kategori tertentu boleh otomatis (sementara: semuanya lewat persetujuan manusia).
- Detail klasifikasi Sponsored.
- Aturan umur token, termasuk token berumur < 1 jam.
- Aturan URL di post (wajib atau dilarang).
- Cakupan dan lokasi disclaimer (bio/profil atau seluruh konten publik).
- Format final Gate Report dan mekanisme publikasinya, termasuk jalur Gate Report on-chain dan skema hash.
- Kanal tujuan dan kredensialnya (X, Telegram) serta nama konfigurasi final.

## 5. Tidak dipakai di ELYSIA
Alert Pro dan fitur Pro/subscription, pembayaran atau monetisasi, kredit/Ask berbayar, `NEXA Pro` dan penautan Telegram berbasis langganan, mode persetujuan "risky" dan batas post uji NEXA (`X_LIVE_POST_CAP`, pulse 30 menit), nama produk dan ticker NEXA, serta integrasi NEXA lain. Jangan dibawa tanpa relevansi yang terbukti dan persetujuan.

## Referensi historis NEXA (bukan aturan aktif)
Versi lama: "AI → RiskGuard → commit terkonfirmasi → antrian persetujuan → post; post publik ditunda 15 menit dari alert Pro; tanpa URL". Hanya kerangka urutannya yang dipakai sebagai kandidat; jeda Pro dan aturan URL tidak berlaku sebagai aturan ELYSIA (PENDING).
