'use client'
// ─────────────────────────────────────────────────────────────
// TunifyX v2 — useAudio hook
// Engine: YouTube IFrame API (reliable, no CORS, works everywhere)
// Singleton pattern — player survives page navigation
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '@/lib/store'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
    _ytPlayer: any
    _ytReady: boolean
  }
}

// ── Boot YouTube IFrame API once ─────────────────────────────
function loadYTScript() {
  if (typeof window === 'undefined') return
  if (document.getElementById('yt-iframe-api')) return
  const tag = document.createElement('script')
  tag.id  = 'yt-iframe-api'
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
}

// ── Create hidden YT player container ────────────────────────
function ensureContainer() {
  if (document.getElementById('yt-player-root')) return
  const wrap = document.createElement('div')
  wrap.id = 'yt-player-root'
  wrap.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;'
  const inner = document.createElement('div')
  inner.id = 'yt-player-inner'
  wrap.appendChild(inner)
  document.body.appendChild(wrap)
}

// ── Init YT Player ────────────────────────────────────────────
function initPlayer(
  onReady: () => void,
  onState: (state: number) => void,
  onProgress: (cur: number, dur: number) => void
) {
  ensureContainer()
  window._ytPlayer = new window.YT.Player('yt-player-inner', {
    height: '1', width: '1',
    playerVars: {
      autoplay: 0, controls: 0, disablekb: 1,
      fs: 0, iv_load_policy: 3, modestbranding: 1,
      playsinline: 1, rel: 0,
    },
    events: {
      onReady: () => { window._ytReady = true; onReady() },
      onStateChange: (e: any) => onState(e.data),
    },
  })

  // Poll progress every 500ms (YT IFrame doesn't have timeupdate event)
  setInterval(() => {
    try {
      const p = window._ytPlayer
      if (!p || typeof p.getCurrentTime !== 'function') return
      const cur = p.getCurrentTime() || 0
      const dur = p.getDuration()    || 0
      onProgress(cur, dur)
    } catch {}
  }, 500)
}

// ── Main hook ─────────────────────────────────────────────────
export function useAudio() {
  const {
    currentTrack, isPlaying, volume, isMuted, repeatMode,
    setPlaying, setProgress, setDuration, setCurrentTime,
    setLoading, setError, next,
  } = usePlayerStore()

  const readyRef = useRef(false)

  // ── Boot ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    loadYTScript()

    const boot = () => {
      if (readyRef.current) return
      initPlayer(
        // onReady
        () => {
          readyRef.current = true
          // If a track was queued before player was ready, load it now
          const { currentTrack } = usePlayerStore.getState()
          if (currentTrack) {
            window._ytPlayer.loadVideoById(currentTrack.videoId)
          }
        },
        // onStateChange
        (state: number) => {
          const YT = window.YT?.PlayerState
          if (!YT) return
          if (state === YT.PLAYING)   { setPlaying(true);  setLoading(false) }
          if (state === YT.PAUSED)    { setPlaying(false); setLoading(false) }
          if (state === YT.BUFFERING) { setLoading(true) }
          if (state === YT.ENDED) {
            setPlaying(false)
            const { repeatMode } = usePlayerStore.getState()
            if (repeatMode === 'one') {
              window._ytPlayer.seekTo(0)
              window._ytPlayer.playVideo()
            } else {
              usePlayerStore.getState().next()
            }
          }
          if (state === YT.CUED) { setLoading(false) }
          // Error state (-1 = unstarted can be ok; 5 = HTML5 error)
        },
        // onProgress
        (cur, dur) => {
          setCurrentTime(cur)
          setDuration(dur)
          setProgress(dur > 0 ? (cur / dur) * 100 : 0)
        }
      )
    }

    if (window.YT?.Player) {
      boot()
    } else {
      window.onYouTubeIframeAPIReady = boot
    }
  }, [])

  // ── Load new track ────────────────────────────────────────
  useEffect(() => {
    if (!currentTrack) return
    setLoading(true)
    setError(null)

    const load = () => {
      try {
        window._ytPlayer.loadVideoById(currentTrack.videoId)
      } catch {}
    }

    if (window._ytReady && window._ytPlayer) {
      load()
    } else {
      // Retry until ready
      const t = setInterval(() => {
        if (window._ytReady && window._ytPlayer) {
          clearInterval(t)
          load()
        }
      }, 200)
      return () => clearInterval(t)
    }
  }, [currentTrack?.videoId])

  // ── Play / Pause ──────────────────────────────────────────
  useEffect(() => {
    if (!window._ytReady || !window._ytPlayer) return
    try {
      if (isPlaying) {
        window._ytPlayer.playVideo()
      } else {
        window._ytPlayer.pauseVideo()
      }
    } catch {}
  }, [isPlaying])

  // ── Volume ────────────────────────────────────────────────
  useEffect(() => {
    if (!window._ytReady || !window._ytPlayer) return
    try {
      const vol = isMuted ? 0 : Math.round(volume * 100)
      window._ytPlayer.setVolume(vol)
    } catch {}
  }, [volume, isMuted])

  // ── Seek ──────────────────────────────────────────────────
  const seek = useCallback((pct: number) => {
    try {
      const dur = window._ytPlayer?.getDuration() || 0
      window._ytPlayer?.seekTo((pct / 100) * dur, true)
      setCurrentTime((pct / 100) * dur)
    } catch {}
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        const { isPlaying, setPlaying } = usePlayerStore.getState()
        setPlaying(!isPlaying)
      }
      if (e.code === 'ArrowRight' && e.shiftKey) usePlayerStore.getState().next()
      if (e.code === 'ArrowLeft'  && e.shiftKey) usePlayerStore.getState().prev()
      if (e.code === 'KeyM') {
        const { isMuted, setMuted } = usePlayerStore.getState()
        setMuted(!isMuted)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { seek }
}
