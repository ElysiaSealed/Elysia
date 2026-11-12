---
name: deploy-contracts
description: DINONAKTIFKAN selama Planning. Panduan keselamatan untuk deployment kontrak ELYSIA ke Elysium Testnet (Chain ID 99801). Bukan izin dan bukan prosedur yang dapat dijalankan: tidak ada deployment, dry-run, simulasi, atau transaksi dari skill ini. Deployment hanya atas persetujuan eksplisit developer untuk tugas tertentu.
---
# deploy-contracts (ELYSIA)

> **STATUS: NONAKTIF selama Planning.** Skill ini hanya panduan. Memanggil atau mengikuti skill ini **tidak** berarti deployment, dry-run, simulasi, transaksi, atau perintah jaringan diizinkan. Jangan menjalankan apa pun dari skill ini.

Sumber kebenaran: `CLAUDE.md`, `docs/ELYSIA_DECISIONS.md` (FINAL/PENDING), `docs/ELYSIA_SMART_CONTRACT_PLAN.md`, `docs/ELYSIA_INFRASTRUCTURE_CHECKLIST.md`, `docs/ELYSIA_BLOCKERS.md`. Skill terkait: `contract-change`; peninjau: agent `contract-reviewer` (read-only).

## 1. Yang belum ada (jangan diasumsikan)
Kontrak ELYSIA (`ElysiaLedger` belum ada), wallet dan private key Deployer/Agent/Keeper (belum dibuat), RPC, explorer, faucet, kredensial, skrip deploy ELYSIA, dan nama keystore ELYSIA. Jangan mengasumsikan satu pun sudah tersedia. `packages/contracts-abi/addresses/*.json` masih memuat alamat NEXA dan **bukan** sumber konfigurasi ELYSIA.

## 2. Gerbang persetujuan (semua wajib)
1. Deployment hanya boleh dilakukan setelah **developer memberi persetujuan eksplisit untuk tugas deployment tertentu**. Persetujuan itu harus menyebut **target, kontrak, jaringan, dan ruang lingkup** yang diizinkan. Persetujuan umum, persetujuan tahap lain, atau pemanggilan skill ini tidak cukup.
2. Jaringan hanya **Elysium Testnet, Chain ID 99801**. **Chain ID harus diverifikasi sebelum tindakan apa pun.** Chain lain, mainnet, Robinhood, dan Solana bukan target.
3. **Alamat kontrak dan wallet harus diverifikasi terhadap sumber konfigurasi ELYSIA** yang disetujui developer, bukan terhadap `addresses/*.json` NEXA.
4. **Tidak boleh memakai alamat, wallet, private key, keystore, atau secret NEXA**, atau infrastruktur NEXA. Keystore Foundry di mesin ini mungkin milik NEXA: jangan dipakai.
5. **Tidak boleh deploy bila desain kontrak, pengujian, atau konfigurasi belum disetujui**, atau bila keputusan PENDING yang memengaruhinya belum diputuskan developer.
6. **Tidak boleh mengirim transaksi atau memublikasikan kontrak hanya karena skill dipanggil.**
7. Dry-run dan simulasi **juga tidak boleh dijalankan** tanpa persetujuan yang memenuhi butir 1.
8. Bila salah satu syarat gagal atau meragukan: **berhenti**, laporkan ke developer, dan jangan melanjutkan.

## 3. Batasan FINAL
- Tiga wallet baru dengan key berbeda: **Deployer**, **Agent**, **Keeper**. Tidak ada Treasury.
- Tidak ada BurnVault, FeeSplitter, CreatorFeeSplitter, ProtocolFeeSplitter, pembayaran, subscription, atau burn.
- Infrastruktur ELYSIA terpisah dari NEXA.
- Claude tidak membuat wallet, tidak memegang private key atau password, dan tidak menjalankan `forge script`, `forge create`, `forge verify-contract`, `cast send`, `cast publish`, `cast wallet`, atau perintah dengan `--broadcast`. Pagar di `.claude/settings.json` hanya pengaman, bukan izin.
- Perintah yang butuh password keystore dijalankan oleh manusia.
- Catatan hasil (blocker, status) ditulis ke dokumen ELYSIA (`docs/ELYSIA_BLOCKERS.md`) hanya bila diminta; jangan pernah menulis ke `docs/BLOCKERS.md`, `docs/DECISIONS.md`, atau dokumen NEXA lain.

## 4. Setelah ada persetujuan (gambaran, bukan prosedur)
Pada tugas deployment yang disetujui, Claude menyusun rencana dan perintah konkret untuk ditinjau developer. Rencana itu mencakup verifikasi prasyarat di bagian 2, pelaksanaan oleh manusia, verifikasi di explorer, serta pencatatan alamat publik dan ekspor ABI (perubahan file yang butuh persetujuan). Urutan dan detailnya (termasuk aturan alamat/nonce dan peran) tidak diasumsikan dari NEXA. Perintah tidak ditulis di skill ini.

## 5. Perlindungan rahasia
Private key, password keystore, mnemonic, dan salt tidak pernah ditulis, dicetak, atau dimasukkan ke repo, `.env` repo, log, chat, atau dokumen. Hanya alamat publik dan hash transaksi yang boleh dicatat.

## PENDING terkait
Skema hash, jalur Gate Report, `ElysiaLedger` baru atau rename, desain `onlyKeeper` dan pembatasan feed, aturan alamat sama antar peran, Anvil lokal (31337), nama keystore ELYSIA, dan gerbang G3 di `ELYSIA_IMPLEMENTATION_ROADMAP.md`.

## Referensi historis NEXA (bukan aturan aktif)
Versi lama skill ini memeriksa deployer tertentu milik NEXA, menulis ke dokumen NEXA, dan mencakup testnet NEXA, localhost, serta dry run mainnet. Semua itu tidak berlaku untuk ELYSIA.
