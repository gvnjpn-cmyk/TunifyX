'use client'
// TunifyX v2 — SearchView

import { useEffect, useRef } from 'react'
import { useSearch } from '@/hooks/useSearch'
import { TrackCard } from '@/components/search/TrackCard'
import { TrackCardSkeleton } from '@/components/ui/Skeleton'
import { MOOD_PRESETS } from '@/lib/utils'
import { usePlayerStore } from '@/lib/store'

export function SearchView() {
  const { results, isLoading, error, query, search, clear } = useSearch()
  const { setActiveView } = usePlayerStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent).detail as string
      if (inputRef.current) inputRef.current.value = q
      search(q)
    }
    window.addEventListener('tunifyx:search', handler)
    return () => window.removeEventListener('tunifyx:search', handler)
  }, [search])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  function searchMood(q: string) { if (inputRef.current) inputRef.current.value = q; search(q) }

  return (
    <div className="px-4 md:px-8 py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-5">Cari</h1>

      {/* Search input */}
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-black/50 pointer-events-none"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder="Cari lagu, artis, atau mood..."
          autoComplete="off"
          spellCheck={false}
          defaultValue={query}
          onChange={e => search(e.target.value)}
          className="w-full bg-white text-black placeholder-black/40 rounded-full py-3.5 pl-12 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1DB954] transition-shadow"
        />
        {query && (
          <button
            onClick={() => { if (inputRef.current) inputRef.current.value = ''; clear() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
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
          {Array(6).fill(0).map((_, i) => (
            <TrackCardSkeleton key={i} style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-10 animate-fade-in">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-[#b3b3b3] font-medium mb-1">Pencarian gagal</p>
          <p className="text-[#b3b3b3]/60 text-xs mb-4">{error}</p>
          <p className="text-xs text-[#b3b3b3]/40">Cek YOUTUBE_API_KEY di Vercel</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && query && results.length === 0 && (
        <div className="text-center py-10 animate-fade-in">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-[#b3b3b3]">Tidak ada hasil untuk <span className="text-white">"{query}"</span></p>
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="animate-fade-in">
          <p className="text-xs text-[#b3b3b3] mb-3">{results.length} hasil untuk "{query}"</p>
          <div className="space-y-0.5">
            {results.map((track, i) => (
              <TrackCard key={track.videoId} track={track} tracks={results} index={i} showIndex />
            ))}
          </div>
        </div>
      )}

      {/* Empty state — show mood presets */}
      {!query && !isLoading && (
        <div className="animate-fade-in">
          <h2 className="text-base font-bold mb-4 text-[#b3b3b3]">Cari berdasarkan mood</h2>
          <div className="grid grid-cols-2 gap-3">
            {MOOD_PRESETS.map(mood => (
              <button
                key={mood.label}
                onClick={() => searchMood(mood.query)}
                className="relative overflow-hidden rounded-lg p-4 h-16 text-left hover:scale-[1.03] active:scale-[0.97] transition-transform"
                style={{ background: mood.color }}
              >
                <span className="text-2xl absolute -bottom-0 -right-1 rotate-12 opacity-60">{mood.emoji}</span>
                <span className="font-semibold text-sm text-white">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
