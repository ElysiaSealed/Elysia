---
name: riskguard-rule
description: Dipakai saat diminta menambah atau mengubah aturan konten RiskGuard ELYSIA. Memisahkan aturan FINAL, PENDING, dan rekomendasi keamanan, lalu mengatur cara menulis aturan dan test fail-closed. Tidak mengubah RiskGuard tanpa persetujuan developer.
---
# riskguard-rule (ELYSIA)

Skill ini untuk RiskGuard **ELYSIA**. Kode di `packages/riskguard` masih **warisan NEXA** (aturan `$NEXA`, tipe konten `burn_report`/`sponsored`/`mention_reply`, bahasa ID dan EN, disclaimer NEXA). Aturan itu **bukan** otomatis aturan ELYSIA. Nama package `@elysia/riskguard` bukan identitas final package ELYSIA; baca nama sebenarnya dari `packages/riskguard/package.json` dan jangan mengasumsikannya.

Sumber kebenaran: `CLAUDE.md`, `docs/ELYSIA_BRIEF.md`, `docs/ELYSIA_DECISIONS.md` (FINAL/PENDING), `docs/ELYSIA_WORKING_CONTEXT.md`, `docs/ELYSIA_BLOCKERS.md`. Reviewer: agent `riskguard-reviewer` (read-only). Konflik dengan NEXA: ikuti ELYSIA.

## 0. Gerbang
- Aturan RiskGuard **tidak diubah otomatis**. Perubahan hanya atas permintaan eksplisit developer. Menemukan celah (mis. dari `riskguard-reviewer`) bukan izin untuk menulis aturan baru: laporkan celahnya, lalu tunggu persetujuan.
- Sebelum mengubah, klasifikasikan setiap aturan yang disentuh (lihat bagian 1) dan tulis klasifikasinya di penjelasan. Jangan menuliskan aturan PENDING seolah-olah final.
- Jangan membuat keputusan kebijakan sendiri (ambang, batas, cakupan). Tanyakan.

## 1. Klasifikasi aturan
**Prinsip keamanan (berlaku selalu):**
- **Fail-closed:** konten atau data yang tidak dapat diverifikasi tidak boleh lolos sebagai aman. Input tak dikenal, data tidak lengkap, atau hasil tool kosong/gagal diblokir, atau menghasilkan jawaban "tidak tahu", tidak pernah lolos diam-diam.
- Setiap angka, alamat, dan klaim di Gate Report harus dapat ditelusuri ke sumber yang jelas (indexer/oracle/tx); tidak ada data, hasil pemeriksaan, atau klaim keamanan yang dikarang.
- Salt, preimage, private key, dan kredensial tidak pernah muncul di log, teks, atau test. Log keputusan hanya menyimpan hash konten, bukan teks.
- Input tak tepercaya (nama/simbol token, teks mention) tidak diteruskan ke LLM tanpa sanitasi.
- Output: `{ allowed, reasons[], requiresApproval }`; setiap keputusan dicatat di log. (Bentuk ini dari kode NEXA yang ada; konfirmasi sebelum mengandalkannya.)

**Kebijakan yang sudah tercatat (FINAL di `ELYSIA_DECISIONS.md`):**
- Konten publik berbahasa Inggris.
- Disclaimer wajib **"Not affiliated with Kinetiq or Elysium"**, dan tidak boleh mengklaim afiliasi resmi dengan Kinetiq atau Elysium.

**Berasal dari brief, belum tercatat sebagai keputusan FINAL di `ELYSIA_DECISIONS.md`** (perlakukan sebagai tujuan kebijakan; konfirmasi bentuk penerapannya sebelum menulis aturan):
- Tidak ada instruksi beli/jual dan tidak ada target harga.
- Tidak mempromosikan token milik sendiri dari akun agent.
- Promosi berbayar wajib berlabel "Sponsored" jika kebijakan itu tetap berlaku (ELYSIA gratis dan tidak punya alur sponsor; rinciannya PENDING).

**PENDING: jangan ditetapkan sendiri** (tanyakan ke developer):
- Batas umur token, termasuk aturan token berumur < 1 jam (brief menyebut ≥ 1 jam; cakupan dan penegakannya belum diputuskan).
- Apakah URL di post wajib dilarang atau opsional (aturan NEXA berasal dari biaya X API milik NEXA).
- Lokasi dan cakupan disclaimer: bio/profil (brief) atau seluruh konten publik.
- Aturan Sponsored yang terperinci.
- Kebijakan ticker dan promosi token milik sendiri (nama final dan ticker belum ada).
- Ambang skor, threshold, dan aturan deteksi yang belum disetujui.
- Set tipe konten ELYSIA (mis. `gate_report`, `graduation_watch`) dan kebijakan disclaimer keuangan ("not financial advice") selain disclaimer afiliasi.

**Warisan NEXA (bukan aturan aktif ELYSIA):** aturan `$NEXA` (harga/ajakan/sebutan token NEXA), tipe `burn_report`, `technical_announcement` untuk NEXA, `mention_reply` (ELYSIA membalas manual, tanpa auto-reply), disclaimer "bukan nasihat keuangan"/"NFA", `approvalMode` default dan jendela 30 hari persetujuan NEXA, pesan "NEXA does not guess", dan bahasa ID sebagai bahasa utama. Tandai sebagai warisan atau PENDING; jangan dibawa tanpa keputusan.

**Rekomendasi keamanan (bukan keputusan):** celah dari red-team atau tinjauan dilaporkan sebagai rekomendasi. Jangan mengubahnya menjadi aturan tanpa persetujuan.

## 2. Menulis aturan (setelah disetujui)
1. Tentukan klasifikasi dan sumbernya (FINAL, brief, atau PENDING yang baru disetujui) dan catat di penjelasan perubahan; jangan mengubah dokumen keputusan.
2. Pertahankan pola yang masih relevan: normalisasi teks (spasi/simbol sisipan, homoglyph, leet, zero-width, huruf berulang) lalu pencocokan; aturan tertutup (fail-closed) sebagai default.
3. **Test untuk setiap aturan:** kasus **lolos** dan kasus **diblokir**, **Inggris dahulu**; Indonesia hanya untuk regresi aturan lama. Tambah kasus evasi (spasi, simbol, homoglyph, zero-width). Tambah kasus fail-closed (data kosong/tidak lengkap).
4. **Jangan memasukkan test yang sengaja gagal** ke suite utama (itu menghentikan `pnpm test` dan hook `pre-push`). Celah yang belum diperbaiki dilaporkan sebagai teks.
5. Jalankan test lokal saja:
   ```bash
   # Jalankan di: ROOT/packages/riskguard
   pnpm exec vitest run
   ```
   atau `pnpm test` dari ROOT. Tidak ada perintah yang menghubungkan ke layanan eksternal.
6. Minta tinjauan agent `riskguard-reviewer` (read-only); bawa temuannya ke developer. Jangan menerapkan perbaikan otomatis.

## 3. Selesai bila
- Aturan diklasifikasikan dan sumbernya jelas; tidak ada PENDING yang ditetapkan diam-diam.
- Test lolos dan test blokir ada (Inggris dahulu), termasuk evasi dan fail-closed.
- Test hijau; tidak ada test gagal di suite utama.
- Tidak ada salt, preimage, key, atau kredensial di kode, log, atau test.
- Developer menyetujui perubahan aturan.

## Referensi historis NEXA (bukan aturan aktif)
Versi lama skill ini mewajibkan test ID dan EN dan "sinkron dengan CLAUDE.md bagian 9" (bagian itu milik CLAUDE.md NEXA dan sudah tidak ada). Perintah lama `pnpm --filter @elysia/riskguard test` mengikuti nama package NEXA dan tidak dipakai lagi sebagai acuan.
