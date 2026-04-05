'use client'
// TunifyX v2 — FullscreenPlayer (mobile)

import Image from 'next/image'
import { useRef, useState, useEffect, useCallback } from 'react'
import { usePlayerStore } from '@/lib/store'
import { useAudio } from '@/hooks/useAudio'
import { formatTime, cn } from '@/lib/utils'
import { SeekBar } from './PlayerBar'
import { toast } from '@/components/ui/Toast'

export function FullscreenPlayer() {
  const {
    currentTrack, isPlaying, progress, duration, currentTime,
    volume, isMuted, isShuffle, repeatMode, isLoading, queue, queueIndex,
    setPlaying, setVolume, setMuted, toggleShuffle, toggleRepeat,
    next, prev, setFullscreen, isFullscreen, isLiked, toggleLike,
    playlists, addToPlaylist,
  } = usePlayerStore()
  const { seek } = useAudio()
  const [tab, setTab] = useState<'queue'>('queue')

  // Swipe down to close
  const touchStart = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY }
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientY - touchStart.current > 80) setFullscreen(false)
  }

  if (!isFullscreen || !currentTrack) return null

  const liked    = isLiked(currentTrack.videoId)
  const upcoming = queue.slice(queueIndex + 1, queueIndex + 6)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-slide-up"
      style={{ background: '#121212' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Blurred BG */}
      <div className="absolute inset-0 overflow-hidden">
        <Image src={currentTrack.thumbnail} alt="" fill className="object-cover scale-125 blur-3xl opacity-20" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-[#121212]" />
      </div>

      <div className="relative z-10 flex flex-col h-full px-6 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between pt-12 pb-6">
          <button onClick={() => setFullscreen(false)} className="text-white/70 hover:text-white p-2 -ml-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div className="text-center">
            <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">Sedang Diputar</p>
          </div>
          <button
            onClick={() => {
              if (!playlists.length) { toast('Buat playlist di Library dulu'); return }
              addToPlaylist(playlists[0].id, currentTrack)
              toast(`✓ Ditambahkan ke ${playlists[0].name}`)
            }}
            className="text-white/70 hover:text-white p-2 -mr-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Art */}
        <div className="flex justify-center py-4 flex-1 items-center">
          <div className={cn(
            'relative rounded-xl overflow-hidden shadow-2xl transition-all duration-500',
            isPlaying ? 'w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]' : 'w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]'
          )}>
            <Image src={currentTrack.thumbnail} alt={currentTrack.title} fill className="object-cover" unoptimized />
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Track info + like */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold truncate">{currentTrack.title}</h2>
            <p className="text-[#b3b3b3] text-sm truncate mt-0.5">{currentTrack.artist}</p>
          </div>
          <button
            onClick={() => { toggleLike(currentTrack); toast(liked ? 'Dihapus dari Liked Songs' : '♥ Liked Songs') }}
            className={cn('shrink-0 hover:scale-110 transition-transform', liked ? 'text-[#1DB954]' : 'text-white/40 hover:text-white')}
          >
            <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="26" height="26">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>

        {/* Seek */}
        <SeekBar progress={progress} currentTime={currentTime} duration={duration} onSeek={seek} className="mb-4" />

        {/* Controls */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={toggleShuffle}
            className={cn('p-2 transition-colors', isShuffle ? 'text-[#1DB954]' : 'text-white/40 hover:text-white')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
          </button>
          <button onClick={prev} className="hover:scale-110 transition-transform text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30">
              <polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2.5"/>
            </svg>
          </button>
          <button
            onClick={() => setPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-xl"
          >
            {isLoading
              ? <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
              : isPlaying
                ? <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><polygon points="5,3 19,12 5,21"/></svg>
            }
          </button>
          <button onClick={next} className="hover:scale-110 transition-transform text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30">
              <polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5"/>
            </svg>
          </button>
          <button
            onClick={toggleRepeat}
            className={cn('p-2 relative transition-colors', repeatMode !== 'off' ? 'text-[#1DB954]' : 'text-white/40 hover:text-white')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            {repeatMode === 'one' && (
              <span className="absolute top-0 right-0 text-[9px] font-bold text-[#1DB954]">1</span>
            )}
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setMuted(!isMuted)} className="text-white/40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            </svg>
          </button>
          <input
            type="range" min="0" max="1" step="0.02"
            value={isMuted ? 0 : volume}
            onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
            className="flex-1 accent-[#1DB954]"
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="text-white/40">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        </div>

        {/* Queue mini */}
        {upcoming.length > 0 && (
          <div className="pb-6">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Selanjutnya</p>
            <div className="space-y-2">
              {upcoming.map(t => (
                <div key={t.videoId} className="flex items-center gap-3">
                  <Image src={t.thumbnail} alt={t.title} width={36} height={36} className="rounded shrink-0" unoptimized />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate text-white/80">{t.title}</p>
                    <p className="text-xs text-white/40 truncate">{t.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
