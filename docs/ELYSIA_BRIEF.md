# Elysia — Brief Rebrand & Build (Elysium Influencer)

Nov 9, 2026 · @ronald

## Ringkasan

**Elysia** adalah influencer AI kedua dari tim yang sama dengan NEXA. Teknologinya hasil fork NEXA (commit-reveal, RiskGuard, indexer, worker), tapi identitas, chain, dan token-nya sendiri. Fokus konten: **ekosistem Elysium** (L2 Hyperliquid dari Kinetiq). Token Elysia diluncurkan di **Solana**.

**Pembagian dengan NEXA**

|  | NEXA | Elysia |
| --- | --- | --- |
| Rumah | Robinhood Chain | Elysium (Hyperliquid) |
| Fokus | Stock Token, Pons V2 | Launch pipeline Elysium, HYPE |
| Ledger bukti | `NexaLedger` di 4663 | `ElysiaLedger` di Elysium |
| Token | $NEXA di Pons V2 (belum) | Token Elysia di Solana |
| Developer | Developer 1 | Developer 2 |

**Asumsi yang dipakai brief ini** (koreksi kalau salah):

1. "Launch di Solana pair Hyperliquid" diartikan: token Elysia rilis di Solana, dengan narasi dan konten yang menghadap ekosistem Hyperliquid/Elysium. Detail pasangan likuiditasnya ada di bagian Token.
2. Rencana NEXA ke Elysium (brief sebelumnya) **diserahkan ke Elysia**, supaya dua agent tidak berebut audiens yang sama. NEXA tetap fokus di Robinhood Chain.
3. Elysia memakai codebase NEXA lewat fork terpisah, repo dan infrastruktur terpisah, tanpa akses ke kunci atau database NEXA.

## Identitas Elysia

NEXA adalah analis dingin yang tidak bisa menarik ucapannya. Elysia adalah **penjaga gerbang**: ia berdiri di pintu masuk Elysium dan menilai setiap token yang ingin masuk, sebelum orang lain sempat terluka. Satu keluarga nilai (commit dulu, tidak bisa menghapus), tapi kepribadian berbeda supaya tidak terasa sebagai salinan.

| Aspek | Elysia |
| --- | --- |
| Peran | Penjaga gerbang Elysium. Melihat setiap launch, menimbang, lalu mencatat penilaiannya on-chain |
| Ideologi | "Paradise has a door. I decide what I believe walks through it, and I sign it before you see it." |
| Kepribadian | Tenang, hangat ke komunitas, tajam ke rug dan bundler. Lebih "protektif" dibanding NEXA yang lebih "sombong" |
| Musuh alami | Launch yang di-bundle, dev yang menjual habis, influencer yang memanggil token lalu menghapus tweet |
| Hubungan dengan NEXA | "Saudara" dari lab yang sama. Sesekali saling menyebut, tapi tidak saling mempromosikan token |
| Catchphrase | *"Sealed."* (setiap commit) · *"The gate remembers."* (setiap reveal, menang atau kalah) |
| Visual | Karakter orisinal. Hindari logo, warna, dan tipografi Elysium/Kinetiq, supaya tidak terlihat seperti akun resmi |
| Bahasa post | Inggris |

**Contoh bio (format seperti Claudia):**

> Paradise has a door. I stand at it.
>
> Every launch on Elysium, judged and sealed on-chain before I speak.
>
> Soul created by @\[handle-dev2\] · sister of @\[handle-NEXA\]
>
> Not affiliated with Kinetiq or Elysium.

Kalimat "Not affiliated" wajib, karena nama Elysia sangat dekat dengan Elysium (lihat Risiko).

## Purpose di Elysium

Elysia menjadi **lapisan kepercayaan untuk launch pipeline Elysium**. Kinetiq merancang Elysium sebagai jalur dari launch di AMM long-tail, ke PropAMM, ke spot HyperCore, lalu perp HIP-3. Banyak token masuk setiap hari, dan di setiap tahap ada yang gagal. Elysia menilai tiap tahap dan mengunci penilaiannya on-chain.

| Konten | Isi | Frekuensi |
| --- | --- | --- |
| **Gate Report** (inti) | Kartu risiko token launchpad (Pump.fun, Ascend, Montra, dll.) yang berumur ≥ 1 jam: konsentrasi holder, bundling, pajak creator, perilaku dev. Hash dikunci sebelum post | Beberapa kali sehari |
| **Graduation Watch** | Token yang lulus ke tahap berikutnya (AMM → HyperCore → HIP-3), plus red flag-nya | Harian |
| **HYPE Daily Call** | Prediksi arah harian HYPE, dinilai dari harga HyperCore | Harian |
| **The Gate Remembers** | Rekap mingguan: penilaian mana yang benar dan mana yang salah, dengan tautan tx | Mingguan, video pendek |

**Kenapa Elysia bisa mendominasi:** alat alert rug sudah ada di ekosistem (mis. ElysiumRadar, capsuleweb3), tapi tidak satu pun punya rekam jejak yang dikunci on-chain. Elysia bukan alert tercepat; Elysia satu-satunya yang akurasinya bisa diaudit siapa pun.

**Bukan peran Elysia:** menyuruh beli atau jual, target harga, menyebut token di bawah 1 jam, promosi berbayar tanpa label "Sponsored", atau mempromosikan token Elysia sendiri dari akun agent.

## Teknologi: fork dari NEXA

Teknis Elysium (chain ID, RPC, explorer, faucet, jebakan viem) sudah ada di brief *NEXA on Elysium — Developer Brief*; developer 2 memakai brief itu sebagai referensi jaringan.

| Komponen NEXA | Untuk Elysia | Catatan |
| --- | --- | --- |
| `NexaLedger` | Pakai ulang, ganti nama jadi `ElysiaLedger` | Logika commit-reveal sama. Deploy dari deployer **baru** milik Elysia |
| Kontrak fee + `BurnVault` | **Tidak dipakai** | Token Elysia di Solana, bukan EVM |
| RiskGuard | Pakai ulang penuh | Tambah aturan: wajib label "Not affiliated with Kinetiq" di bio/profil, larang klaim "official Elysium" |
| Indexer Pons V2 | Ganti dengan indexer launchpad Elysium | Event launch, trade, graduation; deteksi bundling (banyak wallet beli di blok yang sama) |
| Feed harga Chainlink | Ganti dengan mock feed di testnet; precompile HyperCore di mainnet | Precompile baru aktif sekitar 4 minggu setelah mainnet Elysium |
| Worker + LLM adapter | Pakai ulang | Prompt persona Elysia terpisah dari NEXA |
| API + web | Fork | Domain, desain, dan nama sendiri. Endpoint `/proof`, `/gate-report`, `/graduations` |
| Bot Telegram | Fork | Bot dan kanal baru, tidak berbagi token bot dengan NEXA |

**Pemisahan wajib**

- Repo, Railway, Supabase, kunci X, kunci LLM, kunci Telegram, dan deployer semuanya baru. Developer 2 tidak mendapat akses ke rahasia NEXA.
- Akun X Elysia ditandai label **Automated** dan ditautkan ke akun founder.
- Balasan ke akun lain di X dilakukan manual, bukan otomatis (aturan otomasi X).

## Token di Solana

Model paling dekat dengan Claudia: token fan di Solana, sementara aktivitas agent ada di chain lain. Claudia membuktikan model ini bisa jalan, karena orang membeli karakternya, bukan chain-nya.

**Yang perlu diputuskan pemilik sebelum developer membangun apa pun untuk token:**

| Keputusan | Opsi | Catatan |
| --- | --- | --- |
| Arti "pair Hyperliquid" | (a) Token SPL biasa dipasangkan dengan SOL, narasi Hyperliquid/Elysium; (b) dipasangkan dengan HYPE versi Solana lewat bridge; (c) token di Solana sekarang, versi Elysium nanti | Opsi (b) bergantung pada likuiditas HYPE di Solana dan keamanan bridge-nya; belum saya verifikasi. Opsi (a) paling sederhana |
| Tempat launch | Launchpad Solana (mis. Pump.fun) atau pool sendiri | Launchpad: tanpa kontrak custom, tanpa audit kontrak. Pool sendiri: butuh audit |
| Fee creator | Ke treasury, burn, atau dana konten (seperti Claudia mendanai film) | Tulis tujuan fee secara publik sejak hari pertama |
| Waktu launch | Sebelum atau sesudah rekam jejak | Saran: setelah minimal 30 hari Gate Report ter-commit dan ter-skor |

**Aturan yang sama dengan NEXA:**

- Agent Elysia **tidak pernah** membahas harga token-nya sendiri. Pengumuman token datang dari akun founder.
- Satu alamat mint resmi, diumumkan di situs dan bio. Gate Report Elysia boleh menandai token tiruan bernama Elysia.
- Opini hukum tertulis (OJK) sebelum token rilis, karena tim yang sama juga menjalankan fitur berbayar di NEXA.

## Tahapan kerja

1. **Identitas (minggu 1):** amankan nama dan handle (X, Telegram, domain), character sheet, bio, visual orisinal. Nama final diputuskan setelah cek bentrok nama (lihat Risiko).
2. **Fork dan pemisahan (minggu 1):** repo baru dari NEXA, ganti semua nama dan rahasia, infrastruktur baru.
3. **Elysium testnet (minggu 2):** deploy `ElysiaLedger` + mock feed di 99801, satu prediksi HYPE end-to-end, indexer launchpad testnet.
4. **Gate Report off-chain (minggu 2–3):** kartu risiko lewat RiskGuard, X mode `dry`, persetujuan manual.
5. **Elysium mainnet (setelah precompile HyperCore jelas):** deploy ledger, X live, rekam jejak harian dimulai.
6. **Token di Solana:** hanya setelah keputusan di bagian Token, 30 hari rekam jejak, dan opini hukum.

**Selesai untuk tahap testnet bila**

- [ ] `ElysiaLedger` ter-deploy dan terverifikasi di explorer Elysium testnet
- [ ] Satu prediksi HYPE ter-commit, ter-reveal, dan ter-skor
- [ ] Lima Gate Report contoh lolos RiskGuard (dry run)
- [ ] Tidak ada satu pun rahasia NEXA di repo atau env Elysia
- [ ] Link explorer (ledger, tx deploy, commit, reveal) dilaporkan ke pemilik

## Risiko dan pertanyaan terbuka

**Bentrok nama "Elysia" (paling penting).** Nama ini sudah dipakai beberapa pihak:

| Pemakai | Apa | Kenapa berisiko |
| --- | --- | --- |
| [Elysia AI / Mercenary Games](https://elysiaai.net/news/elysia-ai-elysium-universe) | Karakter AI di game **ELYSIUM** (MMORPG), diperkenalkan 30 Okt 2026 | Hampir identik: AI bernama Elysia + dunia bernama Elysium. Pencarian "Elysia Elysium" akan menampilkan mereka |
| [ELYSIA (EL)](https://www.alphagrowth.io/elysia) | Protokol RWA di Ethereum sejak 2018, sekitar 50 ribu follower X | Ticker dan nama sudah terkenal di crypto |
| [elysiaJS (ELYSIA)](https://www.solflare.com/prices/elysiajs/7obAGQeEANux5nPUE9RFLHZ14ZSLiREznLTtMMxZpump/) | Token Solana tak terverifikasi, holder sangat terkonsentrasi | Token Elysia baru di Solana bisa tertukar dengan token ini |
| [Elysia (Weaviate)](https://weaviate.github.io/elysia/) | Framework agent AI open source | Bentrok di pencarian "Elysia AI agent" |

Opsi: (a) tetap "Elysia" dengan handle dan ticker yang jelas berbeda (mis. tambahan kata) + cek merek dagang; (b) varian nama yang masih bernuansa Elysium tapi unik. Putuskan sebelum mengamankan handle.

**Risiko lain**

- **Terlihat seperti akun resmi Elysium.** Nama yang mirip ditambah fokus Elysium bisa dianggap menumpang merek Kinetiq. Mitigasi: label "Not affiliated", visual berbeda, tidak memakai logo.
- **Kanibalisasi dengan NEXA.** Kalau NEXA juga menjalankan rencana Elysium, dua agent dari tim yang sama berebut audiens. Brief ini mengasumsikan rencana NEXA ke Elysium dipindahkan ke Elysia.
- **Elysium masih baru:** satu sequencer, validator di-whitelist, precompile HyperCore belum aktif.
- **Token di Solana dengan narasi Hyperliquid** bisa dibaca sebagai "menumpang hype". Jawabannya rekam jejak: Gate Report yang ter-skor sebelum token ada.

**Pertanyaan untuk pemilik**

- [ ] Nama final dan handle?
- [ ] Arti "pair Hyperliquid" untuk token (opsi a/b/c di bagian Token)?
- [ ] Rencana NEXA ke Elysium dibatalkan dan diserahkan ke Elysia?
- [ ] Siapa pemilik kunci deployer dan akun X Elysia?
