'use client'

import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/lib/store'
import { GridCard } from '@/components/search/TrackCard'
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
  const { setActiveView, history, setQueue } = usePlayerStore()
  const [trending, setTrending]   = useState<Track[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then(d => setTrending(d.tracks || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function searchMood(query: string) {
    setActiveView('search')
    // dispatch to search view via custom event
    window.dispatchEvent(new CustomEvent('tunifyx:search', { detail: query }))
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-8 animate-fade-in">
      {/* Greeting */}
      <h1 className="text-2xl md:text-3xl font-bold">{getGreeting()}</h1>

      {/* Quick picks */}
      {history.length > 0 && (
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {history.slice(0, 6).map((track, i) => (
              <button
                key={track.videoId}
                onClick={() => setQueue(history, i)}
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-md overflow-hidden transition-colors group"
              >
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  className="w-12 h-12 object-cover shrink-0"
                />
                <span className="text-sm font-medium text-left truncate pr-2">{track.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Mood grid */}
      <section>
        <h2 className="text-xl font-bold mb-4">Jelajahi Genre</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MOOD_PRESETS.map(mood => (
            <button
              key={mood.label}
              onClick={() => searchMood(mood.query)}
              className="relative overflow-hidden rounded-lg p-4 text-left h-20 transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: mood.color }}
            >
              <span className="text-2xl absolute bottom-2 right-3 rotate-12 opacity-80">{mood.emoji}</span>
              <span className="font-bold text-sm text-white">{mood.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Trending di Indonesia</h2>
          <button
            onClick={() => searchMood('lagu indonesia trending 2024')}
            className="text-sm text-spotify-light hover:text-white transition-colors"
          >
            Lihat semua
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {loading
            ? Array(8).fill(0).map((_, i) => <GridCardSkeleton key={i}/>)
            : trending.slice(0, 8).map((track, i) => (
                <GridCard key={track.videoId} track={track} tracks={trending} index={i}/>
              ))
          }
        </div>
      </section>

      {/* Recently played */}
      {history.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Baru Diputar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {history.slice(0, 8).map((track, i) => (
              <GridCard key={track.videoId} track={track} tracks={history} index={i}/>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
