# Deploy ke VPS

Panduan dari server kosong sampai sistem berjalan di HTTPS. Semua langkah sudah diuji pada stack Docker Compose dari database kosong (login, PDF, backup, restore).

## 1. Prasyarat

- VPS Linux (Ubuntu 22.04+), min. 2 GB RAM, 20 GB disk. Port 80 dan 443 terbuka.
- Domain/subdomain (mis. `pos.klinik.id`) dengan **A record** ke IP VPS. Caddy mengurus sertifikat HTTPS otomatis, jadi DNS harus sudah mengarah sebelum langkah 4.
- Docker Engine + plugin Compose: `curl -fsSL https://get.docker.com | sh`.
- Server tujuan backup terpisah (lihat bagian 6).

## 2. Ambil kode

```bash
sudo mkdir -p /opt/pos && sudo chown $USER /opt/pos
git clone <URL-REPO> /opt/pos && cd /opt/pos
```

## 3. Isi konfigurasi

```bash
cp .env.production.example .env
openssl rand -base64 32      # salin hasilnya ke AUTH_SECRET
openssl rand -base64 24      # salin hasilnya ke DB_PASSWORD
nano .env                    # isi DOMAIN, DB_PASSWORD, AUTH_SECRET
echo 'COMPOSE_FILE=docker-compose.prod.yml' >> .env
chmod 600 .env
```

| Variabel | Arti |
|---|---|
| `DOMAIN` | Domain tanpa `https://` |
| `DB_PASSWORD` | Password PostgreSQL (hanya dipakai antar container; DB tidak dibuka ke internet) |
| `AUTH_SECRET` | Kunci tanda tangan sesi login. Mengganti nilai ini membuat semua user harus login ulang |

`.env` jangan pernah di-commit. Setelah baris `COMPOSE_FILE` ada, perintah `docker compose` di folder ini otomatis memakai file produksi.

## 4. Jalankan pertama kali

```bash
docker compose up -d db
docker compose run --rm tools pnpm prisma migrate deploy

# Admin pertama (jangan pakai seed: seed hanya data contoh dengan password umum)
ADMIN_USERNAME=owner ADMIN_NAME="Nama Owner" ADMIN_PASSWORD='password-kuat-min-8' \
  docker compose run --rm tools pnpm tsx scripts/create-admin.ts

docker compose up -d --build app caddy
```

Buka `https://<DOMAIN>`, login dengan Admin tadi. Lalu, di aplikasi:

1. **Pengguna**: tambah akun Dokter dan Kasir (user bisa ganti password sendiri di menu nama di kiri bawah).
2. **Pengaturan**: nama klinik, alamat, logo, QRIS, PPN, lebar printer, hari peringatan expired.
3. **Master Data**: layanan, produk, kandang. **Inventaris**: stok awal lewat Stok Masuk.

Cek: `docker compose ps` (semua `running`), `docker compose logs -f app`.

## 5. Update versi

```bash
cd /opt/pos
scripts/backup.sh                                  # selalu backup dulu
git pull
docker compose run --rm tools pnpm prisma migrate deploy
docker compose up -d --build app
```

Migrasi hanya menambah/ubah skema lewat file di `prisma/migrations`; jangan ubah DB manual.

## 6. Backup harian

`scripts/backup.sh` membuat folder `backups/<tanggal-jam>/` berisi `db.dump` (pg_dump) dan `uploads.tar.gz` (lampiran), memverifikasi isinya, dan menghapus backup lebih dari 14 hari (`RETENTION_DAYS`).

Jadwalkan dengan cron (`crontab -e`), tiap hari 02:00 WIB, plus salin ke server lain agar tidak hilang bersama VPS:

```cron
0 2 * * * cd /opt/pos && ./scripts/backup.sh >> /var/log/pos-backup.log 2>&1
30 2 * * * rsync -a --delete /opt/pos/backups/ backup-user@server-lain:/data/pos-backups/
```

(Atur zona waktu VPS ke `Asia/Jakarta`: `sudo timedatectl set-timezone Asia/Jakarta`. Untuk rsync, siapkan SSH key tanpa passphrase ke server tujuan.)

Cek berkala: `ls -lh backups/` dan `tail /var/log/pos-backup.log`. **Uji restore minimal sekali sebulan** (bagian 7, langkah 1-2).

## 7. Restore

`scripts/restore.sh <folder-backup> <nama-db-baru> [folder-uploads]` memulihkan ke database **baru** dan tidak menimpa data yang sedang berjalan.

**Uji restore (aman, tidak mengganggu sistem):**

```bash
scripts/restore.sh backups/20261003-020000 pos_restore ./uploads-restored
docker compose exec -T db psql -U pos -d pos_restore -c 'select count(*) from invoice'
docker compose exec -T db dropdb -U pos pos_restore && rm -rf uploads-restored
```

**Pemulihan nyata (data rusak/VPS baru):**

1. Pada VPS baru, lakukan bagian 1-3 lalu `docker compose up -d db`. Migrasi tidak perlu dijalankan karena dump sudah berisi skema.
2. Salin folder backup ke VPS, lalu: `scripts/restore.sh backups/<folder> pos_restore ./uploads-restored`
3. Hentikan aplikasi dan tukar database (database lama disimpan sebagai `pos_old`, bukan dihapus):
   ```bash
   docker compose stop app
   docker compose exec -T db psql -U pos -d postgres -c 'ALTER DATABASE pos RENAME TO pos_old; ALTER DATABASE pos_restore RENAME TO pos;'
   ```
   (Pada VPS baru, DB `pos` kosong itu otomatis menjadi `pos_old`.)
4. Kembalikan lampiran ke volume, lalu nyalakan app:
   ```bash
   docker compose up -d app
   docker compose exec -T app tar -xzf - -C /data/uploads < backups/<folder>/uploads.tar.gz
   ```
5. Login, periksa invoice terakhir dan satu lampiran. Setelah yakin, hapus `pos_old`: `docker compose exec -T db dropdb -U pos pos_old`.

## 8. Operasional

| Kebutuhan | Perintah |
|---|---|
| Lihat log | `docker compose logs -f app` |
| Restart | `docker compose restart app` |
| Lupa password Admin | Admin lain: menu Pengguna, Reset password. Jika tidak ada Admin lain: `ADMIN_USERNAME=owner2 ... docker compose run --rm tools pnpm tsx scripts/create-admin.ts` |
| Disk penuh | Cek `docker system df` dan `du -sh backups/` |

Catatan keamanan: DB tidak punya port publik, hanya Caddy (80/443) yang terbuka. Aktifkan firewall (`ufw allow 22,80,443/tcp && ufw enable`) dan update OS berkala.
