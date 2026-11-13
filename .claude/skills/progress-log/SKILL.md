---
name: progress-log
description: Panduan pencatatan progres, blocker, dan keputusan ELYSIA ke dokumen ELYSIA. Hanya atas permintaan developer, tidak otomatis. Tidak menulis ke dokumen NEXA, tidak mengubah keputusan atau status blocker tanpa persetujuan, dan tidak mencatat klaim tanpa bukti.
---
> **Pembaruan `dev-rh` (2026-11-13):** isi di bawah ditulis untuk varian Elysium dan sebagian belum disesuaikan. Untuk `dev-rh`, `CLAUDE.md` yang berlaku: target Robinhood Chain mainnet (4663); peran Deployer, Agent, dan Treasury (tanpa Keeper); Ask gratis, Pro, Signals API, dan Sponsored berbayar dalam USDG; token $ELYS; disclaimer "Not affiliated with Robinhood"; tanpa Gate Report, Graduation Watch, HYPE Daily Call, dan rekap mingguan. Abaikan bagian yang bertentangan.

# progress-log (ELYSIA)

Skill ini mengatur cara mencatat progres di proyek **ELYSIA**. Ia **bukan otomatisasi**: tidak berjalan di akhir setiap task, tidak menjadi hook, dan hanya dipakai bila developer meminta pencatatan.

Sumber kebenaran: `CLAUDE.md`, `docs/ELYSIA_DECISIONS.md`, `docs/ELYSIA_WORKING_CONTEXT.md`, `docs/ELYSIA_BLOCKERS.md`, `docs/ELYSIA_IMPLEMENTATION_ROADMAP.md`.

## 1. Larangan
- **Jangan menulis ke dokumen NEXA:** `docs/PROGRESS.md`, `docs/BLOCKERS.md`, `docs/DECISIONS.md`, dan dokumen NEXA lain. Itu referensi historis.
- Jangan membuat dokumen progres baru; pakai dokumen ELYSIA yang sudah ada (bagian 2).
- Jangan menjalankan perintah cloud, deployment, transaksi, atau pipeline demi mencari bahan catatan.

## 2. Dokumen tujuan
| Dokumen | Dipakai untuk | Aturan |
|---|---|---|
| `docs/ELYSIA_WORKING_CONTEXT.md` | Konteks kerja dan status terkini | Perbarui ringkas dan akurat; bukan salinan dokumen lain |
| `docs/ELYSIA_DECISIONS.md` | Keputusan **FINAL** dan **PENDING** | Skill **tidak** menambah, mengubah, atau menaikkan status keputusan. Usulan dilaporkan ke developer dan baru ditulis setelah persetujuan eksplisit. PENDING tidak pernah menjadi FINAL tanpa persetujuan developer |
| `docs/ELYSIA_BLOCKERS.md` | Blocker dan **bukti** status penyelesaiannya | Blocker tidak ditandai selesai karena ada rencana, dokumen, atau niat. Status berubah hanya bila ada bukti nyata (bagian 3) dan persetujuan developer |
| `docs/ELYSIA_IMPLEMENTATION_ROADMAP.md` | Tahapan dan urutan pekerjaan yang **sudah disetujui** | Perubahan tahapan butuh persetujuan developer |
| Dokumen lain | Hanya bila relevan dan diminta | |

## 3. Integritas catatan
- **Planning bukan implementasi.** Jangan mencatat sesuatu sebagai selesai, terpasang, ter-deploy, atau terintegrasi bila belum benar-benar terjadi. Jangan mencatat deployment, transaksi, integrasi eksternal, atau hasil pipeline yang belum ada.
- **Setiap klaim progres harus menyertakan bukti dari pekerjaan aktual.** Tanpa bukti, tulis "belum terverifikasi" atau jangan dicatat.
- **Bukti nonrahasia yang boleh dicatat:**
  - path file yang diubah;
  - ringkasan hasil pengujian dan output verifikasi;
  - tanggal verifikasi;
  - alamat publik dan transaction hash;
  - referensi dokumentasi atau konfigurasi nonrahasia.
- **Dilarang dicatat:** private key, seed phrase/mnemonic, API key, token autentikasi, password, salt, preimage, dan semua informasi rahasia lainnya (juga tidak sebagian atau dalam bentuk tersamar). Bila ragu apakah sesuatu rahasia, jangan dicatat dan tanyakan.
- Pilihan teknis di luar brief ditandai **[di luar brief]** dan diperlakukan sebagai PENDING sampai disetujui.

## 4. Histori
- Tambahkan entri **bertanggal (UTC)**; pertahankan catatan lama. **Jangan menghapus atau menimpa catatan lama secara diam-diam.**
- Koreksi ditulis sebagai entri baru yang merujuk entri lama (apa yang diperbaiki dan mengapa), bukan dengan mengubah entri lama.

## 5. Proses
1. Kumpulkan bukti dari pekerjaan aktual (bagian 3).
2. Beri tahu developer apa yang akan dicatat dan di dokumen mana, kecuali developer sudah memerintahkan pencatatan tertentu.
3. Tulis entri sesuai bagian 2 dan 4.
4. Hal yang menyentuh keputusan (FINAL/PENDING), status blocker, atau roadmap dilaporkan sebagai usulan dan menunggu persetujuan.

## Referensi historis NEXA (bukan aturan aktif)
Versi lama memerintahkan memperbarui `docs/PROGRESS.md`, `docs/BLOCKERS.md`, dan `docs/DECISIONS.md` di setiap akhir task dan melapor hanya saat tahap selesai. Itu tidak berlaku untuk ELYSIA.
