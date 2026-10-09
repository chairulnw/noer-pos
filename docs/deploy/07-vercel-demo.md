# Opsi D · Vercel + Neon (hanya uji coba / demo)

> **Branch `vercel` hanya untuk uji coba dan demo pribadi. Jangan di-merge ke `main`** (main dipakai deploy Docker di PC/VPS).
> Paket **Hobby (gratis) Vercel hanya untuk penggunaan non-komersial pribadi**. Memakainya untuk transaksi klinik sungguhan melanggar ketentuan Vercel; untuk itu pakai paket Pro, atau [Opsi A/C](README.md).

Aplikasi ini satu proyek Next.js: "backend" (server action dan API route) otomatis berjalan sebagai fungsi serverless di Vercel, tidak ada server terpisah. Yang perlu disediakan terpisah hanya database dan penyimpanan file.

| Bagian | Layanan | Paket gratis (per halaman penyedia, 2026) |
|---|---|---|
| Aplikasi + backend | Vercel Hobby | 1 juta pemanggilan fungsi, 100 GB transfer, 4 jam CPU aktif per bulan |
| Database PostgreSQL | **Neon** (lewat Vercel Marketplace; Vercel Postgres sudah tidak ada) | 1 GB per proyek, 100 CU-jam, tidur otomatis setelah 5 menit idle, riwayat pemulihan 6 jam |
| File upload (logo, QRIS, lampiran, foto) | Vercel Blob | 1 GB |

## Yang diubah di branch ini

- `src/lib/uploads.ts`: bila `BLOB_READ_WRITE_TOKEN` ada, file disimpan di Vercel Blob (private); tanpa itu tetap ke folder `UPLOAD_DIR` seperti biasa.
- `src/lib/auth.ts` + tabel `login_throttle`: batas 10 kali gagal login per 15 menit kini disimpan di database (versi memori tidak jalan di serverless).
- `src/lib/db.ts`: ukuran pool koneksi bisa diatur (`DATABASE_POOL_MAX`).
- `next.config.ts`: tanpa `standalone` di Vercel; batas body server action 4 MB (batas platform Vercel 4,5 MB).
- `vercel.json` + skrip `vercel-build`: generate Prisma, migrasi database, build. Region `sin1` (Singapura).
- `.github/workflows/ci.yml`: CI juga jalan untuk branch `vercel`.

## Langkah

1. **Vercel**: login di vercel.com dengan GitHub, **Add New → Project**, pilih repo `noer-pos`. Di **Settings → Git**, set **Production Branch = `vercel`**.
2. **Database**: tab **Storage → Create → Neon (Marketplace)**, hubungkan ke proyek. Variabel `DATABASE_URL` (pooled) dan `DATABASE_URL_UNPOOLED` terisi otomatis. Migrasi memakai yang unpooled.
3. **File**: **Storage → Create → Blob**, pilih akses **Private**. `BLOB_READ_WRITE_TOKEN` terisi otomatis.
4. **Environment Variables** (Settings → Environment Variables):
   - `AUTH_SECRET` = hasil `openssl rand -base64 32`
   - `AUTH_URL` = `https://<nama-proyek>.vercel.app`
   - `AUTH_TRUST_HOST` = `true`
   - `ENABLE_EXPERIMENTAL_COREPACK` = `1` (lockfile memakai pnpm 12)
   - `DATABASE_POOL_MAX` = `5`
5. **Deploy**: push ke branch `vercel` (atau tombol Redeploy). Migrasi berjalan otomatis saat build.
6. **Buat admin** (dari PC ini, memakai URL database *unpooled* dari Vercel; jangan pakai `prisma db seed` di URL publik karena password contohnya umum):
   ```powershell
   docker compose run --rm -e DATABASE_URL="<DATABASE_URL_UNPOOLED>" -e ADMIN_USERNAME=owner -e ADMIN_NAME="Nama" -e ADMIN_PASSWORD="<password kuat>" tools pnpm tsx scripts/create-admin.ts
   ```
7. **Isi produk** (opsional): `docker compose run --rm -e DATABASE_URL="<DATABASE_URL_UNPOOLED>" -v C:\pos-ops\import:/import:ro tools pnpm tsx scripts/import-items.ts /import/master-item.csv --source F1 --apply`

## Batas yang perlu diketahui

- **Upload maksimal sekitar 4 MB** per file (batas body fungsi Vercel). Foto besar harus dikompres.
- **Neon tidur setelah 5 menit idle**: permintaan pertama setelah itu terasa lambat beberapa detik.
- **Pemulihan hanya 6 jam** di paket gratis. Backup manual: `pg_dump` dari URL unpooled secara berkala.
- **Log runtime Hobby hanya disimpan 1 jam.**
- Data ada di luar Indonesia (region Singapura).
- Pembatas login membaca IP dari `x-forwarded-for`, yang di Vercel diisi oleh platform, jadi tidak bisa dipalsukan klien. Biarkan `TRUST_CLOUDFLARE` kosong.
