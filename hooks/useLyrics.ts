'use client'
// TunifyX — useLyrics hook
// Fetch via /api/lyrics (server-side, no CORS)
// Cache in-memory per session
// Manual search override saat lirik salah/tidak ada

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Track } from '@/lib/types'

export type LyricsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found';      lyrics: string }
  | { status: 'not_found' }
  | { status: 'error';      message: string }

// Session cache: videoId → state
const cache = new Map<string, LyricsState>()

export function useLyrics(track: Track | null) {
  const [state, setState]         = useState<LyricsState>({ status: 'idle' })
  const [manualQuery, setManual]  = useState<{ title: string; artist: string } | null>(null)
  const abortRef                  = useRef<AbortController | null>(null)

  // ── Fetch helper ────────────────────────────────────────────
  const fetchLyrics = useCallback((title: string, artist: string, cacheKey?: string) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setState({ status: 'loading' })

    const params = new URLSearchParams({ title, artist })
    fetch(`/api/lyrics?${params}`, { signal: ctrl.signal })
      .then(async res => {
        const data = await res.json()
        if (res.ok && data.lyrics) {
          const s: LyricsState = { status: 'found', lyrics: data.lyrics }
          if (cacheKey) cache.set(cacheKey, s)
          setState(s)
        } else {
          const s: LyricsState = { status: 'not_found' }
          if (cacheKey) cache.set(cacheKey, s)
          setState(s)
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        setState({ status: 'error', message: 'Gagal memuat lirik' })
      })
  }, [])

  // ── Auto fetch saat track berubah ───────────────────────────
  useEffect(() => {
    if (!track) { setState({ status: 'idle' }); return }

    // Reset manual query saat ganti lagu
    setManual(null)

    // Cache hit
    const cached = cache.get(track.videoId)
    if (cached) { setState(cached); return }

    fetchLyrics(track.title, track.artist, track.videoId)
    return () => abortRef.current?.abort()
  }, [track?.videoId])

  // ── Manual search (user koreksi judul/artist) ───────────────
  useEffect(() => {
    if (!manualQuery || !track) return
    // Manual search tidak di-cache ke videoId, biarkan retry fresh
    fetchLyrics(manualQuery.title, manualQuery.artist)
  }, [manualQuery])

  // ── Public: trigger manual search ───────────────────────────
  const searchManual = useCallback((title: string, artist: string) => {
    if (!title.trim()) return
    setManual({ title: title.trim(), artist: artist.trim() })
  }, [])

  // ── Public: retry dengan track sekarang ─────────────────────
  const retry = useCallback(() => {
    if (!track) return
    cache.delete(track.videoId) // hapus cache biar fetch ulang
    fetchLyrics(track.title, track.artist, track.videoId)
  }, [track, fetchLyrics])

  return { state, searchManual, retry }
}
