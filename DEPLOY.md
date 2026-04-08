# 🚀 TunifyX — Panduan Deploy

---

## ☁️ OPSI 1: Deploy ke Vercel (Recommended)

### Langkah 1 — Push ke GitHub

```bash
cd tunifyx
git init
git add .
git commit -m "TunifyX v6"
git branch -M main
git remote add origin https://github.com/USERNAME/tunifyx.git
git push -u origin main
```

### Langkah 2 — Import ke Vercel

1. Buka **[vercel.com](https://vercel.com)** → login
2. Klik **Add New Project**
3. Pilih repo `tunifyx` dari GitHub
4. Vercel otomatis detect Next.js
5. Di bagian **Environment Variables**, tambahkan:

| Name | Value |
|------|-------|
| `YOUTUBE_API_KEY` | `AIzaSy...` (key YouTube lo) |

6. Klik **Deploy**

### Langkah 3 — Dapat YouTube API Key

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Buat project baru
3. **APIs & Services → Library** → cari `YouTube Data API v3` → **Enable**
4. **APIs & Services → Credentials → Create Credentials → API Key**
5. Copy key → paste ke Vercel Environment Variables

### Update Environment Variables (setelah deploy)

```
Vercel Dashboard → Project → Settings → Environment Variables
```
Setelah update env var → klik **Redeploy**

---

## 🟠 OPSI 2: Deploy ke Cloudflare Pages

> **Catatan penting:** Cloudflare Pages menggunakan Edge Runtime (V8 isolates),
> bukan Node.js. TunifyX sudah dikonfigurasi untuk ini — semua API routes
> menggunakan `export const runtime = 'edge'`.

### Langkah 1 — Push ke GitHub (sama seperti Vercel)

```bash
git init
git add .
git commit -m "TunifyX v6"
git remote add origin https://github.com/USERNAME/tunifyx.git
git push -u origin main
```

### Langkah 2 — Connect ke Cloudflare Pages

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com)
2. Pilih **Workers & Pages → Create application → Pages**
3. Klik **Connect to Git**
4. Pilih repo `tunifyx`
5. Set build settings:

| Setting | Value |
|---------|-------|
| Framework preset | **Next.js** |
| Build command | `npx @cloudflare/next-on-pages` |
| Build output directory | `.vercel/output/static` |
| Node.js version | `20` |

6. Di **Environment Variables (production)**:

| Name | Value |
|------|-------|
| `YOUTUBE_API_KEY` | `AIzaSy...` |
| `NODE_VERSION` | `20` |

7. Klik **Save and Deploy**

### Langkah 3 — Tambahkan compatibility flag

Di Cloudflare Dashboard setelah deploy:

```
Pages → tunifyx → Settings → Functions → Compatibility flags
```

Tambahkan flag: **`nodejs_compat`**

Ini wajib agar fetch API bekerja dengan benar di CF Workers.

### Dev lokal untuk Cloudflare

```bash
npm install
cp .dev.vars.example .dev.vars   # isi YOUTUBE_API_KEY
npm run build:cf
npm run preview:cf
```

---

## 🔑 Environment Variables

| Variable | Wajib | Keterangan |
|----------|-------|-----------|
| `YOUTUBE_API_KEY` | ✅ | YouTube Data API v3 — untuk search & trending |

---

## ⚡ Perbedaan Vercel vs Cloudflare Pages

| | Vercel | Cloudflare Pages |
|--|--------|-----------------|
| Setup | Termudah, zero config | Perlu compatibility flag |
| Cold start | ~100-300ms | ~0ms (edge, selalu warm) |
| Free tier | 100GB bandwidth/bulan | 100k req/hari |
| Region | Auto (nearest) | Global edge (150+ PoP) |
| API runtime | Node.js + Edge | Edge only |
| Custom domain | ✅ | ✅ |
| Recommended for | Simplest setup | Performance + global |

---

## ❓ Troubleshooting

### "YOUTUBE_API_KEY is not set"
→ Pastikan env var sudah di-set di dashboard dan sudah **Redeploy**

### Build gagal di Cloudflare: "module not found"
→ Pastikan `NODE_VERSION = 20` di environment variables CF

### API search tidak jalan
→ Pastikan YouTube Data API v3 sudah di-**Enable** di Google Cloud Console
→ Cek quota: [console.cloud.google.com/apis/dashboard](https://console.cloud.google.com/apis/dashboard)

### Lagu tidak muter (YouTube IFrame blocked)
→ Ini bukan masalah deploy — YouTube IFrame API butuh koneksi dari browser user
→ Pastikan tidak ada adblocker yang block `youtube.com`

### Cloudflare: "Script startup exceeded CPU time limit"
→ Tambahkan `nodejs_compat` di compatibility flags (lihat Langkah 3)
