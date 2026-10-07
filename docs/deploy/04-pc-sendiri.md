# Opsi C · PC sendiri (rumah/kantor, boleh beda kota dengan klinik)

Aplikasi berjalan di PC Anda dan tersambung ke internet lewat **Cloudflare Tunnel** (gratis): tanpa IP publik, tanpa membuka port router. Klinik membuka `https://pos.<domain>` seperti biasa. Cocok untuk uji coba/staging; untuk produksi lihat risikonya di bagian akhir.

## 1. Perangkat

- **Paling disarankan: mini PC khusus server** (mis. Intel N100, 8 GB RAM, SSD 256 GB; ±10–15 watt). Tidak dipakai browsing, game, atau kerja lain.
- **UPS** (±600 VA) untuk PC + modem/router agar tahan pemadaman singkat.
- Sambungkan PC ke router dengan **kabel LAN**, bukan Wi-Fi.
- BIOS: aktifkan **Restore on AC Power Loss → Power On** agar PC menyala sendiri setelah listrik kembali.

## 2. Sistem operasi

**Disarankan: Ubuntu Server 24.04 LTS** (gratis, ringan, jarang terkena virus).

- [ ] Unduh dari ubuntu.com/download/server → tulis ke flashdisk dengan balenaEtcher/Rufus → install.
- [ ] Saat instalasi: buat user `klinik`, centang **Install OpenSSH server**.
- [ ] Setelah selesai, dari laptop: `ssh klinik@IP_LOKAL_PC`.

```bash
sudo apt update && sudo apt -y upgrade
sudo timedatectl set-timezone Asia/Jakarta
sudo apt install -y unattended-upgrades git ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker klinik && newgrp docker
# firewall: tidak ada port yang perlu dibuka ke internet (Tunnel keluar dari dalam)
sudo ufw default deny incoming && sudo ufw default allow outgoing && sudo ufw allow from 192.168.0.0/16 to any port 22 && sudo ufw enable
```

> **Terpaksa memakai Windows?** Pasang Docker Desktop (aktifkan *Start when you log in*), buat **akun Windows khusus server** (bukan administrator harian), atur **Active hours** Windows Update di luar jam praktik, nonaktifkan sleep/hibernate, aktifkan Windows Defender, dan jangan pasang software bajakan. Perintah di bawah dijalankan dari PowerShell di folder aplikasi.

## 3. Buat Cloudflare Tunnel

Prasyarat: domain sudah **Active** di Cloudflare ([01](01-domain-cloudflare.md) bagian 1–2).

- [ ] Cloudflare → **Zero Trust** (gratis, pilih paket Free) → **Networks → Tunnels → Create a tunnel** → tipe **Cloudflared** → nama `klinik-pos`.
- [ ] Pada langkah instal connector pilih **Docker**, lalu **salin token** saja (teks panjang setelah `--token`). Jangan jalankan perintah yang ditampilkan; aplikasi sudah punya layanan tunnel sendiri.
- [ ] **Public Hostname → Add**: Subdomain `pos`, Domain `<domain>`, Service **HTTP** `app:3000` → Save. DNS dibuat otomatis.

## 4. Pasang aplikasi

```bash
sudo mkdir -p /opt/pos && sudo chown klinik /opt/pos
git clone <URL-REPO> /opt/pos && cd /opt/pos
cp .env.production.example .env && nano .env
#   DOMAIN=pos.<domain>
#   DB_PASSWORD=...  AUTH_SECRET=...   (lihat ../DEPLOY.md bagian 3)
#   TRUST_CLOUDFLARE=1
#   TUNNEL_TOKEN=<token dari langkah 3>
echo 'COMPOSE_FILE=docker-compose.prod.yml:docker-compose.tunnel.yml' >> .env && chmod 600 .env

docker compose up -d db
docker compose run --rm tools pnpm prisma migrate deploy
ADMIN_USERNAME=owner ADMIN_NAME="Nama Owner" ADMIN_PASSWORD='PasswordKuat2026' \
  docker compose run --rm tools pnpm tsx scripts/create-admin.ts
docker compose up -d --build app tunnel
```

`docker-compose.tunnel.yml` mematikan Caddy dan menyalakan `cloudflared`. HTTPS diurus Cloudflare. Semua layanan memakai `restart: unless-stopped`, jadi ikut menyala setelah PC restart.

Cek: Zero Trust → Tunnels → status **Healthy**; buka `https://pos.<domain>`.

## 5. Lapisan login tambahan (opsional, gratis)

Zero Trust → **Access → Applications → Add → Self-hosted** → domain `pos.<domain>` → Policy **Allow** → *Emails* daftar email staf. Sebelum halaman login aplikasi, staf diminta kode yang dikirim ke emailnya. Lewati bila staf tidak memakai email.

## 6. Pemantauan dan risiko

- [ ] **UptimeRobot** (gratis): monitor HTTPS `https://pos.<domain>/login` tiap 5 menit, notifikasi ke email/Telegram bila mati.
- Risiko: bila **listrik atau internet di lokasi PC** padam, klinik tidak bisa transaksi walau internet klinik normal; tidak ada yang bisa memperbaiki PC dari klinik; disk rusak/pencurian. Karena itu **backup ke cloud wajib** ([05](05-backup-offsite.md)) dan untuk produksi jangka panjang pertimbangkan [Opsi A](02-vps-lokal.md).
