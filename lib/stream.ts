// ─────────────────────────────────────────────────────────────
// TunifyX — Audio Stream Resolver
//
// Cara kerja SpotifyScraper (AliAkhtari78):
//   Repo tersebut menggunakan Python + requests/selenium untuk
//   scrape Spotify's internal embed API endpoint:
//   https://open.spotify.com/embed/track/{id}
//   dan mengekstrak preview_url (30-detik MP3) dari JSON response.
//
// Adaptasi ke Next.js serverless:
//   Karena Vercel serverless tidak bisa jalankan Python/Selenium,
//   kita adaptasi logicnya ke Node.js dengan fetch biasa.
//   Kita gunakan multiple source strategy:
//
//   1. Piped API  — open-source YouTube front-end, returns audio streams
//   2. Invidious  — alternatif YouTube front-end dengan API publik
//   3. YouTube nocookie embed (fallback via iframe, client-side)
//
// Risiko & catatan:
//   - Rate limit: Piped/Invidious bisa rate-limit jika terlalu banyak request
//   - Instance down: Gunakan multiple instances sebagai fallback
//   - Untuk production: pertimbangkan self-host Invidious
// ─────────────────────────────────────────────────────────────

import type { StreamResult } from './types'

// ── Piped instances (open-source YT frontend) ────────────────
// https://github.com/TeamPiped/Piped
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.in.projectsegfau.lt',
  'https://piped-api.garudalinux.org',
]

// ── Invidious instances ──────────────────────────────────────
// https://github.com/iv-org/invidious
const INVIDIOUS_INSTANCES = [
  'https://invidious.snopyta.org',
  'https://inv.riverside.rocks',
  'https://invidious.io.lol',
]

// ── Try Piped API ────────────────────────────────────────────
async function tryPiped(videoId: string): Promise<StreamResult | null> {
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/streams/${videoId}`, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'TunifyX/1.0' },
      })
      if (!res.ok) continue

      const data = await res.json()

      // Piped returns audioStreams array, pick best quality
      const audioStreams: any[] = data.audioStreams || []
      if (!audioStreams.length) continue

      // Prefer opus/webm at highest bitrate
      const sorted = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))
      const best = sorted.find(s => s.mimeType?.includes('audio')) || sorted[0]
      if (!best?.url) continue

      return {
        url:     best.url,
        source:  'piped',
        videoId,
      }
    } catch {
      // Try next instance
      continue
    }
  }
  return null
}

// ── Try Invidious API ────────────────────────────────────────
async function tryInvidious(videoId: string): Promise<StreamResult | null> {
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(
        `${base}/api/v1/videos/${videoId}?fields=adaptiveFormats,formatStreams`,
        {
          signal: AbortSignal.timeout(6000),
          headers: { 'User-Agent': 'TunifyX/1.0' },
        }
      )
      if (!res.ok) continue

      const data = await res.json()

      // adaptiveFormats: audio-only streams
      const formats: any[] = data.adaptiveFormats || []
      const audioOnly = formats
        .filter(f => f.type?.startsWith('audio/'))
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))

      if (audioOnly[0]?.url) {
        return {
          url:    audioOnly[0].url,
          source: 'invidious',
          videoId,
        }
      }

      // fallback to regular streams
      const streams: any[] = data.formatStreams || []
      if (streams[0]?.url) {
        return {
          url:    streams[0].url,
          source: 'invidious',
          videoId,
        }
      }
    } catch {
      continue
    }
  }
  return null
}

// ── Main resolver: try sources in order ──────────────────────
export async function resolveStream(videoId: string): Promise<StreamResult> {
  // 1. Try Piped first (faster, better quality info)
  const piped = await tryPiped(videoId)
  if (piped) return piped

  // 2. Try Invidious
  const inv = await tryInvidious(videoId)
  if (inv) return inv

  // 3. Fallback: return YouTube embed URL
  //    Client will use YouTube IFrame API to play
  return {
    url:    `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`,
    source: 'fallback',
    videoId,
  }
}

// ── Cache layer (in-memory, resets per serverless invocation) ─
// For production: replace with Redis/KV
const streamCache = new Map<string, { result: StreamResult; ts: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function resolveStreamCached(videoId: string): Promise<StreamResult> {
  const cached = streamCache.get(videoId)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.result
  }
  const result = await resolveStream(videoId)
  streamCache.set(videoId, { result, ts: Date.now() })
  return result
}
