'use client'

import Image from 'next/image'
import { usePlayerStore } from '@/lib/store'
import { useAudio } from '@/hooks/useAudio'
import { formatTime, cn } from '@/lib/utils'
import { useRef, useState, useEffect, useCallback } from 'react'
import { toast } from '@/components/ui/Toast'

export function FullscreenPlayer() {
  const {
    currentTrack, isPlaying, progress, duration, currentTime,
    volume, isMuted, isShuffle, repeatMode, isLoading, queue, queueIndex,
    setPlaying, setVolume, setMuted, toggleShuffle, toggleRepeat,
    next, prev, setFullscreen, isFullscreen, addToPlaylist, playlists,
  } = usePlayerStore()

  const { seek } = useAudio()
  const [tab, setTab] = useState<'queue' | 'related'>('queue')
  const [dragging, setDragging] = useState(false)
  const [localPct, setLocalPct] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!dragging) setLocalPct(progress) }, [progress, dragging])

  const getPct = useCallback((e: MouseEvent | TouchEvent) => {
    const bar = barRef.current
    if (!bar) return 0
    const rect = bar.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    return Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100))
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => { if (dragging) setLocalPct(getPct(e)) }
    const onUp   = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return
      seek(getPct(e)); setDragging(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging, getPct, seek])

  if (!isFullscreen || !currentTrack) return null

  const upcoming = queue.slice(queueIndex + 1).slice(0, 10)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-fade-in"
      style={{ background: '#121212' }}
    >
      {/* Blurred background art */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={currentTrack.thumbnail}
          alt="" fill
          className="object-cover scale-110 blur-2xl opacity-25"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"/>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full max-w-lg mx-auto w-full px-6 pt-safe">

        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => setFullscreen(false)}
            className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div className="text-center">
            <p className="text-xs text-white/60 uppercase tracking-widest font-medium">Sedang Diputar</p>
          </div>
          <button
            onClick={() => {
              if (!playlists.length) { toast('Buat playlist dulu di Library'); return }
              // simple: add to first playlist
              addToPlaylist(playlists[0].id, currentTrack)
              toast(`✓ Ditambahkan ke ${playlists[0].name}`)
            }}
            className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Album art */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className={cn(
            'relative rounded-lg overflow-hidden shadow-2xl transition-all duration-300',
            isPlaying ? 'w-72 h-72 md:w-80 md:h-80' : 'w-60 h-60 md:w-64 md:h-64'
          )}>
            <Image
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              fill className="object-cover"
              unoptimized
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin"/>
              </div>
            )}
          </div>
        </div>

        {/* Track info */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-white truncate">{currentTrack.title}</h2>
            <p className="text-spotify-light text-sm mt-0.5 truncate">{currentTrack.artist}</p>
          </div>
          <button
            onClick={() => {
              addToPlaylist(playlists[0]?.id || '', currentTrack)
              toast('♥ Liked')
            }}
            className="shrink-0 w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>

        {/* Seek bar */}
        <div className="mb-4 seek-bar group">
          <div
            ref={barRef}
            className="seek-track cursor-pointer"
            onMouseDown={e => { setDragging(true); setLocalPct(getPct(e.nativeEvent)) }}
            onTouchStart={e => { setDragging(true); setLocalPct(getPct(e.nativeEvent)) }}
          >
            <div className="seek-fill" style={{ width: `${localPct}%` }}/>
            <div className="seek-dot" style={{ left: `${localPct}%` }}/>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-spotify-light">{formatTime(currentTime)}</span>
            <span className="text-xs text-spotify-light">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={toggleShuffle}
            className={cn('transition-colors', isShuffle ? 'text-spotify-green' : 'text-white/40 hover:text-white')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
          </button>

          <button onClick={prev} className="text-white hover:scale-110 transition-transform">
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <polygon points="19,20 9,12 19,4"/>
              <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2.5"/>
            </svg>
          </button>

          <button
            onClick={() => setPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>

          <button onClick={next} className="text-white hover:scale-110 transition-transform">
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <polygon points="5,4 15,12 5,20"/>
              <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5"/>
            </svg>
          </button>

          <button
            onClick={toggleRepeat}
            className={cn('relative transition-colors', repeatMode !== 'off' ? 'text-spotify-green' : 'text-white/40 hover:text-white')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            {repeatMode === 'one' && (
              <span className="absolute -bottom-1 -right-1 text-[8px] font-bold text-spotify-green">1</span>
            )}
          </button>
        </div>

        {/* Volume (mobile) */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setMuted(!isMuted)} className="text-white/40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            </svg>
          </button>
          <input
            type="range" min="0" max="1" step="0.01"
            value={isMuted ? 0 : volume}
            onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
            className="flex-1 accent-spotify-green"
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="text-white/40">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        </div>

        {/* Queue tabs */}
        {upcoming.length > 0 && (
          <div className="mb-4 pb-safe">
            <div className="flex gap-4 border-b border-white/10 mb-3">
              {(['queue', 'related'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'pb-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
                    tab === t ? 'text-white border-spotify-green' : 'text-white/40 border-transparent'
                  )}
                >
                  {t === 'queue' ? 'Selanjutnya' : 'Terkait'}
                </button>
              ))}
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
              {upcoming.slice(0, 4).map((t, i) => (
                <div key={t.videoId} className="flex items-center gap-3 text-sm">
                  <Image src={t.thumbnail} alt={t.title} width={32} height={32}
                    className="rounded shrink-0 object-cover" unoptimized/>
                  <div className="min-w-0">
                    <p className="truncate text-white/80 text-xs">{t.title}</p>
                    <p className="truncate text-white/40 text-xs">{t.artist}</p>
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
