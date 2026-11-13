# ELYSIA — Rencana Smart Contract (`ElysiaLedger`, Robinhood Chain mainnet)

Status: rencana akhir untuk `dev-rh` (2026-11-13). Kontrak sudah ada di `contracts/src/ElysiaLedger.sol` (25 test lulus) tetapi **belum di-deploy**. Target tunggal: Robinhood Chain mainnet, chain ID 4663. Tanpa BurnVault, splitter fee, token, atau chain lain di dalam kontrak ini. Kontrak token $ELYS adalah pekerjaan terpisah (Phase F).

## 1. Kontrak saat ini
| Aspek | Perilaku | Catatan |
|---|---|---|
| Hash | `keccak256(abi.encode(string text, address asset, uint8 direction, uint32 horizon, bytes32 salt))` | Vektor test bersama TS dan Solidity di `packages/shared/test-vectors/commit-reveal.json` |
| Akses | `Ownable2Step`; satu `agent` untuk `commit` dan `reveal`; `renounceOwnership` dinonaktifkan; `setAgent`, `setFeed`, `setMinMoveBps` hanya owner | Owner = Deployer |
| `commit(hash)` | Menyimpan hash, `committedAt`, snapshot `minMoveBps`; `hashUsed` mencegah duplikat | `onlyAgent` |
| `reveal(...)` | Cek hash, arah, horizon, jatuh tempo; verifikasi ronde awal dan akhir lewat `getRoundData` | `onlyAgent` |
| Skor | Return dalam bps dari harga ronde; menang bila arah benar dan ≥ `minMoveBps` (default 0 = arah saja) | Definisi "menang" masih PENDING |
| Statistik | `commitCount`, `revealCount`, `winCount`, `sumReturnBps` | |
| Event | `Committed`, `Revealed` (teks, ronde, harga), `AgentSet`, `FeedSet`, `MinMoveBpsSet` | |
| Horizon | `MIN_HORIZON = 1 hours`, `MAX_HORIZON = 365 days` | |
| Dana | Tidak menerima ETH, tanpa `receive` atau `payable`, tanpa jalur pembayaran | |

## 2. Peran
| Wallet | Izin on-chain |
|---|---|
| Deployer | Deploy; owner: `setAgent`, `setFeed`, `setMinMoveBps` |
| Agent | Hanya `commit` dan `reveal` |
| Treasury | Tidak punya izin di kontrak; hanya menerima USDG di luar kontrak |

Keeper tidak ada: feed adalah feed Chainlink langsung, tidak ada mock yang harus diisi. Penolakan alamat sama antar peran di konstruktor dan setter masih PENDING (rekomendasi desain).

## 3. Oracle Chainlink: hal yang harus ditinjau sebelum deploy
- Feed mainnet yang dipakai: `RHNVDA / USD` `0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15` dan `ETH / USD` `0x78F3556b67E17Df817D51Ef5a990cDaF09E8d3A9` (8 desimal, diverifikasi baca-saja). Aset NVDA Stock Token `0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC` dan WETH `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73`; `setFeed(asset, feed)` memetakan aset ke feed.
- `_verifyStart` dan `_verifyEnd` memakai `roundId ± 1`. Pada feed proxy Chainlink, id ronde berisi `phaseId` di bit atas, sehingga lompatan antar phase atau ronde yang tidak berurutan membuat verifikasi gagal atau salah. Wajib diuji terhadap feed asli (simulasi fork baca-saja) dan ditinjau.
- Heartbeat dan deviasi feed menentukan kapan ronde setelah jatuh tempo muncul; reveal gagal bila belum ada ronde setelah `maturity`. Umur data feed teramati sekitar 12 menit (NVDA) dan 33 menit (ETH) saat diperiksa; heartbeat sebenarnya belum diketahui.
- Feed Stock Token mengikuti jam pasar: perlu diputuskan bagaimana prediksi di luar jam pasar diperlakukan.
- Nama feed NVDA adalah `RHNVDA / USD`, bukan `NVDA / USD`.

## 4. Keamanan dan desain
- Reentrancy: tidak ada transfer nilai.
- Satu agent; rotasi lewat owner. Owner EOA tunggal (Deployer) adalah titik terpusat: pertimbangkan multisig sebelum mainnet.
- Batas panjang `text` pada `reveal` perlu ditetapkan untuk gas dan ukuran event.
- Review wajib sebelum deploy: `forge test` penuh, fuzz tambahan untuk verifikasi ronde, agent `contract-reviewer`, dan review manusia. Audit eksternal sangat disarankan karena mainnet tidak dapat dibatalkan.
- Tidak ada fee, treasury, atau burn di kontrak.

## 5. Test
Unit dan fuzz untuk commit, reveal, akses, duplikat hash, jatuh tempo, dan verifikasi ronde (`contracts/test/ElysiaLedger.t.sol`); test pengganti dengan `MockAggregator` hanya untuk menguji perilaku ronde. Tambahkan test dengan ronde bertipe phase Chainlink dan batas panjang teks. `forge snapshot` diperbarui; ABI diekspor lewat `scripts/export-abi.mjs`.

## 6. Deployment (rencana; belum dieksekusi)
Prasyarat: wallet Deployer dan Agent diverifikasi (`pnpm check:wallets`, `cast chain-id` = 4663 lewat RPC resmi), saldo ETH cukup untuk gas, keystore bernama `elysia-deployer`, persetujuan R2 dan R3 di roadmap.
Urutan: simulasi `forge script script/DeployElysiaLedger.s.sol` tanpa `--broadcast` → deploy oleh manusia (password keystore diketik manusia) → verifikasi di Blockscout → `setAgent` → `setFeed` untuk NVDA dan WETH → satu commit dan reveal dengan horizon terpendek → isi `ELYSIA_LEDGER_ADDRESS` dan catat alamat di `packages/contracts-abi/addresses/mainnet.json` (hanya alamat Elysia).
Skrip `DeployElysiaLedger.s.sol` masih menyebut RPC testnet di komentarnya: perbarui sebelum dipakai.

## 7. Kontrak token $ELYS dan burn
Kontrak token baru dan rencana peluncuran adalah keputusan terpisah (Phase F, gate R6). Riwayat burn dibaca dari CA yang diberikan PM; tidak ada kontrak burn buatan ELYSIA.

## 8. Keputusan yang diminta
1. Definisi "menang" (`minMoveBps`).
2. Penolakan alamat sama antar peran dan pemakaian multisig untuk owner.
3. Perlakuan prediksi di luar jam pasar untuk Stock Token.
4. Batas panjang `text`.
5. Audit eksternal sebelum atau sesudah deploy.
