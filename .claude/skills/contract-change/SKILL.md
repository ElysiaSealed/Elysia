---
name: contract-change
description: Dipakai saat membuat atau mengubah kontrak Solidity ELYSIA (target Robinhood Chain mainnet, Chain ID 4663). Mengatur pemeriksaan sebelum perubahan, standar kontrak, test, dan review. Tidak untuk deployment.
---
# contract-change (ELYSIA, Robinhood Chain)

Berlaku untuk kontrak **ELYSIA** di `contracts/src` (saat ini `ElysiaLedger`; kelak kontrak token $ELYS). Sumber kebenaran: `CLAUDE.md`, `docs/ELYSIA_DECISIONS.md` (FINAL dan PENDING), `docs/ELYSIA_SMART_CONTRACT_PLAN.md`, `docs/ELYSIA_BLOCKERS.md`.

## 0. Gerbang sebelum menyentuh kontrak
- Perubahan kontrak dimulai hanya atas permintaan eksplisit developer. Skill ini bukan izin.
- Mainnet tidak dapat dibatalkan: setiap perubahan harus diperlakukan seolah-olah akan di-deploy.
- Bila perubahan bergantung pada keputusan **PENDING**, berhenti dan tanya. PENDING saat ini (cek ulang di `ELYSIA_DECISIONS.md`): definisi "menang" (`minMoveBps`), penolakan alamat sama antar peran dan multisig untuk owner, perlakuan prediksi di luar jam pasar untuk Stock Token, batas panjang `text`, dan kontrak token $ELYS.
- Jangan mengubah status PENDING di dokumen keputusan; catat usulan di laporan.

## 1. Aturan untuk setiap perubahan
- Hanya **Robinhood Chain mainnet, Chain ID 4663**. Tidak ada chain lain, bridge, atau Solana. Fork test ke RPC memakai RPC resmi dan hanya baca.
- **Peran terpisah:** Deployer (owner, administrasi), Agent (`commit` dan `reveal`). Treasury hanya menerima USDG di luar kontrak. Tidak ada fungsi yang memberi satu peran hak peran lain.
- **Kontrak tidak menerima atau menyimpan nilai:** tanpa `payable`, `receive`, fee, penarikan, atau saldo. Tidak ada BurnVault dan tidak ada splitter fee kreator; riwayat burn dibaca dari CA yang diberikan PM.
- **Oracle:** feed Chainlink asli. Perhatikan id ronde yang memuat phase, heartbeat, dan jam pasar Stock Token. Jangan mengasumsikan `roundId ± 1` aman di semua kondisi tanpa tes terhadap feed asli.
- **Commit-reveal:** hash dikunci sebelum publikasi, salt tidak bocor sebelum reveal, hash nol atau duplikat ditolak, reveal menghitung ulang hash, reveal ganda ditolak, jatuh tempo ditegakkan.
- Tidak ada alamat, kunci, atau keystore dari proyek sumber di kontrak, skrip, test, atau konfigurasi.

## 2. Langkah
1. **Periksa dampak** sebelum mengedit: `graphify query` atau `explain` untuk kontrak yang disentuh, lalu baca konsumennya (`packages/contracts-abi`, `packages/shared`, `apps/worker`, `apps/api`, test, skrip). Jelaskan dampak dan keputusan PENDING terkait.
2. **Ubah kontrak** hanya sebatas yang diminta dan disetujui.
3. **Test** di `contracts/test`: unit dan fuzz. Cakup hak akses per peran, commit dan reveal (hash nol, duplikat, mismatch, belum jatuh tempo, reveal ganda, arah dan horizon tidak valid), verifikasi ronde dan oracle (`updatedAt`, urutan, harga ≤ 0, ronde hilang, perpindahan phase), pengiriman ETH ke kontrak ditolak, dan zero-address. Vektor hash bersama TS dan Solidity di `packages/shared/test-vectors`.
4. **Jalankan lokal:**
   ```bash
   # Jalankan di: ROOT/contracts
   forge build
   forge test -vvv
   ```
   Jangan memakai `forge script`, `forge create`, `cast send`, atau `--broadcast`.
5. **Snapshot gas dan ABI:** `forge snapshot` dan `node scripts/export-abi.mjs` (menulis file; hanya bila diminta). Ekspor hanya ABI kontrak ELYSIA.
6. **Review:** jalankan test sendiri lebih dulu, lalu panggil agent `contract-reviewer` (read-only) dan beri tahu hasil test. Tindak lanjuti temuan "Pelanggaran FINAL"; temuan PENDING dibawa ke developer sebagai pertanyaan.

## 3. Selesai bila
- `forge build` dan `forge test` hijau; fuzz tanpa regresi.
- Tidak ada penerimaan dana, fee, atau alamat dari proyek sumber.
- Peran terpisah dan teruji; tidak ada keputusan PENDING yang diputuskan diam-diam.
- `contract-reviewer` sudah meninjau dan temuan FINAL tertangani.
- Dampak ke `contracts-abi`, worker, api, dan test disebutkan.

## 4. Di luar skill ini
Deployment, verifikasi Blockscout, pembuatan wallet, transaksi, dan perubahan layanan eksternal tidak dilakukan di sini. Semuanya butuh persetujuan eksplisit (gate R3 di `ELYSIA_IMPLEMENTATION_ROADMAP.md`), dan perintah yang butuh password keystore dijalankan manusia.
