'use client'
// ─────────────────────────────────────────────────────────────
// TunifyX — LyricsView
// Scrollable lyrics panel used inside FullscreenPlayer
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { useLyrics } from '@/hooks/useLyrics'
import type { Track } from '@/lib/types'

interface Props {
  track: Track
  isActive: boolean  // only fetch when tab is visible
}

export function LyricsView({ track, isActive }: Props) {
  const state      = useLyrics(isActive ? track : null)
  const scrollRef  = useRef<HTMLDivElement>(null)

  // Scroll to top when new lyrics arrive
  useEffect(() => {
    if (state.status === 'found') {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [state.status, track?.videoId])

  return (
    <div className="flex flex-col h-full">
      {/* Track mini-header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
        <img
          src={track.thumbnail}
          alt={track.title}
          className="w-9 h-9 rounded-lg object-cover shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{track.title}</p>
          <p className="text-xs text-[#b3b3b3] truncate">{track.artist}</p>
        </div>
        <div className="ml-auto shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#b3b3b3]/50 bg-white/5 px-2 py-1 rounded-full">
            Lirik
          </span>
        </div>
      </div>

      {/* Content area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4"
      >
        {/* Loading */}
        {state.status === 'loading' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
            {/* Animated mic icon */}
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                width="40" height="40" className="text-[#b3b3b3]/40">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-[#1DB954] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 rounded-full bg-[#1DB954] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 rounded-full bg-[#1DB954] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <p className="text-sm text-[#b3b3b3]">Memuat lirik...</p>
          </div>
        )}

        {/* Lyrics found */}
        {state.status === 'found' && (
          <div className="animate-fade-in">
            <p className="text-[15px] leading-[1.9] text-white/85 whitespace-pre-line font-light tracking-wide pb-8">
              {state.lyrics}
            </p>
          </div>
        )}

        {/* Not found */}
        {state.status === 'not_found' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center animate-fade-in">
            <span className="text-4xl">🎵</span>
            <p className="text-[#b3b3b3] font-medium text-sm">Lirik tidak tersedia</p>
            <p className="text-[#b3b3b3]/50 text-xs leading-relaxed max-w-[220px]">
              Tidak ada lirik untuk lagu ini.<br />
              Mungkin instrumental atau belum ada di database.
            </p>
          </div>
        )}

        {/* Error */}
        {state.status === 'error' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center animate-fade-in">
            <span className="text-4xl">⚠️</span>
            <p className="text-[#b3b3b3] font-medium text-sm">Gagal memuat lirik</p>
            <p className="text-[#b3b3b3]/50 text-xs">
              {state.message}
            </p>
          </div>
        )}

        {/* Idle */}
        {state.status === 'idle' && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#b3b3b3]/40 text-sm">Pilih lagu untuk melihat lirik</p>
          </div>
        )}
      </div>
    </div>
  )
}
