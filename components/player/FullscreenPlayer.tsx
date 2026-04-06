'use client'
// TunifyX v2 — FullscreenPlayer
// FIXED: queue/queueIndex → context/contextIndex/upNext

import Image from 'next/image'
import { useRef, useState } from 'react'
import { usePlayerStore } from '@/lib/store'
import { useAudio } from '@/hooks/useAudio'
import { cn } from '@/lib/utils'
import { SeekBar } from './PlayerBar'
import { QueuePanel }  from './QueuePanel'
import { LyricsView }  from './LyricsView'
import { toast } from '@/components/ui/Toast'

type Tab = 'player' | 'lyrics' | 'queue'

export function FullscreenPlayer() {
  const {
    currentTrack, isPlaying, progress, duration, currentTime,
    volume, isMuted, isShuffle, repeatMode, isLoading,
    // FIXED: use context/contextIndex/upNext instead of queue/queueIndex
    context, contextIndex, upNext,
    setPlaying, setVolume, setMuted, toggleShuffle, toggleRepeat,
    next, prev, setFullscreen, isFullscreen, isLiked, toggleLike,
    playlists, addToPlaylist, setActiveView,
  } = usePlayerStore()

  const { seek } = useAudio()
  const [tab, setTab] = useState<Tab>('player')

  // Swipe down to close
  const touchStartY = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY }
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (tab !== 'player') return  // don't close while on lyrics/queue tabs
    if (e.changedTouches[0].clientY - touchStartY.current > 80) setFullscreen(false)
  }

  if (!isFullscreen || !currentTrack) return null

  const liked        = isLiked(currentTrack.videoId)
  // FIXED: count upcoming from context + upNext
  const upcomingCount = upNext.length + Math.max(0, context.length - contextIndex - 1)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#121212' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Blurred BG */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Image
          src={currentTrack.thumbnail} alt="" fill
          className="object-cover scale-125 blur-3xl opacity-20" unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-[#121212]" />
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-safe shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)' }}>
          {/* Drag handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full" />

          <button
            onClick={() => setFullscreen(false)}
            className="text-white/70 hover:text-white p-2 -ml-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/10 rounded-full p-1">
            <button
              onClick={() => setTab('player')}
              className={cn(
                'px-4 py-1 rounded-full text-xs font-semibold transition-all',
                tab === 'player' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              )}
            >
              Sekarang
            </button>
            <button
              onClick={() => setTab('lyrics')}
              className={cn(
                'px-4 py-1 rounded-full text-xs font-semibold transition-all',
                tab === 'lyrics' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              )}
            >
              Lirik
            </button>
            <button
              onClick={() => setTab('queue')}
              className={cn(
                'relative px-4 py-1 rounded-full text-xs font-semibold transition-all',
                tab === 'queue' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              )}
            >
              Antrian
              {upcomingCount > 0 && (
                <span className={cn(
                  'absolute -top-1.5 -right-1 min-w-[16px] h-4 text-[9px] font-bold rounded-full flex items-center justify-center px-1',
                  tab === 'queue' ? 'bg-black text-white' : 'bg-[#1DB954] text-black'
                )}>
                  {upcomingCount > 99 ? '99' : upcomingCount}
                </span>
              )}
            </button>
          </div>

          {/* Add to playlist */}
          <button
            onClick={() => {
              if (!playlists.length) {
                toast('Buat playlist di Library dulu')
                setFullscreen(false)
                setActiveView('library')
                return
              }
              addToPlaylist(playlists[0].id, currentTrack)
              toast(`✓ Ditambahkan ke ${playlists[0].name}`)
            }}
            className="text-white/70 hover:text-white p-2 -mr-2"
            title="Tambah ke playlist"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* ── Player Tab ── */}
        {tab === 'player' && (
          <div className="flex-1 flex flex-col px-6 overflow-hidden">

            {/* Art — shrinks when paused */}
            <div className="flex justify-center py-4 flex-shrink-0">
              <div className={cn(
                'relative rounded-xl overflow-hidden shadow-2xl transition-all duration-500',
                isPlaying
                  ? 'w-[268px] h-[268px] sm:w-[300px] sm:h-[300px]'
                  : 'w-[210px] h-[210px] sm:w-[240px] sm:h-[240px]'
              )}>
                <Image
                  src={currentTrack.thumbnail} alt={currentTrack.title}
                  fill className="object-cover" unoptimized
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Track info + like */}
            <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold truncate">{currentTrack.title}</h2>
                <p className="text-[#b3b3b3] text-sm truncate mt-0.5">{currentTrack.artist}</p>
              </div>
              <button
                onClick={() => {
                  toggleLike(currentTrack)
                  toast(liked ? 'Dihapus dari Liked Songs' : '♥ Liked Songs')
                }}
                className={cn(
                  'shrink-0 hover:scale-110 transition-transform',
                  liked ? 'text-[#1DB954]' : 'text-white/40 hover:text-white'
                )}
              >
                <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="26" height="26">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            {/* Seek */}
            <SeekBar
              progress={progress} currentTime={currentTime}
              duration={duration} onSeek={seek}
              className="mb-4 shrink-0"
            />

            {/* Controls */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <button
                onClick={toggleShuffle}
                className={cn(
                  'p-2 flex flex-col items-center gap-0.5',
                  isShuffle ? 'text-[#1DB954]' : 'text-white/40 hover:text-white'
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <polyline points="16 3 21 3 21 8"/>
                  <line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/>
                  <line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
                {isShuffle && <div className="w-1 h-1 rounded-full bg-[#1DB954]" />}
              </button>

              <button onClick={prev} className="hover:scale-110 transition-transform text-white p-2">
                <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30">
                  <polygon points="19,20 9,12 19,4"/>
                  <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2.5"/>
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

              <button onClick={next} className="hover:scale-110 transition-transform text-white p-2">
                <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30">
                  <polygon points="5,4 15,12 5,20"/>
                  <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5"/>
                </svg>
              </button>

              <button
                onClick={toggleRepeat}
                className={cn(
                  'p-2 relative flex flex-col items-center gap-0.5',
                  repeatMode !== 'off' ? 'text-[#1DB954]' : 'text-white/40 hover:text-white'
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <polyline points="17 1 21 5 17 9"/>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <polyline points="7 23 3 19 7 15"/>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                {repeatMode === 'one' && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-bold text-[#1DB954]">1</span>
                )}
                {repeatMode !== 'off' && <div className="w-1 h-1 rounded-full bg-[#1DB954]" />}
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 pb-6 shrink-0">
              <button onClick={() => setMuted(!isMuted)} className="text-white/40 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  {isMuted && <><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
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

            {/* Search shortcut */}
            <div className="pb-6 shrink-0">
              <button
                onClick={() => { setFullscreen(false); setActiveView('search') }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-white/15 text-white/50 hover:text-white hover:border-white/30 text-sm transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Cari lagu lain
              </button>
            </div>
          </div>
        )}

        {/* ── Lyrics Tab ── */}
        {tab === 'lyrics' && (
          <div className="flex-1 overflow-hidden">
            <LyricsView track={currentTrack} isActive={tab === 'lyrics'} />
          </div>
        )}

        {/* ── Queue Tab ── */}
        {tab === 'queue' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <QueuePanel onClose={() => setTab('player')} />
          </div>
        )}
      </div>
    </div>
  )
}
