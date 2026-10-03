# PROGRESS

Dokumen hidup. **Diperbarui oleh agent di akhir setiap task.** Sumber daftar task: `docs/SPEC.md` bagian 11.

**Legenda:** `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai (lint + test lulus, sudah di-commit) · `[!]` terblokir

## Posisi Saat Ini

| | |
|---|---|
| Fase / milestone aktif | Fase 1, Milestone 1A |
| Task berikutnya | 1A.6 |
| Terakhir diperbarui | 2026-10-03 |

---

## Fase 1, Milestone 1A: Inti

- [x] **1A.1** Setup proyek: Next.js, TS, Prisma, Postgres (Docker Compose), Tailwind, shadcn, lint, Vitest
- [x] **1A.2** Skema Prisma + migrasi + seed (3 user, contoh item, contoh pasien)
- [x] **1A.3** Auth + role guard (server-side) + layout per role
- [x] **1A.4** Settings klinik + util audit log
- [x] **1A.5** Master item (layanan & produk), kategori, konversi satuan, master kandang
- [ ] **1A.6** Owner & pasien: CRUD, pencarian, nomor RM, alert alergi/agresif
- [ ] **1A.7** Kunjungan walk-in + halaman "Pasien Hari Ini"
- [ ] **1A.8** Rekam medis: SOAP, vital, diagnosa, lampiran, vaksinasi, finalisasi, addendum, halaman jatuh tempo
- [ ] **1A.9** Resep & tindakan → draft invoice otomatis
- [ ] **1A.10** Inventaris dasar: stok masuk manual, batch, kartu stok, FEFO, blokir expired
- [ ] **1A.11** Kasir: invoice auto/manual/retail, diskon, PPN, pembayaran penuh, kembalian, finalisasi
- [ ] **1A.12** Void invoice (Admin) + restock
- [ ] **1A.13** Struk thermal 80mm (+58mm via setting)

**Gate 1A:** satu pasien bisa dilayani dari pendaftaran sampai struk, stok berkurang benar.
- [ ] Gate 1A lulus (uji manual alur utama)

## Fase 1, Milestone 1B: Layanan Lanjutan & Dokumen

- [ ] **1B.1** Rawat inap & hotel: check-in, kandang tunggal, layar admission aktif
- [ ] **1B.2** Monitoring harian rawat inap
- [ ] **1B.3** Check-out + hitung hari (BR-15) + item tarif ke invoice
- [ ] **1B.4** DP + pelunasan (BR-9)
- [ ] **1B.5** E-invoice PDF
- [ ] **1B.6** Stok opname
- [ ] **1B.7** Notifikasi stok rendah/hampir expired di dashboard

**Gate 1B:** tagihan menginap benar, DP dan pelunasan benar, e-invoice terunduh.
- [ ] Gate 1B lulus

## Fase 1, Milestone 1C: Penutup

- [ ] **1C.1** Dashboard dasar (omzet hanya Admin)
- [ ] **1C.2** Audit log viewer (Admin)
- [ ] **1C.3** Backup harian + prosedur restore
- [ ] **1C.4** Dokumentasi deploy VPS
- [ ] **1C.5** Uji end-to-end alur utama + perbaikan

**Gate 1C:** semua story Must Fase 1 lulus, backup dan restore teruji.
- [ ] Gate 1C lulus

---

## Fase 2 (jangan mulai sebelum Fase 1 selesai)

- [ ] **2.1** Import data lama (preview, validasi, konfirmasi)
- [ ] **2.2** Laporan lengkap
- [ ] **2.3** Export PDF dan Excel
- [ ] **2.4** Dashboard lanjut
- [ ] **2.5** Tutup kas harian (jika klien setuju)

---

## Keputusan yang Diambil

Catat keputusan teknis atau produk yang muncul selama pengerjaan. Format: `tanggal | task | keputusan | alasan`.

| Tanggal | Task | Keputusan | Alasan |
|---|---|---|---|
| 2026-10-03 | 1A.1 | Package manager: pnpm | Sesuai arahan user |
| 2026-10-03 | 1A.1 | shadcn/ui pakai base Radix UI, preset Nova (Lucide/Geist) | Radix adalah base paling umum/terdokumentasi untuk shadcn; belum ada preferensi khusus dari klien |
| 2026-10-03 | 1A.1 | Prisma CLI dipin ke 7.10.0 (bukan dist-tag `latest` 8.0.0-rc.*) | Dist-tag `latest` npm saat ini adalah release candidate; `@prisma/client` stabil ada di 7.10.0, jadi CLI dan client harus selaras di versi stabil |
| 2026-10-03 | 1A.1 | Hapus folder `.claude/.agents/.windsurf/skills-lock.json` yang dibuat otomatis oleh `prisma init` | Bukan bagian dari stack yang diminta (bloat skill AI vendor), tidak diperlukan |
| 2026-10-03 | 1A.2 | Password hash pakai `bcryptjs` (bukan native `bcrypt`/`argon2`) | Pure JS, tanpa kompilasi native, lebih ringan untuk Docker image |
| 2026-10-03 | 1A.2 | Enum `sex` pasien pakai `JANTAN`/`BETINA` | SPEC tidak menentukan nilai eksak, konsisten dengan istilah domain Indonesia yang dipakai di enum lain |
| 2026-10-03 | 1A.2 | BR-17 (1 kandang = 1 admission AKTIF) dan "qty_on_hand >= 0" ditegakkan via **raw SQL manual** di file migrasi (unique index parsial + CHECK constraint), bukan lewat `schema.prisma` | Prisma belum punya sintaks native untuk partial index & check constraint; ditulis manual supaya aturan bisnis kritis tetap ditegakkan di level DB, bukan hanya aplikasi |
| 2026-10-03 | 1A.2 | Pakai `@prisma/adapter-pg` (driver adapter) di `src/lib/db.ts` | Prisma Client versi baru (7.x) di generator `prisma-client` mewajibkan driver adapter eksplisit, tidak bisa connect langsung dari `DATABASE_URL` tanpa adapter |
| 2026-10-03 | 1A.3 | Auth pakai `next-auth@5.0.0-beta.32` (Auth.js v5) dengan Credentials provider, session JWT 12 jam | Sesuai keputusan SPEC (Auth.js Credentials). Versi beta dipakai karena itu rilis yang mendukung Next.js 16 App Router |
| 2026-10-03 | 1A.3 | Config auth dipecah jadi `auth.config.ts` (edge-safe, tanpa provider/Prisma) + `auth.ts` (provider Credentials + Prisma) | `src/proxy.ts` (middleware) jalan di Edge runtime yang tidak mendukung modul Node dipakai Prisma Client; pola split-config ini adalah pola resmi Auth.js untuk kasus ini |
| 2026-10-03 | 1A.3 | File `middleware.ts` ditulis sebagai `src/proxy.ts` | Next.js 16 me-deprecate konvensi nama `middleware.ts`, menggantinya dengan `proxy.ts` (API sama) |
| 2026-10-03 | 1A.3 | Rate limit login: in-memory `Map` per proses (bukan Redis) | Single instance VPS, volume 3 user (lihat PRD bagian 4). Ditandai `ponytail:` di kode sebagai batas yang disengaja |
| 2026-10-03 | desain | Palet ungu `#533872` + IBM Plex Sans menggantikan teal/biru di SPEC | Keputusan user: ikuti artifact "NOER Vet Clinic — Referensi Desain" (warna dari logo). SPEC diperbarui |
| 2026-10-03 | desain | Alert alergi/agresif berupa tag + baris catatan + peringatan keras saat pilih obat alergi, bukan banner merah | Keputusan user: ikuti desain. PRD US-4, FR-PAT-5, dan AC 1A.6 diperbarui |
| 2026-10-03 | desain | Tanpa "Tersimpan otomatis" (autosave) di rekam medis | Keputusan user |
| 2026-10-03 | desain | Menu "Riwayat Pembayaran" untuk Kasir dibangun (FR-POS-14, US-37), dikerjakan bersama 1A.11, tanpa total/omzet | Keputusan user. BR-7 melarang kasir melihat omzet |
| 2026-10-03 | desain | Peringatan obat alergi hanya informasi: tanpa blokir, tanpa tombol "Tetap tambah…", tanpa audit khusus | Keputusan user: keputusan klinis ada di dokter, sistem hanya menunjukkan |
| 2026-10-03 | 1A.4 | `audit_log.entity_id` diubah dari UUID ke TEXT (migrasi `audit_entity_id_text`) | Settings dikunci per nama key (mis. `taxRate`), bukan UUID. ERD SPEC bagian 8 menulis `uuid entity_id`: tipe kolom ini menyimpang dari ERD |
| 2026-10-03 | 1A.4 | Settings = baris key-value per field; logo & QRIS disimpan sebagai data URL di tabel `settings` (batas 200 KB / 1 MB), bukan file di disk | Tanpa route file ber-auth dan tanpa volume tambahan. Batasnya ditandai `ponytail:`-style di `IMAGE_LIMITS`; pindah ke file disk jika gambar perlu lebih besar. Isi gambar tidak masuk audit log |
| 2026-10-03 | 1A.4 | Default settings: PPN nonaktif (11%, mode Exclude), kertas 80 mm, peringatan expired 90 hari | SPEC/PRD tidak menentukan default aktif/nonaktif dan mode PPN; semuanya bisa diubah Admin di halaman Pengaturan. Konfirmasi ke klien |
| 2026-10-03 | 1A.4 | Menu sidebar hanya memuat halaman yang sudah ada (Beranda, Pengaturan); item baru ditambah di `sidebar-nav.tsx` saat halamannya dibuat | Hindari link mati |
| 2026-10-03 | 1A.4 | Tema ungu + IBM Plex Sans diterapkan di `globals.css`; tinggi tombol/input 44px (aksi final 52px) | Sesuai desain NOER dan syarat target sentuh tablet |
| 2026-10-03 | 1A.11 | Rencana: "diskon total" (level invoice) diisi manual per invoice (persen atau nominal), dipotong sebelum PPN; tambah kolom jenis+nilai diskon invoice. Tarif PPN yang dipakai ikut disimpan di invoice (`tax_rate`) | Permintaan user. Berbeda dari PPN yang global dan otomatis. Asumsi "manual per invoice" belum dikonfirmasi eksplisit |
| 2026-10-03 | 1A.5 | Harga beli diperlakukan per satuan dasar (sama dengan harga jual) | SPEC tidak menyebut satuannya; ini asumsi agar margin = harga jual - harga beli. Konfirmasi ke klien |
| 2026-10-03 | 1A.5 | "Nonaktifkan" item/kandang lewat flag `active`, tanpa tombol hapus; `deleted_at` item belum dipakai | Soft delete (aturan 7). Item aktif saja yang bisa dipilih di kunjungan dan kasir |
| 2026-10-03 | 1A.5 | Jenis item (Layanan/Produk) tidak bisa diubah setelah dibuat | Mengubah jenis merusak item yang sudah dipakai di invoice/stok |
| 2026-10-03 | 1A.5 | Halaman Master Data hanya untuk Admin. Kasir "lihat harga layanan" (SPEC bagian 5) dipenuhi di pencarian item kasir (1A.11), lewat `toItemView` tanpa `buyPrice` | Desain tidak punya menu Master Data untuk kasir |
| 2026-10-03 | 1A.5 | Form memakai `keepValuesOnError` (submit lewat `startTransition`) | React 19 mereset isian form setelah server action; tanpa ini semua isian hilang saat ada error validasi |
| 2026-10-03 | proses | Satu task = satu commit; komentar kode seminim mungkin (baris Komentar di CLAUDE.md) | Instruksi user. 1A.3 dan 1A.4 di-commit bersama karena selesai sebelum aturan ini |
| 2026-10-03 | 1A.3 | Login pakai `username` (huruf kecil, UNIQUE + CHECK `username = lower(username)`), bukan email | Keputusan user. Tidak ada fitur email di sistem; staf hanya 3 orang. Migrasi `email_to_username` memakai RENAME agar data tetap. SPEC (FR-AUTH-1/2, ERD) diperbarui. Login seed: `admin` / `dokter` / `kasir`, password `password123` |
| 2026-10-03 | 1A.3 | FR-AUTH-2 (Admin CRUD user) dan FR-AUTH-3 (ganti password sendiri) **belum dikerjakan** | AC task 1A.3 hanya "matriks bagian 5 lolos tes" (role guard), bukan UI manajemen user. Perlu task/task baru terpisah sebelum go-live |

## Blocker dan Pertanyaan Terbuka

| # | Pertanyaan / blocker | Terkait | Status |
|---|---|---|---|
| 1 | Aturan hitung hari menginap: per malam atau per 24 jam? Jam batas check-out? | 1B.3, BR-15 | Terbuka (default di SPEC dipakai sementara) |
| 2 | Penanganan DP yang lebih besar dari tagihan akhir | 1B.4, BR-9 | Terbuka (default: finalisasi ditolak, Admin koreksi DP) |
| 3 | Lebar printer thermal (58 atau 80mm) | 1A.13 | Terbuka |
| 4 | Ada kewajiban pelaporan/regulasi rekam medis hewan? | Fase 1 | Terbuka |
| 5 | Data klinik: nama, logo, alamat, NPWP, gambar QRIS | 1A.4, 1A.13 | Menunggu klien |
| 6 | Daftar layanan, produk, harga, kandang, stok awal per batch | Seed, go-live | Menunggu klien |

## Log Sesi

Satu baris per sesi. Format: `tanggal | task | hasil | catatan untuk sesi berikutnya`.

| Tanggal | Task | Hasil | Catatan |
|---|---|---|---|
| 2026-10-03 | 1A.1 | Selesai | Setup proyek beres: Next.js+TS+Tailwind+shadcn, Prisma (schema kosong, datasource saja), Postgres via Docker Compose, Vitest. Lint, test, build lulus. Lanjut ke 1A.2 (skema Prisma lengkap + migrasi + seed) di sesi berikutnya |
| 2026-10-03 | 1A.2 | Selesai | Skema Prisma lengkap sesuai ERD bagian 8 (semua model, enum, index wajib). Migrasi diterapkan ke Postgres lokal (docker). Seed: 3 user (admin/dokter/kasir@klinik.test, password `password123`), 1 owner + 1 pasien contoh, 2 item contoh (jasa konsultasi + obat). Lint, test, build lulus. Lanjut ke 1A.3 (Auth + role guard) di sesi berikutnya |
| 2026-10-03 | 1A.3 | Selesai | Auth.js Credentials + bcrypt + session JWT 12 jam + rate limit login (in-memory). Matriks peran bagian 5 dikodekan di `src/lib/permissions.ts` dan diuji penuh (53 assertion) di `permissions.test.ts`, independen dari implementasi. `requireUser`/`requireCapability` untuk guard server-side (BR-11). Layout per role: halaman `/` menampilkan menu sesuai capability masing-masing role. Diverifikasi manual lewat curl: login admin/kasir, menu termuat sesuai matriks, logout menghapus sesi, rate limit blokir setelah 5 percobaan gagal (termasuk saat password benar, selama window 15 menit). Lint, test, build lulus. **Belum dikerjakan**: CRUD user (FR-AUTH-2), ganti password sendiri (FR-AUTH-3) — di luar AC task ini. Lanjut ke 1A.4 (Settings klinik + util audit log) di sesi berikutnya |
| 2026-10-03 | 1A.4 | Selesai | Util `logAudit(tx, …)` (ikut transaksi pemanggil, BR-12). Halaman `/pengaturan` (Admin saja, dicek di page dan server action): data klinik, logo, footer struk, kertas 58/80, QRIS, PPN (aktif, tarif integer, mode), hari peringatan expired. Hanya key yang berubah yang disimpan, masing-masing diaudit dengan nilai sebelum/sesudah. Layout sidebar + tema desain NOER, login disesuaikan desain, logo NOER di `public/logo-noer.png`. Test: 66 lulus (skema, diff, audit value, validasi gambar). Diuji di browser: login admin, simpan, audit log tercatat, kasir ditolak (`/forbidden`) dan tidak melihat menu Pengaturan. Perbaikan di jalan: `proxy.ts` sempat mengalihkan `/logo-noer.png` ke login. Belum: audit harga & stok (menyusul di 1A.5 dan 1A.10 memakai `logAudit`), tombol tampil/sembunyi password di login. Lanjut ke 1A.5 |
| 2026-10-03 | 1A.5 | Selesai | Halaman `/master-data/item` (daftar, cari, filter jenis, tambah, ubah) dan `/master-data/kandang`. Validasi zod: kategori sesuai jenis, harga integer, SKU/barcode unik. `toItemView` menyaring `buyPrice` untuk Kasir/Dokter (BR-7), diuji. Tambah/ubah item masuk audit log (nilai sebelum/sesudah). Test: 81 lulus. Diuji di browser: tambah item, SKU duplikat ditolak (isian tetap ada), ubah harga tercatat di audit; kasir diarahkan ke `/forbidden`. Nama kandang duplikat ditolak (diuji lewat skrip). Belum: kandang tidak diaudit (bukan daftar audit FR-SYS-1); menonaktifkan kandang belum memeriksa admission aktif (menunggu 1B.1). Lanjut ke 1A.6 |

## Perintah Proyek

| Keperluan | Perintah |
|---|---|
| Dev server | `pnpm dev` |
| Lint | `pnpm lint` |
| Test | `pnpm test` |
| Build | `pnpm build` |
| DB (Docker) | `docker compose up -d` / `docker compose down` |
| Migrasi | `pnpm prisma:migrate` |
| Seed | `pnpm prisma:seed` |
| Prisma Studio | `pnpm prisma:studio` |
