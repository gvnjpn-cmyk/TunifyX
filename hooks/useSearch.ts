'use client'

import { useState, useCallback, useRef } from 'react'
import type { Track } from '@/lib/types'

const cache = new Map<string, { tracks: Track[]; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 min

export function useSearch() {
  const [results, setResults]   = useState<Track[]>([])
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [query, setQuery]       = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback((q: string) => {
    setQuery(q)
    clearTimeout(timerRef.current)

    if (!q.trim()) {
      setResults([])
      setError(null)
      return
    }

    timerRef.current = setTimeout(async () => {
      const key = q.trim().toLowerCase()

      // Cache hit
      const cached = cache.get(key)
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setResults(cached.tracks)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Search failed')
        cache.set(key, { tracks: data.tracks, ts: Date.now() })
        setResults(data.tracks || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }, 500)
  }, [])

  const clear = useCallback(() => {
    setResults([])
    setQuery('')
    setError(null)
    clearTimeout(timerRef.current)
  }, [])

  return { results, isLoading, error, query, search, clear }
}
