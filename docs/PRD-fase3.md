# PRD Fase 3: Perluasan Fitur Klinik

| | |
|---|---|
| **Status** | Draft v0.1, **menunggu persetujuan**. Belum ada kode yang dibuat |
| **Pemilik produk** | Irul (Chairul Nur Wahid) |
| **Dokumen induk** | `docs/PRD.md` (Fase 1 dan 2). PRD ini menambah dan mengubah scope di atasnya |
| **Referensi fitur** | VetCloud (vetcloud.id), ditelusuri 6 Okt 2026. Yang ditiru adalah **fitur dan pengelompokan menu**, bukan tampilannya |
| **Gaya tampilan** | Tetap NOER: terang, ungu `#533872`, IBM Plex Sans, komponen yang sudah ada |
| **Catatan** | Setelah disetujui, `docs/PRD.md` bagian Non-Tujuan dan `docs/SPEC.md` (aturan bisnis, ERD, task) diperbarui mengikuti dokumen ini |

---

## 1. Ringkasan

Fase 1 dan 2 sudah mencakup alur inti: pasien, kunjungan, rekam medis, rawat inap/hotel, kasir, stok, laporan, tutup kas. Fase 3 memperluas sistem agar setara dengan aplikasi klinik hewan yang beredar di pasar, dengan tiga arah:

1. **Navigasi yang lebih jelas.** Menu dikelompokkan per pekerjaan (Penjualan, Operasional Klinik, Pelanggan, Inventaris, Laporan, Data Master), dan kasir punya satu layar POS.
2. **Modul klinis yang berdiri sendiri.** Janji temu, operasi, grooming, hasil lab, radiologi, dan pet hotel punya menu dan catatannya sendiri, tidak hanya sebagai item di invoice.
3. **Keuangan lengkap.** Deposit/saldo pelanggan, biaya operasional, dan laporan laba rugi (laba bersih).

## 2. Perubahan Scope terhadap PRD Induk

| Item | Di PRD induk | Di Fase 3 | Catatan |
|---|---|---|---|
| Janji temu (booking) | Di luar scope | **Masuk** | Dicatat oleh staf. Tidak ada booking online oleh pemilik hewan |
| Deposit / saldo pelanggan | Tidak ada | **Masuk** | Saldo **tidak bisa ditarik tunai** agar tidak menjadi refund (refund tetap di luar scope) |
| Pengeluaran operasional & laba bersih | Pertanyaan terbuka Q3 | **Masuk** | Menjawab Q3 |
| Antrean / nomor antrean | Di luar scope | Tetap di luar | Janji temu cukup diurutkan per jam |
| WhatsApp (API, tombol, laporan WA) | Di luar scope | Tetap di luar | Termasuk "laporan WA" rawat inap dan pengingat janji temu |
| Kehadiran staf | Tidak ada | **Tidak dibuat** | Sesuai permintaan |
| Multi-cabang, paket langganan | Di luar scope | Tetap di luar | Single-tenant |
| Import & export data (task 2.1, 2.3) | Fase 2 | Tetap ditunda | Dikerjakan bila diminta |
| Refund, cicilan, bundling, supplier/PO, kartu vaksin, QRIS dinamis, PIN kasir, portal pemilik | Di luar scope | Tetap di luar | |

## 3. Struktur Menu Baru

Kolom **Status**: ✅ sudah ada (hanya dipindah atau diganti nama), 🟡 sudah ada sebagian, 🆕 baru.

| Grup | Menu | Status | Isi singkat |
|---|---|:-:|---|
| **Ikhtisar** | Dasbor | 🟡 | Beranda sekarang + aksi cepat, janji temu hari ini, pengeluaran |
| **Penjualan** | Kasir (POS) | 🟡 | Satu layar: katalog + keranjang + bayar (lihat 4.1) |
| | Transaksi (Lunas) | ✅ | Riwayat Pembayaran sekarang |
| | Tagihan / Invoice | ✅ | Tagihan belum lunas dan semua invoice |
| | Tutup Kas | ✅ | Tetap ada (tidak ada di referensi, sudah dibangun di 2.5) |
| **Operasional Klinik** | Janji Temu | 🆕 | 4.2 |
| | Rekam Medis | 🟡 | Daftar semua rekam medis + template cepat SOAP (4.3) |
| | Rawat Inap | ✅ | Dipisah dari pet hotel |
| | Pet Hotel | 🟡 | Grid kandang, status kebersihan, instruksi pakan (4.4) |
| | Vaksin | 🟡 | Daftar semua vaksinasi + jatuh tempo (4.5) |
| | Hasil Lab | 🟡 | 4.6 |
| | Radiologi | 🟡 | 4.6 |
| | Operasi | 🆕 | 4.7 |
| | Grooming | 🆕 | 4.8 |
| **Pelanggan** | Hewan Peliharaan | ✅ | Dipisah dari pemilik |
| | Pemilik Hewan | ✅ | + kolom saldo deposit |
| | Deposit / Wallet | 🆕 | 4.9 |
| **Inventaris & Ritel** | Produk | ✅ | Gabungan master item dan stok |
| | Riwayat Stok | 🟡 | Semua mutasi stok lintas produk (sekarang hanya per produk) |
| | Stok Opname | ✅ | |
| | Biaya Operasional | 🆕 | 4.10 |
| **Laporan** | Laporan Penjualan | ✅ | + rincian tunai vs non-tunai |
| | Laba Rugi | 🆕 | 4.11 |
| | Audit Log | ✅ | Tetap ada |
| **Data Master** | Klinik | ✅ | Pengaturan klinik sekarang |
| | Jenis Hewan | 🆕 | 4.12 |
| | Ras Hewan | 🆕 | 4.12 |
| | Kandang | ✅ | Dipindah dari Master Data |
| | Pengguna | ✅ | |
| | Pengaturan Printer | 🟡 | Lebar kertas dipindah dari Pengaturan |
| | Notifikasi | 🆕 | 4.13 |
| | Profil | ✅ | Akun saya sekarang |

Tambahan lintas halaman: **pencarian global** (Ctrl+K) untuk pasien, pemilik, rekam medis, dan invoice (4.14).

Menu yang tampil tetap mengikuti peran. Kasir misalnya tidak melihat Laporan, Biaya Operasional, dan Data Master.

## 4. User Stories dan Acceptance Criteria

Prioritas: **M** = Must, **S** = Should, **C** = Could.

### 4.1 Kasir (POS)
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-40 | Kasir | Satu layar kasir | Kiri: katalog layanan dan produk (grid atau daftar), cari nama/SKU, scan barcode, filter per kategori (Petshop, Obat, Vaksin, Lab, Radiologi, Operasi, Rawat Inap, Tindakan, Grooming). Kanan: keranjang, jumlah, diskon, total, tombol bayar | M |
| US-41 | Kasir | Memilih pelanggan | Default "Umum / Walk-in". Bisa pilih pemilik (dan hewannya) agar transaksi masuk riwayat pasien dan bisa dibayar dengan saldo deposit | M |
| US-42 | Kasir | Melanjutkan tagihan yang sudah ada | Tagihan dari kunjungan, rawat inap, operasi, grooming yang belum lunas bisa dibuka di layar kasir yang sama | M |
| US-43 | Kasir | Bayar pakai saldo deposit | Saldo menjadi salah satu metode bayar. Tidak boleh melebihi saldo. Tetap tunduk pada aturan maksimal 2 pembayaran (DP + pelunasan) | S |

Aturan Fase 1 tetap berlaku: stok berkurang saat lunas (FEFO), batch expired tidak dijual, diskon tercatat audit, Kasir tidak melihat harga beli/omzet.

### 4.2 Janji Temu
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-44 | Kasir/Dokter | Mencatat janji temu | Pasien, dokter, layanan/keperluan, tanggal dan jam, catatan. Status: Terjadwal, Selesai, Batal | M |
| US-45 | Kasir/Dokter | Melihat jadwal | Tampilan per hari (strip tanggal) dan kalender bulanan, filter per dokter. Ringkasan: total, menunggu, selesai | M |
| US-46 | Kasir | Mengubah janji temu jadi kunjungan | Satu klik saat pasien datang: kunjungan dibuat dengan dokter dan keluhan dari janji temu, rekam medis siap diisi, status janji temu jadi Selesai | M |
| US-47 | Kasir | Tahu siapa yang tidak datang | Janji temu lewat hari tanpa kunjungan ditandai "Tidak datang" | C |

Tanpa pengingat WhatsApp/SMS, tanpa booking online.

### 4.3 Rekam Medis
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-48 | Dokter | Daftar semua rekam medis | Tabel: tanggal, pasien & pemilik, dokter, diagnosis & keluhan, status (Draft/Final). Cari dan filter tanggal/dokter | M |
| US-49 | Dokter | Isi SOAP lebih cepat | Tombol "pilih cepat" untuk keluhan umum, temuan fisik, diagnosis, dan rencana terapi. Daftar pilihan bisa diatur Admin | S |

Aturan final + addendum tetap berlaku.

### 4.4 Pet Hotel (dipisah dari Rawat Inap)
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-50 | Kasir | Melihat kandang sekaligus | Grid kandang dengan status Tersedia, Terisi, Perlu dibersihkan. Ringkasan total/tersedia/terisi/perlu sanitasi | M |
| US-51 | Kasir | Check-in penitipan | Pilih pasien dan kandang (menampilkan jenis hewan dan tarif per hari), tanggal masuk, estimasi keluar, instruksi pakan & jadwal makan, catatan obat bawaan | M |
| US-52 | Admin | Tarif per kandang | Setiap kandang punya tarif harian dan peruntukan (mis. kucing, anjing kecil) | S |
| US-53 | Kasir | Menandai kandang bersih | Setelah check-out kandang berstatus "Perlu dibersihkan" sampai ditandai bersih | S |

Penagihan per hari mengikuti BR-15 yang sudah ada.

### 4.5 Vaksin
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-54 | Dokter | Daftar riwayat vaksinasi | Tanggal diberikan, pasien & pemilik, nama vaksin & batch, jadwal ulang, catatan. Cari dan filter | M |

Pencatatan vaksin tetap lewat rekam medis kunjungan (stok vaksin terpotong dari invoice). Halaman Jatuh Tempo digabung ke menu ini.

### 4.6 Hasil Lab dan Radiologi
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-55 | Dokter | Mencatat hasil lab | Pasien/rekam medis, nama pemeriksaan, tanggal, ringkasan hasil/nilai, kesimpulan, lampiran file | M |
| US-56 | Dokter | Mencatat radiologi | Pasien/rekam medis, jenis (X-Ray, USG, Echocardiography, lainnya), tanggal, temuan/interpretasi, catatan, lampiran gambar | M |
| US-57 | Dokter | Melihatnya di riwayat pasien | Hasil lab dan radiologi tampil di profil pasien dan rekam medis terkait | M |

Lampiran memakai penyimpanan dan pembatasan akses yang sudah ada (PDF/JPG/PNG, maks 10 MB, hanya user login).

### 4.7 Operasi
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-58 | Dokter | Menjadwalkan operasi | Pasien/rekam medis, tanggal, prosedur, protokol anestesi, dokter, catatan pra-operasi. Status: Dijadwalkan, Berjalan, Selesai, Batal | M |
| US-59 | Dokter | Mencatat hasil operasi | Catatan pasca-operasi dan instruksi. Setelah Selesai, catatan dikunci seperti rekam medis (koreksi lewat addendum) | S |
| US-60 | Kasir | Biaya operasi tertagih | Layanan operasi dan obat yang dipakai masuk ke tagihan pasien | M |

### 4.8 Grooming
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-61 | Kasir | Menjadwalkan grooming | Pasien, paket grooming (dari layanan kategori Grooming), tanggal dan jam, catatan | M |
| US-62 | Kasir | Melihat kalender grooming | Kalender bulanan dan daftar per bulan. Status: Menunggu, Dikerjakan, Selesai, Batal | M |
| US-63 | Kasir | Grooming tertagih | Saat Selesai, paket grooming masuk tagihan pemilik | M |

### 4.9 Deposit / Wallet
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-64 | Kasir | Top-up saldo pelanggan | Pilih pemilik, nominal, metode (Tunai, Transfer, QRIS), catatan. Struk top-up bisa dicetak | M |
| US-65 | Kasir | Melihat mutasi saldo | Total saldo titipan semua pelanggan, riwayat mutasi (top-up, pemakaian, koreksi) dengan filter per pemilik | M |
| US-66 | Admin | Mengoreksi saldo | Hanya Admin, alasan wajib, tercatat audit | M |

Saldo tidak bisa ditarik tunai. Top-up tunai ikut dihitung di Tutup Kas.

### 4.10 Biaya Operasional
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-67 | Admin | Mencatat pengeluaran | Nama, nominal, kategori, tanggal, keterangan. Kategori dari master (mis. Gaji, Sewa, Listrik & Air, Pembelian Stok, Lainnya) | M |
| US-68 | Admin | Melihat dan mengoreksi | Daftar dengan total periode. Ubah/hapus tercatat audit (hapus = soft delete) | M |

### 4.11 Laporan
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-69 | Owner | Rincian penjualan | Laporan penjualan yang ada + total tunai vs non-tunai dan persentasenya | S |
| US-70 | Owner | Laba rugi | Pendapatan − HPP = laba kotor; laba kotor − biaya operasional = **laba bersih**; margin; grafik tren harian. Periode: bulan ini, bulan lalu, 3 bulan, tahun ini, rentang bebas | M |

### 4.12 Jenis dan Ras Hewan
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-71 | Admin | Mengelola master jenis dan ras | Tambah, ubah, nonaktifkan. Ras terhubung ke jenis | M |
| US-72 | Kasir | Memilih dari daftar | Form pasien memakai pilihan jenis lalu ras. Data lama yang diketik bebas dipetakan otomatis bila namanya cocok, sisanya tetap tampil apa adanya | M |

### 4.13 Notifikasi (di dalam aplikasi)
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-73 | Staf | Lonceng notifikasi | Ikon lonceng dengan jumlah belum dibaca. Isi sesuai peran: stok rendah/expired (Admin), janji temu hari ini, vaksin jatuh tempo, pasien rawat inap. Tandai dibaca | S |

Tidak ada push notification, email, atau WhatsApp.

### 4.14 Dasbor dan Pencarian
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-74 | Staf | Aksi cepat di dasbor | Tombol ke Kasir, Rekam Medis, Transaksi, dan Janji Temu sesuai peran. Kartu janji temu hari ini. Admin: pengeluaran dan tren pengeluaran | S |
| US-75 | Staf | Pencarian global | Ctrl+K dari halaman mana pun: pasien, pemilik, rekam medis, invoice. Hasil mengikuti hak akses peran | S |

## 5. Matriks Peran (tambahan)

| Kemampuan | Admin | Dokter | Kasir |
|---|:-:|:-:|:-:|
| Janji temu: lihat dan kelola | ✅ | ✅ | ✅ |
| Operasi, hasil lab, radiologi: isi | ✅ | ✅ | ❌ |
| Operasi, hasil lab, radiologi: lihat | ✅ | ✅ | ❌ |
| Grooming: kelola | ✅ | ✅ | ✅ |
| Pet hotel: check-in/out, tandai kandang bersih | ✅ | ✅ | ✅ |
| Deposit: top-up dan pakai saldo | ✅ | ❌ | ✅ |
| Deposit: koreksi saldo | ✅ | ❌ | ❌ |
| Biaya operasional, laba rugi | ✅ | ❌ | ❌ |
| Master jenis/ras hewan | ✅ | ❌ | ❌ |

Peran **Paramedis** (ada di referensi) belum dimasukkan, lihat Q12.

## 6. Dampak ke Aturan Bisnis (diperinci di SPEC setelah disetujui)

| Area | Dampak |
|---|---|
| BR-9 pembayaran | Saldo deposit menjadi metode bayar baru. Batas 2 pembayaran per invoice tetap |
| BR-13 void | Void invoice yang dibayar saldo mengembalikan saldo (bukan uang tunai) |
| Tutup kas (2.5) | Top-up tunai dihitung sebagai kas masuk |
| Laporan (2.2) | Top-up deposit **bukan** pendapatan; pendapatan diakui saat invoice FINAL |
| Audit log | Tambah: janji temu dibatalkan, operasi selesai, top-up, koreksi saldo, biaya operasional |
| Data pasien | `species` dan `breed` beralih dari teks bebas ke master (migrasi data lama) |

## 7. Pertanyaan Terbuka

| # | Pertanyaan | Usulan default |
|---|---|---|
| Q8 | Janji temu boleh tumpang tindih untuk dokter yang sama di jam yang sama? | Boleh, hanya diberi peringatan |
| Q9 | Grooming dikerjakan siapa? Perlu mencatat groomer? | Tidak mencatat groomer |
| Q10 | Deposit: ada batas maksimal saldo atau masa berlaku? | Tanpa batas dan tanpa masa berlaku |
| Q11 | Kategori biaya operasional apa saja? | Gaji, Sewa, Listrik & Air, Internet, Pembelian Stok, Perawatan Alat, Lainnya |
| Q12 | Perlu peran Paramedis (mis. boleh isi monitoring rawat inap tapi tidak finalisasi rekam medis)? | Belum, pakai 3 peran yang ada |
| Q13 | Pembelian stok dicatat sebagai biaya operasional, atau cukup lewat HPP? | Tidak, agar tidak dihitung dua kali (HPP sudah masuk laba kotor) |
| Q14 | Hasil lab perlu nilai per parameter (mis. tabel hematologi) atau cukup ringkasan teks + lampiran? | Ringkasan teks + lampiran |

## 8. Rencana Rilis

Satu milestone diuji dan di-commit sebelum lanjut ke berikutnya.

| Milestone | Isi | Kriteria selesai |
|---|---|---|
| **3A** | Sidebar baru (grup menu), Kasir (POS) satu layar, pemisahan Hewan/Pemilik dan Rawat Inap/Pet Hotel | Semua menu lama bisa dicapai dari menu baru, alur kasir lulus `pnpm e2e` |
| **3B** | Janji Temu, Rekam Medis (daftar + pilih cepat), Vaksin, Hasil Lab, Radiologi | Janji temu bisa jadi kunjungan; lab/radiologi tampil di riwayat pasien |
| **3C** | Operasi, Grooming, Pet Hotel (grid, status kebersihan, tarif per kandang) | Operasi dan grooming tertagih benar |
| **3D** | Deposit/Wallet, Biaya Operasional, Laba Rugi, rincian tunai/non-tunai | Saldo, tutup kas, dan laba bersih cocok dengan hitungan manual |
| **3E** | Jenis/Ras Hewan, Notifikasi, Pencarian global, Pengaturan Printer, Dasbor aksi cepat | Data lama spesies/ras terpetakan; notifikasi sesuai peran |
