# 🎵 TunifyX

Spotify-like music streaming app — Next.js 14, Tailwind CSS, Vercel-ready.

---

## 📁 Struktur Project

```
tunifyx/
├── app/
│   ├── api/
│   │   ├── search/route.ts      ← YouTube search endpoint
│   │   ├── trending/route.ts    ← Trending music endpoint
│   │   └── stream/route.ts      ← Audio stream resolver
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 ← App shell (routing via Zustand)
│
├── components/
│   ├── home/HomeView.tsx        ← Home page
│   ├── search/
│   │   ├── SearchView.tsx       ← Search page
│   │   └── TrackCard.tsx        ← Track card + grid card
│   ├── library/LibraryView.tsx  ← Library + playlist detail
│   ├── player/
│   │   ├── PlayerBar.tsx        ← Bottom player bar
│   │   └── FullscreenPlayer.tsx ← Mobile fullscreen player
│   ├── layout/
│   │   ├── Sidebar.tsx          ← Desktop sidebar
│   │   └── MobileNav.tsx        ← Mobile bottom nav
│   └── ui/
│       ├── Skeleton.tsx
│       └── Toast.tsx
│
├── lib/
│   ├── types.ts                 ← Shared TypeScript types
│   ├── youtube.ts               ← YouTube API v3 helpers
│   ├── stream.ts                ← Stream resolver (Piped/Invidious)
│   ├── store.ts                 ← Zustand global state
│   └── utils.ts                 ← Helpers, mood presets
│
├── hooks/
│   ├── useAudio.ts              ← HTML5 Audio controller
│   └── useSearch.ts             ← Search with debounce + cache
│
├── public/
│   ├── favicon.svg
│   └── manifest.json
│
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 🚀 Install & Jalankan Lokal

### 1. Clone & install

```bash
git clone https://github.com/username/tunifyx.git
cd tunifyx
npm install
```

### 2. Isi API key

```bash
cp .env.example .env.local
```

Buka `.env.local` dan isi:

```env
YOUTUBE_API_KEY=your_key_here
```

> **Cara dapat YouTube API Key:**
> 1. Buka [Google Cloud Console](https://console.cloud.google.com)
> 2. Buat project baru atau pilih yang ada
> 3. Klik **Library** → cari **YouTube Data API v3** → **Enable**
> 4. Klik **Credentials** → **Create Credentials** → **API Key**
> 5. Copy key dan paste ke `.env.local`

### 3. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deploy ke Vercel

### Cara 1: Via GitHub (recommended)

1. Push project ke GitHub
2. Buka [vercel.com](https://vercel.com) → **New Project**
3. Import repo GitHub kamu
4. Di bagian **Environment Variables**, tambahkan:
   - `YOUTUBE_API_KEY` = key YouTube kamu
5. Klik **Deploy**

### Cara 2: Via Vercel CLI

```bash
npm i -g vercel
vercel
# Ikuti instruksi, masukkan env var saat diminta
```

### Set env var setelah deploy:

Vercel Dashboard → Project → **Settings** → **Environment Variables**

---

## 🔑 Environment Variables

| Variable | Wajib | Keterangan |
|----------|-------|-----------|
| `YOUTUBE_API_KEY` | ✅ | YouTube Data API v3 key |
| `OPENROUTER_API_KEY` | ❌ | Opsional, untuk fitur AI (belum diimplementasi) |

---

## 🎧 Cara Kerja Audio Stream

### SpotifyScraper (AliAkhtari78) — Adaptasi

Repo asli SpotifyScraper (Python) bekerja dengan:
1. Fetch Spotify embed page: `https://open.spotify.com/embed/track/{id}`
2. Ekstrak JSON dari respons HTML (berisi `preview_url`)
3. `preview_url` adalah MP3 30-detik dari Spotify CDN

**Kenapa tidak langsung dipakai di Next.js/Vercel:**
- Ditulis dalam Python (tidak jalan di Node.js/V8)
- Perlu Selenium/Playwright untuk beberapa endpoint (tidak bisa di serverless)
- `preview_url` hanya 30 detik (bukan full track)

**Adaptasi TunifyX (Node.js, serverless-safe):**

```
lib/stream.ts
  ↓
1. Coba Piped API   → audio-only stream dari YouTube
2. Coba Invidious   → adaptive audio format
3. Fallback         → YouTube nocookie embed (IFrame)
```

### Piped API
- Open-source YouTube front-end
- Endpoint: `GET /streams/{videoId}`
- Returns: `audioStreams[]` dengan URL langsung
- Serverless-safe: pure HTTP fetch, no browser

### Invidious API
- Alternatif YouTube front-end
- Endpoint: `GET /api/v1/videos/{videoId}`
- Returns: `adaptiveFormats[]` audio-only
- Self-hostable untuk production

### Fallback: YouTube IFrame
- Jika semua gagal, client render `youtube-nocookie.com/embed`
- Gratis, selalu works, tapi punya visual YouTube

---

## ⚠️ Risiko & Solusi

| Risiko | Keterangan | Solusi |
|--------|-----------|--------|
| Rate limit Piped/Invidious | Public instances bisa throttle | Self-host Invidious |
| Instance down | Public instances kadang offline | Multiple instance fallback (sudah ada) |
| YouTube block | YouTube kadang block scraping | Gunakan official YouTube IFrame API |
| Vercel timeout | Stream resolve bisa lambat | `maxDuration = 10` sudah diset |

---

## 🧩 Fitur

- ✅ Search lagu via YouTube API v3
- ✅ Play/pause, next/prev, seek bar
- ✅ Volume control
- ✅ Shuffle & repeat (off/all/one)
- ✅ Queue management
- ✅ Playlist (localStorage)
- ✅ History/recently played
- ✅ Mood/genre presets
- ✅ Trending Indonesia
- ✅ Fullscreen player (mobile)
- ✅ Loading skeleton
- ✅ Toast notification
- ✅ PWA-ready (manifest)
- ✅ Mobile-first responsive

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Player**: HTML5 Audio + YouTube IFrame fallback
- **API**: Next.js Route Handlers (serverless)
- **Deploy**: Vercel
