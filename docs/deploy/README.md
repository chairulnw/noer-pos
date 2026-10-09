# Panduan Deploy

Tiga pilihan tempat menjalankan aplikasi. Kodenya sama; yang beda hanya server dan cara aplikasi tersambung ke internet.

| | [A. VPS lokal](02-vps-lokal.md) | [B. Oracle Cloud gratis](03-oracle-cloud.md) | [C. PC sendiri](04-pc-sendiri.md) |
|---|---|---|---|
| Biaya | ±Rp 100 rb/bulan | Rp 0 | Listrik (mini PC ±Rp 15 rb, PC desktop ±Rp 60–110 rb/bulan) |
| Cocok untuk | **Produksi (disarankan)** | Uji coba, staging | Uji coba, staging |
| Keandalan | SLA penyedia, ada CS | Tanpa jaminan, VM gratis bisa dihentikan | Bergantung listrik + internet rumah |
| Tersambung lewat | Caddy (HTTPS) + Cloudflare | Caddy (HTTPS) + Cloudflare | Cloudflare Tunnel (tanpa buka port) |
| Data pasien | Indonesia (Jakarta) | Batam/Singapura | Di rumah Anda |

## Urutan kerja

1. [01 · Domain dan Cloudflare](01-domain-cloudflare.md): semua opsi.
2. Pasang server sesuai pilihan: A, B, atau C.
3. [05 · Backup ke luar server](05-backup-offsite.md): **wajib**, semua opsi.
4. [06 · Go-live dan operasional](06-go-live-operasional.md): checklist sebelum dipakai, update, pemantauan.

Detail teknis bersama (isi `.env`, migrasi, membuat Admin, restore) ada di [../DEPLOY.md](../DEPLOY.md). Panduan di folder ini merujuk ke sana agar tidak ada dua versi.

## Istilah singkat

- **Server**: komputer yang menyala terus dan menjalankan aplikasi + database.
- **Docker / Docker Compose**: alat untuk menjalankan aplikasi, database, dan Caddy dengan satu perintah, sama persis di mana pun.
- **Caddy**: penjaga pintu yang memasang HTTPS (gembok) otomatis.
- **Cloudflare**: layanan gratis di depan server: menyaring serangan, menyembunyikan IP server, membatasi percobaan login.
- **SSH**: cara mengetik perintah ke server dari laptop Anda.

> **Hanya untuk uji coba/demo:** [07 · Vercel + Neon](07-vercel-demo.md) (branch `vercel`, tidak untuk dipakai usaha di paket gratis).
