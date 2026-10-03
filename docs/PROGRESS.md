# PROGRESS

Dokumen hidup. **Diperbarui oleh agent di akhir setiap task.** Sumber daftar task: `docs/SPEC.md` bagian 11.

**Legenda:** `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai (lint + test lulus, sudah di-commit) · `[!]` terblokir

## Posisi Saat Ini

| | |
|---|---|
| Fase / milestone aktif | Fase 1, Milestone 1A |
| Task berikutnya | 1A.3 |
| Terakhir diperbarui | 2026-10-03 |

---

## Fase 1, Milestone 1A: Inti

- [x] **1A.1** Setup proyek: Next.js, TS, Prisma, Postgres (Docker Compose), Tailwind, shadcn, lint, Vitest
- [x] **1A.2** Skema Prisma + migrasi + seed (3 user, contoh item, contoh pasien)
- [ ] **1A.3** Auth + role guard (server-side) + layout per role
- [ ] **1A.4** Settings klinik + util audit log
- [ ] **1A.5** Master item (layanan & produk), kategori, konversi satuan, master kandang
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
