---
name: deploy-contracts
description: Panduan keselamatan untuk deployment kontrak ELYSIA ke Robinhood Chain mainnet (Chain ID 4663). Bukan izin dan bukan prosedur yang dapat dijalankan: tidak ada deployment, simulasi, atau transaksi dari skill ini. Deployment hanya atas persetujuan eksplisit developer untuk tindakan tertentu.
---
# deploy-contracts (ELYSIA, Robinhood Chain mainnet)

> **Skill ini hanya panduan.** Memanggil atau mengikutinya **tidak** berarti deployment, simulasi, transaksi, atau perintah jaringan diizinkan. Mainnet memakai dana nyata dan tidak dapat dibatalkan.

Sumber kebenaran: `CLAUDE.md`, `docs/ELYSIA_DECISIONS.md`, `docs/ELYSIA_SMART_CONTRACT_PLAN.md`, `docs/ELYSIA_INFRASTRUCTURE_CHECKLIST.md`, `docs/ELYSIA_BLOCKERS.md`. Skill terkait: `contract-change`; peninjau: agent `contract-reviewer` (read-only).

## 1. Yang belum ada (jangan diasumsikan)
`ElysiaLedger` belum di-deploy; alamatnya belum ada. Wallet Deployer dan Agent sudah memiliki alamat publik di `.env.example`, tetapi saldo ETH di Robinhood Chain belum dikonfirmasi. Keystore dibuat dan dipegang manusia. Kontrak token $ELYS belum ada.

## 2. Gerbang persetujuan (semua wajib)
1. Persetujuan eksplisit developer untuk **tindakan tertentu** yang menyebut target, kontrak, jaringan, dan ruang lingkup. Persetujuan umum atau pemanggilan skill ini tidak cukup. Berlaku per tindakan: simulasi, deploy, `setAgent`, `setFeed`, dan tiap transaksi lain.
2. Gate roadmap R0 sampai R2 sudah terpenuhi: arah tertulis, wallet dan resource siap, review kontrak selesai (`forge test` penuh dan `contract-reviewer`).
3. **Chain ID harus diverifikasi** (4663) lewat RPC resmi dengan pemeriksaan baca-saja sebelum tindakan apa pun.
4. Alamat aset dan feed (NVDA, WETH, Chainlink) diverifikasi ulang baca-saja pada hari deploy, termasuk desimal dan umur data.
5. Tidak boleh memakai alamat, wallet, kunci, keystore, atau secret dari proyek sumber. Keystore Foundry di mesin ini mungkin bukan milik ELYSIA: periksa dengan `pnpm check:wallets` dan jangan dipakai bila tidak cocok.
6. Tidak boleh deploy bila desain, test, atau konfigurasi belum disetujui, atau bila keputusan PENDING yang memengaruhinya belum diputuskan.
7. Bila salah satu syarat gagal atau meragukan: berhenti dan laporkan.

## 3. Batasan
- Claude tidak membuat wallet, tidak memegang private key atau password, dan tidak menjalankan `forge script` dengan `--broadcast`, `forge create`, `forge verify-contract`, `cast send`, `cast publish`, atau `cast wallet`. Pagar di `.claude/settings.json` hanya pengaman, bukan izin.
- Perintah yang butuh password keystore dijalankan oleh manusia.
- Hasil (blocker, status) ditulis ke dokumen ELYSIA (`docs/ELYSIA_BLOCKERS.md`, `docs/ELYSIA_DECISIONS.md`) hanya bila diminta.

## 4. Setelah ada persetujuan (gambaran, bukan prosedur)
Claude menyusun rencana dan perintah konkret untuk ditinjau developer: prasyarat di bagian 2, simulasi tanpa broadcast, deploy oleh manusia, verifikasi di Blockscout, `setAgent`, `setFeed` untuk aset yang disetujui, satu commit dan reveal berhorizon terpendek, lalu pencatatan alamat publik dan ekspor ABI (perubahan file yang butuh persetujuan). Perintah tidak ditulis di skill ini.

## 5. Perlindungan rahasia
Private key, password keystore, mnemonic, dan salt tidak pernah ditulis, dicetak, atau dimasukkan ke repo, `.env`, log, chat, atau dokumen. Hanya alamat publik dan hash transaksi yang boleh dicatat.
