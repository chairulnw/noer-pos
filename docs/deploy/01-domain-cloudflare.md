# 01 · Domain dan Cloudflare (semua opsi)

## 1. Beli domain

- Murah: **.my.id** (±Rp 15–25 rb/tahun, KTP) atau **.biz.id**. Profesional: **.com** / **.id**.
- Beli di registrar lokal (Niagahoster, Rumahweb, IDCloudHost, Dewaweb). Contoh: `noerklinik.my.id`.
- Aplikasi akan diakses di subdomain, mis. `pos.noerklinik.my.id`.

> Hanya untuk uji coba tanpa beli domain: opsi A/B bisa memakai **DuckDNS** gratis (`nama.duckdns.org`, isi IP server di duckdns.org) lalu lewati bagian Cloudflare. Opsi C (Tunnel) **wajib** domain sendiri di Cloudflare.

## 2. Sambungkan ke Cloudflare (gratis)

- [ ] Daftar di **cloudflare.com** → **Add a site** → ketik domain → pilih paket **Free**.
- [ ] Cloudflare memberi 2 **nameserver** (mis. `ada.ns.cloudflare.com`). Masuk ke panel registrar domain → ganti nameserver ke dua alamat itu → tunggu sampai Cloudflare menyatakan domain **Active** (beberapa menit sampai 24 jam).
- [ ] **SSL/TLS → Overview**: mode **Full (strict)**.
- [ ] **SSL/TLS → Edge Certificates**: aktifkan **Always Use HTTPS**.

## 3. Arahkan ke server

- **Opsi A dan B**: **DNS → Add record** → tipe **A**, nama `pos`, isi **IP publik server**, **Proxy status: Proxied (awan oranye)**.
- **Opsi C**: record dibuat otomatis oleh Cloudflare Tunnel (lihat [04-pc-sendiri.md](04-pc-sendiri.md)).

## 4. Batasi percobaan login (anti brute force)

- [ ] **Security → WAF → Rate limiting rules → Create rule**.
- [ ] Nama: `Batas login`. Jika: **URI Path** *contains* `/api/auth/callback` **dan** **Request Method** *equals* `POST`.
- [ ] Batas: **10 permintaan per 1 menit** per IP → Aksi **Block** selama **10 menit** → Deploy.
- [ ] Setelah server berjalan, isi `TRUST_CLOUDFLARE=1` di `.env` server lalu `docker compose up -d app` agar penguncian login di aplikasi memakai IP asli pengunjung. **Kosongkan** bila tidak memakai Cloudflare (header IP bisa dipalsukan).

## 5. Pengaturan tambahan yang disarankan

- [ ] **Security → Settings**: Security Level **Medium**; aktifkan **Bot Fight Mode**.
- [ ] **Security → WAF → Custom rules** (opsional): blokir negara yang tidak relevan, mis. *Country not in* `Indonesia` → **Managed Challenge** (staf yang sedang ke luar negeri akan diminta verifikasi, bukan diblokir).
- [ ] **Caching → Configuration**: biarkan default. Jangan buat aturan "Cache Everything" (halaman aplikasi berisi data pribadi).
