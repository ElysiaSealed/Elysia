---
name: contract-change
description: Dipakai saat membuat atau mengubah kontrak Solidity ELYSIA (target hanya Elysium Testnet, Chain ID 99801). Mengatur pemeriksaan sebelum perubahan, standar kontrak, test, dan review. Tidak untuk deployment.
---
# contract-change (ELYSIA)

Skill ini berlaku untuk kontrak **ELYSIA**. Kontrak NEXA di `contracts/src` (`NexaLedger`, `BurnVault`, `FeeSplitter`, `CreatorFeeSplitter`, `ProtocolFeeSplitter`) adalah **referensi historis**, bukan kontrak ELYSIA dan bukan titik awal otomatis. `ElysiaLedger` **belum ada**; jangan menganggapnya tersedia, dan jangan menganggap `NexaLedger` adalah bentuk finalnya.

Sumber kebenaran: `CLAUDE.md`, `docs/ELYSIA_DECISIONS.md` (FINAL/PENDING), `docs/ELYSIA_SMART_CONTRACT_PLAN.md`, `docs/ELYSIA_BLOCKERS.md`. Konflik dengan NEXA: ikuti ELYSIA.

## 0. Gerbang sebelum menyentuh kontrak
- Perubahan kontrak hanya dimulai setelah permintaan eksplisit developer. Skill ini tidak memberi izin untuk memulai.
- Jika perubahan bergantung pada keputusan **PENDING**, **berhenti dan tanya**. Jangan memilih sendiri dan jangan menuliskannya sebagai final. PENDING saat ini (cek ulang di `ELYSIA_DECISIONS.md`):
  - skema hash commit-reveal (hash NEXA hanya kandidat);
  - jalur Gate Report on-chain (satu kontrak dua jalur, dua kontrak, atau off-chain);
  - `ElysiaLedger` kontrak baru atau rename;
  - definisi "menang" (`minMoveBps`);
  - penolakan alamat sama antar peran dan owner EOA tunggal;
  - desain `onlyKeeper` dan pembatasan `push` pada mock feed.
- Jangan mengubah status PENDING di dokumen keputusan; catat usulan di laporan dan tunggu persetujuan.

## 1. Aturan FINAL untuk setiap perubahan
- Hanya **Elysium Testnet, Chain ID 99801**. Tidak ada chain lain, bridge, Robinhood, atau Solana. Fork test ke RPC chain lain dilarang.
- **Tiga peran terpisah**, key berbeda: **Deployer** (owner/administrasi), **Agent** (`commit`/`reveal`/atestasi), **Keeper** (operasi feed). Tiap fungsi diberi hak sesuai perannya; tidak ada fungsi yang memberi satu peran hak peran lain. Bentuk rinci (`onlyAgent`, `onlyKeeper`, rotasi) mengikuti rancangan yang disetujui; bagian yang PENDING tidak diasumsikan.
- **Layanan gratis, tanpa dana:** kontrak tidak menerima atau menyimpan nilai (tanpa `payable`, `receive`, `fallback` penerima nilai, penarikan, fee, pembayaran, saldo). Tanpa Treasury, `BurnVault`, `FeeSplitter`, `CreatorFeeSplitter`, `ProtocolFeeSplitter`, burn token, atau rasio fee apa pun. Jangan membawa konstanta fee NEXA.
- **Oracle:** jangan mengasumsikan Chainlink atau precompile HyperCore tersedia. Testnet memakai mock feed (brief) dengan pembatasan yang disetujui. Desain mainnet bukan bagian perubahan ini.
- **Commit-reveal:** pertahankan sifat keamanannya (hash dikunci sebelum publikasi, salt tidak bocor sebelum reveal, hash nol/duplikat ditolak, reveal menghitung ulang hash, tidak bisa reveal dua kali, jatuh tempo ditegakkan) tanpa menetapkan skema hash yang masih PENDING.
- **Statistik terpisah:** counter prediksi (commit/reveal/menang/return) tidak boleh tercampur dengan atestasi Gate Report; setiap jalur harus tidak dapat menggeser statistik jalur lain.
- Tanpa alamat, key, atau keystore NEXA di kontrak, script, test, atau konfigurasi (`packages/contracts-abi/addresses/*.json` saat ini masih memuat alamat NEXA; jangan dipakai). Script deploy dan skripnya tidak boleh dijalankan oleh skill ini.

## 2. Langkah
1. **Periksa dampak** sebelum mengedit: `graphify query`/`explain` untuk kontrak yang disentuh, lalu `grep`/baca konsumennya (`packages/contracts-abi`, `packages/shared`, `apps/worker`, `apps/api`, test, script). Jelaskan dampak dan keputusan PENDING terkait.
2. **Ubah kontrak** hanya sebatas yang diminta dan disetujui. Jangan menghapus atau memindahkan kontrak NEXA tanpa persetujuan terpisah (klasifikasi REMOVE di `ELYSIA_MIGRATION_PLAN.md` baru berlaku setelah disetujui).
3. **Test** (di `contracts/test`): unit **dan fuzz**. Cakup: hak akses per peran (tiap peran ditolak pada fungsi peran lain), commit/reveal (hash nol, duplikat, mismatch, belum jatuh tempo, reveal ganda, arah/horizon tidak valid), validasi round dan perilaku oracle termasuk mock feed yang dimanipulasi (`updatedAt`, urutan, harga ≤ 0, round hilang), **pengiriman ETH/HYPE ke kontrak ditolak**, pemisahan statistik prediksi vs Gate Report (bila jalurnya sudah disetujui), dan zero-address. Vektor hash bersama TS dan Solidity (`packages/shared/test-vectors`) hanya dipakai setelah skema hash disetujui.
4. **Jalankan lokal** (tidak butuh jaringan atau wallet):
   ```bash
   # Jalankan di: ROOT/contracts
   forge build
   forge test -vvv
   ```
   Jangan memakai `--fork-url`, `forge script`, `forge create`, `cast send`, atau `--broadcast`. Anvil lokal (31337) masih PENDING; jangan dipakai sampai diputuskan.
5. **Snapshot gas dan ekspor ABI** (menulis file; hanya jika diminta): `forge snapshot` dan ekspor ABI ke `packages/contracts-abi` lewat skrip yang sudah ada setelah dicek isinya terhadap kontrak ELYSIA. Ekspor hanya ABI kontrak ELYSIA; jangan menimpa atau menghapus ABI NEXA yang ada tanpa persetujuan.
6. **Review keamanan:** panggil agent `contract-reviewer` (read-only; tidak bisa menjalankan test). Jalankan test sendiri lebih dulu dan beri tahu hasilnya ke reviewer. Tindak lanjuti temuan "Pelanggaran FINAL"; temuan "Perlu verifikasi PENDING" dibawa ke developer sebagai pertanyaan.

## 3. Selesai bila
- `forge build` dan `forge test` hijau; fuzz tanpa regresi.
- Tidak ada penerimaan dana, fee, Treasury, burn, atau alamat NEXA.
- Peran Deployer/Agent/Keeper terpisah dan teruji.
- Tidak ada keputusan PENDING yang diputuskan diam-diam; daftar PENDING terkait dilaporkan.
- `contract-reviewer` sudah meninjau dan temuan FINAL tertangani.
- Dampak ke `contracts-abi`, worker, api, dan test sudah disebutkan.

## 4. Di luar skill ini
Deployment, verifikasi Blockscout, pembuatan wallet, transaksi, dan perubahan layanan eksternal tidak dilakukan di sini; semuanya butuh persetujuan eksplisit (gate G3 di `ELYSIA_IMPLEMENTATION_ROADMAP.md`) dan perintah yang butuh password keystore dijalankan manusia.

## Referensi historis NEXA (bukan aturan aktif)
Versi lama skill ini mewajibkan rasio 30/20 sebagai `constant`. Itu milik fee kontrak NEXA dan **tidak berlaku** untuk ELYSIA.
