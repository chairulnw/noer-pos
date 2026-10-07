# 06 · Go-live dan Operasional

## Checklist sebelum dipakai klinik

- [ ] Domain aktif di Cloudflare, HTTPS (gembok) muncul, mode SSL **Full (strict)** (opsi A/B).
- [ ] Rate limiting login di Cloudflare aktif, `TRUST_CLOUDFLARE=1` di `.env`.
- [ ] Admin dibuat dengan `scripts/create-admin.ts`, **bukan seed**. Akun Dokter/Kasir dibuat di menu Pengguna dengan password kuat.
- [ ] Pengaturan Klinik terisi (nama, alamat, logo, QRIS, PPN), Pengaturan Printer sesuai printer struk.
- [ ] Master data: layanan, produk, jenis/ras hewan, kandang. Stok awal lewat Stok Masuk.
- [ ] Backup harian jalan, salinan ke cloud muncul, **uji pulihkan sekali berhasil** ([05](05-backup-offsite.md)).
- [ ] UptimeRobot memantau `https://pos.<domain>/login`.
- [ ] Skenario uji `docs/uji/` minimal 01, 05, 06, 07, 10 lulus di server ini dengan perangkat klinik (PC/tablet kasir, printer thermal, scanner barcode).
- [ ] Masa paralel 1–2 minggu: sistem dipakai berdampingan dengan cara lama, stok dan uang dicocokkan tiap hari.

## Update aplikasi

```bash
cd /opt/pos
./scripts/backup.sh                                    # selalu backup dulu
git pull
docker compose run --rm tools pnpm prisma migrate deploy
docker compose up -d --build app                       # opsi C: ... app tunnel
```

Lakukan di luar jam praktik. Bila gagal: `git checkout <versi-sebelumnya>` lalu build ulang; bila skema sudah berubah, pulihkan dari backup ([../DEPLOY.md](../DEPLOY.md) bagian 7).

## Rutin

| Kapan | Apa |
|---|---|
| Harian (otomatis) | Backup 02:00, salin ke cloud 02:30, update keamanan OS |
| Mingguan | Lihat **Pengguna → Sesi Login**: keluarkan perangkat asing lalu ganti password; lihat Audit Log |
| Bulanan | Uji pulihkan backup; `df -h` (sisa disk); `docker system prune -f` (bersihkan image lama) |
| Tiap staf keluar | Nonaktifkan akunnya di Pengguna (sesi langsung terputus) |

## Bila ada masalah

| Masalah | Langkah |
|---|---|
| Situs tidak bisa dibuka | `docker compose ps`, `docker compose logs -f app`; opsi C: status Tunnel di Zero Trust |
| Lupa password Admin | Admin lain mereset di Pengguna; bila tidak ada, buat Admin baru dengan `scripts/create-admin.ts` |
| Ada login mencurigakan | Pengguna → Sesi Login → keluarkan semua sesi orang itu → reset password → cek Audit Log |
| Server rusak/hilang | Siapkan server baru (opsi mana pun), pulihkan backup terakhir dari cloud ([../DEPLOY.md](../DEPLOY.md) bagian 7) |
