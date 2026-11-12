# ELYSIA — BLOCKERS

Dokumen khusus ELYSIA (dibuat 2026-11-12). Terpisah dari `docs/BLOCKERS.md` (NEXA), yang tidak diubah dan tidak menjadi sumber nomor/status di sini. Semua item di bawah **Terbuka**: belum ada resource, wallet, atau kredensial ELYSIA yang dibuat. Tidak ada private key, password, atau API key yang boleh ditulis di dokumen ini.

Pemilik: **Manusia** = dikerjakan manusia (Claude tidak membuat wallet/akun/kunci); **Pemilik** = pemilik proyek; **Head Dev** = persetujuan; **Claude** = pekerjaan teknis setelah gate terbuka.

| ID | Blocker | Tindakan | Pemilik | Status |
|---|---|---|---|---|
| EB-01 | Pemisahan akun dan CLI dari NEXA sebelum tindakan cloud apa pun. Salinan ini memuat tautan project NEXA (`supabase/.temp/linked-project.json`) dan CLI `gh`/`supabase`/`railway`/`vercel` mungkin login ke akun NEXA | Logout atau gunakan profil/mesin terpisah; verifikasi akun aktif tiap CLI; jangan jalankan perintah `supabase`/`railway`/`vercel`/`gh` dari salinan ini sebelum relink ke akun ELYSIA | Pemilik | Terbuka |
| EB-02 | Tiga wallet baru belum ada: Deployer, Agent, Keeper (tiga private key berbeda, independen dari NEXA) | Membuat ketiga wallet; key Deployer di Foundry keystore bernama baru; key Agent dan Keeper disimpan sendiri dan diisi di dashboard Railway nanti; catat hanya alamat publik. Claude tidak membuat wallet dan tidak menerima key | Manusia | Terbuka |
| EB-03 | Alamat di `packages/contracts-abi/addresses/elysium-testnet.json` masih alamat NEXA (deployer, agent, treasury) dan keeper tak jelas pemiliknya | Isi ulang dengan tiga alamat baru, hapus field `treasury`, setelah EB-02 dan persetujuan perubahan file | Claude (setelah EB-02) | Terbuka |
| EB-04 | Faucet HYPE testnet untuk ketiga wallet (gas) | Klaim dari faucet resmi Elysium testnet (sumber: `packages/shared/src/chains.ts`) ke Deployer, Agent, Keeper; verifikasi saldo dengan `cast balance` | Manusia | Terbuka |
| EB-05 | Repository private baru belum dibuat | Buat repo private ELYSIA dari snapshot bersih; arsipkan dokumen operasional NEXA; jangan memakai remote NEXA | Pemilik | Terbuka |
| EB-06 | Infrastruktur independen belum ada (Railway, Supabase Free, Vercel) | Buat project baru setelah EB-01 dan EB-05; deploy hanya setelah gate G3; verifikasi kuota Supabase Free ke dokumentasi resmi | Pemilik | Terbuka |
| EB-07 | Kredensial Telegram baru (bot dan chat/kanal) | Buat bot dan kanal baru yang tidak berbagi token dengan NEXA; isi token di dashboard, bukan di repo | Manusia | Terbuka |
| EB-08 | Kredensial X baru (akun ELYSIA bertanda Automated, tertaut akun founder) | Buat akun dan API key baru; mode `dry` sampai izin `live` (G4); balasan manual | Manusia | Terbuka |
| EB-09 | Kredensial LLM baru (penyedia belum diputuskan) | Putuskan penyedia lalu buat key baru; selama kosong worker memakai mock LLM | Pemilik | Terbuka |
| EB-10 | Alamat dan ABI launchpad Elysium (Pump.fun, Ascend, Montra) belum terverifikasi (`pons` di `chains.ts` = `null`) | Riset ke dokumentasi resmi masing-masing launchpad; verifikasi event dengan data testnet sebelum menulis indexer | Claude (riset), Pemilik (konfirmasi) | Terbuka |
| EB-11 | Kepastian precompile HyperCore untuk harga mainnet (brief: aktif sekitar 4 minggu setelah mainnet; tidak boleh diasumsikan tersedia) | Pantau dokumentasi resmi; evaluasi saat Phase 5; tidak ada pekerjaan kontrak mainnet sebelum persetujuan baru | Head Dev | Terbuka |
| EB-12 | Pemisahan keputusan dan persetujuan desain kontrak (jalur Gate Report on-chain, kontrak baru vs rename, definisi "menang") | Putuskan di `ELYSIA_DECISIONS.md` (status PENDING) sebelum Phase 2 | Head Dev | Terbuka |
| EB-13 | Nama final dan handle (bentrok nama "Elysia" di brief), domain, logo/desain resmi | Putuskan nama; amankan handle dan domain; logo/aset: pending (jangan pakai atau buat placeholder dari NEXA) | Pemilik | Terbuka |
| EB-14 | Pengetatan `.claude/settings.json` dan adaptasi `CLAUDE.md`, skill, agent (masih aturan NEXA) | Tahap berikutnya setelah persetujuan; tidak diubah pada tahap planning | Head Dev | Terbuka |
| EB-15 | Pemindaian secret ulang di repo ELYSIA baru; riwayat git salinan ini tidak ada | Lakukan saat repo baru dibuat; laporkan hanya nama variabel dan lokasi, bukan nilai | Claude | Terbuka |

## Catatan
- Tidak ada blocker untuk Treasury, pembayaran Pro, atau wallet NEXA: ketiganya bukan kebutuhan ELYSIA.
- Perintah yang butuh password keystore dijalankan manusia dan ditulis di sini saat gate deploy (G3) dibuka. Belum ada perintah deploy yang disiapkan.
- Satu-satunya chain: Elysium Testnet, Chain ID 99801.

## Catatan progres (append-only)
**2026-11-12 — EB-14 (konfigurasi Claude Code): status tabel tidak diubah, belum selesai.**
- Bukti pekerjaan (nonrahasia): `CLAUDE.md` ditulis ulang dan bagian 8 diperbarui; tujuh skill diadaptasi (`commit-reveal`, `contract-change`, `riskguard-rule`, `new-endpoint`, `post-pipeline`, `progress-log`, `deploy-contracts` yang dinonaktifkan selama Planning); dua agent diadaptasi dan read-only; `.claude/settings.json` diperketat dan diverifikasi sebagian (lihat catatan progres di `ELYSIA_DECISIONS.md`); `integrate-html` diblokir lewat aturan deny.
- **Pekerjaan belum selesai (usulan blocker baru, belum bernomor, butuh persetujuan developer untuk dibuat resmi):** isolasi akses ke rahasia NEXA di mesin kerja. Aturan `Read` tidak menghalangi akses via Bash/PowerShell. Diperlukan pemisahan lingkungan kerja ELYSIA (profil OS terpisah, VM, atau WSL tanpa folder NEXA) atau sandbox yang terverifikasi.
- Belum selesai terkait EB-01: CLI `gh`/`vercel`/`railway`/`supabase` masih login ke akun yang dipakai NEXA dan `supabase/.temp` masih tertaut; ini tidak diubah.
- Item lain dari rencana yang belum dikerjakan: sinkronisasi baris PENDING di `ELYSIA_DECISIONS.md` tentang pengetatan settings, dan tiga keputusan kebijakan (urutan commit-persetujuan-publikasi, cakupan disclaimer, atribusi AI).
