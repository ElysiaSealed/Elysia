---
name: commit-reveal
description: Dipakai saat menyentuh hash, commit, reveal, salt, atau preimage di ELYSIA (Prediction of the Day). Mengatur prinsip keamanan commit-reveal dan memisahkan yang FINAL dari yang masih PENDING. Tidak menetapkan skema hash baru dan tidak menjalankan alat apa pun.
---
# commit-reveal (ELYSIA)

Skill ini untuk mekanisme commit-reveal **ELYSIA** di Robinhood Chain: `ElysiaLedger` (`contracts/src`), util hash di `packages/shared` (`commit-reveal.ts`), dan vektor test bersama di `packages/shared/test-vectors/commit-reveal.json`.

Sumber kebenaran: `CLAUDE.md`, `docs/ELYSIA_DECISIONS.md`, `docs/ELYSIA_SMART_CONTRACT_PLAN.md`, `docs/ELYSIA_ARCHITECTURE.md`. Peninjau: agent `contract-reviewer`. Skill terkait: `contract-change`, `post-pipeline`.

## 0. Gerbang
- Perubahan hanya atas permintaan eksplisit developer. Skill ini tidak menjalankan `forge`, deployment, transaksi, pembuatan wallet, atau pembuatan salt dan secret.
- Bila pekerjaan bergantung pada keputusan PENDING (bagian 3), berhenti dan tanya. Jangan merancang kriptografi baru atas inisiatif sendiri.

## 1. Batasan FINAL
- Target: Robinhood Chain mainnet (4663). Tanpa chain lain.
- Peran: Deployer (owner), Agent (commit dan reveal). Tidak ada BurnVault, splitter, atau burn di kontrak ledger.
- Tidak boleh memakai wallet, kunci, alamat, atau konfigurasi dari proyek sumber.
- Tanpa deployment atau transaksi tanpa persetujuan eksplisit.

## 2. Skema saat ini
`keccak256(abi.encode(string text, address asset, uint8 direction, uint32 horizon, bytes32 salt))`, dihitung identik di Solidity dan TypeScript dan dibuktikan oleh vektor test bersama. Ledger memverifikasi ronde oracle awal dan akhir saat reveal. Mengubah skema berarti mengubah kontrak, util TS, dan vektor sekaligus dan butuh persetujuan.

## 3. Prinsip keamanan yang dipertahankan
- **Salt dan preimage rahasia sampai reveal.** Disimpan terenkripsi (`PREIMAGE_KEY`); tidak pernah di log, teks publik, respons API, atau dokumen.
- **Commit mendahului publikasi:** tx commit terkonfirmasi sebelum konten terkait dipublikasikan (alur di `post-pipeline`).
- **Validasi hash:** reveal menghitung ulang hash dan menolak bila berbeda dari yang di-commit.
- **Zero hash ditolak; hash duplikat ditolak; reveal ganda ditolak; jatuh tempo ditegakkan.**
- **Pemisahan hak akses:** hanya Agent yang commit dan reveal; owner hanya administrasi.
- **Konsistensi lintas bahasa:** hash TS dan Solidity identik, dibuktikan vektor bersama.
- Tidak ada secret nyata di test: pakai nilai sintetis.
- Konten yang sudah di-commit tidak dihapus atau diubah diam-diam; histori dapat diverifikasi.

## 4. PENDING (butuh persetujuan developer; jangan ditetapkan sendiri)
- Domain separation: apakah chain ID dan alamat kontrak masuk payload.
- Batas waktu commit dan reveal serta aturan kedaluwarsa.
- Definisi "menang" (`minMoveBps`) dan perhitungan statistik.
- Aturan alamat sama untuk beberapa peran.
- Perlakuan prediksi Stock Token di luar jam pasar.
