# ELYSIA — Roadmap Implementasi

Status: DRAFT planning (2026-11-11). Estimasi waktu **tidak diberikan**: belum ada dasar validasi; brief menyebut "minggu 1–3" untuk fase awal sebagai perkiraan awal belum tervalidasi. Kompleksitas: R (rendah), S (sedang), T (tinggi).

## Approval gates (wajib, urutan)
| Gate | Isi | Pemberi |
|---|---|---|
| G0 | Nama final/handle (bentrok "Elysia" di brief), scope, penghapusan modul NEXA | Pemilik + Head Dev |
| G1 | Wallet deployer/agent/keeper baru, repo private baru | Pemilik |
| G2 | Keputusan kontrak (jalur Gate Report, definisi menang) | Head Dev |
| G3 | Deploy testnet 99801 (perintah dijalankan manusia) | Pemilik |
| G4 | X `live` | Pemilik |
| G5 | Hasil evaluasi mainnet readiness (precompile, audit). Persetujuan baru diperlukan sebelum pekerjaan mainnet apa pun | Head Dev |

Tidak ada gate token: token Solana ditunda dan **tidak ada di roadmap aktif** (lihat "Hal di luar roadmap aktif").

## Phase 0 — Audit dan pemisahan proyek
Tujuan: repo independen tanpa jejak NEXA. 
Tugas: (1) selesaikan audit (dokumen ini) [R]; (2) arsipkan dokumen operasional NEXA [R]; (3) repo private baru dari snapshot bersih [R, G1]; (4) pemindaian secret + batas independensi [R]; (5) `CLAUDE.md` ELYSIA, adaptasi skill/agent, ketatkan `settings.json` [S, G0]. 
Dependency: G0, G1. Prioritas: tertinggi. 
Acceptance: tidak ada alamat/kunci/akun/nama NEXA di runtime; CLI login diverifikasi ke akun yang benar; `pnpm test`/`forge test` hijau di baseline. 
Risiko: salah login CLI ke infra NEXA.

## Phase 1 — Foundation
Tujuan: kerangka single-chain. 
Tugas: rename package + env [S]; sederhanakan `chains.ts` ke 99801 [S]; baseline schema DB [S]; hapus modul DEFER/REMOVE yang disetujui [S]; persona/prompt ELYSIA (EN) [S]; RiskGuard adaptasi + test allow/block EN [S]; arsitektur bot Telegram baru [S]; desain web: pending aset [—]. 
Dependency: Phase 0. 
Acceptance: build + test hijau; RiskGuard memblokir buy/sell, price target, klaim "official", token < 1 jam; mewajibkan disclaimer. 
Testing: `riskguard-rule` (EN), vektor hash. Risiko: kopling NexaLedger di api-client/web.

## Phase 2 — Elysium Testnet (kontrak)
Tugas: `ElysiaLedger` + mock feed terbatas [T, G2]; test unit+fuzz [S]; script deploy 99801 + dry run [S]; ekspor ABI [R]; konfigurasi chain/explorer [R]. 
Dependency: G1, G2. 
Acceptance: `forge test` hijau; dry run sukses; (G3) deploy dan verifikasi Blockscout oleh manusia; link explorer tersedia. 
Risiko: oracle mock terbuka; kunci keeper.

## Phase 3 — Gate Report dry run (off-chain)
Tugas: konfirmasi alamat/ABI launchpad Elysium (Pump.fun, Ascend, Montra) [INVESTIGATE→S]; indexer launchpad + deteksi bundling [T]; data collection + analisis risiko [T]; pipeline LLM→RiskGuard→hash [S]; antrian persetujuan manual + CLI [KEEP]; X mode `dry` [R]; historis laporan di DB [S]. 
Dependency: Phase 1, alamat launchpad (blocker). 
Acceptance: **5 sample Gate Report lolos RiskGuard dry run**; usia token ≥ 1 jam ditegakkan; tidak ada buy/sell/price target; tidak ada URL. 
Risiko: sumber data tidak lengkap → laporan "tidak tahu" (aturan brief).

## Phase 4 — Integrasi testnet
Tugas: HYPE Daily Call: commit → reveal → skor [S]; commit hash Gate Report [S]; keeper HYPE (Hyperliquid) [S]; API `/proof`, `/gate-report`, `/graduations` + OpenAPI + fixture + api-client [S]; Graduation Watch [S]; Telegram dry [S]; web terhubung (setelah desain) [T]; verifikasi event on-chain [R]; verifikasi konfigurasi independen [R]. 
Dependency: Phase 2 (G3), Phase 3. 
Acceptance (kriteria testnet brief): lihat §Kriteria. 
Risiko: heartbeat keeper membuat reveal tertunda; batas Free Plan.

## Phase 5 — Mainnet readiness (hanya evaluasi, perlu persetujuan baru)
Catatan: target kontrak saat ini hanya Elysium Testnet 99801. Phase 5 hanya evaluasi dokumen/riset, bukan pekerjaan kontrak mainnet.
Tugas: evaluasi precompile HyperCore (tidak diasumsikan tersedia) [INVESTIGATE]; desain ulang sumber harga (snapshot on-chain) [T]; review keamanan/audit [T]; kesiapan operasional; X live (G4) hanya dengan izin. 
Acceptance: dokumen readiness; keputusan G5. Tidak ada deploy mainnet pada roadmap ini.

## Phase 6 — Dikeluarkan dari roadmap aktif
Token Solana ditunda dan menunggu persetujuan baru. Phase ini **tidak dijadwalkan** dan tidak punya task, dependency, atau acceptance criteria. Lihat "Hal di luar roadmap aktif".

## Kriteria penerimaan testnet (diturunkan dari brief + permintaan)
1. `ElysiaLedger` ter-deploy ke 99801. 2. Terverifikasi di explorer. 3. Satu HYPE prediction ter-commit. 4. Ter-reveal. 5. Ter-skor. 6. Lima Gate Report lolos RiskGuard dry run. 7. Tidak ada secret NEXA. 8. Tidak ada dependensi ke infra production NEXA. 9. Tautan explorer (ledger, tx deploy, commit, reveal). 10. Hasil uji terdokumentasi.
Pekerjaan penyokong: wallet baru (G1) + faucet HYPE, mock feed + keeper aktif (reveal butuh round setelah jatuh tempo), RPC testnet stabil, Postgres baru, kunci LLM baru, test hijau, pemindaian secret.

## Urutan implementasi
G0 → Phase 0 → Phase 1 → (Phase 2 ‖ Phase 3 jika launchpad diketahui) → G3 → Phase 4 → laporan testnet → Phase 5 (evaluasi, perlu persetujuan baru).

## Hal di luar roadmap aktif (hanya catatan masa depan)
- Token Solana, tokenomics, dan integrasi token apa pun: ditunda, menunggu persetujuan baru. Tidak ada jadwal.
- Pertimbangan masa depan (bukan prasyarat jadwal): brief menyarankan token dipertimbangkan setelah ±30 hari Gate Report ter-skor dan opini hukum. Periode 30 hari ini hanya catatan, bukan tenggat implementasi.
- Chain lain, bridge, multichain: tidak ada. Target kontrak: Elysium Testnet, Chain ID 99801.
- Fitur berbayar (Pro, Ask, Signals, sponsor): tidak ada; ELYSIA gratis.

## Konflik dan keputusan terbuka
- Brief menyebut token di Solana dan tahap mainnet; Head Dev dan arahan terbaru: tanpa chain lain → token **ditunda**, mainnet hanya evaluasi (Phase 5).
- `docs/ELYSIUM-PLAN.md` (NEXA on Elysium) menyatakan satu codebase multi-chain dan menjaga Robinhood; bertentangan dengan fork independen brief ELYSIA dan Head Dev. Diperlakukan referensi historis.
- Brief menyebut "Lima Gate Report contoh"; sumber datanya (testnet launchpad vs data nyata) belum jelas.
- Dev lokal membutuhkan Anvil (chain 31337) untuk test; perlu konfirmasi bahwa ini bukan "menambah chain".
