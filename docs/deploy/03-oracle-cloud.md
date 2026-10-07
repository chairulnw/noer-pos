# Opsi B · Oracle Cloud Always Free

Gratis permanen untuk bentuk **Always Free** (VM ARM Ampere A1, total sampai 4 OCPU / 24 GB RAM, disk 200 GB). Cocok untuk uji coba atau staging. Kuota dan kebijakan bisa berubah; cek halaman Oracle Free Tier saat mendaftar.

## 1. Daftar akun

- [ ] Buka **oracle.com/cloud/free** → Start for free. Siapkan email dan kartu kredit/debit (verifikasi, tidak ditagih untuk Always Free).
- [ ] **Home Region**: pilih **Indonesia (Batam)** bila tersedia, kalau tidak **Singapore**. **Tidak bisa diganti** dan kuota gratis hanya berlaku di region ini.
- [ ] Opsional tapi disarankan: setelah aktif, **Upgrade to Pay As You Go**. Tetap Rp 0 selama memakai sumber daya Always Free, tapi VM tidak ditandai "menganggur" dan lebih mudah mendapat kapasitas. Pasang **Budget alert** Rp 1 agar tahu bila ada biaya.

## 2. Buat VM

- [ ] Menu ☰ → **Compute → Instances → Create instance**.
- [ ] **Image**: Canonical **Ubuntu 22.04 / 24.04** (versi aarch64).
- [ ] **Shape**: Change shape → **Ampere → VM.Standard.A1.Flex** → **2 OCPU, 12 GB** (cukup untuk klinik; sisakan kuota). Pastikan ada label **Always Free-eligible**.
- [ ] **Networking**: biarkan VCN baru, **Assign a public IPv4 address**.
- [ ] **SSH keys**: Generate key pair → **unduh private key** (simpan baik-baik), atau unggah public key milik Anda.
- [ ] **Boot volume**: 50–100 GB (masih dalam 200 GB gratis).
- [ ] **Create**. Bila muncul **Out of capacity**: coba Availability Domain lain, coba lagi malam/dini hari, atau kurangi ke 1 OCPU / 6 GB.

## 3. Buka port 80 dan 443 (dua lapis firewall)

Oracle punya firewall jaringan **dan** firewall di dalam Ubuntu. Keduanya harus dibuka.

- [ ] **Lapis 1 (jaringan)**: Instance → klik **Subnet** → **Security List** default → **Add Ingress Rules**: Source `0.0.0.0/0`, TCP, port `80` dan `443`.
- [ ] **Lapis 2 (di VM)**, setelah SSH masuk:

```bash
ssh -i kunci-oracle.key ubuntu@IP_PUBLIK
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

> Jangan memakai `ufw` di image Ubuntu Oracle; aturan bawaannya memakai iptables dan bisa bentrok.

## 4. Siapkan server dan pasang aplikasi

```bash
sudo apt update && sudo apt -y upgrade
sudo timedatectl set-timezone Asia/Jakarta
sudo apt install -y unattended-upgrades git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && newgrp docker
```

Lalu sama seperti [Opsi A bagian 4](02-vps-lokal.md#4-pasang-aplikasi) (clone, `.env`, migrasi, buat Admin, `docker compose up -d --build app caddy`). Semua image (Node, PostgreSQL, Caddy) mendukung ARM; build pertama ±5–10 menit.

Domain: Cloudflare A record `pos` → IP publik VM (lihat [01](01-domain-cloudflare.md)).

## 5. Risiko yang harus diterima

- Tanpa jaminan uptime dan tanpa CS; VM gratis dapat dihentikan bila dianggap menganggur (kurangi dengan Pay As You Go).
- **Backup ke luar Oracle wajib** ([05](05-backup-offsite.md)): bila akun bermasalah, data dipulihkan ke VPS lain dalam hitungan jam.
