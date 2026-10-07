# 05 · Backup ke luar server (wajib, semua opsi)

`scripts/backup.sh` sudah membuat backup harian di server (`backups/<tanggal-jam>/`: `db.dump` + `uploads.tar.gz`, disimpan 14 hari). Langkah ini **menyalinnya ke tempat lain**, agar data selamat bila server rusak, dihapus, atau terkena ransomware.

## 1. Jadwalkan backup harian di server

```bash
cd /opt/pos && chmod +x scripts/backup.sh && ./scripts/backup.sh     # uji sekali
crontab -e
# tambahkan:
0 2 * * * cd /opt/pos && ./scripts/backup.sh >> /var/log/pos-backup.log 2>&1
```

## 2. Pilih tujuan salinan

| Tujuan | Gratis | Catatan |
|---|---|---|
| **Cloudflare R2** | 10 GB | Disarankan. Tanpa biaya unduh; sudah satu akun dengan Cloudflare |
| **Google Drive** | 15 GB (akun Google) | Mudah dilihat dari HP |
| Server/PC lain via rsync | — | Lihat ../DEPLOY.md bagian 6 |

## 3. Pasang rclone

```bash
sudo apt install -y rclone
rclone config
```

**Cloudflare R2**: Cloudflare → **R2** → Create bucket `pos-backup` → **Manage R2 API Tokens** → Create token (Object Read & Write, bucket itu saja) → catat Access Key, Secret, endpoint. Di `rclone config`: `n` → nama `r2` → tipe **s3** → provider **Cloudflare** → isi key, secret, endpoint.

**Google Drive**: di `rclone config`: `n` → nama `gdrive` → tipe **drive** → scope `drive.file` → ikuti tautan login (di server tanpa layar, jalankan `rclone authorize "drive"` di laptop lalu tempel hasilnya).

Uji: `rclone copy /opt/pos/backups r2:pos-backup/backups --dry-run` (atau `gdrive:pos-backups`).

## 4. Salin otomatis tiap hari

```bash
crontab -e
# 30 menit setelah backup; --max-age agar hanya file baru yang diunggah
30 2 * * * rclone copy /opt/pos/backups r2:pos-backup/backups --max-age 48h >> /var/log/pos-backup.log 2>&1
```

Pakai `copy` (bukan `sync`) agar file di cloud **tidak ikut terhapus** bila server terkena ransomware. Atur penghapusan lama di cloud: R2 → bucket → **Object lifecycle rules** → hapus objek lebih dari 90 hari.

## 5. Uji pulihkan (sebulan sekali)

```bash
rclone copy r2:pos-backup/backups/<folder> ./uji-restore/<folder>
scripts/restore.sh ./uji-restore/<folder> pos_restore ./uploads-restored
docker compose exec -T db psql -U pos -d pos_restore -c 'select count(*) from invoice'
docker compose exec -T db dropdb -U pos pos_restore && rm -rf uji-restore uploads-restored
```

Backup yang belum pernah diuji pulihkan belum bisa dianggap aman. Pemulihan sungguhan: ../DEPLOY.md bagian 7.
