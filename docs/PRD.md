# PRD: Sistem POS + PMS Klinik Hewan

| | |
|---|---|
| **Status** | Draft v2.0 (2 fase) |
| **Pemilik produk** | Irul (Chairul Nur Wahid) |
| **Klien** | 1 klinik hewan (single-tenant) |
| **Dokumen terkait** | `docs/SPEC.md` (spesifikasi teknis, ERD, task breakdown, prompt agent) |
| **Catatan** | PRD ini menjawab **apa** dan **kenapa**. Detail **bagaimana** ada di spec teknis. Jika konflik: PRD menang untuk scope dan prioritas, spec menang untuk detail teknis. Angka target adalah usulan dan perlu divalidasi dengan klien |

**Fase 3 (6 Okt 2026):** scope diperluas, rincian di `docs/PRD-fase3.md`. Janji temu, deposit/saldo pelanggan, dan biaya operasional/laba bersih **keluar dari Non-Tujuan** di bawah. Selain itu tetap berlaku.

**Perubahan dari v1:** 3 fase menjadi 2 fase. Rawat inap, pet hotel, DP, dan e-invoice masuk MVP. Antrean, refund, bundling, cicilan, supplier/PO, WhatsApp, kartu vaksin, QRIS dinamis, dan PIN kasir dihapus dari scope.

---

## 1. Ringkasan

Klinik hewan butuh satu sistem yang menyatukan **rekam medis pasien (PMS)** dan **kasir (POS)** berikut stok obat/vaksin, rawat inap, dan pet hotel. Sistem ini menggantikan pencatatan manual agar riwayat medis tidak hilang, transaksi dan stok akurat, dan obat kedaluwarsa tidak sengaja terpakai.

**Bentuk produk:** web app berbasis cloud, responsif untuk PC dan tablet, UI Bahasa Indonesia, mata uang IDR. Cetak struk ke printer thermal dan e-invoice PDF yang diunduh dan dikirim manual oleh staf.

---

## 2. Masalah yang Diselesaikan

| # | Masalah (kondisi saat ini) | Dampak |
|---|---|---|
| P1 | Riwayat medis hewan tidak terdokumentasi terstruktur | Dokter kehilangan konteks, risiko salah tindakan (alergi, riwayat vaksin) |
| P2 | Kasir dan rekam medis terpisah, item tindakan/obat ditulis ulang | Double entry, tagihan salah atau terlewat |
| P3 | Stok obat/vaksin tidak terlacak per batch dan tanggal expired | Risiko obat expired terpakai, kerugian stok |
| P4 | Tidak ada jejak siapa mengubah harga, stok, atau membatalkan transaksi | Sulit audit, risiko kebocoran |
| P5 | Tagihan rawat inap/hotel dihitung manual, DP tidak tercatat rapi | Salah hitung hari, selisih pembayaran |
| P6 | Laporan omzet dan stok disusun manual | Pemilik tidak punya gambaran bisnis yang cepat |

---

## 3. Tujuan dan Non-Tujuan

### Tujuan
| ID | Tujuan |
|---|---|
| G1 | Satu alur terpadu: pasien datang → dilayani → ditagih → dibayar → struk/e-invoice |
| G2 | Rekam medis terstruktur (SOAP), **tidak bisa diubah diam-diam** (final + addendum) |
| G3 | Stok akurat per batch, keluar otomatis **FEFO**, obat expired **tidak bisa dijual** |
| G4 | Rawat inap dan pet hotel tertagih otomatis berdasarkan jumlah hari, mendukung DP |
| G5 | Semua perubahan sensitif tercatat (audit log) |
| G6 | Pemilik melihat omzet dan kondisi stok hari ini dengan sekali buka |
| G7 | Mudah dipakai staf non-teknis di tablet/PC |

### Non-Tujuan (di luar scope)
| Item | Alasan |
|---|---|
| Antrean / nomor antrean | Walk-in diinput kasir lalu langsung dilayani |
| Booking online oleh pemilik hewan | Janji temu dicatat staf (Fase 3). Booking mandiri tetap di luar scope |
| Refund | Tidak ada kebijakan refund. (Void untuk koreksi salah input tetap ada, bukan refund) |
| Paket bundling, cicilan | Tidak diminta. DP hanya 1x lalu pelunasan |
| Supplier & purchase order | Semua stok masuk diinput manual |
| WhatsApp (API maupun tombol) | Komunikasi dengan pemilik hewan manual |
| Kartu vaksin & surat sehat | Dibuat di luar sistem. Sistem hanya mencatat vaksinasi |
| QRIS dinamis / payment gateway | QRIS statis saja |
| Multi-cabang, mode offline, portal pemilik, integrasi akuntansi, komisi dokter, obat racikan, multi-gudang | Tidak diminta |

---

## 4. Pengguna dan Persona

| Persona | Peran | Kebutuhan utama | Frustrasi saat ini |
|---|---|---|---|
| **Owner/Admin** | Pemilik/pengelola. Akses penuh | Lihat omzet, kontrol harga & stok, awasi void | Tidak tahu angka real-time, sulit melacak selisih stok |
| **Dokter Hewan** | Memeriksa, mengisi rekam medis, meresepkan, memantau rawat inap | Lihat riwayat dan alergi cepat, catat SOAP tanpa repot | Berkas hilang, menulis ulang item untuk kasir |
| **Kasir/Resepsionis** | Mendaftarkan pasien, input kunjungan, tagihan, pembayaran | Proses bayar cepat tanpa salah hitung | Hitung manual, harus tanya dokter soal item |

**Volume:** ±20 pasien/hari, 3 akun. Prioritas desain adalah **kebenaran data dan kemudahan**, bukan skalabilitas.

---

## 5. Metrik Keberhasilan (usulan)

| Metrik | Target | Cara ukur |
|---|---|---|
| Waktu dari dokter finalisasi sampai struk tercetak | ≤ 3 menit | Selisih timestamp finalisasi dokter dan pembayaran |
| Kunjungan tercatat di sistem | 100% setelah 2 minggu go-live | Jumlah kunjungan sistem vs catatan harian klinik |
| Penjualan obat/vaksin expired | 0 | Sistem memblokir secara teknis, cek audit stok |
| Selisih stok sistem vs opname fisik | ≤ 2% | Stok opname bulanan |
| Tagihan rawat inap/hotel salah hitung hari | 0 | Cek sampel invoice vs tanggal check-in/out |
| Void tanpa alasan tercatat | 0 | Audit log |
| Rekam medis difinalisasi sebelum invoice final | ≥ 95% | Rasio kunjungan |
| Kepuasan staf (SUS) | ≥ 70 | Survei setelah 1 bulan |

---

## 6. Ruang Lingkup per Fase

### Fase 1 (MVP): operasional lengkap
| Modul | Isi |
|---|---|
| Login & role | 3 role: Owner/Admin, Dokter, Kasir |
| Owner & pasien | CRUD, nomor RM otomatis, pencarian cepat, tag & catatan alergi/agresif, foto opsional |
| Kunjungan | Tanpa antrean. Kasir input walk-in, langsung dilayani. Dokter melihat daftar "pasien hari ini" |
| Rekam medis | SOAP, vital signs, diagnosa, tindakan, resep, lampiran lab/rontgen. Final + addendum |
| Vaksinasi | Catat vaksin, batch, tanggal berikutnya. Daftar "jatuh tempo" hanya tampilan |
| Rawat inap & pet hotel | Check-in/out, kandang/ruangan, tarif per hari otomatis, monitoring harian sederhana |
| Grooming | Layanan biasa di kasir |
| Master data | Layanan dan produk, harga, satuan |
| Inventaris | Stok masuk manual per batch + expired, FEFO, blokir expired, kartu stok, **stok opname**, notifikasi stok rendah/hampir expired |
| Kasir | Invoice auto/manual, retail walk-in, barcode, diskon, PPN, tunai/QRIS statis/transfer/kartu |
| DP | 1 DP + 1 pelunasan, tanpa cicilan |
| Void | Hanya Admin, wajib alasan, koreksi salah input |
| Struk & e-invoice | Struk thermal + e-invoice PDF (diunduh, dikirim manual) |
| Sistem | Audit log, pengaturan klinik, dashboard dasar, backup harian |

**Milestone internal Fase 1:**
| Milestone | Isi |
|---|---|
| **1A** | Login, owner/pasien, kunjungan, rekam medis, master data, inventaris dasar (batch, FEFO, blokir expired), kasir dasar, struk |
| **1B** | Rawat inap & hotel, DP, e-invoice, stok opname, notifikasi stok |
| **1C** | Dashboard, audit log lengkap, backup, uji end-to-end, perbaikan |

### Fase 2: analisis dan migrasi
| Fitur | Isi |
|---|---|
| Import data lama | CSV/Excel untuk owner, pasien, stok. Preview dan validasi sebelum disimpan |
| Laporan lengkap | Omzet harian/bulanan, laba kotor, top produk/layanan, stok menipis, expired, kunjungan, jatuh tempo kontrol |
| Export | PDF dan Excel |
| Dashboard lanjut | Grafik tren omzet dan kunjungan |
| Tutup kas harian | Modal awal, hitung fisik, selisih (usulan, bisa ditunda) |

---

## 7. User Stories dan Acceptance Criteria

Prioritas: **M** = Must, **S** = Should, **C** = Could.

### 7.1 Pasien & Kunjungan (Fase 1)
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-1 | Kasir | Mendaftarkan owner dan hewan baru | Owner wajib: nama, WhatsApp, alamat. Hewan wajib terhubung ke owner. Nomor RM `RM-YYYY-NNNNN` otomatis. Nomor WA duplikat memunculkan peringatan | M |
| US-2 | Kasir | Mencari pasien dengan cepat | Cari berdasarkan nama owner/hewan, no. WA, no. RM, microchip | M |
| US-3 | Kasir | Membuat kunjungan walk-in | Pilih pasien dan dokter, isi keluhan. Kunjungan langsung masuk daftar "pasien hari ini" milik dokter. Tanpa nomor antrean | M |
| US-4 | Dokter/Kasir | Melihat peringatan alergi atau hewan agresif | Tag kecil di daftar, invoice, dan header rekam medis. Baris catatan klinis di profil dan header rekam medis. Peringatan merah saat obat yang dialergikan dipilih di form resep. Hanya informasi, tidak memblokir: keputusan ada di dokter | M |

### 7.2 Rekam Medis (Fase 1)
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-5 | Dokter | Mencatat pemeriksaan SOAP + vital signs | Field S/O/A/P, suhu, HR, RR, berat, BCS, CRT. Berat memperbarui profil pasien | M |
| US-6 | Dokter | Memilih tindakan dan meresepkan obat | Item dari master. Otomatis masuk draft invoice tanpa input ulang | M |
| US-7 | Dokter | Mengunci rekam medis setelah selesai | Setelah final isi tidak bisa diubah. Koreksi lewat addendum bertanda waktu dan nama user | M |
| US-8 | Dokter | Mengunggah hasil lab/rontgen | PDF/JPG/PNG maks 10 MB. Hanya user terautentikasi yang bisa membuka | M |
| US-9 | Dokter | Mencatat vaksinasi dan jadwal berikutnya | Tanggal jatuh tempo otomatis dari interval master, bisa diubah | M |
| US-10 | Dokter/Kasir | Melihat daftar pasien jatuh tempo vaksin/kontrol | Daftar hanya tampilan (nama, owner, no. WA, tanggal). Komunikasi manual | S |

### 7.3 Rawat Inap & Pet Hotel (Fase 1)
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-11 | Dokter/Kasir | Check-in hewan untuk rawat inap atau hotel | Pilih jenis, kandang/ruangan, tanggal masuk, tarif harian dari master. Kandang terisi tidak bisa dipakai ganda | M |
| US-12 | Dokter | Mencatat monitoring harian rawat inap | Tanggal, suhu, makan/minum, catatan | S |
| US-13 | Dokter/Kasir | Check-out dengan tagihan otomatis | Jumlah hari dihitung dari tanggal masuk-keluar (aturan di spec). Item tarif × hari masuk ke draft invoice | M |
| US-14 | Admin | Mengelola daftar kandang/ruangan | Tambah, ubah, nonaktifkan | S |

### 7.4 Kasir & Pembayaran (Fase 1)
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-15 | Kasir | Invoice terbentuk otomatis dari kunjungan | Item dokter muncul. Kasir bisa tambah/ubah manual sebelum finalisasi | M |
| US-16 | Kasir | Menjual produk tanpa kunjungan (retail) | Invoice walk-in tanpa pasien. Scan barcode didukung | M |
| US-17 | Kasir | Memberi diskon per item atau per invoice | % atau nominal. Tercatat di audit log | M |
| US-18 | Owner | Mengatur PPN | On/off, persentase (default 11%), mode include/exclude | M |
| US-19 | Kasir | Menerima pembayaran dengan beberapa metode | Tunai (hitung kembalian), QRIS statis, transfer, kartu | M |
| US-20 | Kasir | Menerima DP lalu pelunasan | Maksimal 2 pembayaran per invoice: DP (sebagian), lalu pelunasan sisa. Tanpa cicilan. Sisa tagihan terlihat jelas | M |
| US-21 | Kasir | Mencetak struk thermal | Memuat data klinik, item, diskon, PPN, total, DP, sisa, metode bayar. Cetak ulang bertanda "SALINAN" | M |
| US-22 | Kasir | Mengunduh e-invoice PDF | PDF bernomor invoice, siap dikirim manual oleh staf | M |
| US-37 | Kasir | Melihat riwayat pembayaran | Daftar pembayaran per transaksi dengan pencarian dan cetak ulang struk "SALINAN". Tanpa total harian/omzet untuk Kasir | S |
| US-23 | Admin | Membatalkan (void) invoice salah input | Hanya Admin, alasan wajib. Pilih restock per item. Tercatat di audit log. Bukan refund | M |

### 7.5 Inventaris (Fase 1)
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-24 | Admin | Mencatat stok masuk manual per batch dengan expired | Input satuan beli, sistem konversi ke satuan dasar | M |
| US-25 | Sistem | Mengurangi stok otomatis FEFO | Batch expired terdekat dipakai dulu, bisa lintas batch. Stok kurang menolak finalisasi | M |
| US-26 | Kasir/Dokter | Tidak bisa menjual obat expired | Batch expired tidak dialokasikan. Tidak ada override | M |
| US-27 | Admin | Melakukan stok opname | Input hitung fisik per batch. Selisih menjadi penyesuaian dengan alasan, tercatat di kartu stok | M |
| US-28 | Owner | Melihat peringatan stok rendah dan hampir expired | Tampil di dashboard. Threshold per item, default expired 90 hari | M |

### 7.6 Dashboard & Sistem (Fase 1)
| ID | Sebagai | Saya ingin | Acceptance Criteria | P |
|---|---|---|---|:-:|
| US-29 | Owner | Dashboard ringkas | Omzet hari ini, jumlah kunjungan, pasien rawat inap/hotel aktif, stok rendah/hampir expired. Omzet hanya terlihat Admin | M |
| US-30 | Owner | Mengatur data klinik | Nama, alamat, telepon, NPWP, logo, gambar QRIS, footer struk, PPN, lebar kertas | M |
| US-31 | Owner | Melihat audit log | Siapa, kapan, apa, nilai sebelum/sesudah | M |

### 7.7 Fase 2
| ID | Cerita | P |
|---|---|:-:|
| US-32 | Sebagai Admin, saya ingin mengimpor owner, pasien, dan stok dari CSV/Excel dengan preview dan validasi | S |
| US-33 | Sebagai Owner, saya ingin laporan omzet, laba kotor, top produk/layanan, stok, kunjungan, dan jatuh tempo kontrol | S |
| US-34 | Sebagai Owner, saya ingin mengekspor laporan ke PDF dan Excel | S |
| US-35 | Sebagai Owner, saya ingin grafik tren omzet dan kunjungan | C |
| US-36 | Sebagai Kasir, saya ingin tutup kas harian (modal awal, hitung fisik, selisih) | C |

---

## 8. Matriks Peran

| Kemampuan | Owner/Admin | Dokter | Kasir |
|---|:-:|:-:|:-:|
| Kelola user, pengaturan, harga | ✅ | ❌ | ❌ |
| Daftar owner/pasien, input kunjungan | ✅ | ✅ | ✅ |
| Isi dan finalisasi rekam medis | ✅ | ✅ | ❌ |
| Check-in/out rawat inap & hotel | ✅ | ✅ | ✅ |
| Monitoring harian rawat inap | ✅ | ✅ | ❌ |
| Kasir dan pembayaran | ✅ | ❌ | ✅ |
| Void invoice, stok opname, stok masuk | ✅ | ❌ | ❌ |
| Lihat harga beli, margin, omzet | ✅ | ❌ | ❌ |
| Audit log | ✅ | ❌ | ❌ |

---

## 9. Persyaratan Non-Fungsional

| Area | Persyaratan |
|---|---|
| Integritas data | Invoice, stok, dan pembayaran tersimpan atomik. Uang disimpan sebagai integer Rupiah |
| Keamanan | Autentikasi, otorisasi dicek di server, password ter-hash, lampiran tidak publik |
| Privasi | Data pemilik (WA, alamat) hanya untuk user terautentikasi |
| Ketersediaan | Backup harian otomatis, retensi 14 hari, prosedur restore terdokumentasi |
| Usability | Tablet-friendly, pesan error Bahasa Indonesia, alur bayar maksimal 3 klik dari invoice |
| Auditabilitas | Perubahan harga, stok, void, diskon, finalisasi, dan koreksi DP tercatat |
| Lokalisasi | Zona `Asia/Jakarta`, format `Rp 1.250.000`, tanggal `DD MMM YYYY` |

---

## 10. Lanskap Kompetitor

| Aspek | Kreloses (referensi) | Produk ini |
|---|---|---|
| Model | SaaS multi-industri (vet, gigi, fisio, kiropraktik), Malaysia/Asia | Khusus 1 klinik hewan, dibangun custom |
| Fitur utama | EMR, kalender booking, invoice, stok, modul keuangan, laporan | Rekam medis, kasir, stok FEFO, rawat inap/hotel, laporan |
| Pembeda | | Alur sesuai klinik, kustomisasi penuh, data milik klinik, tanpa biaya langganan per user |
| Celah | Booking dan modul pengeluaran ada di Kreloses | Sengaja tidak masuk scope |

---

## 11. Risiko dan Mitigasi

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| R1 | Internet klinik tidak stabil | Kasir macet | Konfirmasi ke klien. Cadangan: server lokal |
| R2 | Staf menolak pindah dari cara lama | Adopsi rendah | Alur sederhana, pelatihan singkat, masa paralel 1-2 minggu |
| R3 | Stok awal tidak lengkap (batch/expired) | Stok awal tidak akurat | Stok opname awal sebelum go-live, input batch aktif saja |
| R4 | Cetak thermal via browser merepotkan (dialog print) | Kasir lambat | Mulai `window.print()`, siapkan upgrade QZ Tray |
| R5 | **MVP lebih besar** (rawat inap, hotel, DP, e-invoice masuk) | Jadwal molor | Pecah 1A/1B/1C, rilis internal tiap milestone |
| R6 | Salah hitung uang/stok/hari menginap | Kerugian, hilang kepercayaan | Integer Rupiah, unit test, transaksi atomik, aturan hitung hari tertulis |
| R7 | Tanpa refund, kesalahan input tidak bisa dikoreksi | Data salah menumpuk | Void oleh Admin dengan alasan wajib |
| R8 | DP lebih besar dari tagihan akhir (mis. rawat inap lebih singkat) | Invoice tidak bisa difinalisasi | Admin dapat mengoreksi jumlah DP (tercatat audit). Perlu konfirmasi klien |
| R9 | E-invoice dikirim manual | Ada pekerjaan staf | Terima di MVP. Dikaji ulang bila klien mau otomatis |
| R10 | Kehilangan atau kebocoran data | Reputasi dan hukum | Backup harian, otorisasi server, HTTPS |
| R11 | Ketergantungan satu developer | Maintenance terhambat | Dokumentasi spec dan deploy |

---

## 12. Asumsi, Dependensi, dan Pertanyaan Terbuka

### Asumsi
- Satu klinik, 3 pengguna, ±20 pasien/hari
- Internet klinik stabil, ada PC/tablet dan printer thermal
- Harga jual tetap per item, hanya Owner/Admin yang mengubah
- E-invoice adalah **invoice digital (PDF)**, bukan faktur pajak
- Laporan "laba" di Fase 2 berupa **laba kotor** (penjualan dikurangi HPP). Pengeluaran operasional (gaji, sewa, listrik) tidak dicatat
- Klien menyediakan daftar layanan, produk, dan harga untuk data awal

### Dependensi dari klien
| Item | Dibutuhkan untuk |
|---|---|
| Nama, logo, alamat, telepon, NPWP, gambar QRIS statis | Header struk, e-invoice, pengaturan |
| Daftar layanan + harga, produk + harga beli/jual + satuan | Data master awal |
| Lebar printer thermal (58/80mm) | CSS cetak |
| Stok awal per batch dan expired | Go-live |
| Daftar kandang/ruangan rawat inap dan hotel | Master kandang |

### Pertanyaan terbuka
| # | Pertanyaan | Dibutuhkan sebelum |
|---|---|---|
| Q1 | Aturan hitung hari menginap: per malam (tanggal kalender, minimal 1 hari) atau per 24 jam? Ada jam batas check-out? | Milestone 1B |
| Q2 | Jika DP lebih besar dari tagihan akhir, bagaimana penanganannya? | Milestone 1B |
| Q3 | Perlu pencatatan pengeluaran operasional agar laporan laba lengkap? | Fase 2 |
| Q4 | Apakah ada kewajiban pelaporan/regulasi untuk rekam medis hewan di wilayah klien? | Fase 1 |
| Q5 | Ada data lama untuk diimpor? Format dan isinya? | Fase 2 |
| Q6 | Internet klinik stabil? | Sebelum deploy |
| Q7 | Tutup kas harian: masuk Fase 2 atau tidak diperlukan? | Fase 2 |

---

## 13. Rencana Rilis

| Milestone | Isi | Kriteria selesai |
|---|---|---|
| **M0** | Konfirmasi dependensi klien + data awal | Daftar layanan, produk, kandang, dan stok awal diterima |
| **1A** | Inti: pasien → rekam medis → invoice → bayar → struk | Satu pasien dilayani dari daftar sampai struk, stok berkurang benar |
| **1B** | Rawat inap/hotel, DP, e-invoice, opname, notifikasi stok | Tagihan menginap benar, DP dan pelunasan benar, e-invoice terunduh |
| **1C** | Dashboard, audit log, backup, uji end-to-end | Backup dan restore teruji, semua story Must Fase 1 lulus |
| **Go-live** | Paralel 1-2 minggu dengan cara lama | Bug kritis nol, staf nyaman memakai |
| **Fase 2** | Import, laporan, export, dashboard lanjut, tutup kas | Story Fase 2 lulus |

Tanggal belum ditetapkan (belum ada deadline dari klien).
