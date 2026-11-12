# ELYSIA — Working Context (baca ini dulu di sesi baru)

Update: 2026-11-11 · Fase: master planning (belum ada implementasi).

## Identitas
ELYSIA — Gatekeeper of Elysium. AI agent independen (fork NEXA, proyek terpisah) yang menilai peluncuran token di Elysium (L2 Hyperliquid/Kinetiq), meng-commit hasil penilaian on-chain sebelum publikasi. Persona: tenang, hangat ke komunitas, tegas ke rug/bundler. Catchphrase: "Sealed." (commit), "The gate remembers." (reveal). Konten publik bahasa Inggris; wajib: "Not affiliated with Kinetiq or Elysium." Tidak mengaku produk resmi Elysium/Kinetiq. Logo resmi: **pending** (jangan pakai/buat logo NEXA atau placeholder).

## Arahan Head Dev (wajib)
"Jangan tambahin chain apapun, tapi smartcontract ke testnet elyisum." → satu chain: Elysium Testnet **99801**; tanpa Solana, chain lain, bridge, multichain, atau Robinhood.

## Keputusan final Head Dev (2026-11-12)
- **ELYSIA layanan gratis.** Tanpa Pro, subscription, pembayaran, Ask/Signals berbayar, sponsor, USDG.
- **Tiga wallet baru, independen dari NEXA, tiga private key berbeda:** Deployer (deploy/admin kontrak), Agent (commit/reveal/atestasi), Keeper (oracle/feed). **Tidak ada Treasury Wallet.**
- Tidak membawa: BurnVault, FeeSplitter, CreatorFeeSplitter, ProtocolFeeSplitter, burn, sistem pembayaran Pro NEXA. Tidak memakai wallet NEXA.
- Wallet belum dibuat; tidak ada private key yang dimasukkan.
- Solana tetap ditunda. Target kontrak tetap hanya Elysium Testnet 99801.

## Aturan terbaru dari pemilik
Token Solana ditunda (menunggu persetujuan baru). Tanpa deployment pada planning. `BurnVault`/`FeeSplitter`/`CreatorFeeSplitter`/`ProtocolFeeSplitter` tidak dibawa. Tidak boleh pakai secret/wallet/infra NEXA. Dokumen khusus ELYSIA: 7 dokumen planning + `ELYSIA_BLOCKERS.md` + `ELYSIA_DECISIONS.md`; dokumentasi NEXA (BLOCKERS, DECISIONS, PROGRESS) sudah diarsipkan di luar repository.

## Fitur (dari brief)
Gate Report (inti; token ≥ 1 jam; hash commit sebelum posting), Graduation Watch (AMM → HyperCore → HIP-3), HYPE Daily Call (commit-reveal), The Gate Remembers (rekap mingguan). API: `/proof`, `/gate-report`, `/graduations`. Telegram bot baru. X: Automated, `dry` dulu, balasan manual.

## Ringkasan arsitektur
Indexer launchpad → DB → worker (LLM → RiskGuard kode → commit hash → antrian persetujuan manual → X/Telegram) → API → web. Kontrak: `ElysiaLedger` + mock feed HYPE. Rinci: `ELYSIA_ARCHITECTURE.md`.

## Status repository
Salinan NEXA, tanpa `.git`/`.github`. Graphify: 162 file, 1.450 node, 3.210 edge, 74 community (16 file Solidity masuk); health check dan manifest OK; output di `graphify-out/`. Source belum diubah. Graph direlevansi ke kode NEXA-dengan-lapisan-Elysium-parsial.

## Status infrastruktur
Belum ada: repo GitHub baru, Railway, Supabase, Vercel, domain, logo, tiga wallet ELYSIA (deployer/agent/keeper), bot Telegram, kredensial X/LLM. Treasury tidak akan ada. Rinci: `ELYSIA_INFRASTRUCTURE_CHECKLIST.md`.

## Temuan kritis
1. `addresses/elysium-testnet.json` memakai deployer/agent/treasury yang identik dengan NEXA → tidak boleh dipakai; keeper tak jelas pemilik; field `treasury` harus hilang.
2. `MockAggregator.push` terbuka untuk siapa pun dengan `updatedAt` bebas; keeper = titik tunggal kepercayaan; model `getRoundData` mungkin tak cocok dengan precompile HyperCore.
3. `supabase/.temp` tertaut ke project NEXA; CLI mungkin login ke akun NEXA.
4. `NexaLedger` tidak bisa menampung Gate Report tanpa merusak statistik (counter campur).
5. `ELYSIUM-PLAN.md` (NEXA multi-chain) bertentangan dengan arahan single-chain.

## Keputusan ditetapkan
Chain 99801 saja; fork independen; tanpa fee/BurnVault; RiskGuard dipakai ulang dengan aturan tambahan; tanpa Treasury/pembayaran. Hash `keccak256(abi.encode(string,address,uint8,uint32,bytes32))` dari NEXA adalah **kandidat** (PENDING verifikasi untuk ELYSIA), bukan keputusan final.

## Keputusan pending (butuh Head Dev/pemilik)
Nama final/handle; jalur Gate Report on-chain (A/B/C); rename vs kontrak baru; definisi "menang"; apakah Anvil lokal boleh; penghapusan modul NEXA (termasuk modul berbayar); ketatkan `settings.json`; Supabase plan/region; penyedia LLM; alamat launchpad; siapa memegang kunci tiap wallet; apakah kontrak menolak alamat sama antar peran. Daftar blocker: `ELYSIA_BLOCKERS.md`; status keputusan (FINAL/PENDING): `ELYSIA_DECISIONS.md`. Hash commit-reveal adaptasi NEXA masih PENDING.

## Konflik brief ↔ arahan
Brief: token di Solana (ditunda); tahap mainnet Elysium (hanya readiness); Gate Report on-chain vs kemampuan NexaLedger.

## Batasan implementasi
Jangan ubah source/config/skill/agent/dependency; jangan commit/push/deploy; jangan baca/tulis secret; semua REMOVE butuh persetujuan; konfirmasi login CLI sebelum perintah cloud.

## Rujukan
`docs/ELYSIA_BRIEF.md`, `ELYSIA_ARCHITECTURE.md`, `ELYSIA_MIGRATION_PLAN.md`, `ELYSIA_DATABASE_OPTIMIZATION.md`, `ELYSIA_SMART_CONTRACT_PLAN.md`, `ELYSIA_IMPLEMENTATION_ROADMAP.md`, `ELYSIA_INFRASTRUCTURE_CHECKLIST.md`. Dokumen NEXA lama (report, BLOCKERS, PROGRESS, DECISIONS, ELYSIUM-PLAN, dan lainnya) sudah diarsipkan di luar repository (`d:\.PROJECT\Elysia-NEXA-archive`) = referensi historis, bukan instruksi.
