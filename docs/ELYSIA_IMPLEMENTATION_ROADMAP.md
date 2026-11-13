# ELYSIA — Roadmap Implementasi (Robinhood Chain)

Status: rencana akhir untuk branch `dev-rh` (2026-11-13). Arah: ELYSIA berjalan di **Robinhood Chain mainnet (chain ID 4663)**, langsung tanpa tahap testnet. Estimasi waktu **tidak diberikan**: belum ada dasar validasi. Kompleksitas: R (rendah), S (sedang), T (tinggi).

Roadmap Elysium Testnet sebelumnya tidak lagi berlaku untuk `dev-rh`. Fitur dan halaman khusus Elysium sudah disingkirkan dari branch ini; riwayatnya tetap ada di `main`.

## Produk
- AI analyst di Robinhood Chain: membaca peluncuran Pons V2 dan Stock Token, meng-commit setiap prediksi on-chain sebelum dipublikasikan, lalu mempublikasikannya setelah persetujuan manusia.
- Gratis: feed publik, Prediction of the Day, Proof of Intelligence, Rug radar, Ask, Burn tracker (riwayat dari CA yang diberikan PM).
- Berbayar (USDG): Pro (alert lebih awal), Signals API, Sponsored report. Harga sementara dan dapat diedit lewat env: Pro $5 per 30 hari, Ask gratis, Signals API $499 per 30 hari, Sponsored $750 per laporan.
- Token **$ELYS** dengan kontrak baru. Alamat menyusul; halaman Burn membaca CA dari PM. Tidak ada BurnVault dan tidak ada splitter fee kreator.

## Approval gates (wajib, urutan)
| Gate | Isi | Pemberi |
|---|---|---|
| R0 | Arahan `dev-rh` (Robinhood mainnet, fitur berbayar, token $ELYS) dikonfirmasi tertulis sebagai keputusan FINAL, termasuk teks disclaimer | Head Dev |
| R1 | Wallet mainnet siap dan didanai ETH (Deployer, Agent, Treasury). Resource baru: Supabase, Railway, Vercel, bot Telegram, kunci LLM, kredensial X | Pemilik |
| R2 | Review kontrak `ElysiaLedger` selesai (test penuh, `contract-reviewer`, review manusia) | Head Dev |
| R3 | Deploy `ElysiaLedger` ke mainnet 4663 (perintah dijalankan manusia, persetujuan eksplisit per deploy) | Pemilik |
| R4 | Pembayaran USDG terverifikasi ujung ke ujung dengan jumlah kecil; tinjauan hukum; `PAID_FEATURES_ENABLED=true` | Pemilik + Head Dev |
| R5 | X mode `live` | Pemilik |
| R6 | Token $ELYS: kontrak, CA, dan rencana peluncuran disetujui; CA burn dari PM diterima | Head Dev + PM |

Mainnet berarti kontrak tidak dapat dibatalkan dan transaksi memakai dana nyata. Tidak ada broadcast apa pun tanpa persetujuan eksplisit.

## Phase A — Fondasi `dev-rh` (SELESAI)
Branch `dev-rh` dan aturan push khusus; `ElysiaLedger` menggantikan ledger lama (kontrak, ABI, worker, API); rename merek dan token ke Elysia dan $ELYS; default chain ke mainnet 4663 dan penyingkiran kode Elysium; penyingkiran BurnVault dan fee splitter, burn dibaca dari CA PM, migrasi 0012; teks web, persona worker, dan RiskGuard untuk Robinhood; harga yang dapat diedit lewat `GET /pricing`; `.env.example` baru.
Bukti: `forge test` 25 lulus, typecheck bersih, build produksi berhasil, test non-DB lulus; test DB belum dijalankan.

## Phase B — Penyelesaian pembersihan
Tugas: dokumen `docs/ELYSIA_*.md` lain, skill, agent, dan `README.md` disesuaikan dengan Robinhood [S]; `settings.json` (aturan deny dan ask) ditinjau untuk fase mainnet [S]; skrip `check-wallets.mjs` disesuaikan (Keeper tidak dibutuhkan di mainnet) [R]; test DB lokal dijalankan dengan `TEST_DATABASE_URL` ke `elysia_test` [R]; pindai secret dan jejak proyek sumber di seluruh repo [R]; CI (typecheck, vitest, forge test) [S].
Acceptance: tidak ada alamat, kunci, akun, atau nama proyek sumber di runtime maupun dokumen; test DB dilaporkan jalan; CI hijau.

## Phase C — Kontrak dan deploy mainnet (R2, R3)
Tugas: tinjau `ElysiaLedger` (peran Deployer/Agent, `setFeed` hanya owner, ronde oracle, `minMoveBps`) [T]; perbarui skrip deploy untuk mainnet dan hapus skrip mock testnet yang tidak dipakai [S]; simulasi `forge script` tanpa broadcast dengan konfirmasi [S]; deploy oleh manusia, verifikasi di Blockscout [R]; `setFeed` untuk NVDA dan WETH ke feed Chainlink yang sudah diverifikasi [S]; isi `ELYSIA_LEDGER_ADDRESS` dan ekspor ABI [R].
Dependency: R1, R2. Acceptance: `forge test` hijau; alamat dan transaksi deploy tercatat; satu prediksi commit, reveal, dan skor berhasil dengan jumlah gas kecil.
Risiko: feed Chainlink memiliki heartbeat sehingga reveal tertunda; kesalahan alamat aset tidak dapat dikoreksi tanpa transaksi lagi.

## Phase D — Data dan pipeline
Tugas: indexer Pons V2 (factory, hook, graduation executor) dengan blok awal dan backfill terbatas [S]; Rug radar, pasar Stock Token, selisih DEX vs oracle [S]; worker Prediction of the Day dan laporan harian [S]; pipeline AI → RiskGuard → commit terkonfirmasi → antrian persetujuan manusia [KEEP]; bot Telegram [S]; X tetap `dry`.
Dependency: R1; commit memerlukan R3. Acceptance: laporan contoh lolos RiskGuard dry run; tidak ada buy/sell, price target, klaim afiliasi, atau sebutan $ELYS; data tidak lengkap menjadi "tidak tahu".
Risiko: batas egress dan ukuran Supabase free; sumber data tidak lengkap.

## Phase E — Pembayaran dan fitur berbayar (R4)
Tugas: uji pembayaran Pro dengan USDG di mainnet (jumlah kecil, dengan persetujuan) [S]; alur kunci Signals API setelah pembayaran [S]; alur Sponsored (kontak, label, tinjauan manusia) [S]; benefit holder $ELYS setelah token ada [S]; tinjauan hukum dan disclaimer [Head Dev].
Acceptance: satu pembayaran Pro terverifikasi dan teraktivasi; alert Telegram dan stream jalan; `PAID_FEATURES_ENABLED=true` hanya setelah R4.
Risiko: USDG tampaknya kontrak proxy (kode pendek): admin kontrak berada di pihak ketiga.

## Phase F — Burn dan token $ELYS (R6)
Tugas: terima CA burn dan ABI/event dari PM, sesuaikan `apps/indexer/src/abi.ts` dan tabel `burns` [S]; backfill dan uji halaman Burn [R]; kontrak $ELYS baru dan rencana peluncuran [T, keputusan terpisah].
Acceptance: halaman Burn menampilkan riwayat dari CA PM dengan tautan explorer; tidak ada transaksi burn dari ELYSIA.

## Phase G — Peluncuran publik (R5)
Tugas: domain dan handle final; logo dan aset merek (belum ada, jangan membuat placeholder); X `live` bertahap dengan batas `X_LIVE_POST_CAP`; pemantauan biaya (`cost_log`) dan kuota Supabase; cadangan data bukti.
Acceptance: akun X berlabel Automated; post hanya lewat persetujuan manusia; laporan biaya dan kuota.

## Urutan implementasi
R0 → Phase A (selesai) → Phase B → R1 → Phase C (R2, R3) → Phase D → R4 → Phase E → Phase F (R6) → R5 → Phase G.

## Keputusan terbuka
- Konfirmasi tertulis Head Dev untuk arah `dev-rh`; baris PENDING 2026-11-13 di `ELYSIA_DECISIONS.md` bertentangan dengan keputusan FINAL lama (khusus Elysium).
- Teks disclaimer publik: saat ini "Not affiliated with Robinhood"; apakah perlu menyebut Pons.
- Harga final (nilai sementara sudah diatur lewat env) dan pihak yang menerbitkan kunci Signals API.
- Tinjauan hukum untuk fitur berbayar dan token $ELYS.
- Format event burn dan CA dari PM; detail peluncuran $ELYS.
- Aturan umur token dan aturan URL di post (masih PENDING).
- Nama final, domain, logo, region Supabase.
