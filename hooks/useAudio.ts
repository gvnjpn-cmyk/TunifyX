'use client'
// ─────────────────────────────────────────────────────────────
// TunifyX v2 — useAudio
// YouTube IFrame API engine — singleton, survives navigation
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

function loadYTScript() {
  if (typeof window === 'undefined') return
  if (document.getElementById('yt-iframe-api')) return
  const tag = document.createElement('script')
  tag.id  = 'yt-iframe-api'
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
}

function ensureContainer() {
  if (document.getElementById('yt-player-root')) return
  const wrap  = document.createElement('div')
  wrap.id     = 'yt-player-root'
  wrap.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;'
  const inner = document.createElement('div')
  inner.id    = 'yt-player-inner'
  wrap.appendChild(inner)
  document.body.appendChild(wrap)
}

let _progressTimer: ReturnType<typeof setInterval> | null = null

function initPlayer(
  onReady:    () => void,
  onState:    (state: number) => void,
  onProgress: (cur: number, dur: number) => void,
  onError:    (code: number) => void,
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
      onReady:       () => { window._ytReady = true; onReady() },
      onStateChange: (e: any) => onState(e.data),
      onError:       (e: any) => onError(e.data),
    },
  })

  // Poll progress every 400ms
  if (_progressTimer) clearInterval(_progressTimer)
  _progressTimer = setInterval(() => {
    try {
      const p = window._ytPlayer
      if (!p || typeof p.getCurrentTime !== 'function') return
      onProgress(p.getCurrentTime() || 0, p.getDuration() || 0)
    } catch {}
  }, 400)
}

export function useAudio() {
  const {
    currentTrack, isPlaying, volume, isMuted,
    setPlaying, setProgress, setDuration, setCurrentTime,
    setLoading, setError,
  } = usePlayerStore()

  const readyRef    = useRef(false)
  const loadingRef  = useRef(false)   // prevent double-load

  // ── Boot ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    loadYTScript()

    const boot = () => {
      if (readyRef.current) return
      readyRef.current = true

      initPlayer(
        // onReady
        () => {
          const { currentTrack } = usePlayerStore.getState()
          if (currentTrack) {
            window._ytPlayer.loadVideoById(currentTrack.videoId)
          }
        },
        // onStateChange
        (state) => {
          const YT = window.YT?.PlayerState
          if (!YT) return
          if (state === YT.PLAYING) {
            setPlaying(true)
            setLoading(false)
            loadingRef.current = false
          }
          if (state === YT.PAUSED)    { setPlaying(false); setLoading(false) }
          if (state === YT.BUFFERING) { setLoading(true) }
          if (state === YT.CUED)      { setLoading(false) }
          if (state === YT.ENDED) {
            setPlaying(false)
            setLoading(false)
            const { repeatMode } = usePlayerStore.getState()
            if (repeatMode === 'one') {
              // seek to 0 and replay — no new load
              try {
                window._ytPlayer.seekTo(0, true)
                window._ytPlayer.playVideo()
              } catch {}
            } else {
              usePlayerStore.getState().next()
            }
          }
        },
        // onProgress
        (cur, dur) => {
          setCurrentTime(cur)
          setDuration(dur)
          setProgress(dur > 0 ? (cur / dur) * 100 : 0)
        },
        // onError
        (code) => {
          setLoading(false)
          loadingRef.current = false
          // 101, 150 = embed blocked; 5 = HTML5 error; 2 = invalid id
          if (code === 101 || code === 150) {
            setError('Video tidak bisa diputar (embed diblokir). Coba lagu lain.')
          } else {
            setError(`Gagal memutar video (kode ${code}). Melewati...`)
            // Auto-skip after error
            setTimeout(() => {
              setError(null)
              usePlayerStore.getState().next()
            }, 2000)
          }
        }
      )
    }

    if (window.YT?.Player) { boot() }
    else { window.onYouTubeIframeAPIReady = boot }
  }, [])

  // ── Load new track ─────────────────────────────────────────
  useEffect(() => {
    if (!currentTrack) return
    if (loadingRef.current) return  // prevent double-load spam

    loadingRef.current = true
    setLoading(true)
    setError(null)

    const load = () => {
      try {
        window._ytPlayer.loadVideoById(currentTrack.videoId)
        // loadVideoById auto-plays
      } catch {
        loadingRef.current = false
        setLoading(false)
      }
    }

    if (window._ytReady && window._ytPlayer) {
      load()
    } else {
      const t = setInterval(() => {
        if (window._ytReady && window._ytPlayer) {
          clearInterval(t); load()
        }
      }, 200)
      return () => clearInterval(t)
    }
  }, [currentTrack?.videoId])

  // ── Play / Pause ───────────────────────────────────────────
  useEffect(() => {
    if (!window._ytReady || !window._ytPlayer) return
    try {
      if (isPlaying) window._ytPlayer.playVideo()
      else           window._ytPlayer.pauseVideo()
    } catch {}
  }, [isPlaying])

  // ── Volume ─────────────────────────────────────────────────
  useEffect(() => {
    if (!window._ytReady || !window._ytPlayer) return
    try { window._ytPlayer.setVolume(isMuted ? 0 : Math.round(volume * 100)) } catch {}
  }, [volume, isMuted])

  // ── Seek ───────────────────────────────────────────────────
  const seek = useCallback((pct: number) => {
    try {
      const dur = window._ytPlayer?.getDuration() || 0
      const to  = (pct / 100) * dur
      window._ytPlayer?.seekTo(to, true)
      setCurrentTime(to)
      setProgress(pct)
    } catch {}
  }, [])

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space')                       { e.preventDefault(); const s = usePlayerStore.getState(); s.setPlaying(!s.isPlaying) }
      if (e.code === 'ArrowRight' && e.shiftKey)    usePlayerStore.getState().next()
      if (e.code === 'ArrowLeft'  && e.shiftKey)    usePlayerStore.getState().prev()
      if (e.code === 'KeyM')                        { const s = usePlayerStore.getState(); s.setMuted(!s.isMuted) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { seek }
}
