# ELYSIA — Gatekeeper of Elysium · Instruksi Claude Code

Dokumen ini adalah pintu masuk instruksi proyek **ELYSIA**. Isinya ringkas dan menunjuk ke dokumen ELYSIA di `docs/`; jangan menyalin seluruh isi dokumen itu ke sini. Semua perintah bash diberi komentar direktori, contoh: `# Jalankan di: ROOT/contracts` (`ROOT` = folder tempat Claude Code dijalankan).

## 1. Identitas proyek
- Nama: **ELYSIA**, penjaga gerbang ekosistem Elysium. Menilai peluncuran token, mencatat penilaian on-chain (commit) sebelum publikasi, dan menyediakan bukti yang dapat diverifikasi.
- ELYSIA adalah **proyek independen** yang dikembangkan dari basis kode NEXA. **NEXA tetap proyek terpisah** (Robinhood Chain, Stock Token, Pons V2).
- ELYSIA **bukan** rebranding sederhana: tidak semua fitur, modul, atau keputusan NEXA dibawa.
- Repository ini berasal dari **salinan kode NEXA**: sebagian besar source, config, skill, dan agent masih berisi nama dan logika NEXA (perlakukan sebagai **referensi historis**, bukan instruksi). Dokumen operasional NEXA (BLOCKERS, DECISIONS, PROGRESS, brief, ELYSIUM-PLAN, report, infrastruktur, wallet, audit, html-design) sudah diarsipkan **di luar repository** (`d:\.PROJECT\Elysia-NEXA-archive`) dan tidak boleh dimasukkan kembali. `README.md` sudah ditulis ulang untuk ELYSIA.

## 2. Sumber kebenaran (urutan prioritas)
1. Keputusan Head Dev yang berstatus **FINAL** di `docs/ELYSIA_DECISIONS.md`.
2. `docs/ELYSIA_BRIEF.md`.
3. `docs/ELYSIA_WORKING_CONTEXT.md` (baca ini dulu di setiap sesi).
4. Dokumen ELYSIA lain: `ELYSIA_ARCHITECTURE.md`, `ELYSIA_MIGRATION_PLAN.md`, `ELYSIA_SMART_CONTRACT_PLAN.md`, `ELYSIA_DATABASE_OPTIMIZATION.md`, `ELYSIA_IMPLEMENTATION_ROADMAP.md`, `ELYSIA_INFRASTRUCTURE_CHECKLIST.md`, dan `ELYSIA_BLOCKERS.md`.

Aturan:
- Konflik dengan dokumen NEXA: jangan otomatis mengikuti NEXA. Catat konfliknya dan tanyakan.
- Brief memuat hal yang sudah ditunda oleh keputusan Head Dev (token Solana, tahap mainnet). Keputusan Head Dev menang atas brief; jangan implementasikan bagian brief yang ditunda.
- Keputusan **PENDING** di `ELYSIA_DECISIONS.md` **bukan keputusan final**. Sebelum implementasi yang bergantung padanya, ajukan pertanyaan. Contoh yang masih PENDING: skema hash commit-reveal untuk ELYSIA, jalur Gate Report on-chain, `ElysiaLedger` kontrak baru vs rename, definisi "menang", penolakan alamat sama antar peran, nama final/handle, penghapusan modul NEXA, aturan umur token (< 1 jam), dan aturan URL di post.
- Jangan mengarang requirement di luar brief dan keputusan tercatat.

## 3. Chain dan smart contract
- Target smart contract: **Elysium Testnet, Chain ID 99801**. Hanya itu.
- Dilarang: menambah chain lain, integrasi Solana, mengaktifkan integrasi Robinhood Chain, bridge, atau arsitektur multichain.
- Token ELYSIA di Solana **ditunda**, bukan bagian roadmap aktif; hanya boleh dibahas sebagai catatan masa depan.
- Pekerjaan mainnet hanya evaluasi (readiness) dan butuh persetujuan baru. Precompile HyperCore tidak boleh diasumsikan tersedia.
- Jangan menghapus library EVM (viem, Foundry, OpenZeppelin) hanya karena berasal dari NEXA.
- Jangan broadcast transaksi apa pun, termasuk deploy, tanpa persetujuan eksplisit. Perintah yang butuh password keystore dijalankan manusia.

## 4. Model layanan dan wallet
ELYSIA adalah **layanan gratis**.
- Hanya **tiga wallet operasional baru**, dengan tiga private key berbeda: **Deployer** (deploy dan admin kontrak), **Agent** (commit/reveal/atestasi), **Keeper** (operasi oracle/feed).
- Tidak ada Treasury, Pro/subscription, payment gateway, USDG, Ask/Signals berbayar, sponsor berbayar, BurnVault, FeeSplitter, CreatorFeeSplitter, ProtocolFeeSplitter, atau burn token.
- Dilarang memakai wallet, alamat operasional, private key, atau kredensial NEXA, termasuk alamat lama NEXA (file `packages/contracts-abi/addresses/*.json` sudah dikosongkan dan tidak boleh diisi ulang dengan alamat NEXA).
- Private key tidak pernah dibuat, diminta, ditampilkan, atau ditulis oleh Claude (repo, `.env`, log, chat, `docs/`). Wallet dibuat manusia; Claude hanya memakai alamat publik yang diberikan.
- Wallet dan kredensial ELYSIA belum ada; lihat `docs/ELYSIA_BLOCKERS.md`.

## 5. Batasan pengembangan
- Jangan global replace "NEXA" menjadi "ELYSIA" tanpa audit dampak (kopling tinggi: worker, api, api-client, web, ABI).
- Jangan menghapus tabel, migrasi, source code, dependency, atau modul sebelum ada keputusan dan persetujuan. Mengeluarkan fitur dari desain ELYSIA berbeda dari menghapus file/tabel; klasifikasi ada di `ELYSIA_MIGRATION_PLAN.md`.
- Jangan mengubah integrasi cloud NEXA menjadi integrasi ELYSIA secara otomatis. Jangan memakai X, Telegram, LLM, atau layanan NEXA lain.
- **Kebijakan infrastruktur (FINAL, `ELYSIA_DECISIONS.md`):**
  - Akun GitHub dan akun Vercel boleh sama dengan akun yang sudah dipakai developer.
  - Repository ELYSIA wajib **baru, private, di GitHub Organization** yang akan dibuat developer. Project Vercel wajib baru. Supabase dan Railway wajib **project baru** khusus ELYSIA.
  - Dilarang memakai repository, project, database, environment variables, secrets, atau deployment target NEXA, di mana pun ia muncul (CLI yang tertaut, `supabase/.temp`, file konfigurasi, riwayat).
  - Jangan membuat repository, project, database, domain, atau layanan eksternal, dan jangan menghubungkan ke resource eksternal, sebelum ada **permintaan eksplisit developer**.
  - **Login ke akun yang benar tidak berarti target project sudah benar**: verifikasi nama project/ref/org target pada tiap perintah cloud sebelum menjalankannya, dan berhenti bila ragu (`ELYSIA_BLOCKERS.md` EB-01).
- Jangan commit/push tanpa persetujuan. `.claude/settings.json` mewajibkan konfirmasi untuk operasi eksternal (`git push`, `gh`/Vercel/Supabase/Railway yang mengubah resource, `forge script`, pemeriksaan jaringan seperti `cast call`) dan menolak (deny) force push, `forge create`, `cast send`, `cast publish`, serta perintah ber-`--broadcast` selama Planning. Aturan `Read` melindungi file `.env`, folder rahasia NEXA, dan folder autentikasi CLI dari tool Read, tetapi **bukan isolasi menyeluruh**: akses lewat Bash atau PowerShell tidak dijamin terblokir, jadi jangan membaca atau memakai rahasia NEXA dengan cara apa pun. Aturan ini adalah pagar pengaman, bukan jaminan: jangan menghindarinya lewat perintah setara (jalur absolut, `sh -c`, `npx`, dan sebagainya), dan broadcast tetap butuh persetujuan eksplisit developer.
- Pertahankan RiskGuard **fail-closed**: setiap post lewat RiskGuard berbasis kode (bukan AI); data tidak lengkap berarti "tidak tahu"; tanpa ajakan beli/jual, tanpa price target (berasal dari brief). ELYSIA tidak membahas atau mempromosikan token miliknya sendiri.
- **PENDING (menunggu persetujuan developer, jangan ditetapkan sendiri):** (a) aturan umur token, termasuk token berumur < 1 jam: jangan menganggapnya otomatis dilarang dan jangan menganggapnya otomatis boleh dipublikasikan; (b) aturan URL di post: jangan menganggap post wajib memiliki URL atau wajib tanpa URL. Rincian klasifikasi aturan RiskGuard ada di `.claude/skills/riskguard-rule/SKILL.md`.
- Jangan mengorbankan integritas bukti: hash commit sebelum publikasi, tx hash tersimpan, salt/preimage terenkripsi dan tidak pernah di log, histori Gate Report tidak dihapus otomatis.
- Aturan pipeline: AI → RiskGuard → commit terkonfirmasi → antrian persetujuan manusia → post. Mode X `dry` sampai ada izin eksplisit untuk `live`. Balasan di X manual, tanpa auto-reply.
- Jangan klaim afiliasi resmi dengan Elysium atau Kinetiq. Konten publik **berbahasa Inggris** dan wajib memuat: "Not affiliated with Kinetiq or Elysium".
- Logo dan aset brand ELYSIA belum ada: tandai pending; jangan memakai aset NEXA atau membuat placeholder.
- Pilihan teknis di luar brief dan keputusan tercatat ditandai **[di luar brief]** dan dicatat di `docs/ELYSIA_DECISIONS.md` (status PENDING sampai disetujui). Jangan menulis ke `docs/DECISIONS.md` atau `docs/BLOCKERS.md` (itu dokumentasi NEXA).

## 6. Aturan keselamatan perubahan
Sebelum perubahan yang berpotensi merusak atau sulit dibatalkan:
1. Periksa file dan dependensi terkait (gunakan Graphify, lalu verifikasi ke source).
2. Jelaskan dampaknya.
3. Identifikasi keputusan PENDING yang terkait.
4. Minta persetujuan bila di luar keputusan yang sudah disetujui.

Tanpa persetujuan eksplisit, jangan: deploy, mengirim transaksi wallet, menghapus data, migrasi destruktif, mengubah layanan eksternal, force-push, atau menjalankan perintah yang membaca secret.

## 7. Konvensi kerja
- TypeScript strict; input eksternal divalidasi zod; uang dan harga `bigint` dengan desimal eksplisit; waktu UTC; rahasia hanya di `.env` (jangan di repo); perbarui `.env.example` bila ada variabel baru.
- Salt, API key, dan private key tidak pernah di log.
- Bahasa: komunikasi dan dokumen planning dalam Bahasa Indonesia; kode, komentar, nama, log developer, commit message, branch, dan PR dalam Bahasa Inggris (Conventional Commits). Konten publik ELYSIA dalam Bahasa Inggris.
- **Kebijakan Git (permanen):**
  - Commit message: hanya Bahasa Inggris dan Conventional Commits (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`, `perf`, `style`, `revert`), subjek maksimal 100 karakter.
  - Dilarang menambahkan `Co-Authored-By`, atribusi AI, atau "Generated with Claude" ke commit message, PR, atau file mana pun.
  - `.githooks/commit-msg` memvalidasi dan **menolak** pesan yang tidak valid; hook tidak pernah menulis ulang pesan. Hook aktif lewat `core.hooksPath=.githooks` (diatur otomatis oleh `pnpm install` lewat script `prepare`).
  - Push hanya ke `origin/main` repository ELYSIA (`ElysiaSealed/Elysia`), lewat `pnpm push`. `.githooks/pre-push` menolak force push, branch lain, hapus branch, dan working tree yang kotor, lalu menjalankan typecheck, production build, test non-DB, dan `forge test`.
  - Branch `dev-rh` (Elysia untuk Robinhood Chain, arahan Head Dev): hanya bila pengguna menulis "push dev-rh", jalankan `pnpm push:dev-rh` (`git push origin dev-rh`) dan hanya itu. "push" biasa tetap `pnpm push` ke `main`. Hook mengizinkan hanya `main -> main` dan `dev-rh -> dev-rh`; pemeriksaan lain tidak berubah. Persetujuan eksplisit tetap diperlukan untuk tiap push.
  - Test DB hanya berjalan bila `TEST_DATABASE_URL` diset eksplisit ke DB lokal ELYSIA bernama `elysia_test` (tanpa kata NEXA); tidak ada fallback ke DB lain. Tanpa itu, test DB dilaporkan **belum dijalankan**, bukan lolos.
  - Dilarang memakai `--no-verify`, mengubah atau menonaktifkan hook, dan memakai `git push` langsung untuk menghindari hook. Hook tidak pernah membuat commit dan tidak pernah men-deploy.
  - Commit dan push tetap hanya atas persetujuan eksplisit pengguna (lihat bagian 5 dan 6).
- Task gagal 3 kali dengan pendekatan berbeda: catat di `docs/ELYSIA_BLOCKERS.md` dan lanjut task lain.

## 8. Skill dan agent
Skill di `.claude/skills/` dan agent di `.claude/agents/` awalnya berasal dari NEXA. Status saat ini (hasil audit dan adaptasi 2026-11-12):
- **Sudah diadaptasi untuk ELYSIA:** `commit-reveal`, `contract-change`, `riskguard-rule`, `new-endpoint`, `post-pipeline`, `progress-log`, dan `deploy-contracts`. Sebagian aturan di dalamnya masih PENDING (lihat `ELYSIA_DECISIONS.md`); skill tidak menetapkannya.
- **`deploy-contracts` dinonaktifkan selama Planning:** hanya panduan keselamatan, bukan izin deployment.
- **`integrate-html` di luar scope ELYSIA dan diblokir** lewat `permissions.deny` di `.claude/settings.json`. Isi skill tidak diadaptasi dan filenya dipertahankan sebagai referensi historis.
- **`caveman`, `ponytail`, `graphify`:** skill generik, tetap dipakai dengan batasan masing-masing (mis. `graphify` tidak dipakai untuk kloning URL, hook git, atau penulisan CLAUDE.md tanpa persetujuan).
- **Agent `contract-reviewer` dan `riskguard-reviewer`:** sudah diadaptasi dan bersifat read-only (Read, Grep, Glob).

Baca skill yang relevan saat tugas membutuhkannya, ikuti hanya bagian yang tidak bertentangan dengan dokumen ini, dan jangan menganggap skill otomatis cocok atau berizin. Jangan menjalankan agent yang punya izin tulis di luar cakupan tugas. Jangan menyalin isi skill ke dokumen ini.

## 9. Status saat ini
Tahap planning selesai; implementasi belum dimulai. Lihat `docs/ELYSIA_IMPLEMENTATION_ROADMAP.md` untuk fase dan approval gate, dan `docs/ELYSIA_WORKING_CONTEXT.md` untuk ringkasan.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
