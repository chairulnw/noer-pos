# Skenario Uji NOER Petshop & Vet Clinic

Checklist uji manual seluruh fitur dan alur per peran. Satu poin berisi satu alur lengkap (beberapa aksi berurutan) dan hasil yang diharapkan. Centang `[x]` bila lulus; bila gagal, tulis catatan singkat di bawah poinnya (langkah, hasil yang muncul, screenshot).

## Urutan pengerjaan

| No | File | Isi | Peran utama |
|---|---|---|---|
| 0 | [00-persiapan.md](00-persiapan.md) | Reset data, akun, data awal | — |
| 1 | [01-akses-dan-menu.md](01-akses-dan-menu.md) | Login, menu per peran, blokir akses | Admin, Dokter, Kasir |
| 2 | [02-master-data.md](02-master-data.md) | Klinik, printer, jenis/ras, pengguna, produk & layanan | Admin |
| 3 | [03-inventaris.md](03-inventaris.md) | Stok masuk, FEFO, expired, riwayat stok, opname | Admin |
| 4 | [04-pelanggan.md](04-pelanggan.md) | Pemilik, hewan, foto, deposit/wallet | Kasir, Admin |
| 5 | [05-alur-klinik-dokter.md](05-alur-klinik-dokter.md) | Kunjungan, rekam medis, vaksin, lab, radiologi, operasi | Dokter |
| 6 | [06-kasir-dan-pembayaran.md](06-kasir-dan-pembayaran.md) | POS, tagihan, metode bayar, DP, saldo, pembatalan, struk/PDF, tutup kas | Kasir, Admin |
| 7 | [07-rawat-inap-pet-hotel-grooming.md](07-rawat-inap-pet-hotel-grooming.md) | Rawat inap, pet hotel, grooming | Semua |
| 8 | [08-laporan-dasbor-audit.md](08-laporan-dasbor-audit.md) | Dasbor, laporan, laba rugi, biaya, notifikasi, pencarian, audit log | Admin |
| 9 | [09-tampilan-tabel.md](09-tampilan-tabel.md) | Paginasi, sort, filter, tampilan HP | Semua |
| 10 | [10-hari-penuh-klinik.md](10-hari-penuh-klinik.md) | Simulasi satu hari operasional end-to-end | Semua |

## Aturan yang harus selalu benar (cek di setiap skenario)

- Uang tampil `Rp 1.000` (titik ribuan), tanpa desimal.
- Kasir **tidak pernah** melihat harga beli, HPP, margin, omzet, laba.
- Dokter tidak bisa membuka halaman kasir, tagihan, laporan uang.
- Rekam medis FINAL tidak bisa diubah, koreksi lewat addendum.
- Stok berkurang saat tagihan FINAL dengan FEFO, batch expired tidak bisa dijual.
- Data transaksi tidak pernah hilang; yang dibatalkan tetap tercatat berstatus **Dibatalkan**.
- Waktu tampil dalam WIB.
- Perubahan sensitif (harga, stok, pembatalan, diskon, DP, finalisasi, pengguna, pengaturan) muncul di Audit Log.

## Format catatan bug

```
[file] poin: ...
Peran: ... | URL: ...
Langkah: ...
Hasil: ...
Harapan: ...
```
