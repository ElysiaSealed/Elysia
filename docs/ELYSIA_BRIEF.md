# ELYSIA — Product Brief (Robinhood Chain)

Status: 2026-11-13, untuk branch `dev-rh`. Brief ini ditulis ulang dari arahan developer dan Head Dev; versi brief sebelumnya (varian Elysium) ada di branch `main`. Bagian yang masih menunggu keputusan ditandai PENDING.

## Tujuan
ELYSIA adalah AI analyst di Robinhood Chain. Ia membaca peluncuran Pons V2 dan Stock Token, meng-commit setiap prediksi on-chain sebelum dipublikasikan, dan menyediakan bukti yang dapat diverifikasi siapa pun. Nilai produk adalah **rekam jejak yang tidak dapat diubah**, bukan klaim.

## Pengguna
Trader dan komunitas Robinhood Chain; bot dan dashboard (Signals API); proyek yang ingin riset berlabel sponsor.

## Fitur
| Fitur | Akses | Deskripsi |
|---|---|---|
| Prediction of the Day | Gratis | Satu prediksi arah per hari atas satu aset (Stock Token atau ETH); hash di-commit sebelum posting, dibuka dan diskor setelah jatuh tempo terhadap harga oracle Chainlink |
| Proof of Intelligence | Gratis | Win rate, rata-rata return, tautan Blockscout untuk tiap commit |
| ELYSIA vs KOL | Gratis | Leaderboard akurasi; hanya KOL yang bersedia dinilai |
| Rug radar | Gratis | Peluncuran Pons V2 baru dengan red flag (creator tax, konsentrasi holder) |
| Stock Token movers | Gratis | Harga, selisih DEX vs Chainlink |
| Ask | Gratis | Ringkasan risiko untuk satu alamat kontrak dari data yang sudah diindeks; dengan batas laju per IP |
| Burn tracker | Gratis | Riwayat burn $ELYS dari CA yang diberikan PM |
| Pro | Berbayar (USDG) | Alert real-time di web dan Telegram, 15 menit sebelum post publik di X |
| Signals API | Berbayar (USDG) | Feed JSON post publik untuk bot dan dashboard; kunci API |
| Sponsored report | Berbayar (USDG) | Riset berlabel Sponsored, tanpa rekomendasi, tinjauan manusia |
| Holder $ELYS | Berbayar/benefit | Alert lebih awal dan kredit Ask gratis; ambang saldo diumumkan saat peluncuran (PENDING) |

Harga sementara (dapat diedit lewat env): Pro $5 per 30 hari, Ask gratis, Signals API $499 per 30 hari, Sponsored $750 per laporan.

## Aturan konten dan keselamatan
- Pipeline: AI → RiskGuard (kode) → commit terkonfirmasi → antrian persetujuan manusia → post. Mode X `dry` sampai izin eksplisit; balasan manual.
- RiskGuard fail-closed: tanpa ajakan beli atau jual, tanpa price target, tanpa klaim afiliasi atau status resmi dengan Robinhood atau Pons, tanpa membahas token ELYSIA sendiri; data tidak lengkap berarti "tidak tahu".
- Konten publik berbahasa Inggris dengan "Not affiliated with Robinhood" (teks final PENDING). Akun X berlabel Automated.
- Aturan umur token (< 1 jam) dan aturan URL di post: PENDING.

## On-chain
- Robinhood Chain mainnet (chain ID 4663). Kontrak baru `ElysiaLedger` di-deploy ulang dengan wallet baru; token $ELYS dengan kontrak baru (CA menyusul). Tanpa BurnVault dan splitter fee kreator.
- Data pihak ketiga: Pons V2, Uniswap v4, Chainlink, USDG, NVDA Stock Token, WETH (lihat `packages/shared/src/chains.ts`).

## Tampilan
Palet warna dan tipografi sama dengan yang ada sekarang (`apps/web/src/styles/tokens.css`). Logo dan aset brand: pending.

## Di luar scope saat ini
Chain lain, bridge, multichain; token di Solana; pekerjaan di Elysium (ada di `main`). Peluncuran token $ELYS menunggu keputusan terpisah.

## Kriteria penerimaan mainnet
1. `ElysiaLedger` ter-deploy dan terverifikasi di Blockscout. 2. Satu prediksi ter-commit, ter-reveal, dan ter-skor. 3. Contoh post lolos RiskGuard dry run. 4. Satu pembayaran Pro terverifikasi dengan jumlah kecil. 5. Halaman Burn menampilkan riwayat dari CA PM. 6. Tidak ada alamat, kunci, atau akun proyek sumber. 7. Hasil uji terdokumentasi. Detail dan gate: `ELYSIA_IMPLEMENTATION_ROADMAP.md`.
