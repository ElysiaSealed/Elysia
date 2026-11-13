# ELYSIA — BLOCKERS (Robinhood Chain, `dev-rh`)

Diperbarui 2026-11-13. Dokumen ini hanya memuat blocker untuk jalur Robinhood. Tidak ada private key, password, atau API key yang boleh ditulis di sini.

Pemilik: **Manusia** = dikerjakan manusia (Claude tidak membuat wallet, akun, atau kunci); **Pemilik** = pemilik proyek; **Head Dev** = persetujuan; **PM** = pemberi data; **Claude** = pekerjaan teknis setelah gate terbuka.

| ID | Blocker | Tindakan | Pemilik | Status |
|---|---|---|---|---|
| RB-01 | Konfirmasi tertulis Head Dev untuk arah `dev-rh` (Robinhood mainnet, fitur berbayar, token $ELYS); baris PENDING 2026-11-13 bertentangan dengan keputusan FINAL lama | Head Dev menandai entri itu FINAL di `ELYSIA_DECISIONS.md` | Head Dev | Terbuka |
| RB-02 | Pemisahan akun dan CLI dari proyek sumber sebelum tindakan cloud apa pun; `supabase/.temp` dapat menunjuk ke project lama | Verifikasi akun dan project target pada tiap perintah; relink ke project baru | Pemilik | Terbuka |
| RB-03 | Resource baru: Supabase (free), Railway, Vercel | Buat project baru atas permintaan eksplisit; verifikasi kuota Supabase | Pemilik | Belum dikonfirmasi |
| RB-04 | Bot Telegram baru dan kunci LLM baru; kredensial X untuk mode `live` | Dibuat manusia dan diisi di dashboard, bukan di repo | Manusia | Belum dikonfirmasi |
| RB-05 | Saldo ETH di Robinhood Chain untuk Deployer dan Agent | Manusia mendanai; verifikasi dengan `cast balance` (baca-saja) | Manusia | Belum dikonfirmasi |
| RB-06 | CA burn, ABI atau signature event burn, dan blok awal dari PM | PM memberi; sesuaikan `apps/indexer/src/abi.ts` dan `burns.ts`, isi `BURN_CONTRACT_ADDRESS` | PM, Claude | Terbuka |
| RB-07 | Tinjauan `ElysiaLedger` terhadap feed Chainlink (aturan `roundId ± 1`, phase, heartbeat, jam pasar) | Uji simulasi fork baca-saja dan review sebelum deploy | Claude, Head Dev | Terbuka |
| RB-08 | Deploy `ElysiaLedger` ke mainnet | Manusia menjalankan; persetujuan eksplisit; lihat `ELYSIA_SMART_CONTRACT_PLAN.md` §6 | Pemilik | Terbuka |
| RB-09 | Pembayaran USDG terverifikasi ujung ke ujung dan tinjauan hukum | Uji jumlah kecil dengan persetujuan; baru `PAID_FEATURES_ENABLED=true` | Pemilik, Head Dev | Terbuka |
| RB-10 | Teks disclaimer publik ("Not affiliated with Robinhood", apakah menyebut Pons) | Keputusan Head Dev | Head Dev | Terbuka |
| RB-11 | Harga final dan pihak yang menerbitkan kunci Signals API | Harga sementara di env; keputusan final | Pemilik | Terbuka |
| RB-12 | Token $ELYS: kontrak, CA, dan rencana peluncuran | Keputusan terpisah (gate R6) | Head Dev, PM | Terbuka |
| RB-13 | Nama final, handle, domain, logo dan aset brand | Putuskan; jangan membuat placeholder | Pemilik | Terbuka |
| RB-14 | Test DB lokal belum dijalankan (butuh Postgres lokal `elysia_test` dan `TEST_DATABASE_URL`) | Manusia menyiapkan DB lokal; Claude menjalankan `pnpm test:db` | Manusia | Terbuka |
| RB-15 | Isolasi akses ke rahasia proyek sumber di mesin kerja: aturan `Read` tidak menghalangi akses lewat Bash atau PowerShell | Pisahkan lingkungan kerja (profil OS, VM, atau WSL) atau sandbox yang terverifikasi | Pemilik | Terbuka |

## Catatan
- Perintah yang butuh password keystore dijalankan manusia dan ditulis di dokumen deploy saat gate R3 dibuka.
- Satu-satunya chain: Robinhood Chain mainnet 4663.
- Blocker lama untuk Elysium Testnet (alamat launchpad Elysium, precompile HyperCore, mock feed, keeper) tidak berlaku untuk `dev-rh`; riwayatnya tetap di branch `main`.

## Catatan progres (append-only)
**2026-11-13 — Phase B (pembersihan dokumen dan skrip).** Dokumen inti, `README.md`, dan `scripts/check-wallets.mjs` disesuaikan dengan jalur Robinhood. Tidak ada blocker yang diselesaikan oleh perubahan ini.
