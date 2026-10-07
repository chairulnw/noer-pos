# Opsi A · VPS lokal (disarankan untuk produksi)

## 1. Sewa VPS

- Penyedia lokal dengan pusat data Jakarta, mis. IDCloudHost, Biznet Gio, Dewaweb, Hostinger.
- Spesifikasi minimal: **2 GB RAM, 1–2 vCPU, 40 GB SSD, Ubuntu 22.04/24.04 LTS**. Harga ±Rp 60–150 rb/bulan.
- Saat membuat VPS: pilih Ubuntu, tambahkan **SSH key** bila tersedia (lebih aman dari password). Catat **IP publik**.
- Aktifkan fitur **snapshot/backup** penyedia bila murah (tambahan dari backup harian di bagian 05).

## 2. Masuk ke server

```bash
ssh root@IP_SERVER            # dari Terminal (Mac/Linux) atau PowerShell (Windows)
adduser klinik && usermod -aG sudo klinik    # buat user non-root
rsync --archive --chown=klinik:klinik ~/.ssh /home/klinik   # bila memakai SSH key
exit
ssh klinik@IP_SERVER
```

## 3. Siapkan server

```bash
sudo apt update && sudo apt -y upgrade
sudo timedatectl set-timezone Asia/Jakarta
sudo apt install -y unattended-upgrades git ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker klinik && newgrp docker

# firewall: hanya SSH dan web
sudo ufw default deny incoming && sudo ufw default allow outgoing
sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable
```

Bila login memakai SSH key, matikan login password SSH:

```bash
sudo sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config && sudo systemctl restart ssh
```

## 4. Pasang aplikasi

Ikuti [../DEPLOY.md](../DEPLOY.md) **bagian 2–4** (ambil kode, isi `.env`, migrasi, buat Admin pertama, jalankan). Ringkasnya:

```bash
sudo mkdir -p /opt/pos && sudo chown klinik /opt/pos
git clone <URL-REPO> /opt/pos && cd /opt/pos
cp .env.production.example .env && nano .env      # DOMAIN, DB_PASSWORD, AUTH_SECRET, TRUST_CLOUDFLARE=1
echo 'COMPOSE_FILE=docker-compose.prod.yml' >> .env && chmod 600 .env
docker compose up -d db
docker compose run --rm tools pnpm prisma migrate deploy
ADMIN_USERNAME=owner ADMIN_NAME="Nama Owner" ADMIN_PASSWORD='PasswordKuat2026' \
  docker compose run --rm tools pnpm tsx scripts/create-admin.ts
docker compose up -d --build app caddy
```

Buka `https://pos.<domain>` → login Admin → lanjut ke [05](05-backup-offsite.md) dan [06](06-go-live-operasional.md).

## 5. Bila gagal

| Gejala | Periksa |
|---|---|
| Situs tidak terbuka | `docker compose ps` (semua running?), DNS A record benar & proxied, `sudo ufw status` |
| Error SSL / "too many redirects" | Cloudflare SSL/TLS harus **Full (strict)** |
| Error 500 setelah update | `docker compose logs -f app`; pastikan migrasi sudah dijalankan |
