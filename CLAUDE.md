# ELYSIA — AI Analyst di Robinhood Chain · Instruksi Claude Code

Dokumen ini adalah pintu masuk instruksi proyek **ELYSIA** untuk branch `dev-rh` (arah akhir: Robinhood Chain). Isinya ringkas dan menunjuk ke dokumen ELYSIA di `docs/`; jangan menyalin seluruh isi dokumen itu ke sini. Semua perintah bash diberi komentar direktori, contoh: `# Jalankan di: ROOT/contracts` (`ROOT` = folder tempat Claude Code dijalankan).

## 1. Identitas proyek
- Nama: **ELYSIA**, AI analyst di **Robinhood Chain**. Membaca peluncuran Pons V2 dan Stock Token, mencatat setiap prediksi on-chain (commit) sebelum dipublikasikan, dan menyediakan bukti yang dapat diverifikasi.
- ELYSIA adalah **proyek independen** yang dikembangkan dari basis kode proyek sumber. Wallet, alamat operasional, kredensial, repository, database, dan infrastruktur proyek sumber **tidak** dibawa dan tidak boleh dipakai. Arsip dokumen proyek sumber berada di luar repository dan tidak boleh dibaca atau dimasukkan kembali.
- Branch: `dev-rh` adalah jalur pengembangan Robinhood dan naik ke `main` saat pindah ke Robinhood. `main` saat ini masih varian Elysium Testnet dengan keputusan dan aturan terpisah.
- Dokumen di `docs/` selain roadmap dan checklist infrastruktur sebagian masih menulis varian Elysium (brief, arsitektur, rencana migrasi, rencana kontrak, working context). Perlakukan sebagai **referensi historis** sampai ditulis ulang pada Phase B roadmap, dan catat konflik, jangan menebak.

## 2. Sumber kebenaran (urutan prioritas)
1. Arahan terbaru developer dan Head Dev yang tercatat di `docs/ELYSIA_DECISIONS.md` (entri 2026-11-13 untuk `dev-rh`; masih PENDING sampai Head Dev mengonfirmasi tertulis).
2. `docs/ELYSIA_IMPLEMENTATION_ROADMAP.md` dan `docs/ELYSIA_INFRASTRUCTURE_CHECKLIST.md` (rencana akhir Robinhood).
3. Dokumen ELYSIA lain di `docs/` sebagai referensi, dengan batasan pada bagian 1.

Aturan:
- Jangan mengarang requirement di luar arahan dan keputusan tercatat. Pilihan teknis di luar itu ditandai **[di luar brief]** dan dicatat di `docs/ELYSIA_DECISIONS.md` (status PENDING sampai disetujui).
- Keputusan **PENDING** bukan keputusan final. Sebelum implementasi yang bergantung padanya, ajukan pertanyaan. Contoh yang masih PENDING: teks disclaimer publik, harga final, definisi "menang" (`minMoveBps`), penolakan alamat sama antar peran di kontrak, aturan umur token (< 1 jam), aturan URL di post, format event burn dan CA dari PM, rencana peluncuran $ELYS, nama final dan domain.
- Jangan menulis ke `docs/DECISIONS.md` atau `docs/BLOCKERS.md` (dokumentasi proyek sumber).

## 3. Chain dan smart contract
- Target: **Robinhood Chain mainnet, chain ID 4663** (RPC `https://rpc.mainnet.chain.robinhood.com`, explorer `https://robinhoodchain.blockscout.com`). Langsung mainnet, tanpa tahap testnet. Entri testnet di `packages/shared/src/chains.ts` hanya untuk test dan pemilihan eksplisit.
- Alamat pihak ketiga (USDG, Pons V2, Uniswap v4 PoolManager, feed Chainlink, Stock Token, WETH) ada di `packages/shared/src/chains.ts` beserta sumbernya dan sudah diverifikasi baca-saja. Verifikasi ulang dengan pemeriksaan baca-saja sebelum memakai alamat baru. USDG kemungkinan proxy: admin kontrak ada di pihak ketiga.
- Dilarang: chain lain, bridge, arsitektur multichain, dan integrasi Solana.
- Kontrak ditulis baru dan di-deploy ulang dengan wallet baru: `ElysiaLedger` dan, kelak, token **$ELYS**. Tidak ada BurnVault dan tidak ada splitter fee kreator. Halaman Burn hanya membaca riwayat dari CA yang diberikan PM.
- Mainnet tidak dapat dibatalkan dan memakai dana nyata. Sebelum deploy: `forge test` penuh, tinjauan `contract-reviewer`, dan simulasi tanpa broadcast. **Jangan broadcast transaksi apa pun, termasuk deploy dan pembayaran uji, tanpa persetujuan eksplisit per tindakan.** Perintah yang butuh password keystore dijalankan manusia.
- Jangan menghapus library EVM (viem, Foundry, OpenZeppelin).

## 4. Model layanan dan wallet
- Gratis: feed publik, Prediction of the Day, Proof of Intelligence, Rug radar, Ask, Burn tracker.
- Berbayar dalam USDG: Pro, Signals API, Sponsored report. Harga sementara dan dapat diedit lewat env (`PRO_PRICE_USDG_MICROS`, `ASK_PRICE_USDG_MICROS`, `SIGNALS_PRICE_USDG_MICROS`, `SPONSORED_PRICE_USDG_MICROS`) dan ditampilkan lewat `GET /pricing`. `PAID_FEATURES_ENABLED` tetap `false` sampai pembayaran terverifikasi ujung ke ujung dan tinjauan hukum selesai (gate R4).
- Wallet operasional: **Deployer** (deploy dan admin kontrak), **Agent** (commit dan reveal), **Treasury** (penerima pembayaran). Alamat publik ada di `.env.example`. Keeper tidak diperlukan di mainnet karena ledger membaca feed Chainlink langsung.
- Dilarang memakai wallet, alamat operasional, private key, atau kredensial proyek sumber, termasuk alamat lamanya (file `packages/contracts-abi/addresses/*.json` tidak boleh diisi dengan alamat itu).
- Private key tidak pernah dibuat, diminta, ditampilkan, atau ditulis oleh Claude (repo, `.env`, log, chat, `docs/`). Wallet dibuat manusia; Claude hanya memakai alamat publik yang diberikan.

## 5. Batasan pengembangan
- Jangan global replace nama tanpa audit dampak (kopling tinggi: worker, api, api-client, web, ABI). Jangan menghapus tabel, migrasi, source code, dependency, atau modul tanpa keputusan dan persetujuan; perubahan skema memakai migrasi baru, bukan mengedit migrasi lama.
- **Kebijakan infrastruktur:**
  - Repository `ElysiaSealed/Elysia` (private, GitHub Organization). Project Vercel, Supabase (Free), dan Railway wajib **project baru** khusus ELYSIA.
  - Dilarang memakai repository, project, database, environment variables, secrets, atau deployment target proyek sumber, di mana pun ia muncul (CLI yang tertaut, `supabase/.temp`, file konfigurasi, riwayat).
  - Jangan membuat repository, project, database, domain, atau layanan eksternal, dan jangan menghubungkan ke resource eksternal, sebelum ada **permintaan eksplisit developer**.
  - Login ke akun yang benar tidak berarti target project sudah benar: verifikasi nama project, ref, dan org target pada tiap perintah cloud, dan berhenti bila ragu.
- **Supabase free: hemat egress dan ukuran database.** Tanpa `select *`, paginasi keyset, cache respons API, tanpa polling rapat atau realtime, tulis per batch dengan `ON CONFLICT`, agregasi atau pangkas data mentah turunan. Bukti (hash commit, tx hash, prediksi, pembayaran) tidak dihapus otomatis. Rujukan: `docs/ELYSIA_DATABASE_OPTIMIZATION.md`.
- `.claude/settings.json` mewajibkan konfirmasi untuk operasi eksternal (`git push`, `gh`/Vercel/Supabase/Railway yang mengubah resource, `forge script`, pemeriksaan jaringan seperti `cast call`) dan menolak force push, `forge create`, `cast send`, `cast publish`, serta perintah ber-`--broadcast`. Aturan `Read` melindungi file `.env` dan folder autentikasi CLI dari tool Read, tetapi **bukan isolasi menyeluruh**: akses lewat Bash atau PowerShell tidak dijamin terblokir. Jangan menghindari aturan ini lewat perintah setara; broadcast tetap butuh persetujuan eksplisit developer.
- Pertahankan RiskGuard **fail-closed**: setiap post lewat RiskGuard berbasis kode (bukan AI); data tidak lengkap berarti "tidak tahu"; tanpa ajakan beli atau jual, tanpa price target; ELYSIA tidak membahas atau mempromosikan token miliknya sendiri ($ELYS), dan RiskGuard memblokir sebutannya di post.
- **PENDING (jangan ditetapkan sendiri):** (a) aturan umur token, termasuk token < 1 jam: jangan menganggapnya otomatis dilarang atau otomatis boleh dipublikasikan; (b) aturan URL di post. Klasifikasi aturan RiskGuard ada di `.claude/skills/riskguard-rule/SKILL.md`.
- Integritas bukti: hash commit sebelum publikasi, tx hash tersimpan, salt dan preimage terenkripsi dan tidak pernah di log.
- Pipeline: AI → RiskGuard → commit terkonfirmasi → antrian persetujuan manusia → post. Mode X `dry` sampai ada izin eksplisit untuk `live`. Balasan di X manual, tanpa auto-reply.
- Jangan klaim afiliasi resmi dengan Robinhood atau Pons. Konten publik **berbahasa Inggris** dan memuat: "Not affiliated with Robinhood" (teks final menunggu konfirmasi). Akun X: `@ElysiaSealed`.
- Logo dan aset brand belum ada: tandai pending; jangan membuat placeholder atau memakai aset proyek sumber.

## 6. Aturan keselamatan perubahan
Sebelum perubahan yang berpotensi merusak atau sulit dibatalkan:
1. Periksa file dan dependensi terkait (gunakan Graphify, lalu verifikasi ke source).
2. Jelaskan dampaknya.
3. Identifikasi keputusan PENDING yang terkait.
4. Minta persetujuan bila di luar arahan yang sudah disetujui.

Tanpa persetujuan eksplisit, jangan: deploy, mengirim transaksi wallet, menghapus data, migrasi destruktif, mengubah layanan eksternal, force-push, atau menjalankan perintah yang membaca secret.

## 7. Konvensi kerja
- TypeScript strict; input eksternal divalidasi zod; uang dan harga `bigint` dengan desimal eksplisit (USDG 6 desimal); waktu UTC; rahasia hanya di `.env` (jangan di repo); perbarui `.env.example` bila ada variabel baru.
- Salt, API key, dan private key tidak pernah di log.
- Bahasa: komunikasi dan dokumen planning dalam Bahasa Indonesia; kode, **komentar**, nama, log developer, commit message, branch, dan PR dalam Bahasa Inggris (Conventional Commits). Konten publik dalam Bahasa Inggris.
- **Kebijakan Git (permanen):**
  - Commit message: hanya Bahasa Inggris dan Conventional Commits (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`, `perf`, `style`, `revert`), subjek maksimal 100 karakter. Dilarang menambahkan `Co-Authored-By`, atribusi AI, atau "Generated with Claude".
  - `.githooks/commit-msg` menolak pesan tidak valid dan tidak pernah menulis ulang. Hook aktif lewat `core.hooksPath=.githooks` (diatur `pnpm install`).
  - Push `main`: `pnpm push` (`git push origin main`). Push `dev-rh`: hanya bila pengguna menulis "push dev-rh", jalankan `pnpm push:dev-rh` (`git push origin dev-rh`) dan hanya itu. `.githooks/pre-push` hanya mengizinkan `main -> main` dan `dev-rh -> dev-rh`, menolak force push, hapus branch, dan working tree kotor, lalu menjalankan typecheck, production build, test non-DB, dan `forge test`.
  - Test DB hanya berjalan bila `TEST_DATABASE_URL` diset eksplisit ke DB lokal bernama `elysia_test`; tanpa itu, test DB dilaporkan **belum dijalankan**, bukan lolos.
  - Dilarang memakai `--no-verify`, mengubah atau menonaktifkan hook, atau `git push` langsung untuk menghindari hook. Commit dan push hanya atas persetujuan eksplisit pengguna.
- Task gagal 3 kali dengan pendekatan berbeda: catat di `docs/ELYSIA_BLOCKERS.md` dan lanjut task lain.

## 8. Skill dan agent
Skill di `.claude/skills/` dan agent di `.claude/agents/` berasal dari varian Elysium dan belum ditulis ulang untuk Robinhood (Phase B). Ikuti hanya bagian yang tidak bertentangan dengan dokumen ini; jangan menganggap skill otomatis cocok atau berizin.
- `commit-reveal`, `contract-change`, `riskguard-rule`, `new-endpoint`, `post-pipeline`, `progress-log`: panduan umum yang masih relevan; abaikan rujukan ke Elysium, Gate Report, dan HYPE.
- `deploy-contracts`: hanya panduan keselamatan, **bukan izin deployment**. Deploy mainnet mengikuti gate R3 di roadmap.
- `integrate-html`: di luar scope dan diblokir lewat `permissions.deny`.
- `caveman`, `ponytail`, `graphify`: skill generik dengan batasan masing-masing (mis. `graphify` tidak dipakai untuk kloning URL, hook git, atau penulisan CLAUDE.md tanpa persetujuan).
- Agent `contract-reviewer` dan `riskguard-reviewer` bersifat read-only (Read, Grep, Glob). Jalankan `contract-reviewer` sebelum deploy. Jangan menjalankan agent yang punya izin tulis di luar cakupan tugas.

## 9. Status saat ini
Phase A selesai: branch `dev-rh`, `ElysiaLedger`, rebrand ke Elysia dan $ELYS, default chain mainnet 4663, burn dari CA PM, teks web dan persona Robinhood, harga yang dapat diedit. Belum: deploy kontrak, pembayaran terverifikasi, CA burn, penulisan ulang dokumen dan skill, test DB lokal. Lihat `docs/ELYSIA_IMPLEMENTATION_ROADMAP.md` untuk fase dan gate, `docs/ELYSIA_INFRASTRUCTURE_CHECKLIST.md` untuk infrastruktur, dan catatan progres di `docs/ELYSIA_DECISIONS.md`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
