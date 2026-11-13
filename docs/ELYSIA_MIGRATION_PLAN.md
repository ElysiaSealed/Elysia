# ELYSIA — Ringkasan Migrasi (`dev-rh`)

Status: 2026-11-13. Dokumen ini mencatat apa yang dibawa, diganti, dan disingkirkan saat basis kode asal disesuaikan menjadi ELYSIA di Robinhood Chain. Dokumen migrasi sebelumnya (varian Elysium Testnet) tetap ada di branch `main`.

## 1. Pemisahan dari proyek sumber (prioritas tertinggi)
| Item | Status | Tindakan |
|---|---|---|
| Wallet, alamat operasional, kunci, kredensial | Tidak dibawa | Tiga wallet baru (Deployer, Agent, Treasury); alamat publik di `.env.example` |
| Alamat kontrak lama | Tidak dibawa | `packages/contracts-abi/addresses/*.json` hanya berisi alamat Elysia setelah deploy yang disetujui |
| Repository, project, database, deployment | Tidak dibawa | Repo `ElysiaSealed/Elysia`; Supabase, Railway, Vercel project baru |
| Folder lokal tak terlacak `contracts/broadcast/` | Peringatan | Berisi catatan deploy lama; jangan dibaca, diubah, atau di-commit |
| `supabase/.temp` | Periksa | Jangan menjalankan perintah `supabase` sebelum relink ke project baru |
| Pemindaian secret | Dilakukan | Tidak ada nilai rahasia terdeteksi pada pemindaian pola kunci di repo (lihat catatan progres) |

## 2. Yang sudah dilakukan di `dev-rh`
| Area | Perubahan |
|---|---|
| Kontrak | Ledger lama menjadi `ElysiaLedger` (kontrak, test, skrip deploy, ABI). `BurnVault`, `FeeSplitter`, `ISwapper`, `MockTokens`, skrip fee, dan skrip mock Elysium dihapus |
| Merek dan token | Merek lama menjadi Elysia; token menjadi `$ELYS` di API, worker, API client, web, RiskGuard, fixture; env `ELYSIA_LEDGER_ADDRESS`, `ELYS_TOKEN_ADDRESS` |
| Chain | `CHAINS.elysiumTestnet` dan semua kode khusus Elysium (Hyperliquid, mirror feed Elysium, blocker launchpad, chain picker) dihapus; default API, worker, dan indexer = mainnet 4663 |
| Burn | Indexer membaca event dari `BURN_CONTRACT_ADDRESS` (CA PM); kolom `nexa_burned` menjadi `elys_burned` lewat migrasi `0012_rename_burn_column` (migrasi lama tidak diubah) |
| Web | Teks dan persona Robinhood; halaman Gate Report, Graduation Watch, dan recap dihapus; Prediction of the Day menggantikan HYPE Daily Call; token dan palet warna tidak diubah |
| RiskGuard | Klaim afiliasi terhadap Robinhood dan Pons diblokir; tipe konten khusus Elysium dihapus; sebutan `$ELYS` diblokir |
| Harga | `GET /pricing` dan env harga (Pro $5, Ask gratis, Signals $499, Sponsored $750) |
| Skrip | `check-wallets.mjs` untuk Deployer, Agent, Treasury; `export-abi.mjs` hanya `ElysiaLedger`; hook pre-push mengizinkan `dev-rh` |

## 3. Klasifikasi modul saat ini
| Modul | Kelas | Catatan |
|---|---|---|
| `contracts/src/ElysiaLedger.sol` | KEEP | Tinjau terhadap feed Chainlink sebelum deploy |
| `contracts/test/mocks/MockAggregator.sol`, `TestUSDG.sol`, `DeployTestnetMocks.s.sol`, `DeployTestUsdg.s.sol` | INVESTIGATE | Hanya untuk uji testnet; hapus bila tidak lagi dipakai (butuh persetujuan) |
| `packages/shared` (`chains.ts`, commit-reveal, scoring) | KEEP | Registri chain berisi mainnet dan testnet Robinhood |
| `packages/riskguard` | KEEP | Fail-closed; aturan Robinhood dan Pons |
| `packages/db` | KEEP | Tabel pembayaran dan auth dipakai oleh fitur berbayar; tabel `burns` membaca CA PM |
| `apps/api`, `apps/worker`, `apps/indexer`, `apps/web` | KEEP | Berbayar mati sampai `PAID_FEATURES_ENABLED=true` |
| Worker keeper (mirror feed) | INVESTIGATE | Hanya testnet; tidak dipakai di mainnet |

## 4. Yang masih perlu dikerjakan
Skill dan agent di `.claude/` disesuaikan; `.claude/settings.json` ditinjau untuk fase mainnet; CI ditambahkan; test DB lokal dijalankan; penghapusan modul testnet yang tidak terpakai (butuh persetujuan). Lihat roadmap Phase B.
