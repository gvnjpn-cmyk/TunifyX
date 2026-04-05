'use client'

import { useEffect, useRef } from 'react'
import { useSearch } from '@/hooks/useSearch'
import { TrackCard } from '@/components/search/TrackCard'
import { TrackCardSkeleton } from '@/components/ui/Skeleton'

export function SearchView() {
  const { results, isLoading, error, query, search, clear } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for programmatic search from home mood buttons
  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent).detail as string
      if (inputRef.current) inputRef.current.value = q
      search(q)
    }
    window.addEventListener('tunifyx:search', handler)
    return () => window.removeEventListener('tunifyx:search', handler)
  }, [search])

  // Focus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  return (
    <div className="px-4 md:px-8 py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-5">Cari</h1>

      {/* Search bar */}
      <div className="relative mb-6">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-black/60"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          width="18" height="18"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder="Cari lagu, artis, atau mood..."
          autoComplete="off"
          spellCheck={false}
          defaultValue={query}
          onChange={e => search(e.target.value)}
          className="w-full bg-white text-black placeholder-black/50 rounded-full py-3 pl-12 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-spotify-green"
        />
        {query && (
          <button
            onClick={() => { if (inputRef.current) inputRef.current.value = ''; clear() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black/60 hover:text-black"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-1">
          {Array(8).fill(0).map((_, i) => <TrackCardSkeleton key={i}/>)}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-10">
          <p className="text-red-400 text-sm">⚠ {error}</p>
          <p className="text-spotify-light text-xs mt-1">Cek API key di Vercel Environment Variables</p>
        </div>
      )}

      {/* No results */}
      {!isLoading && !error && query && results.length === 0 && (
        <div className="text-center py-10">
          <p className="text-spotify-light">Tidak ada hasil untuk &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-1 animate-fade-in">
          <p className="text-xs text-spotify-light mb-3">{results.length} hasil</p>
          {results.map((track, i) => (
            <TrackCard
              key={track.videoId}
              track={track}
              tracks={results}
              index={i}
              showIndex
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!query && !isLoading && (
        <div className="text-center py-16">
          <svg className="mx-auto mb-4 text-spotify-light/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p className="text-spotify-light">Ketik untuk cari lagu</p>
        </div>
      )}
    </div>
  )
}
