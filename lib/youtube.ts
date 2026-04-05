// ─────────────────────────────────────────────────────────────
// TunifyX — YouTube Data API v3 helpers
// Semua fetch ke YouTube API lewat sini (server-side only)
// ─────────────────────────────────────────────────────────────

import type { Track } from './types'

const YT_BASE = 'https://www.googleapis.com/youtube/v3'

function getKey(): string {
  const k = process.env.YOUTUBE_API_KEY
  if (!k) throw new Error('YOUTUBE_API_KEY is not set')
  return k
}

// ── Format PT3M45S → "3:45" ──────────────────────────────────
function parseDuration(iso: string): { str: string; sec: number } {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return { str: '0:00', sec: 0 }
  const h = parseInt(match[1] || '0')
  const m = parseInt(match[2] || '0')
  const s = parseInt(match[3] || '0')
  const total = h * 3600 + m * 60 + s
  const parts = h > 0
    ? [h, String(m).padStart(2, '0'), String(s).padStart(2, '0')]
    : [m, String(s).padStart(2, '0')]
  return { str: parts.join(':'), sec: total }
}

// ── Snippet → Track ──────────────────────────────────────────
function snippetToTrack(item: any): Track {
  const id = typeof item.id === 'string' ? item.id : item.id?.videoId
  return {
    videoId:   id || '',
    title:     item.snippet?.title || 'Unknown',
    artist:    item.snippet?.channelTitle || 'Unknown',
    thumbnail: item.snippet?.thumbnails?.medium?.url
            || item.snippet?.thumbnails?.default?.url
            || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    duration:  '—',
  }
}

// ── Search (query string) ────────────────────────────────────
export async function searchYoutube(
  query: string,
  maxResults = 20
): Promise<Track[]> {
  const key = getKey()

  // Step 1: search for video IDs
  const searchUrl = new URL(`${YT_BASE}/search`)
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('q', query)
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('videoCategoryId', '10') // Music
  searchUrl.searchParams.set('maxResults', String(maxResults))
  searchUrl.searchParams.set('key', key)

  const searchRes = await fetch(searchUrl.toString(), {
    next: { revalidate: 300 }, // cache 5 min
  })

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}))
    throw new Error(err?.error?.message || `YouTube search failed: ${searchRes.status}`)
  }

  const searchData = await searchRes.json()
  const items: any[] = searchData.items || []
  if (!items.length) return []

  // Step 2: fetch video details (duration) in one batch
  const ids = items.map((i: any) => i.id?.videoId).filter(Boolean).join(',')
  const detailUrl = new URL(`${YT_BASE}/videos`)
  detailUrl.searchParams.set('part', 'contentDetails,snippet')
  detailUrl.searchParams.set('id', ids)
  detailUrl.searchParams.set('key', key)

  const detailRes = await fetch(detailUrl.toString(), { next: { revalidate: 300 } })
  const detailData = detailRes.ok ? await detailRes.json() : { items: [] }
  const detailMap = new Map(
    (detailData.items || []).map((d: any) => [d.id, d])
  )

  return items.map((item: any): Track => {
    const id     = item.id?.videoId || ''
    const detail = detailMap.get(id) as any
    const dur    = detail?.contentDetails?.duration
      ? parseDuration(detail.contentDetails.duration)
      : { str: '—', sec: 0 }

    return {
      videoId:     id,
      title:       item.snippet?.title || 'Unknown',
      artist:      item.snippet?.channelTitle || 'Unknown',
      thumbnail:   item.snippet?.thumbnails?.medium?.url
                || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      duration:    dur.str,
      durationSec: dur.sec,
    }
  })
}

// ── Trending Music (Indonesia) ───────────────────────────────
export async function getTrending(maxResults = 16): Promise<Track[]> {
  const key = getKey()

  const url = new URL(`${YT_BASE}/videos`)
  url.searchParams.set('part', 'snippet,contentDetails')
  url.searchParams.set('chart', 'mostPopular')
  url.searchParams.set('videoCategoryId', '10')
  url.searchParams.set('regionCode', 'ID')
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('key', key)

  const res = await fetch(url.toString(), { next: { revalidate: 600 } })
  if (!res.ok) throw new Error('Failed to fetch trending')

  const data = await res.json()
  return (data.items || []).map((item: any): Track => {
    const dur = item.contentDetails?.duration
      ? parseDuration(item.contentDetails.duration)
      : { str: '—', sec: 0 }
    return {
      videoId:     item.id,
      title:       item.snippet?.title || 'Unknown',
      artist:      item.snippet?.channelTitle || 'Unknown',
      thumbnail:   item.snippet?.thumbnails?.medium?.url
                || `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
      duration:    dur.str,
      durationSec: dur.sec,
    }
  })
}

// ── Smart query transform (from Noctyra Search logic) ────────
export function smartQuery(raw: string): string {
  const q = raw.toLowerCase().trim()
  if (/lagu indo|pop indo|galau|baper|dangdut|koplo|indonesia/.test(q)) return `${raw} official audio`
  if (/anime|vocaloid|j-pop|jpop|opening|ending|ost|miku/.test(q))      return `${raw} official audio`
  if (/kpop|k-pop|bts|blackpink|twice|aespa|newjeans/.test(q))          return `${raw} official mv`
  if (/lofi|lo-fi|chill|study music|relax/.test(q))                      return `${raw} music`
  return `${raw} official audio`
}
