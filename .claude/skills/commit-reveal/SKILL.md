---
name: commit-reveal
description: Dipakai saat menyentuh hash, commit, reveal, salt, atau preimage di ELYSIA (HYPE Daily Call, Gate Report). Mengatur prinsip keamanan commit-reveal dan memisahkan yang sudah FINAL dari desain yang masih PENDING. Tidak menetapkan skema hash dan tidak menjalankan alat apa pun.
---
# commit-reveal (ELYSIA)

Skill ini untuk mekanisme commit-reveal **ELYSIA**. Implementasi NEXA (`NexaLedger`, util hash di `packages/shared`, vektor test) adalah **referensi historis**, bukan standar ELYSIA. `ElysiaLedger` **belum ada** dan keberadaannya belum terbukti; jangan menganggapnya tersedia.

Sumber kebenaran: `CLAUDE.md`, `docs/ELYSIA_DECISIONS.md` (FINAL/PENDING), `docs/ELYSIA_WORKING_CONTEXT.md`, `docs/ELYSIA_ARCHITECTURE.md`, `docs/ELYSIA_SMART_CONTRACT_PLAN.md`. Peninjau: agent `contract-reviewer` (read-only). Skill terkait: `contract-change`, `post-pipeline`.

## 0. Gerbang
- Perubahan hanya atas permintaan eksplisit developer. Selama Planning tidak ada `forge`, Anvil, deployment, transaksi, pembuatan wallet, atau pembuatan salt/secret.
- Bila pekerjaan bergantung pada keputusan PENDING (bagian 3), **berhenti dan tanya**. Jangan merancang kriptografi baru atas inisiatif sendiri dan jangan memilih skema.

## 1. Batasan FINAL
- Target hanya **Elysium Testnet, Chain ID 99801**. Tidak ada Solana atau chain lain.
- Layanan gratis; **tiga wallet** terpisah dengan key berbeda: **Deployer**, **Agent**, **Keeper**. Tidak ada Treasury, BurnVault, FeeSplitter, CreatorFeeSplitter, ProtocolFeeSplitter, pembayaran, subscription, atau burn. Jangan membawa asumsi fee, distribusi dana, atau penerimaan dana.
- Dilarang memakai wallet, private key, alamat, atau infrastruktur NEXA. Alamat, hash, vektor test, konfigurasi chain, atau contoh transaksi NEXA tidak boleh dibawa sebagai konfigurasi ELYSIA.
- Tanpa deployment atau transaksi tanpa persetujuan eksplisit.

## 2. Prinsip keamanan yang dipertahankan
Prinsip berikut berlaku apa pun skema finalnya:
- **Salt dan preimage rahasia sampai reveal.** Disimpan terenkripsi; tidak pernah di log, teks yang terbaca publik, respons API, atau dokumen. Pembukaan hanya pada saat reveal.
- **Commit mendahului publikasi terkait** (brief), **hanya untuk alur yang benar-benar memakai commit-reveal** (mis. HYPE Daily Call): commit yang berkaitan dengan sebuah konten harus terjadi, dan tx-nya terkonfirmasi, sebelum publikasi konten **itu** (alur: `post-pipeline`). Prinsip ini tidak otomatis berlaku untuk alur lain. **Penerapannya pada Gate Report masih PENDING** (apakah Gate Report memakai commit-reveal atau mekanisme terpisah belum diputuskan).
- **Validasi hash:** reveal menghitung ulang hash dari preimage dan menolaknya bila berbeda dari yang di-commit.
- **Zero hash (`bytes32(0)`) sebagai kandidat validasi keamanan:** menolak commit dengan hash nol adalah pengaman yang dipertahankan. Penerapan dan posisinya dalam spesifikasi final **belum ditetapkan dan perlu dikonfirmasi saat desain kontrak disetujui**; ini bukan spesifikasi kontrak FINAL.
- **Pencegahan replay dan keunikan commit** wajib ada (mekanismenya PENDING).
- **Pemisahan hak akses:** Agent hanya boleh commit/reveal/atestasi sesuai rancangan; Keeper hanya operasi feed; Deployer hanya administrasi. Tidak ada peran yang memberi hak peran lain.
- **Konsistensi lintas bahasa:** hash yang dihitung off-chain (TypeScript) harus identik dengan yang dihitung on-chain, dibuktikan oleh vektor test bersama (format PENDING).
- Tidak ada secret nyata di test: pakai nilai sintetis; jangan membuat atau menyimpan salt produksi, key, atau kredensial.
- Konten yang terlanjur di-commit tidak dihapus atau diubah diam-diam; histori dapat diverifikasi.

## 3. PENDING (butuh persetujuan developer; jangan ditetapkan sendiri)
- Skema hash final dan encoding payload (`abi.encode`, `abi.encodePacked`, atau skema lain).
- Domain separation dan apakah chain ID (dan alamat kontrak) masuk payload.
- Struktur commit dan reveal; batas waktu commit/reveal; aturan kedaluwarsa.
- Mekanisme pencegahan replay dan keunikan commit.
- Definisi "menang" dan perhitungan statistik.
- Pemisahan prediction commit dengan Gate Report attestation, dan apakah Gate Report memakai commit-reveal atau mekanisme terpisah (jalur A/B/C di rencana kontrak).
- Aturan alamat sama untuk beberapa peran (Deployer/Agent/Keeper) dan owner EOA tunggal.
- Apakah Agent dan Keeper punya hak akses selain yang sudah ditetapkan.
- Format vektor test dan kompatibilitas lintas bahasa.
- Apakah `ElysiaLedger` kontrak baru atau rename.

## 4. Referensi historis NEXA (kandidat, bukan standar ELYSIA)
`NexaLedger` memakai hash `keccak256(abi.encode(string text, address asset, uint8 direction, uint32 horizon, bytes32 salt))`, dihitung identik di Solidity dan TypeScript (`packages/shared`), dengan vektor test JSON bersama untuk `forge test` dan Vitest, dan verifikasi round oracle saat reveal. Semua itu hanya **kandidat** untuk dipertimbangkan: kecocokannya untuk HYPE Daily Call dan Gate Report belum diverifikasi, dan tidak boleh dipakai sebagai standar ELYSIA sebelum disetujui developer. Vektor, alamat, dan konfigurasi NEXA tidak disalin ke ELYSIA.
