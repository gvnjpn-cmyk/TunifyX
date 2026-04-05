'use client'

import Image from 'next/image'
import { useEffect, useCallback, useRef, useState } from 'react'
import { usePlayerStore } from '@/lib/store'
import { useAudio } from '@/hooks/useAudio'
import { formatTime, cn } from '@/lib/utils'

// ── SVG icons ───────────────────────────────────────────────
const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
)
const IconPause = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <rect x="6" y="4" width="4" height="16" rx="1"/>
    <rect x="14" y="4" width="4" height="16" rx="1"/>
  </svg>
)
const IconPrev = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <polygon points="19,20 9,12 19,4"/>
    <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2.5"/>
  </svg>
)
const IconNext = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <polygon points="5,4 15,12 5,20"/>
    <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5"/>
  </svg>
)
const IconVolume = ({ muted }: { muted: boolean }) => muted ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
)
const IconQueue = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

// ── Seek bar ─────────────────────────────────────────────────
function SeekBar({ progress, currentTime, duration, onSeek }: {
  progress: number
  currentTime: number
  duration: number
  onSeek: (pct: number) => void
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [localPct, setLocalPct] = useState(0)

  const getPct = useCallback((e: MouseEvent | TouchEvent) => {
    const bar = barRef.current
    if (!bar) return 0
    const rect = bar.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    return Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100))
  }, [])

  useEffect(() => {
    if (dragging) return
    setLocalPct(progress)
  }, [progress, dragging])

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return
      setLocalPct(getPct(e))
    }
    const onUp = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return
      onSeek(getPct(e))
      setDragging(false)
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
  }, [dragging, getPct, onSeek])

  return (
    <div className="flex items-center gap-2 w-full group seek-bar">
      <span className="text-[11px] text-spotify-light w-8 text-right shrink-0">
        {formatTime(currentTime)}
      </span>
      <div
        ref={barRef}
        className="seek-track flex-1"
        onMouseDown={e => { setDragging(true); setLocalPct(getPct(e.nativeEvent)) }}
        onTouchStart={e => { setDragging(true); setLocalPct(getPct(e.nativeEvent)) }}
      >
        <div className="seek-fill" style={{ width: `${localPct}%` }} />
        <div className="seek-dot" style={{ left: `${localPct}%` }} />
      </div>
      <span className="text-[11px] text-spotify-light w-8 shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  )
}

// ── YouTube IFrame fallback ───────────────────────────────────
function YTFallback({ videoId, playing }: { videoId: string; playing: boolean }) {
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${playing ? 1 : 0}&controls=0&enablejsapi=1`}
      allow="autoplay; encrypted-media"
      className="absolute opacity-0 pointer-events-none w-1 h-1"
      title="yt-player"
    />
  )
}

// ── Main PlayerBar ────────────────────────────────────────────
export function PlayerBar() {
  const {
    currentTrack, isPlaying, progress, duration, currentTime,
    volume, isMuted, streamUrl, isLoading, isShuffle, repeatMode,
    setPlaying, setVolume, setMuted, toggleShuffle, toggleRepeat,
    next, prev, setFullscreen, queue,
  } = usePlayerStore()

  const { seek } = useAudio()
  const [showQueue, setShowQueue] = useState(false)

  if (!currentTrack) return null

  const isFallback = streamUrl?.includes('youtube') || streamUrl?.includes('nocookie')

  return (
    <>
      {/* Hidden YT iframe when using fallback */}
      {isFallback && currentTrack && (
        <YTFallback videoId={currentTrack.videoId} playing={isPlaying} />
      )}

      <div className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-spotify-dark border-t border-white/10',
        'px-4 py-3',
        'md:px-6 md:py-4',
        // On mobile, sit above mobile nav
        'mb-[60px] md:mb-0'
      )}>

        {/* Mobile: compact layout */}
        <div className="flex md:hidden items-center gap-3">
          {/* Thumbnail */}
          <button
            className="relative w-10 h-10 shrink-0 rounded overflow-hidden"
            onClick={() => setFullscreen(true)}
          >
            <Image
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              fill className="object-cover"
              unoptimized
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-spotify-green border-t-transparent rounded-full animate-spin"/>
              </div>
            )}
          </button>

          {/* Info */}
          <button
            className="flex-1 min-w-0 text-left"
            onClick={() => setFullscreen(true)}
          >
            <p className="text-sm font-medium truncate">{currentTrack.title}</p>
            <p className="text-xs text-spotify-light truncate">{currentTrack.artist}</p>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setPlaying(!isPlaying)}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black"
            >
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>
            <button onClick={next} className="w-9 h-9 flex items-center justify-center text-spotify-light">
              <IconNext />
            </button>
          </div>

          {/* Mobile progress line */}
          <div className="absolute bottom-[60px] left-0 right-0 h-0.5 bg-white/10">
            <div className="h-full bg-spotify-green transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Desktop: full 3-column layout */}
        <div className="hidden md:grid grid-cols-3 items-center gap-4">

          {/* Left: track info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="relative w-14 h-14 rounded overflow-hidden shrink-0"
              onClick={() => setFullscreen(true)}
            >
              <Image
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                fill className="object-cover"
                unoptimized
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-spotify-green border-t-transparent rounded-full animate-spin"/>
                </div>
              )}
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate hover:underline cursor-pointer"
                onClick={() => setFullscreen(true)}>
                {currentTrack.title}
              </p>
              <p className="text-xs text-spotify-light truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Center: controls + seek */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleShuffle}
                className={cn('transition-colors', isShuffle ? 'text-spotify-green' : 'text-spotify-light hover:text-white')}
                title="Shuffle"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polyline points="16 3 21 3 21 8"/>
                  <line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/>
                  <line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
              </button>

              <button onClick={prev} className="text-spotify-light hover:text-white transition-colors">
                <IconPrev />
              </button>

              <button
                onClick={() => setPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform"
              >
                {isPlaying ? <IconPause /> : <IconPlay />}
              </button>

              <button onClick={next} className="text-spotify-light hover:text-white transition-colors">
                <IconNext />
              </button>

              <button
                onClick={toggleRepeat}
                className={cn('transition-colors relative', repeatMode !== 'off' ? 'text-spotify-green' : 'text-spotify-light hover:text-white')}
                title={`Repeat: ${repeatMode}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
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

            <SeekBar
              progress={progress}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
            />
          </div>

          {/* Right: volume + queue */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowQueue(q => !q)}
              className={cn('transition-colors', showQueue ? 'text-spotify-green' : 'text-spotify-light hover:text-white')}
              title="Queue"
            >
              <IconQueue />
            </button>

            <button
              onClick={() => setMuted(!isMuted)}
              className="text-spotify-light hover:text-white transition-colors"
            >
              <IconVolume muted={isMuted} />
            </button>

            <input
              type="range" min="0" max="1" step="0.01"
              value={isMuted ? 0 : volume}
              onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
              className="w-24 accent-spotify-green"
              title="Volume"
            />
          </div>
        </div>
      </div>

      {/* Queue panel (desktop) */}
      {showQueue && (
        <div className="hidden md:block fixed right-4 bottom-24 z-50 w-80 bg-spotify-card rounded-lg shadow-2xl overflow-hidden animate-slide-up">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="font-semibold text-sm">Antrian ({queue.length})</h3>
          </div>
          <div className="overflow-y-auto max-h-72">
            {queue.map((t, i) => (
              <QueueRow key={t.videoId + i} track={t} index={i} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function QueueRow({ track, index }: { track: any; index: number }) {
  const { queueIndex, setQueue, queue, removeFromQueue } = usePlayerStore()
  const isActive = index === queueIndex

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors group',
        isActive ? 'bg-white/10' : 'hover:bg-white/5'
      )}
      onClick={() => setQueue(queue, index)}
    >
      {isActive ? (
        <div className="flex items-end gap-0.5 h-4 w-4 shrink-0">
          <div className="eq-bar h-full origin-bottom" style={{ animationDelay: '0s' }}/>
          <div className="eq-bar h-full origin-bottom" style={{ animationDelay: '0.2s' }}/>
          <div className="eq-bar h-full origin-bottom" style={{ animationDelay: '0.4s' }}/>
        </div>
      ) : (
        <span className="text-xs text-spotify-light w-4 text-center shrink-0">{index + 1}</span>
      )}
      <Image
        src={track.thumbnail} alt={track.title}
        width={36} height={36}
        className="rounded shrink-0 object-cover"
        unoptimized
      />
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium truncate', isActive && 'text-spotify-green')}>
          {track.title}
        </p>
        <p className="text-xs text-spotify-light truncate">{track.artist}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); removeFromQueue(index) }}
        className="opacity-0 group-hover:opacity-100 text-spotify-light hover:text-white p-1 transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
