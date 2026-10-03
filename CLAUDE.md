# CLAUDE.md

Sistem POS + Practice Management untuk **1 klinik hewan** (single-tenant). Web app, UI Bahasa Indonesia, mata uang IDR.

## Wajib dibaca sebelum mengerjakan apa pun

| File | Isi | Kapan dibaca |
|---|---|---|
| `docs/PRD.md` | Scope, prioritas, user story, acceptance criteria | Awal setiap sesi |
| `docs/SPEC.md` | Aturan bisnis, ERD, user flow, task breakdown | Awal setiap sesi, lalu rujuk bagian yang relevan |
| `docs/PROGRESS.md` | Status task, keputusan, blocker | **Pertama**, untuk tahu posisi terakhir |

**Hierarki otoritas:** PRD menang untuk scope dan prioritas. SPEC menang untuk detail teknis. Jika ada konflik atau hal yang tidak jelas, **tanyakan, jangan menebak**.

## Stack

Next.js (App Router) + TypeScript, PostgreSQL, Prisma, Auth.js (Credentials), Tailwind + shadcn/ui, Zod, Vitest, `@react-pdf/renderer`. Deploy: Docker Compose di VPS.

## Cara kerja

1. Buka `docs/PROGRESS.md`, ambil task berikutnya yang belum selesai (urut dari atas). **Satu task per sesi.**
2. Baca task tersebut di `docs/SPEC.md` bagian 11, plus FR/BR yang terkait.
3. Tulis rencana singkat sebelum coding: file yang dibuat/diubah dan asumsi. Tanyakan jika ada ambiguitas.
4. Implementasi + unit test untuk logika bisnis.
5. Jalankan lint dan test. Semua harus lulus.
6. Perbarui `docs/PROGRESS.md` (centang task, catat keputusan atau blocker).
7. Ringkas ke user: apa yang dikerjakan, cara menjalankan, cara verifikasi manual, apa yang belum selesai.

## Aturan keras (jangan dilanggar)

| # | Aturan |
|---|---|
| 1 | **Uang = integer Rupiah.** Dilarang `float`/`number` desimal untuk uang |
| 2 | **Otorisasi dicek di server** untuk setiap route/action. Menyembunyikan menu di UI tidak cukup |
| 3 | **Kasir tidak boleh menerima** harga beli, margin, atau omzet di response API |
| 4 | Invoice + stok + pembayaran dalam **satu transaksi DB** (`prisma.$transaction`) |
| 5 | Stok berkurang saat invoice **FINAL**, alokasi **FEFO**, batch expired **tidak boleh dijual** |
| 6 | Rekam medis final **tidak bisa diedit**. Koreksi lewat addendum |
| 7 | Data transaksional **tidak di-hard-delete**. Master data pakai soft delete |
| 8 | Invoice menyimpan **snapshot** nama, harga jual, harga beli per item |
| 9 | Perubahan sensitif (harga, stok, void, diskon, DP, finalisasi, user, settings) **wajib masuk audit log** |
| 10 | Simpan waktu dalam UTC, tampilkan `Asia/Jakarta` |

## Di luar scope (jangan dibangun)

Antrean/nomor antrean, booking, refund, bundling/paket, cicilan, supplier & PO, WhatsApp (API maupun `wa.me`), kartu vaksin & surat sehat, QRIS dinamis, PIN kasir, multi-cabang, mode offline, portal pemilik.

Fase 2 (import data lama, laporan, export, dashboard lanjut, tutup kas) **tidak dikerjakan** sebelum seluruh Fase 1 selesai.

## Konvensi

| Area | Konvensi |
|---|---|
| Bahasa | UI dan pesan error: **Bahasa Indonesia**. Kode, nama variabel, nama tabel/kolom: **Inggris**. (Istilah domain medis boleh Indonesia jika lebih jelas, konsisten dengan SPEC) |
| Validasi | Zod di client dan server. Satu skema dipakai bersama |
| Test | Vitest. Logika bisnis wajib ada test (daftar di SPEC bagian 10) |
| Commit | Conventional Commits, mis. `feat(pos): add DP payment rules`. Satu task = satu atau beberapa commit kecil |
| Komentar | Seminim mungkin: hanya alasan yang tidak jelas dari kode, satu baris. Jangan menjelaskan apa yang dilakukan kode |
| Format | Lint + formatter dari setup 1A.1 harus lulus sebelum commit |
| Migrasi | Semua perubahan skema lewat migrasi Prisma. Jangan edit DB manual |
| Secret | Jangan commit `.env`. Sediakan `.env.example` |

## Perintah

```bash
# dev server
pnpm dev

# lint
pnpm lint

# test
pnpm test

# database (docker)
docker compose up -d
docker compose down

# migrasi
pnpm prisma:migrate

# seed
pnpm prisma:seed

# uji alur utama (menghapus data transaksi di DB dev)
pnpm e2e

# prisma studio
pnpm prisma:studio

# backup / restore (ke DB baru), deploy: docs/DEPLOY.md
scripts/backup.sh
scripts/restore.sh <folder-backup> <nama-db>
```

## Next.js

Versi ini punya perubahan besar dari yang umum dikenal. Sebelum menulis kode Next.js, baca panduan yang relevan di `node_modules/next/dist/docs/` dan perhatikan notifikasi deprecation.

## Jika ragu

- Scope: tanya, jangan tambah fitur "sekalian".
- Aturan bisnis tidak tercakup di SPEC: tanya, jangan menebak.
- Permintaan yang bertentangan dengan dokumen: sampaikan konfliknya, tunggu keputusan.
