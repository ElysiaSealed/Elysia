# ELYSIA — Rencana Smart Contract (`ElysiaLedger`)

Status: DRAFT planning (2026-11-11). Tidak ada kontrak dibuat atau di-deploy. Target tunggal: **Elysium Testnet, chain ID 99801**. Tanpa kontrak fee, `BurnVault`, logic Pons V2, token, atau chain lain.

## 1. Evaluasi `NexaLedger` (dibaca penuh, `contracts/src/NexaLedger.sol`)
| Aspek | Perilaku saat ini | Penilaian untuk ELYSIA |
|---|---|---|
| Hash | `keccak256(abi.encode(string text, address asset, uint8 direction, uint32 horizon, bytes32 salt))` | KANDIDAT, **PENDING** persetujuan Head Dev (brief: logika commit-reveal sama; kesesuaian untuk Gate Report belum diverifikasi, lihat §2). Vektor test bersama TS/Solidity tersedia |
| Akses | `Ownable2Step`; `agent` tunggal untuk `commit`/`reveal`; `renounceOwnership` dinonaktifkan; `setAgent`, `setFeed`, `setMinMoveBps` hanya owner | KEEP. Owner EOA deployer ELYSIA untuk testnet |
| `commit(hash)` | menyimpan hash, `committedAt`, snapshot `minMoveBps`; `hashUsed` mencegah duplikat | KEEP |
| `reveal(...)` | cek hash, arah, horizon, jatuh tempo, lalu verifikasi round awal/akhir lewat `getRoundData` | ADAPT (lihat §3) |
| Skor | return bps dari harga round; menang jika arah benar dan ≥ `minMoveBps` (default 0 = arah saja) | KEEP; definisi "menang" final masih keputusan terbuka |
| Statistik | `commitCount`, `revealCount`, `winCount`, `sumReturnBps` | ADAPT: tercampur bila Gate Report ikut dicatat (§2) |
| Event | `Committed`, `Revealed` (memuat teks, round id, harga) | KEEP + tambahan untuk laporan |
| Teks bahasa | NatSpec berbahasa Indonesia | Ganti ke Inggris (konvensi kode) |
| Horizon | `MIN_HORIZON = 1 hours`, `MAX = 365 days` | Cocok untuk uji 1 jam dan harian 7 hari |

Rekomendasi: **ADAPT menjadi kontrak baru `ElysiaLedger`** (file baru, bukan rename in-place), mewarisi desain NexaLedger tetapi diubah sadar, bukan hanya diganti nama. Alasan: (a) Gate Report butuh jenis catatan baru; (b) model oracle perlu dipikirkan ulang; (c) kontrak harus bebas jejak NEXA. Jika Head Dev memilih "rename saja", risiko §2 dan §3 tetap ada.

## 2. Gate Report on-chain (keputusan Head Dev #1)
Brief: hash laporan **harus di-commit on-chain sebelum publikasi**. `NexaLedger.commit(hash)` bersifat generik, tetapi laporan tidak punya `reveal` berskor; memakainya langsung akan membuat `commitCount` jauh melebihi `revealCount` dan merusak win rate. Opsi:
- **A (rekomendasi):** satu kontrak `ElysiaLedger` dengan dua jalur: `commitPrediction(hash)` (alur NexaLedger, berskor) dan `commitReport(hash)` (atestasi saja, event `ReportCommitted`, counter terpisah, tanpa skor). Satu alamat, satu agent, satu set test.
- B: dua kontrak (ledger prediksi + `ElysiaReportLedger`); lebih terpisah tetapi dua deploy dan dua audit (ELYSIUM-PLAN NEXA menyebut varian ini sebagai `NexaRiskLedger`, wajib audit).
- C: laporan tetap off-chain di fase awal (melanggar brief; hanya bila Head Dev menurunkan prioritas).
Skema hash laporan harus didefinisikan: hash dari JSON kanonik laporan + salt (hindari memuat teks panjang on-chain). Reveal laporan (membuka isi) tidak wajib bila isi sudah publik setelah diposting; tentukan apakah event berisi `reportHash` + `uri/ref` saja.

## 3. Oracle HYPE dan mock feed
Fakta terverifikasi:
- `MockAggregator.push(answer, updatedAt)` **tidak dibatasi akses** dan `updatedAt` bebas ditentukan pemanggil. Siapa pun dapat menambah round dan memengaruhi skor. Di Robinhood hanya aman karena testnet.
- Keeper (`apps/worker/src/keeper.ts`) menyalin harga dari API publik Hyperliquid dengan wallet sendiri (`KEEPER_PRIVATE_KEY`): titik tunggal kepercayaan dan ketersediaan; round hanya muncul saat heartbeat habis (6 jam) atau deviasi ≥ 0,5% (default `DEFAULT_KEEPER_CONFIG`). Reveal gagal bila tidak ada round setelah jatuh tempo.
- Verifikasi round NexaLedger (`_verifyStart`/`_verifyEnd`) memakai `roundId ± 1`, yang hanya valid dalam satu phase Chainlink dan mengasumsikan riwayat ronde.

Rencana testnet: mock feed HYPE/USD (8 desimal) dengan **`push` dibatasi `onlyKeeper`** dan batasan `updatedAt ≤ block.timestamp` serta monotonik; keeper terpisah dari agent dan deployer; semua ditandai sebagai "uji mesin", bukan bukti akurasi. Hasil skor testnet tidak dipakai dalam klaim performa publik.

Risiko mainnet (tidak diasumsikan tersedia): precompile HyperCore memberi harga sekarang, bukan riwayat ronde. Karena **HYPE Daily Call mengumumkan asetnya** (tidak perlu disembunyikan), desain mainnet bisa membaca harga saat commit (snapshot on-chain) dan saat reveal, menggantikan verifikasi `getRoundData`. Ini perubahan kontrak besar; direncanakan sebagai fase terpisah setelah precompile terverifikasi (Phase 5), bukan sekarang. Opsi di Phase 5: adaptor feed berbasis precompile yang menyimpan snapshot; atau kontrak v2.

## 4. Peran dan alamat (keputusan final Head Dev, 2026-11-12)
ELYSIA gratis; tidak ada pembayaran, fee, atau Treasury. Kontrak tidak menerima dana, tidak menyimpan saldo, dan tidak punya jalur pembayaran.
- `elysium-testnet.json` saat ini berisi deployer, agent, dan treasury **identik dengan NEXA** dan `keeper` tak diketahui pemiliknya. **Tidak boleh dipakai** (brief: deployer baru; Head Dev: tanpa wallet NEXA).
- **Tepat tiga wallet baru, tiga private key berbeda:**

| Wallet | Izin on-chain | Catatan |
|---|---|---|
| Deployer | Deploy; `owner` (`Ownable2Step`): `setAgent`, `setKeeper`, `setFeed`, `setMinMoveBps` | Tidak dipakai untuk commit/reveal atau push feed |
| Agent | Hanya `commit`, `reveal`, dan atestasi laporan (`onlyAgent`) | Bukan owner |
| Keeper | Hanya `push` pada mock feed (`onlyKeeper`) | Bukan owner, bukan agent |

- Konstruktor/setter sebaiknya menolak alamat yang sama untuk dua peran (rekomendasi desain, perlu persetujuan) agar pemisahan peran ditegakkan on-chain, bukan hanya konvensi.
- Tidak ada Treasury, penerima fee, atau `TREASURY_ADDRESS` di kontrak, script, atau config. Pembuatan wallet dan pengisian faucet HYPE dilakukan manusia; Claude tidak membuat wallet dan tidak memegang private key (belum ada wallet yang dibuat pada tahap planning).
- Asumsi lama "ledger harus transaksi pertama deployer agar alamat sama `0xEF1f…`" (NEXA) **tidak berlaku** untuk ELYSIA dan tidak boleh diikuti.

## 5. Keamanan dan desain
- Reentrancy: tidak ada transfer nilai; risiko rendah.
- Tiga peran, tiga kunci terpisah (deployer/agent/keeper); rotasi agent dan keeper lewat owner (`setAgent`, `setKeeper`); owner = EOA deployer di testnet (rekomendasi, dicatat sebagai risiko terpusat).
- Kontrak tidak menerima ETH/HYPE (tanpa `receive`/`payable`) dan tidak memiliki fungsi pembayaran, sesuai model gratis.
- Manipulasi `updatedAt` mock → batasi `push` (lihat §3).
- Batas panjang `text` pada `reveal` (calldata/event) perlu ditetapkan untuk biaya gas.
- Audit eksternal belum diwajibkan untuk testnet; wajib sebelum mainnet.
- Rasio fee 30/20 dan semua logic fee **tidak dibawa**.

## 6. Test
- Unit + fuzz untuk commit/reveal, akses, duplikat hash, jatuh tempo, verifikasi round (adaptasi `NexaLedger.t.sol`, 24 test NEXA sebagai baseline).
- Test baru: jalur `commitReport`, counter terpisah, `push` mock terbatas, keeper tak berwenang ditolak.
- Vektor hash bersama `packages/shared/test-vectors/commit-reveal.json` tetap dipakai oleh `forge test` dan Vitest; tambah vektor laporan.
- `forge snapshot` dan ekspor ABI ke `packages/contracts-abi`.

## 7. Deployment dan verifikasi (rencana; belum dieksekusi)
Prasyarat: tiga wallet baru (deployer, agent, keeper) terverifikasi (`cast chain-id` = 99801, alamat keystore, saldo HYPE > 0), keystore dengan nama ELYSIA. Urutan: deploy mock feed → deploy `ElysiaLedger` → `setFeed(HYPE, feed)` → verifikasi Blockscout → satu commit dan reveal HYPE (horizon 1 jam). Command yang butuh password keystore dijalankan manusia. Dry run (`forge script` tanpa `--broadcast`) lebih dulu. Verifikasi memakai Blockscout Elysium (`https://elysium.kinetiq.xyz/api/`, dari ELYSIUM-PLAN NEXA; verifikasi ulang ke docs resmi). Faucet dan RPC dari `chains.ts` (sumber: docs Elysium, 2026-11-09).

## 8. Ketergantungan mainnet (tidak diasumsikan)
Precompile HyperCore (brief: aktif sekitar 4 minggu setelah mainnet), alamat launchpad mainnet, RPC/explorer mainnet, audit, tiga wallet mainnet baru (bukan wallet testnet). Semuanya Phase 5 dan butuh persetujuan.

## 9. Keputusan yang diminta
1. Jalur Gate Report (A/B/C di §2).
2. Rename-adapt vs kontrak baru (rekomendasi: kontrak baru berbasis NexaLedger).
3. Definisi "menang" (`minMoveBps`).
4. Penggunaan EOA owner tunggal di testnet.
5. Apakah kontrak menolak alamat sama antar peran (deployer/agent/keeper).

Final (Head Dev, 2026-11-12): layanan gratis; tiga wallet; tanpa Treasury, fee, BurnVault, FeeSplitter, atau burn.
