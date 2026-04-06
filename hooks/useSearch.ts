'use client'
// TunifyX v3 — useSearch
// FIXED: debounce 350ms (was 500ms)

import { useState, useCallback, useRef } from 'react'
import type { Track } from '@/lib/types'

const cache = new Map<string, { tracks: Track[]; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000

export function useSearch() {
  const [results, setResults]   = useState<Track[]>([])
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [query, setQuery]       = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const abortRef = useRef<AbortController>()

  const search = useCallback((q: string) => {
    setQuery(q)
    clearTimeout(timerRef.current)
    abortRef.current?.abort()

    if (!q.trim()) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    // ✅ FIXED: 350ms debounce (was 500ms)
    timerRef.current = setTimeout(async () => {
      const key = q.trim().toLowerCase()

      const cached = cache.get(key)
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setResults(cached.tracks)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      abortRef.current = new AbortController()

      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, {
          signal: abortRef.current.signal
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Search failed')
        cache.set(key, { tracks: data.tracks, ts: Date.now() })
        setResults(data.tracks || [])
      } catch (err: any) {
        if (err.name === 'AbortError') return // ignore cancelled requests
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [])

  const clear = useCallback(() => {
    setResults([])
    setQuery('')
    setError(null)
    setLoading(false)
    clearTimeout(timerRef.current)
    abortRef.current?.abort()
  }, [])

  return { results, isLoading, error, query, search, clear }
}
