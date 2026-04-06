'use client'
// TunifyX v3 — SearchView
// FIXED: controlled input, debounce 350ms, "Putar Semua" button
// FIXED: friendly error messages, mood shortcuts

import { useEffect, useRef, useState } from 'react'
import { useSearch } from '@/hooks/useSearch'
import { TrackCard } from '@/components/search/TrackCard'
import { TrackCardSkeleton } from '@/components/ui/Skeleton'
import { MOOD_PRESETS } from '@/lib/utils'
import { usePlayerStore } from '@/lib/store'
import { toast } from '@/components/ui/Toast'

export function SearchView() {
  const { results, isLoading, error, query, search, clear } = useSearch()
  const { playContext, addManyToQueue } = usePlayerStore()
  const inputRef = useRef<HTMLInputElement>(null)
  // ✅ FIXED: controlled input value
  const [inputVal, setInputVal] = useState(query)

  // Listen for external search triggers (mood cards from Home)
  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent).detail as string
      setInputVal(q)
      search(q)
    }
    window.addEventListener('tunifyx:search', handler)
    return () => window.removeEventListener('tunifyx:search', handler)
  }, [search])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  function handleChange(val: string) {
    setInputVal(val)
    search(val)
  }

  function handleClear() {
    setInputVal('')
    clear()
    inputRef.current?.focus()
  }

  function searchMood(q: string) {
    setInputVal(q)
    search(q)
  }

  return (
    <div className="px-4 md:px-8 py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-5">Cari</h1>

      {/* Search input */}
      <div className="relative mb-6">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-black/50 pointer-events-none"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"
        >
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        {/* ✅ FIXED: controlled input */}
        <input
          ref={inputRef}
          type="search"
          placeholder="Cari lagu, artis, atau mood..."
          autoComplete="off"
          spellCheck={false}
          value={inputVal}
          onChange={e => handleChange(e.target.value)}
          className="w-full bg-white text-black placeholder-black/40 rounded-full py-3.5 pl-12 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1DB954] transition-shadow"
        />
        {inputVal && (
          <button
            onClick={handleClear}
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
            <TrackCardSkeleton key={i} style={{ animationDelay: `${i * 0.04}s` }} />
          ))}
        </div>
      )}

      {/* ✅ FIXED: friendly error message (no "Vercel" jargon for users) */}
      {error && !isLoading && (
        <div className="text-center py-10 animate-fade-in">
          <div className="text-4xl mb-3">🔌</div>
          <p className="text-white font-medium mb-1">Pencarian tidak tersedia</p>
          <p className="text-[#b3b3b3] text-sm mb-4">Layanan sedang gangguan. Coba lagi sebentar.</p>
          <button
            onClick={() => search(inputVal)}
            className="text-sm bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full transition-colors"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* No results */}
      {!isLoading && !error && inputVal && results.length === 0 && (
        <div className="text-center py-10 animate-fade-in">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-[#b3b3b3]">
            Tidak ada hasil untuk <span className="text-white">"{inputVal}"</span>
          </p>
          <p className="text-[#b3b3b3]/60 text-sm mt-1">Coba kata kunci lain</p>
        </div>
      )}

      {/* ✅ NEW: Results with "Play All" + "Add All to Queue" */}
      {!isLoading && results.length > 0 && (
        <div className="animate-fade-in">
          {/* Action row */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => playContext(results, 0)}
              className="flex items-center gap-2 bg-[#1DB954] text-black text-sm font-bold px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              Putar Semua
            </button>
            <button
              onClick={() => {
                addManyToQueue(results)
                toast(`✓ ${results.length} lagu ditambahkan ke antrian`)
              }}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-full transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Semua ke Antrian
            </button>
            <span className="text-xs text-[#b3b3b3] ml-auto">{results.length} hasil</span>
          </div>

          <div className="space-y-0.5">
            {results.map((track, i) => (
              <TrackCard key={track.videoId} track={track} tracks={results} index={i} showIndex />
            ))}
          </div>
        </div>
      )}

      {/* Empty state — mood presets */}
      {!inputVal && !isLoading && (
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
