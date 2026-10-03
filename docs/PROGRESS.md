# PROGRESS

Dokumen hidup. **Diperbarui oleh agent di akhir setiap task.** Sumber daftar task: `docs/SPEC.md` bagian 11.

**Legenda:** `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai (lint + test lulus, sudah di-commit) · `[!]` terblokir

## Posisi Saat Ini

| | |
|---|---|
| Fase / milestone aktif | Fase 1, Milestone 1A |
| Task berikutnya | 1C.1 |
| Terakhir diperbarui | 2026-10-03 |

---

## Fase 1, Milestone 1A: Inti

- [x] **1A.1** Setup proyek: Next.js, TS, Prisma, Postgres (Docker Compose), Tailwind, shadcn, lint, Vitest
- [x] **1A.2** Skema Prisma + migrasi + seed (3 user, contoh item, contoh pasien)
- [x] **1A.3** Auth + role guard (server-side) + layout per role
- [x] **1A.4** Settings klinik + util audit log
- [x] **1A.5** Master item (layanan & produk), kategori, konversi satuan, master kandang
- [x] **1A.6** Owner & pasien: CRUD, pencarian, nomor RM, alert alergi/agresif
- [x] **1A.7** Kunjungan walk-in + halaman "Pasien Hari Ini"
- [x] **1A.8** Rekam medis: SOAP, vital, diagnosa, lampiran, vaksinasi, finalisasi, addendum, halaman jatuh tempo
- [x] **1A.9** Resep & tindakan → draft invoice otomatis
- [x] **1A.10** Inventaris dasar: stok masuk manual, batch, kartu stok, FEFO, blokir expired
- [x] **1A.11** Kasir: invoice auto/manual/retail, diskon, PPN, pembayaran penuh, kembalian, finalisasi
- [x] **1A.12** Void invoice (Admin) + restock
- [x] **1A.13** Struk thermal 80mm (+58mm via setting)

**Gate 1A:** satu pasien bisa dilayani dari pendaftaran sampai struk, stok berkurang benar.
- [x] Gate 1A lulus (`pnpm e2e`: pendaftaran, kunjungan, rekam medis, invoice, bayar, stok, void, audit)

## Fase 1, Milestone 1B: Layanan Lanjutan & Dokumen

- [x] **1B.1** Rawat inap & hotel: check-in, kandang tunggal, layar admission aktif
- [x] **1B.2** Monitoring harian rawat inap
- [x] **1B.3** Check-out + hitung hari (BR-15) + item tarif ke invoice
- [x] **1B.4** DP + pelunasan (BR-9)
- [x] **1B.5** E-invoice PDF
- [x] **1B.6** Stok opname
- [x] **1B.7** Notifikasi stok rendah/hampir expired di dashboard

**Gate 1B:** tagihan menginap benar, DP dan pelunasan benar, e-invoice terunduh.
- [x] Gate 1B lulus

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
| 2026-10-03 | 1A.6 | Kolom baru `patient.behavior_note` (migrasi `patient_behavior_note`) | Desain punya baris catatan "Perilaku" bertext, ERD hanya punya flag `aggressive`. Tag Alergi tampil jika `allergy_note` terisi |
| 2026-10-03 | 1A.6 | Foto pasien (opsional di FR-PAT-2) ditunda | Butuh penyimpanan file + route ber-auth; bukan syarat AC. Kolom `photo_path` sudah ada |
| 2026-10-03 | 1A.6 | Nomor RM = max nomor tahun ini + 1 dalam transaksi, ulangi hingga 3x jika bentrok unique `rm_no`; nomor pasien yang dihapus tidak dipakai ulang | Tanpa tabel counter. Volume ±20 pasien/hari |
| 2026-10-03 | 1A.6 | WhatsApp disimpan `62xxx` (10-15 digit), ditampilkan `0812-3456-7781`. Duplikat memunculkan peringatan dengan tombol "Tetap simpan", tidak memblokir | FR-PAT-1, FR-PAT-8 |
| 2026-10-03 | 1A.6 | Hapus pasien/owner = soft delete dengan konfirmasi; owner yang masih punya hewan tidak bisa dihapus | Aturan keras 7. Dibolehkan semua role karena matriks bagian 5 memberi akses CRUD owner/pasien ke semuanya |
| 2026-10-03 | 1A.7 | Status kunjungan berpindah otomatis ke MENUNGGU_BAYAR (saat rekam medis final) dan SELESAI (saat invoice lunas) dikerjakan di 1A.8 dan 1A.11, bukan di 1A.7 | Pemicunya ada di task itu |
| 2026-10-03 | 1A.7 | Halaman `/kunjungan` satu rute untuk semua role: Dokter hanya melihat kunjungannya sendiri dan judulnya "Pasien Hari Ini"; Kasir/Admin melihat semua. Auto-refresh 10 detik. Kunjungan hanya bisa dibatalkan saat DILAYANI | FR-VIS-3. Hasil kunjungan = status BATAL, tanpa hapus (aturan 7) |
| 2026-10-03 | 1A.7 | Kunjungan baru dibuat dari profil pasien ("+ Buat kunjungan"), bukan dari halaman Kunjungan | Pasien harus dipilih lewat pencarian yang sudah ada |
| 2026-10-03 | 1A.8 | Kolom baru `attachment.file_name` (migrasi `attachment_file_name`). File lampiran disimpan di `UPLOAD_DIR` (default `./uploads`, gitignored; perlu volume Docker di 1C.4), dilayani lewat `/api/lampiran/[id]` yang mengecek login dan role (401/403) | FR-MR-7: lampiran tidak publik. Jenis file divalidasi dari isi (PDF/PNG/JPEG), bukan dari nama atau mime kiriman browser |
| 2026-10-03 | 1A.8 | Lampiran boleh ditambah setelah rekam medis final (hanya tambah, tanpa hapus); catatan, vital, dan vaksinasi terkunci. Penguncian dicek di dalam update DB (`WHERE finalized = false`), bukan hanya di UI | Hasil lab sering datang setelah final. BR-2 |
| 2026-10-03 | 1A.8 | Finalisasi menolak rekam medis yang seluruh SOAP dan diagnosanya kosong | Menghindari rekam medis kosong terkunci. Tidak ada di SPEC: aturan tambahan |
| 2026-10-03 | 1A.8 | Halaman Jatuh Tempo hanya untuk Admin dan Dokter (kapabilitas lihat rekam medis), mengikuti desain dan matriks. Hanya dosis vaksin terbaru per pasien dan vaksin yang dihitung; rentang 7/14/30 hari, yang sudah lewat tetap tampil | US-10 menyebut Kasir, tetapi matriks bagian 5 dan desain tidak memberi Kasir akses rekam medis. "Kontrol" (jadwal kontrol) belum punya data terstruktur, hanya vaksin |
| 2026-10-03 | 1A.8 | Berat dari vital signs memperbarui `last_weight_kg` pasien saat draft disimpan. Diagnosa baru otomatis masuk master diagnosa (tanpa duplikat, tidak peka huruf besar-kecil) | FR-MR-2, FR-MR-3 |
| 2026-10-03 | 1A.8 | Finalisasi dan addendum masuk audit log; Dokter mana pun boleh membuka dan mengisi rekam medis semua kunjungan | FR-SYS-1. Matriks tidak membatasi per dokter |
| 2026-10-03 | 1A.9 | Tindakan dan resep disimpan di `prescription_item` (jenis dilihat dari `item.type`; layanan qty 1). Disimpan bersama draft rekam medis (hapus-lalu-buat ulang dalam transaksi), terkunci setelah final | ERD tidak punya tabel tindakan terpisah; desain menampilkan keduanya dalam satu tabel |
| 2026-10-03 | 1A.9 | Draft invoice dibuat **saat finalisasi rekam medis** (bukan saat item pertama ditambah): salin item dengan snapshot nama, harga jual, dan HPP (BR-6), hitung total, nomor `INV-YYYYMMDD-NNN` (BR-10) | Nomor invoice tidak boleh dipakai ulang, jadi tidak dibuat untuk rekam medis yang tidak pernah final. Sesuai alur 9.1. Finalisasi diulang hingga 3x jika nomor bentrok |
| 2026-10-03 | 1A.9 | Rumus uang di `src/lib/billing.ts` (diuji): qty x harga dibulatkan ke Rupiah; diskon item persen (bilangan bulat 0-100) atau nominal (maks harga); `subtotal` = jumlah item setelah diskon item; `discount_total` = diskon level invoice saja; PPN dihitung dari (subtotal - diskon invoice), dibulatkan, mode exclude/include | Mengikuti contoh angka di desain (462.500 - 12.500 + PPN 11% = 499.500) |
| 2026-10-03 | 1A.9 | Kolom baru di invoice: `discount_type`, `discount_value` (diskon total), `tax_rate`, `tax_included` (tarif PPN yang dipakai). Draft ikut tarif Pengaturan terbaru saat dihitung ulang; tarif dibekukan saat FINAL | Permintaan user soal diskon total dan pertanyaan tarif PPN |
| 2026-10-03 | 1A.9 | Dokter tidak menerima harga di pemilih item (hanya nama, jenis, satuan); invoice yang dikirim ke UI tidak membawa `unit_cost_snapshot` | SPEC bagian 5 (dokter tidak melihat harga), BR-7 |
| 2026-10-03 | 1A.9 | Peringatan alergi saat memilih obat berupa pencocokan kata nama obat (min. 5 huruf) dengan catatan alergi; hanya informasi, tidak memblokir | Keputusan user (sistem hanya menunjukkan). Pencocokan teks bebas bisa meleset untuk nama dagang |
| 2026-10-03 | 1A.9 | Halaman `/invoice` (daftar + filter) dan `/invoice/[id]` baru versi baca saja; edit item, diskon, dan pembayaran di 1A.11 | AC 1A.9: item dokter muncul di invoice |
| 2026-10-03 | 1A.10 | `stock_movement.qty` bertanda: masuk positif, keluar negatif, void positif, penyesuaian bertanda | ERD tidak menentukan; tanda memudahkan kartu stok dan saldo |
| 2026-10-03 | 1A.10 | Batch kedaluwarsa jika tanggal expired **sebelum** hari ini (hari-H masih bisa dijual); stok masuk untuk batch yang sudah expired ditolak | Tanggal expired pada kemasan berarti berlaku sampai hari itu |
| 2026-10-03 | 1A.10 | Stok masuk: harga beli diisi **per satuan beli**; HPP batch = harga / faktor konversi (dibulatkan). Batch dengan no. batch dan expired sama digabung dan HPP-nya dirata-rata tertimbang. `items.buy_price` master tidak diubah otomatis | FR-INV-2, BR-8. Perubahan harga master hanya lewat Master Data (teraudit) |
| 2026-10-03 | 1A.10 | Pengurangan stok (`deductForInvoiceItem`) memakai FEFO, batch tanpa expired terakhir lalu FIFO, update kondisional `qty_on_hand >= qty` agar dua transaksi bersamaan tidak membuat stok negatif; mengembalikan HPP rata-rata alokasi untuk snapshot invoice. Dipanggil oleh finalisasi invoice di 1A.11 | BR-4, BR-5, BR-6 |
| 2026-10-03 | 1A.10 | Halaman Inventaris hanya Admin (kapabilitas manage_stock): daftar produk dengan status Habis/Menipis/Hampir expired/Aman, kartu stok per produk (batch + riwayat), form stok masuk. Notifikasi di dashboard di 1B.7 | SPEC bagian 5 |
| 2026-10-03 | infra | Port Postgres Docker dipindah dari 5432 ke **5433** (`docker-compose.yml`, `.env`, `.env.example`) | Postgres lokal lain di mesin pengembang mengambil `localhost:5432` dan menutupi container, sehingga login role `pos` gagal (`DatabaseAccessDenied`). Data container tidak berubah |
| 2026-10-03 | 1A.11 | Tombol **Bayar** pada draft = finalisasi + pengurangan stok FEFO + pembayaran LUNAS dalam **satu transaksi** (BR-4, BR-12); invoice dikunci per baris (`FOR UPDATE`) agar edit, bayar ganda, dan finalisasi tidak saling menimpa. Kegagalan (stok kurang, uang kurang) membatalkan semuanya | AC "alur bayar maksimal 3 klik" dan desain (satu tombol Bayar) |
| 2026-10-03 | 1A.11 | Stok kurang menolak finalisasi dengan pesan per item ("tersedia N, dibutuhkan M"); batch expired tidak dihitung. HPP (`unit_cost_snapshot`) diisi dari rata-rata tertimbang batch yang dialokasikan | BR-5, BR-6 |
| 2026-10-03 | 1A.11 | Invoice yang total akhirnya 0 (mis. diskon 100%) selesai tanpa catatan pembayaran; invoice tanpa item tidak bisa dibayar | Tidak ada nominal untuk dicatat |
| 2026-10-03 | 1A.11 | Pembayaran lunas pada invoice kunjungan mengubah kunjungan menjadi SELESAI (FR-VIS-2) | |
| 2026-10-03 | 1A.11 | Diskon item dan diskon invoice (persen bulat atau nominal) hanya bisa diubah oleh Admin dan Kasir, tiap perubahan masuk audit log (`invoice.discount_item`, `invoice.discount`); finalisasi dan pembayaran juga diaudit | FR-POS-4, FR-SYS-1 |
| 2026-10-03 | 1A.11 | Menambahkan item yang sudah ada di invoice menaikkan qty (bukan baris baru); Enter di kolom cari menambah item bila cocok barcode/SKU persis atau hasil pencarian tunggal | Memudahkan scan barcode beruntun |
| 2026-10-03 | 1A.11 | Retail walk-in: nomor invoice dibuat saat "Mulai invoice retail" ditekan; draft kosong yang ditinggalkan tetap ada (tidak dihapus, BR-10). Nama pelanggan opsional | Tanpa mekanisme hapus draft sampai 1A.12 (void) |
| 2026-10-03 | 1A.11 | QRIS statis ditampilkan lewat `/api/qris` (login + role), bukan dikirim sebagai props ke halaman | Gambar bisa 1 MB |
| 2026-10-03 | 1A.11 | Riwayat Pembayaran (FR-POS-14): daftar per transaksi tanpa total/omzet; cetak ulang struk menyusul di 1A.13. DP dan metode bayar kedua baru di 1B.4, tombol "Bayar DP" dari desain belum ada | BR-7 |
| 2026-10-03 | 1A.12 | `invoice.visit_id` dan `admission_id` tidak lagi UNIQUE penuh, diganti **unique parsial** yang mengabaikan status VOID (migrasi `invoice_partial_unique`, SQL manual); relasi Prisma `Visit.invoice` menjadi `Visit.invoices` | BR-14 (koreksi = void + invoice baru) mustahil bila satu kunjungan hanya boleh punya satu invoice selamanya. Tetap hanya satu invoice **aktif** per kunjungan |
| 2026-10-03 | 1A.12 | Void (Admin, alasan min. 3 karakter): invoice DRAFT atau FINAL; nomor invoice tetap; seluruh pembayaran ditandai `voided` dan tetap tampil di riwayat; kunjungan SELESAI kembali ke MENUNGGU_BAYAR; teraudit dengan daftar item yang di-restock | BR-13. Dashboard omzet (1C.1) harus mengabaikan invoice VOID dan pembayaran void |
| 2026-10-03 | 1A.12 | Restock dipilih per item produk; stok kembali ke **batch asal** lewat gerakan `VOID_RETURN` (bisa ke batch yang kini expired, tetap tidak bisa dijual). Item yang tidak dicentang tetap terpotong (mis. rusak). DRAFT tidak punya stok terpotong sehingga tanpa pilihan restock | Void dua kali ditolak sehingga stok tidak bisa kembali ganda |
| 2026-10-03 | 1A.12 | Tombol "Buat invoice baru dari kunjungan" pada invoice kunjungan yang void membuat draft baru dari tindakan/resep rekam medis (harga master saat ini). Retail memakai "Mulai invoice retail" baru | Jalur koreksi yang diminta BR-14 |
| 2026-10-03 | 1A.13 | Struk di `/invoice/[id]/struk` (invoice FINAL): kop dari Pengaturan (nama, alamat, telepon, NPWP), item dengan diskon, subtotal/diskon/PPN/total, pembayaran + kembalian, sisa bila ada, footer. Lebar `@page` 80 atau 58 mm mengikuti Pengaturan; tombol Cetak memanggil `window.print()` dan hanya struk yang tercetak | FR-POS-10, FR-POS-11, SPEC bagian 2 |
| 2026-10-03 | 1A.13 | Penanda **SALINAN**: kolom baru `invoice.receipt_prints` bertambah tiap tombol Cetak ditekan; cetak pertama = asli, berikutnya = salinan | Tidak ada cara lain mengetahui cetak ulang. Tidak tahu apakah printer benar-benar mencetak |
| 2026-10-03 | 1A.13 | Logo klinik tidak dicetak di struk | Gambar di printer thermal sering kabur; belum diminta. Tambahkan bila klien mau |
| 2026-10-03 | proses | `pnpm e2e` (`scripts/e2e.ts`) menjalankan alur utama dan memverifikasi stok, status, audit; **menghapus data transaksi** di DB dev | Dasar Gate 1A dan uji e2e 1C.5. Menolak jalan bila NODE_ENV=production |
| 2026-10-03 | 1B.1 | Check-in membuat admission **dan draft invoice miliknya** (`invoice.admission_id`) dalam satu transaksi; invoice rawat inap terpisah dari invoice kunjungan walau dikaitkan ke kunjungan | Alur 9.3 (draft dibuat saat check-in agar DP bisa diterima di 1B.4). `visit_id` unik per invoice aktif sehingga satu invoice tidak bisa memuat keduanya |
| 2026-10-03 | 1B.1 | Validasi check-in: kandang aktif dan sesuai jenis; tarif harian = layanan aktif `billing_unit = PER_DAY` berkategori "rawat inap"/"hotel" sesuai jenis; satu pasien tidak boleh punya dua admission aktif; waktu masuk tidak boleh lebih dari 1 jam di masa depan. Kandang terisi dijaga unique index parsial DB (BR-17) dan diuji dengan check-in bersamaan | FR-ADM-1, FR-ADM-2. Dua aturan terakhir (pasien ganda, batas waktu) tidak ada di SPEC: mencegah tagihan ganda |
| 2026-10-03 | 1B.1 | Lama inap ditampilkan "Hari ke-N" = selisih tanggal kalender (zona Jakarta) + 1; tarif harian hanya terlihat oleh yang boleh melihat harga (formulir check-in tidak menampilkan harga) | BR-15, SPEC bagian 5. Menu Rawat Inap & Hotel tersedia untuk semua role mengikuti SPEC (desain kasir tidak memuatnya) |
| 2026-10-03 | 1B.1 | Layanan tarif harian harus dibuat Admin di Master Data (kategori rawat inap/hotel, centang "Tarif per hari") dan kandang di Master Data > Kandang sebelum check-in; seed belum memuatnya | Data tarif dan kandang menunggu klien |
| 2026-10-03 | 1B.2 | Monitoring harian hanya untuk admission **rawat inap yang masih AKTIF** (hotel tidak memerlukannya, SPEC FR-ADM-3); waktu tidak boleh sebelum check-in atau di masa depan; minimal salah satu dari suhu, makan/minum, catatan; log hanya bisa ditambah (tanpa ubah/hapus) | Catatan klinis yang tidak boleh diedit diam-diam; koreksi lewat log baru. Aturan append-only tidak tertulis di SPEC |
| 2026-10-03 | 1B.2 | Halaman `/rawat-inap/[id]` dan bagian monitoring di profil pasien hanya untuk Admin dan Dokter (kapabilitas `monitor_admission`); Kasir tidak melihat tautan Monitoring | SPEC bagian 5 |
| 2026-10-03 | 1B.3 | Check-out menghitung hari dengan BR-15 (selisih tanggal kalender Jakarta, minimal 1), menyimpan `billed_days`, membebaskan kandang, dan menambah item tarif x hari ke draft invoice admission dalam satu transaksi, lalu membuka invoice. Pratinjau hari dan total tampil sebelum konfirmasi (total disembunyikan dari Dokter) | FR-ADM-4, BR-15 (default, menunggu jawaban klien soal per malam atau per 24 jam dan jam batas check-out) |
| 2026-10-03 | 1B.3 | Harga item tarif memakai harga master saat check-out (bukan saat check-in). Bila invoice admission sudah FINAL, check-out ditolak dan admission tetap aktif; bila VOID, dibuat draft invoice baru | Admission hanya menyimpan item tarif, bukan harga. Penanganan invoice final/void tidak ada di SPEC |
| 2026-10-03 | 1B.3 | Check-out dilakukan semua role (SPEC bagian 5); hotel dan rawat inap memakai alur yang sama | |
| 2026-10-03 | 1B.4 | Aturan BR-9 di `src/lib/billing.ts` (diuji): maksimal 2 pembayaran; satu DP lalu pelunasan = sisa; DP pada draft boleh berapa pun karena total belum final, pada invoice FINAL harus lebih kecil dari total; DP > total tagihan menolak finalisasi/pembayaran dengan pesan jelas; overpay hanya tunai (kembalian) | BR-9, R8 |
| 2026-10-03 | 1B.4 | Tombol **Bayar** pada draft ber-DP = finalisasi + pelunasan sebesar sisa (kind PELUNASAN); bila sisa 0 (DP = total atau total 0) tombol berubah jadi "Selesaikan invoice" tanpa pembayaran tambahan | Alur 9.3 |
| 2026-10-03 | 1B.4 | Koreksi jumlah DP hanya oleh Admin (kapabilitas baru `correct_deposit`), hanya selama DP satu-satunya pembayaran dan invoice belum void, wajib alasan, teraudit sebelum/sesudah (`payment.deposit_correct`); DP juga diaudit (`payment.deposit`) | BR-9, FR-SYS-1. Matriks bagian 5 tidak punya baris untuk koreksi DP: ditambahkan sebagai capability Admin |
| 2026-10-03 | 1B.4 | Belum ada tombol "finalkan tanpa bayar", jadi invoice FINAL tidak pernah berstatus DP; jalur DP-pada-FINAL tersedia di logika tetapi belum terjangkau dari UI. Struk menampilkan baris DP/Pelunasan dan SISA | Tidak diminta; hindari invoice final menggantung |
| 2026-10-03 | 1B.5 | E-invoice PDF A4 di `/api/invoice/[id]/pdf` (`@react-pdf/renderer`, tanpa Puppeteer): logo, data klinik, ditagihkan kepada (owner/pelanggan), pasien, item dengan diskon, subtotal/diskon/PPN/total, pembayaran (DP, pelunasan), sisa, status bayar, footer, dan pernyataan bukan faktur pajak (BR-16). Hanya untuk yang boleh mengelola invoice (Admin, Kasir); invoice VOID tidak bisa diunduh; draft boleh diunduh dengan label DRAFT | FR-POS-12 |
| 2026-10-03 | 1B.5 | Logo di PDF memakai logo Pengaturan bila PNG/JPEG; logo WebP tidak didukung renderer sehingga dilewati. Tanpa logo terunggah dipakai logo bawaan NOER | Keterbatasan @react-pdf/renderer |
| 2026-10-03 | 1B.6 | Sesi opname (`/inventaris/opname`) menyalin semua batch bertotal > 0 (termasuk yang sudah expired); hanya satu sesi DRAFT pada satu waktu (tombol berubah jadi "Lanjutkan sesi draft"). Baris yang tidak diubah dianggap sesuai | FR-INV-6 |
| 2026-10-03 | 1B.6 | Selisih = hitung fisik - stok sistem **pada saat angka hitung diisi/diubah** (disimpan sebagai `system_qty`), bukan stok saat finalisasi. Finalisasi menerapkan selisih itu sebagai gerakan `ADJUST` bertanda; bila stok kini tidak cukup untuk selisih negatif, seluruh finalisasi dibatalkan dengan pesan "hitung ulang batch ini" | Penjualan yang terjadi di sela hitungan tidak boleh dihitung dua kali |
| 2026-10-03 | 1B.6 | Alasan wajib untuk setiap selisih (ditolak saat finalisasi, draft boleh kosong); opname FINAL tidak bisa diubah; finalisasi memakai langkah konfirmasi di halaman (bukan dialog browser) dan teraudit (`stock.opname` berisi daftar penyesuaian) | FR-INV-6, FR-SYS-1 |
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
| 2026-10-03 | 1A.6 | Selesai | `/pasien`: pencarian (nama owner/hewan, no. WA, no. RM, microchip; tanpa kata kunci = 50 terbaru) + profil sesuai desain, tag Alergi/Agresif dan baris catatan klinis. Form owner (peringatan WA duplikat), form hewan (tanggal lahir atau perkiraan umur, berat), halaman owner, ubah, hapus lunak. Logika murni diuji (WA, umur, nomor RM, skema; 102 test lulus). Diuji di browser dan skrip: 3 pendaftaran bersamaan menghasilkan RM berurutan, duplikat WA, tombol "Tetap simpan", owner tanpa hewan tetap ditemukan, hapus owner berhewan ditolak. Belum: profil belum punya tab riwayat kunjungan/vaksin/rawat inap (menyusul 1A.7, 1A.8, 1B), tombol "+ Buat kunjungan" (1A.7), foto. Lanjut ke 1A.7 |
| 2026-10-03 | 1A.7 | Selesai | `/kunjungan` (daftar hari ini, auto-refresh 10 dtk, batalkan) dan `/kunjungan/baru?patient=` (pilih dokter, keluhan; tag dan catatan alergi tampil di atas form). `visit_date` memakai hari Jakarta. Diuji lewat skrip (dokter tidak valid, pasien tidak ada, filter per dokter, batalkan sekali) dan HTTP per role. Tanpa nomor antrean. Lanjut ke 1A.8 |
| 2026-10-03 | 1A.8 | Selesai | `/rekam-medis/[visitId]`: vital signs, SOAP, diagnosa (autocomplete master), vaksinasi (jatuh tempo otomatis dari interval), lampiran, finalisasi (kunjungan jadi MENUNGGU_BAYAR), addendum. `/jatuh-tempo`. Riwayat kunjungan dan vaksinasi di profil pasien (Admin/Dokter). 113 test lulus. Diuji lewat skrip: final terkunci (simpan, vaksin, finalisasi ulang ditolak), addendum, lampiran palsu ditolak, audit; akses per role dan lampiran 401/403; simpan draft di browser. Finalisasi lewat tombol tidak diuji di browser karena dialog konfirmasi. Belum: tindakan & resep (1A.9). Lanjut ke 1A.9 |
| 2026-10-03 | 1A.9 | Selesai | Bagian Tindakan & resep di form rekam medis (cari, qty, aturan pakai, peringatan alergi). Finalisasi membuat draft invoice dengan snapshot harga/HPP, total (PPN dari Pengaturan), nomor berurutan; finalisasi ganda bersamaan tetap satu invoice. 128 test lulus (rumus uang, nomor, alergi). Diuji lewat skrip dan browser (picker, peringatan, simpan). Lanjut ke 1A.10 |
| 2026-10-03 | 1A.10 | Selesai | `/inventaris`, `/inventaris/masuk`, `/inventaris/[itemId]` (kartu stok). Logika FEFO, konversi, expired, status stok diuji (144 test). Data layer diuji lewat skrip: lintas batch, HPP tertimbang 1.250, expired dilewati, stok kurang ditolak tanpa mengubah stok, dua pengambilan bersamaan tidak negatif, CHECK stok negatif. Browser: stok masuk 2 box = 200 tablet tampil di kartu stok. Lanjut ke 1A.11 |
| 2026-10-03 | 1A.11 | Selesai | `/invoice` (editor draft: cari/scan, qty, diskon item, diskon invoice, hapus; panel bayar tunai/QRIS/transfer/kartu, kembalian, QRIS), `/retail`, `/pembayaran`. 155 test (rumus uang, status bayar, skema). Skrip: edit, audit diskon, stok kurang membatalkan semua, bayar tunai kurang ditolak, bayar bersamaan hanya sekali, kunci setelah final, HPP tertimbang, kunjungan SELESAI. Browser: retail dari awal sampai Lunas dan stok berkurang. Role: dokter ditolak, kasir tanpa HPP di halaman. Lanjut ke 1A.12 |
| 2026-10-03 | 1A.12 | Selesai | Panel Void di halaman invoice (Admin saja): alasan wajib, pilihan restock per produk, bukan refund; pembayaran ditandai Void di invoice dan Riwayat Pembayaran. Skrip: restock ke batch asal, void ganda ditolak, edit/bayar invoice void ditolak, invoice pengganti, void draft, audit. Browser: alasan kosong ditolak, void berhasil. Kasir tidak melihat tombol. Lanjut ke 1A.13 |
| 2026-10-03 | 1A.13 | Selesai | Cetak struk 80/58 mm + tombol dari halaman invoice dan Riwayat Pembayaran. Dicek di browser: layout 80 mm, 58 mm, mode SALINAN. **Belum diuji dengan printer thermal sungguhan** dan dialog print browser tidak diuji (diperlukan perangkat klien). **Gate 1A lulus** lewat `pnpm e2e`. Lanjut ke Milestone 1B (1B.1) |
| 2026-10-03 | 1B.1 | Selesai | `/rawat-inap` (admission aktif: kandang, pasien + tag alergi, jenis, masuk, Hari ke-N, link invoice), `/rawat-inap/check-in` (cari pasien, jenis, kandang kosong, tarif, waktu, kunjungan hari ini), bagian Rawat inap & hotel di profil pasien. 162 test (hari kalender). Skrip: semua validasi, dua check-in bersamaan ke kandang sama (satu ditolak, tanpa invoice yatim). Browser: daftar, form (opsi berganti per jenis), check-in. Lanjut ke 1B.2 |
| 2026-10-03 | 1B.2 | Selesai | `/rawat-inap/[id]` (tambah monitoring: waktu, suhu, makan/minum, catatan; riwayat terbaru dulu) dan 5 log terakhir di profil pasien. 169 test (skema log, check-in). Skrip: sebelum check-in, masa depan, hotel, setelah check-out, id tak ada ditolak. Browser: tambah log, form ter-reset, tampil di profil. Kasir ditolak (/forbidden). Lanjut ke 1B.3 |
| 2026-10-03 | 1B.3 | Selesai | `/rawat-inap/[id]/check-out` (waktu keluar, pratinjau N hari x tarif) dan tombol Check-out di daftar aktif. Skrip: hari yang sama jadi 1 hari, 3 hari = Rp 450.000 (PPN 11% ikut), check-out ulang/bersamaan/sebelum masuk/masa depan ditolak, invoice final menolak dan membatalkan seluruh perubahan, invoice void membuat draft baru. Browser: pratinjau 2 hari x Rp 150.000, check-out membuka invoice Rp 300.000. Dokter tidak melihat harga. Lanjut ke 1B.4 |
| 2026-10-03 | 1B.4 | Selesai | Tombol Bayar DP (jumlah, metode, uang diterima), ringkasan Total/DP dibayar/Sisa, label DP/Pelunasan di invoice dan struk, koreksi DP Admin. 182 test (settlement, deposit, koreksi, permission). Skrip: DP kedua ditolak, pelunasan = sisa, maks 2 pembayaran, DP 600rb > total 300rb ditolak lalu dikoreksi Admin, DP pada FINAL, void invoice ber-DP menandai DP void. Browser: DP Rp 50.000 lalu pelunasan Rp 150.000 menjadi Final/Lunas. Lanjut ke 1B.5 |
| 2026-10-03 | 1B.5 | Selesai | Tombol Unduh e-invoice (PDF) di halaman invoice. Test render PDF (termasuk 80 item multi-halaman, 183 test). Diuji: tanpa login 401, Dokter 403, Kasir 200 dengan header unduhan; tampilan PDF diperiksa di viewer browser (item diskon, PPN, DP, sisa). Lanjut ke 1B.6 |
| 2026-10-03 | 1B.6 | Selesai | `/inventaris/opname` (daftar + mulai/lanjutkan) dan `/inventaris/opname/[id]` (tabel hitung fisik, selisih langsung, alasan, simpan draft, finalkan dengan konfirmasi; tampilan final baca saja). 184 test. Skrip: sesi ganda melanjutkan yang lama, alasan wajib, penjualan di sela hitungan tidak dihitung ganda, penguncian setelah final, rollback saat stok tidak cukup, audit. Browser: 100 -> 96 dengan alasan, gerakan ADJUST -4. Lanjut ke 1B.7 |
| 2026-10-03 | 1B.7 | Selesai | Kartu "Notifikasi stok" di Beranda untuk Admin (kapabilitas manage_stock): produk habis/menipis (ambang per item) dan batch expired/hampir expired (hari peringatan dari Pengaturan). 187 test. Kasir/dokter tidak melihat kartu. Gate 1B terbukti lewat uji 1B.3-1B.5 (tagihan menginap, DP/pelunasan, PDF). Lanjut ke 1C.1 |

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
| Uji alur utama (hapus data transaksi DB dev) | `pnpm e2e` |
| Prisma Studio | `pnpm prisma:studio` |
