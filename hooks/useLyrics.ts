'use client'
// ─────────────────────────────────────────────────────────────
// TunifyX — useLyrics hook
//
// Sources (tried in order):
//   1. lrclib.net — Indonesian + anime support, plain lyrics
//   2. lyrics.ovh — fallback, broader coverage
//
// Features:
//   - In-memory cache (survives re-renders, cleared on unmount)
//   - AbortController cancels in-flight requests on fast track switch
//   - Title/artist cleaning (strips "[Official MV]", "VEVO" etc.)
//   - Never throws — always resolves to lyrics or null
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import type { Track } from '@/lib/types'

export type LyricsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found';   lyrics: string }
  | { status: 'not_found' }
  | { status: 'error';   message: string }

// ── In-memory cache: videoId → LyricsState ───────────────────
// Lives for the session, no localStorage (lyrics can be large)
const cache = new Map<string, LyricsState>()

// ── Title/artist cleaning ─────────────────────────────────────
function cleanTitle(raw: string): string {
  return raw
    // Remove brackets with common suffixes
    .replace(/\s*[\(\[【][^\)\]】]*?(official|lyric|audio|mv|video|hd|4k|remaster|vevo|ost|ver|version|feat|ft\.)[^\)\]】]*?[\)\]】]/gi, '')
    // Remove trailing separators and channel names: "- BTS", "× VEVO", "| Lyrics"
    .replace(/\s*[-–—×|·]\s*.{0,40}$/i, '')
    // Remove feat/ft
    .replace(/\s*(feat\.?|ft\.?)\s+.+$/i, '')
    // Cleanup whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanArtist(raw: string): string {
  return raw
    .replace(/\s*VEVO$/i, '')
    .replace(/\s*Official$/i, '')
    .replace(/\s*Music$/i, '')
    .replace(/\s*Records?$/i, '')
    .replace(/\s*TV$/i, '')
    .replace(/\s*Channel$/i, '')
    .replace(/\s*[-–]\s*.+$/, '')   // "BTS - Big Hit" → "BTS"
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Source 1: lrclib.net ──────────────────────────────────────
async function fromLrclib(
  title: string,
  artist: string,
  signal: AbortSignal
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ track_name: title })
    if (artist) params.set('artist_name', artist)

    const res = await fetch(`https://lrclib.net/api/search?${params}`, {
      signal,
      headers: { 'User-Agent': 'TunifyX/1.0' },
    })
    if (!res.ok) return null

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    // Prefer plain lyrics, then strip timestamps from synced
    const match = data.find((d: any) => d.plainLyrics) || data.find((d: any) => d.syncedLyrics)
    if (!match) return null

    if (match.plainLyrics) return match.plainLyrics.trim()

    // Strip LRC timestamps: [00:12.34]
    return match.syncedLyrics
      .replace(/\[\d{2}:\d{2}[.:]\d{2,3}\]/g, '')
      .replace(/^\s*\n/gm, '')
      .trim()
  } catch (e: any) {
    if (e.name === 'AbortError') throw e  // re-throw so caller knows
    return null
  }
}

// ── Source 2: lyrics.ovh ─────────────────────────────────────
async function fromLyricsOvh(
  title: string,
  artist: string,
  signal: AbortSignal
): Promise<string | null> {
  if (!artist || !title) return null
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    const res = await fetch(url, { signal })
    if (!res.ok) return null
    const data = await res.json()
    return data.lyrics?.trim() || null
  } catch (e: any) {
    if (e.name === 'AbortError') throw e
    return null
  }
}

// ── Main fetch orchestrator ───────────────────────────────────
async function fetchLyrics(
  track: Track,
  signal: AbortSignal
): Promise<LyricsState> {
  const title  = cleanTitle(track.title)
  const artist = cleanArtist(track.artist)

  if (!title) return { status: 'not_found' }

  // Strategy 1: lrclib with artist
  let lyrics = await fromLrclib(title, artist, signal)

  // Strategy 2: lrclib title-only (if artist returns nothing)
  if (!lyrics && artist) {
    lyrics = await fromLrclib(title, '', signal)
  }

  // Strategy 3: lrclib with first word of artist (e.g. "BTS" from "BTS Official")
  if (!lyrics && artist.includes(' ')) {
    lyrics = await fromLrclib(title, artist.split(' ')[0], signal)
  }

  // Strategy 4: lyrics.ovh with artist
  if (!lyrics && artist) {
    lyrics = await fromLyricsOvh(title, artist, signal)
  }

  // Strategy 5: lyrics.ovh swapped (artist=title, title=artist)
  if (!lyrics && artist) {
    lyrics = await fromLyricsOvh(artist, title, signal)
  }

  if (lyrics) return { status: 'found', lyrics }
  return { status: 'not_found' }
}

// ── Hook ──────────────────────────────────────────────────────
export function useLyrics(track: Track | null) {
  const [state, setState] = useState<LyricsState>({ status: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!track) {
      setState({ status: 'idle' })
      return
    }

    // Cache hit
    const cached = cache.get(track.videoId)
    if (cached) {
      setState(cached)
      return
    }

    // Cancel any in-flight request for previous track
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState({ status: 'loading' })

    fetchLyrics(track, controller.signal)
      .then(result => {
        cache.set(track.videoId, result)
        setState(result)
      })
      .catch(err => {
        if (err.name === 'AbortError') return // silently ignore cancels
        const errState: LyricsState = { status: 'error', message: 'Gagal memuat lirik' }
        cache.set(track.videoId, errState)
        setState(errState)
      })

    return () => {
      controller.abort()
    }
  }, [track?.videoId])  // re-run only when track changes

  return state
}
