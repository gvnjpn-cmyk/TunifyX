'use client'
// TunifyX v2 — HomeView

import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/lib/store'
import { GridCard, TrackCard } from '@/components/search/TrackCard'
import { GridCardSkeleton } from '@/components/ui/Skeleton'
import { MOOD_PRESETS } from '@/lib/utils'
import type { Track } from '@/lib/types'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Masih melek nih 🌙'
  if (h < 11) return 'Selamat pagi ☀️'
  if (h < 15) return 'Selamat siang 🌤'
  if (h < 18) return 'Selamat sore 🌆'
  if (h < 21) return 'Selamat malam 🌙'
  return 'Malam ini dengerin apa? 🎵'
}

export function HomeView() {
  const { setActiveView, history, playContext, likes } = usePlayerStore()
  const [trending, setTrending] = useState<Track[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  useEffect(() => {
    fetch('/api/trending')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setTrending(d.tracks || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  function searchMood(query: string) {
    setActiveView('search')
    window.dispatchEvent(new CustomEvent('tunifyx:search', { detail: query }))
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-8 animate-fade-in">
      {/* Greeting */}
      <h1 className="text-2xl md:text-3xl font-bold">{getGreeting()}</h1>

      {/* Quick picks from history */}
      {history.length > 0 && (
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {history.slice(0, 6).map((track, i) => (
              <button
                key={track.videoId}
                onClick={() => playContext(history, i)}
                className="flex items-center gap-3 bg-white/10 hover:bg-white/15 active:bg-white/20 rounded-md overflow-hidden transition-all group"
              >
                <img src={track.thumbnail} alt="" className="w-12 h-12 object-cover shrink-0" />
                <span className="text-sm font-semibold text-left truncate pr-2 leading-tight">{track.title}</span>
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

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Trending di Indonesia</h2>
          {!loading && !error && (
            <button onClick={() => searchMood('lagu indonesia trending 2024')} className="text-sm text-[#b3b3b3] hover:text-white transition-colors">
              Lihat semua
            </button>
          )}
        </div>
        {error ? (
          <div className="text-center py-8 text-[#b3b3b3]">
            <p>Gagal memuat trending.</p>
            <button onClick={() => { setLoading(true); setError(false); fetch('/api/trending').then(r=>r.json()).then(d=>setTrending(d.tracks||[])).catch(()=>setError(true)).finally(()=>setLoading(false)) }}
              className="mt-2 text-sm text-[#1DB954] hover:underline">Coba lagi</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loading
              ? Array(8).fill(0).map((_, i) => <GridCardSkeleton key={i} />)
              : trending.slice(0, 8).map((t, i) => <GridCard key={t.videoId} track={t} tracks={trending} index={i} />)
            }
          </div>
        )}
      </section>

      {/* Liked songs */}
      {likes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Liked Songs</h2>
            <button onClick={() => setActiveView('library')} className="text-sm text-[#b3b3b3] hover:text-white transition-colors">
              Lihat semua
            </button>
          </div>
          <div className="space-y-1">
            {likes.slice(0, 5).map((t, i) => (
              <TrackCard key={t.videoId} track={t} tracks={likes} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Recently played */}
      {history.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Baru Diputar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {history.slice(0, 8).map((t, i) => <GridCard key={t.videoId} track={t} tracks={history} index={i} />)}
          </div>
        </section>
      )}
    </div>
  )
}
