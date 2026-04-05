'use client'
// TunifyX v2 — PlayerBar

import Image from 'next/image'
import { useRef, useState, useEffect, useCallback } from 'react'
import { usePlayerStore } from '@/lib/store'
import { useAudio } from '@/hooks/useAudio'
import { formatTime, cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import { QueuePanel } from './QueuePanel'

// ── Icons ─────────────────────────────────────────────────────
const I = {
  Play:   () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><polygon points="5,3 19,12 5,21"/></svg>,
  Pause:  () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>,
  Prev:   () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2.5"/></svg>,
  Next:   () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5"/></svg>,
  VolOn:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
  VolOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
  Queue:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>,
  Heart:  ({ filled }: { filled: boolean }) => <svg viewBox="0 0 24 24" fill={filled ? '#1DB954' : 'none'} stroke={filled ? '#1DB954' : 'currentColor'} strokeWidth="2" width="17" height="17"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
}

// ── SeekBar (reused by FullscreenPlayer too) ──────────────────
export function SeekBar({ progress, currentTime, duration, onSeek, className }: {
  progress: number; currentTime: number; duration: number
  onSeek: (pct: number) => void; className?: string
}) {
  const barRef   = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [localPct, setLocalPct] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => { if (!dragging.current) setLocalPct(progress) }, [progress])

  const getPct = useCallback((e: MouseEvent | TouchEvent) => {
    if (!barRef.current) return 0
    const r = barRef.current.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    return Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100))
  }, [])

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => { if (dragging.current) setLocalPct(getPct(e)) }
    const up   = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      dragging.current = false; setIsDragging(false); onSeek(getPct(e))
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup',   up)
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend',  up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup',   up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend',  up)
    }
  }, [getPct, onSeek])

  return (
    <div className={cn('flex items-center gap-2 group seek-bar', isDragging && 'is-dragging', className)}>
      <span className="text-[11px] text-[#b3b3b3] w-8 text-right tabular-nums shrink-0">{formatTime(currentTime)}</span>
      <div
        ref={barRef}
        className="seek-track flex-1"
        onMouseDown={e => { dragging.current = true; setIsDragging(true); setLocalPct(getPct(e.nativeEvent)) }}
        onTouchStart={e => { dragging.current = true; setIsDragging(true); setLocalPct(getPct(e.nativeEvent)) }}
      >
        <div className="seek-fill" style={{ width: `${localPct}%` }} />
        <div className="seek-dot"  style={{ left:  `${localPct}%` }} />
      </div>
      <span className="text-[11px] text-[#b3b3b3] w-8 tabular-nums shrink-0">{formatTime(duration)}</span>
    </div>
  )
}

// ── Main PlayerBar ────────────────────────────────────────────
export function PlayerBar() {
  const {
    currentTrack, isPlaying, progress, duration, currentTime,
    volume, isMuted, isLoading, isShuffle, repeatMode, error,
    setPlaying, setVolume, setMuted, toggleShuffle, toggleRepeat,
    next, prev, setFullscreen,
    showQueue, setShowQueue, isLiked, toggleLike,
    upNext, context, contextIndex,
  } = usePlayerStore()

  const { seek } = useAudio()

  // Total upcoming count for badge
  const upcomingCount = upNext.length + Math.max(0, context.length - contextIndex - 1)

  if (!currentTrack) return null

  const liked = isLiked(currentTrack.videoId)

  return (
    <>
      {/* ── Desktop Player Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 hidden md:block bg-[#181818] border-t border-white/10">
        {error && (
          <div className="bg-red-900/50 text-red-200 text-xs text-center py-1.5 px-4 animate-fade-in">
            ⚠ {error}
          </div>
        )}

        <div className="grid grid-cols-3 items-center px-4 py-3 gap-4">
          {/* Left: track info */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setFullscreen(true)}
              className="relative w-14 h-14 rounded overflow-hidden shrink-0 group">
              <Image src={currentTrack.thumbnail} alt={currentTrack.title} fill className="object-cover" unoptimized />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <button onClick={() => setFullscreen(true)}
                className="block truncate text-sm font-medium hover:underline text-left w-full">
                {currentTrack.title}
              </button>
              <p className="text-xs text-[#b3b3b3] truncate">{currentTrack.artist}</p>
            </div>
            <button
              onClick={() => { toggleLike(currentTrack); toast(liked ? 'Dihapus dari Liked Songs' : '♥ Liked Songs') }}
              className={cn('shrink-0 transition-all hover:scale-110', liked ? 'text-[#1DB954]' : 'text-[#b3b3b3] hover:text-white')}
            >
              <I.Heart filled={liked} />
            </button>
          </div>

          {/* Center: controls + seek */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-5">
              <button onClick={toggleShuffle}
                className={cn('transition-colors hover:scale-105 relative', isShuffle ? 'text-[#1DB954]' : 'text-[#b3b3b3] hover:text-white')}
                title="Shuffle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
                {isShuffle && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1DB954]" />}
              </button>

              <button onClick={prev} className="text-[#b3b3b3] hover:text-white hover:scale-105 transition-all"><I.Prev /></button>

              <button
                onClick={() => setPlaying(!isPlaying)}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform active:scale-95"
              >
                {isLoading
                  ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  : isPlaying ? <I.Pause /> : <I.Play />
                }
              </button>

              <button onClick={next} className="text-[#b3b3b3] hover:text-white hover:scale-105 transition-all"><I.Next /></button>

              <button onClick={toggleRepeat}
                className={cn('relative transition-colors hover:scale-105', repeatMode !== 'off' ? 'text-[#1DB954]' : 'text-[#b3b3b3] hover:text-white')}
                title="Repeat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
                {repeatMode !== 'off'  && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1DB954]" />}
              </button>
            </div>

            <SeekBar progress={progress} currentTime={currentTime} duration={duration} onSeek={seek} className="w-full max-w-md" />
          </div>

          {/* Right: volume + queue */}
          <div className="flex items-center justify-end gap-3">
            {/* Queue button with badge */}
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={cn('relative transition-colors hover:scale-105', showQueue ? 'text-[#1DB954]' : 'text-[#b3b3b3] hover:text-white')}
              title="Antrian (Q)"
            >
              <I.Queue />
              {upcomingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-[#1DB954] text-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {upcomingCount > 99 ? '99' : upcomingCount}
                </span>
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={() => setMuted(!isMuted)} className="text-[#b3b3b3] hover:text-white transition-colors">
                {isMuted || volume === 0 ? <I.VolOff /> : <I.VolOn />}
              </button>
              <div className="relative w-20">
                <div className="seek-track seek-bar">
                  <div className="seek-fill" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
                </div>
                <input
                  type="range" min="0" max="1" step="0.02"
                  value={isMuted ? 0 : volume}
                  onChange={e => { setVolume(parseFloat(e.target.value)); if (isMuted) setMuted(false) }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-1.5"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Player Bar ── */}
      <div className="fixed z-40 md:hidden left-2 right-2 bottom-[68px] bg-[#282828] rounded-xl overflow-hidden shadow-2xl animate-slide-up">
        <div className="h-0.5 bg-[#404040]">
          <div className="h-full bg-[#1DB954] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button onClick={() => setFullscreen(true)} className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <Image src={currentTrack.thumbnail} alt={currentTrack.title} fill className="object-cover" unoptimized />
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <button onClick={() => setFullscreen(true)} className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate">{currentTrack.title}</p>
            <p className="text-xs text-[#b3b3b3] truncate">{currentTrack.artist}</p>
          </button>
          <button
            onClick={() => { toggleLike(currentTrack); toast(liked ? 'Dihapus' : '♥ Liked') }}
            className={cn('p-2 transition-colors', liked ? 'text-[#1DB954]' : 'text-[#b3b3b3]')}
          >
            <I.Heart filled={liked} />
          </button>
          <button onClick={prev} className="p-2 text-[#b3b3b3]"><I.Prev /></button>
          <button
            onClick={() => setPlaying(!isPlaying)}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black active:scale-95 transition-transform"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              : isPlaying ? <I.Pause /> : <I.Play />}
          </button>
          <button onClick={next} className="p-2 text-[#b3b3b3]"><I.Next /></button>
        </div>
      </div>

      {/* ── Queue Sidebar Panel (desktop) ── */}
      {showQueue && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowQueue(false)} />
          <div className="hidden md:flex fixed right-0 top-0 bottom-[73px] z-40 w-80 flex-col bg-[#121212] border-l border-white/10 shadow-2xl animate-slide-in-right">
            <QueuePanel onClose={() => setShowQueue(false)} />
          </div>
        </>
      )}
    </>
  )
}
