import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// ─────────────────────────────────────────────────────────────
// TunifyX — Lyrics API Route
//
// Strategi pencarian (berurutan sampai ketemu):
//   1. lrclib  — title + artist
//   2. lrclib  — title only
//   3. lrclib  — title + first word artist
//   4. lrclib  — title agresif clean (semua dalam kurung dihapus)
//   5. lyrics.ovh — title + artist
//   6. lyrics.ovh — title agresif + artist
//
// Title cleaning berlapis — makin ke bawah makin agresif
// ─────────────────────────────────────────────────────────────

// ── Layer 1: clean ringan ─────────────────────────────────────
// Hapus tag umum YouTube tapi pertahankan judul asli
function cleanLight(raw: string): string {
  return raw
    // Hapus konten dalam kurung yang berisi keyword umum
    .replace(/\s*[\(\[【〔][^\)\]】〕]*?(official|lyric|audio|mv|video|hd|4k|remaster|vevo|ost|ver\.|version|feat|ft\.|prod|cover|remix|edit|visualizer|topic)[^\)\]】〕]*?[\)\]】〕]/gi, '')
    // Hapus trailing " - Channel Name" atau " | something"
    .replace(/\s*[-–—]\s*(official\s*)?(music\s*)?(video|audio|mv|lyric[s]?|ver\.?|version)[^-–—]*$/gi, '')
    // Hapus feat/ft setelah judul
    .replace(/\s*(feat\.?|ft\.?|with)\s+[^(\[]+/gi, '')
    // Cleanup
    .replace(/\s+/g, ' ').trim()
}

// ── Layer 2: clean sedang ─────────────────────────────────────
// Hapus trailing " - anything" setelah judul
function cleanMedium(raw: string): string {
  return cleanLight(raw)
    // Hapus semua setelah dash/pipe (biasanya channel name)
    .replace(/\s*[-–—×|·]\s*.+$/, '')
    .replace(/\s+/g, ' ').trim()
}

// ── Layer 3: clean agresif ────────────────────────────────────
// Hapus SEMUA konten dalam tanda kurung
function cleanAggressive(raw: string): string {
  return raw
    .replace(/\s*[\(\[【〔][^\)\]】〕]*?[\)\]】〕]/g, '')  // hapus semua kurung
    .replace(/\s*[-–—×|·]\s*.+$/, '')                     // hapus trailing dash
    .replace(/\s*(feat\.?|ft\.?|with)\s+.+$/gi, '')        // hapus feat
    .replace(/\s+/g, ' ').trim()
}

// ── Artist cleaning ───────────────────────────────────────────
function cleanArtist(raw: string): string {
  return raw
    .replace(/\s*VEVO$/i, '')
    .replace(/\s*Official$/i, '')
    .replace(/\s*(Music|Records?|Entertainment|TV|Channel|Studios?)$/i, '')
    .replace(/\s*[-–]\s*.+$/, '')   // "BTS - Big Hit" → "BTS"
    .replace(/\s+/g, ' ').trim()
}

// ── Ambil kata pertama artist ─────────────────────────────────
function firstWord(str: string): string {
  return str.split(/[\s,&+]/)[0].trim()
}

// ── Source 1: lrclib.net ──────────────────────────────────────
async function fromLrclib(title: string, artist: string): Promise<string | null> {
  if (!title) return null
  try {
    const params = new URLSearchParams({ track_name: title })
    if (artist) params.set('artist_name', artist)

    const res = await fetch(`https://lrclib.net/api/search?${params}`, {
      headers: { 'User-Agent': 'TunifyX/1.0' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null

    const data = await res.json()
    if (!Array.isArray(data) || !data.length) return null

    // Pilih yang paling relevan: ada plainLyrics duluan
    const hit = data.find((d: any) => d.plainLyrics) || data.find((d: any) => d.syncedLyrics)
    if (!hit) return null

    if (hit.plainLyrics) return hit.plainLyrics.trim()

    // Strip LRC timestamps [00:12.34]
    return hit.syncedLyrics
      .replace(/\[\d{2}:\d{2}[.:]\d{2,3}\]\s*/g, '')
      .replace(/^\s*\n/gm, '')
      .trim()
  } catch { return null }
}

// ── Source 2: lyrics.ovh ─────────────────────────────────────
async function fromLyricsOvh(title: string, artist: string): Promise<string | null> {
  if (!title || !artist) return null
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const raw = data.lyrics?.trim()
    if (!raw || raw.length < 30) return null // filter hasil terlalu pendek
    return raw
  } catch { return null }
}

// ── Orchestrator ──────────────────────────────────────────────
async function findLyrics(rawTitle: string, rawArtist: string): Promise<string | null> {
  const artist   = cleanArtist(rawArtist)
  const t1       = cleanLight(rawTitle)        // ringan
  const t2       = cleanMedium(rawTitle)       // sedang
  const t3       = cleanAggressive(rawTitle)   // agresif
  const artistFw = firstWord(artist)

  // Semua variasi title yang akan dicoba
  const titles = [...new Set([t1, t2, t3].filter(Boolean))]

  // Coba setiap variasi title × setiap source
  for (const title of titles) {
    // lrclib + full artist
    let r = await fromLrclib(title, artist)
    if (r) return r

    // lrclib + no artist
    r = await fromLrclib(title, '')
    if (r) return r

    // lrclib + first word artist
    if (artistFw && artistFw !== artist) {
      r = await fromLrclib(title, artistFw)
      if (r) return r
    }

    // lyrics.ovh + full artist
    r = await fromLyricsOvh(title, artist)
    if (r) return r

    // lyrics.ovh + first word artist
    if (artistFw && artistFw !== artist) {
      r = await fromLyricsOvh(title, artistFw)
      if (r) return r
    }
  }

  return null
}

// ── Handler ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const title  = req.nextUrl.searchParams.get('title')?.trim()
  const artist = req.nextUrl.searchParams.get('artist')?.trim() || ''

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const lyrics = await findLyrics(title, artist)

  if (lyrics) {
    return NextResponse.json({ lyrics }, {
      headers: {
        'Cache-Control': 'public, max-age=86400', // cache 24 jam
      },
    })
  }

  return NextResponse.json(
    { lyrics: null, tried: { title, artist } },
    { status: 404 }
  )
}
