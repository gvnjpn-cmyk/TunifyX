'use client'
// TunifyX v3 — HomeView
// FIXED: horizontal scroll for trending (mobile friendly)
// FIXED: onboarding empty state for first-time users
// FIXED: no duplicate content between Liked + Recently Played

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { usePlayerStore } from '@/lib/store'
import { GridCard } from '@/components/search/TrackCard'
import { GridCardSkeleton } from '@/components/ui/Skeleton'
import { MOOD_PRESETS } from '@/lib/utils'
import type { Track } from '@/lib/types'
import { ResumeCard } from './ResumeCard'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Masih melek nih 🌙'
  if (h < 11) return 'Selamat pagi ☀️'
  if (h < 15) return 'Selamat siang 🌤'
  if (h < 18) return 'Selamat sore 🌆'
  if (h < 21) return 'Selamat malam 🌙'
  return 'Malam ini dengerin apa? 🎵'
}

// ✅ Horizontal scroll row component
function HorizontalRow({ tracks, onPlay }: { tracks: Track[]; onPlay: (i: number) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:-mx-8 md:px-8">
      {tracks.map((track, i) => (
        <div
          key={track.videoId}
          className="group cursor-pointer shrink-0 w-36 md:w-44"
          onClick={() => onPlay(i)}
        >
          <div className="relative aspect-square rounded-md overflow-hidden mb-2 bg-[#282828]">
            <Image
              src={track.thumbnail} alt={track.title}
              fill className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2">
              <div className="w-9 h-9 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" fill="black" width="14" height="14">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              </div>
            </div>
          </div>
          <p className="text-xs font-medium truncate text-white">{track.title}</p>
          <p className="text-xs text-[#b3b3b3] truncate mt-0.5">{track.artist}</p>
        </div>
      ))}
    </div>
  )
}

export function HomeView() {
  const { setActiveView, history, playContext, likes } = usePlayerStore()
  const [trending, setTrending] = useState<Track[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  function loadTrending() {
    setLoading(true); setError(false)
    fetch('/api/trending')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setTrending(d.tracks || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTrending() }, [])

  function searchMood(query: string) {
    setActiveView('search')
    window.dispatchEvent(new CustomEvent('tunifyx:search', { detail: query }))
  }

  const isEmpty = !loading && !error && trending.length === 0 && history.length === 0

  // ✅ FIXED: First-time user onboarding state
  if (isEmpty && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center animate-fade-in">
        <div className="text-6xl mb-5">🎵</div>
        <h1 className="text-2xl font-bold mb-2">Selamat datang di TunifyX</h1>
        <p className="text-[#b3b3b3] mb-8 text-sm leading-relaxed">
          Temukan dan dengarkan jutaan lagu dari YouTube.<br/>Mulai dengan mencari lagu favoritmu.
        </p>
        <button
          onClick={() => setActiveView('search')}
          className="flex items-center gap-2 bg-[#1DB954] text-black font-bold px-8 py-3.5 rounded-full hover:scale-105 active:scale-95 transition-transform text-sm shadow-lg"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          Cari Lagu Pertamamu
        </button>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 w-full max-w-md">
          {MOOD_PRESETS.slice(0, 4).map(mood => (
            <button
              key={mood.label}
              onClick={() => searchMood(mood.query)}
              className="relative overflow-hidden rounded-lg p-3 h-16 text-left hover:scale-[1.03] transition-transform"
              style={{ background: mood.color }}
            >
              <span className="text-2xl absolute -bottom-0 -right-1 rotate-12 opacity-60">{mood.emoji}</span>
              <span className="font-semibold text-xs text-white">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-8 animate-fade-in">
      <h1 className="text-2xl md:text-3xl font-bold">{getGreeting()}</h1>

      {/* ── Resume Card ── */}
      <ResumeCard />

      {/* Quick picks — recent history as pill buttons */}
      {history.length > 0 && (
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {history.slice(0, 6).map((track, i) => (
              <button
                key={track.videoId}
                onClick={() => playContext(history, i)}
                className="flex items-center gap-3 bg-white/10 hover:bg-white/15 active:bg-white/20 rounded-md overflow-hidden transition-all text-left"
              >
                <img src={track.thumbnail} alt="" className="w-12 h-12 object-cover shrink-0" />
                <span className="text-sm font-semibold truncate pr-2 leading-tight">{track.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Moods */}
      <section>
        <h2 className="text-xl font-bold mb-4">Jelajahi Genre</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MOOD_PRESETS.map(mood => (
            <button
              key={mood.label}
              onClick={() => searchMood(mood.query)}
              className="relative overflow-hidden rounded-lg p-4 h-20 text-left hover:scale-[1.03] active:scale-[0.98] transition-transform"
              style={{ background: mood.color }}
            >
              <span className="text-3xl absolute -bottom-1 -right-1 rotate-12 opacity-70">{mood.emoji}</span>
              <span className="font-bold text-sm text-white relative z-10">{mood.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Trending — ✅ FIXED: horizontal scroll */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Trending di Indonesia</h2>
          {!loading && !error && (
            <button
              onClick={() => searchMood('lagu indonesia trending 2024')}
              className="text-sm text-[#b3b3b3] hover:text-white transition-colors"
            >
              Lihat semua
            </button>
          )}
        </div>

        {error ? (
          <div className="text-center py-8 text-[#b3b3b3]">
            <p className="text-sm">Gagal memuat trending.</p>
            <button onClick={loadTrending} className="mt-2 text-sm text-[#1DB954] hover:underline">
              Coba lagi
            </button>
          </div>
        ) : loading ? (
          // ✅ FIXED: Skeleton in horizontal row format
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:-mx-8 md:px-8">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="shrink-0 w-36 md:w-44">
                <div className="skeleton aspect-square w-full rounded-md mb-2" />
                <div className="skeleton h-3 w-4/5 rounded mb-1.5" />
                <div className="skeleton h-3 w-3/5 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <HorizontalRow
            tracks={trending}
            onPlay={i => playContext(trending, i)}
          />
        )}
      </section>

      {/* ✅ FIXED: Only show Liked Songs OR Recently Played, not both
          Priority: if user has liked songs, show those. Otherwise show history. */}
      {likes.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Liked Songs</h2>
            <button
              onClick={() => setActiveView('library')}
              className="text-sm text-[#b3b3b3] hover:text-white transition-colors"
            >
              Lihat semua
            </button>
          </div>
          <HorizontalRow
            tracks={likes.slice(0, 10)}
            onPlay={i => playContext(likes, i)}
          />
        </section>
      ) : history.length > 6 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Baru Diputar</h2>
          <HorizontalRow
            tracks={history.slice(6, 14)}
            onPlay={i => playContext(history, 6 + i)}
          />
        </section>
      )}
    </div>
  )
}
