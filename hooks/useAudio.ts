'use client'
// ─────────────────────────────────────────────────────────────
// TunifyX v4 — useAudio
// YouTube IFrame API engine — singleton, survives navigation
//
// Resume changes:
//   - Saves progress to localStorage every 4s via throttle
//   - Saves immediately on track change (overwrite)
//   - Seeks to saved position when resumed track finishes loading
//   - Clears resume data when track errors
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '@/lib/store'
import { saveProgress, updateResumeTime, clearResume, loadResume } from '@/lib/resume'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
    _ytPlayer:  any
    _ytReady:   boolean
    _ytBooted:  boolean
  }
}

function loadYTScript() {
  if (typeof window === 'undefined') return
  if (document.getElementById('yt-iframe-api')) return
  const s = document.createElement('script')
  s.id = 'yt-iframe-api'
  s.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(s)
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
// ── Resume: pending seek after player is ready ────────────────
// Set by useAudio when user clicks "Lanjutkan", consumed once
let _pendingSeekTo: number | null = null

export function setPendingSeek(seconds: number) {
  _pendingSeekTo = seconds
}

// Helper: update progress in store (avoids stale closure)
function store_setProgress(cur: number, dur: number) {
  const s = usePlayerStore.getState()
  s.setCurrentTime(cur)
  s.setDuration(dur)
  s.setProgress(dur > 0 ? (cur / dur) * 100 : 0)
}

function initYTPlayer(
  onReady:    () => void,
  onState:    (s: number) => void,
  onProgress: (cur: number, dur: number) => void,
  onError:    (code: number) => void,
) {
  ensureContainer()
  if (window._ytPlayer) return

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

  if (_progressTimer) clearInterval(_progressTimer)
  _progressTimer = setInterval(() => {
    try {
      const p = window._ytPlayer
      if (!p?.getCurrentTime) return
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

  const readyRef      = useRef(false)
  const loadingRef    = useRef(false)
  // Throttle: track last save time
  const lastSaveRef   = useRef(0)
  // Track if current load is a resume (need to seek after PLAYING)
  const resumeSeekRef = useRef<number | null>(null)

  // ── Boot ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window._ytBooted) return
    window._ytBooted = true
    loadYTScript()

    const boot = () => {
      if (!window.YT?.Player) return
      initYTPlayer(
        // onReady
        () => {
          const { currentTrack } = usePlayerStore.getState()
          if (currentTrack) window._ytPlayer.loadVideoById(currentTrack.videoId)
        },
        // onStateChange
        (state) => {
          const YT = window.YT?.PlayerState
          if (!YT) return
          const store = usePlayerStore.getState()

          if (state === YT.PLAYING) {
            store.setPlaying(true)
            store.setLoading(false)
            loadingRef.current = false

            // ── Resume seek: fire once after video starts playing ──
            const seekTo = resumeSeekRef.current ?? _pendingSeekTo
            if (seekTo !== null && seekTo > 0) {
              try {
                window._ytPlayer.seekTo(seekTo, true)
                store.setCurrentTime(seekTo)
              } catch {}
              resumeSeekRef.current = null
              _pendingSeekTo        = null
            }
          }
          if (state === YT.PAUSED)    { store.setPlaying(false); store.setLoading(false) }
          if (state === YT.BUFFERING) { store.setLoading(true) }
          if (state === YT.CUED)      { store.setLoading(false) }

          if (state === YT.ENDED) {
            store.setPlaying(false)
            store.setLoading(false)
            // Clear resume when song naturally ends
            clearResume()
            const { repeatMode } = usePlayerStore.getState()
            if (repeatMode === 'one') {
              try { window._ytPlayer.seekTo(0, true); window._ytPlayer.playVideo() } catch {}
            } else {
              setTimeout(() => usePlayerStore.getState().next(), 300)
            }
          }
        },
        // onProgress
        (cur, dur) => {
          store_setProgress(cur, dur)
          // ── Throttled save: every 4 seconds ──
          const now = Date.now()
          if (now - lastSaveRef.current >= 4000) {
            lastSaveRef.current = now
            const { currentTrack } = usePlayerStore.getState()
            if (currentTrack && cur > 3) {
              updateResumeTime(cur, dur)
            }
          }
        },
        // onError
        (code) => {
          const store = usePlayerStore.getState()
          store.setLoading(false)
          loadingRef.current = false
          clearResume() // bad track — remove from resume
          if (code === 101 || code === 150) {
            store.setError('Video tidak bisa diputar. Coba lagu lain.')
          } else {
            store.setError(`Gagal memutar (kode ${code}). Melewati...`)
            setTimeout(() => { store.setError(null); usePlayerStore.getState().next() }, 2000)
          }
        },
      )
    }

    if (window.YT?.Player) boot()
    else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { prev?.(); boot() }
    }
  }, [])

  // ── Load new track ──────────────────────────────────────────
  useEffect(() => {
    if (!currentTrack) return
    if (loadingRef.current) return

    loadingRef.current = true
    setLoading(true)
    setError(null)

    // Save full track info immediately when track changes
    saveProgress(currentTrack, 0, 0)
    lastSaveRef.current = Date.now()

    const load = () => {
      try { window._ytPlayer.loadVideoById(currentTrack.videoId) }
      catch { loadingRef.current = false; setLoading(false) }
    }

    if (window._ytReady && window._ytPlayer) {
      load()
    } else {
      const t = setInterval(() => {
        if (window._ytReady && window._ytPlayer) { clearInterval(t); load() }
      }, 200)
      return () => clearInterval(t)
    }
  }, [currentTrack?.videoId])

  // ── Play / Pause ────────────────────────────────────────────
  useEffect(() => {
    if (!window._ytReady || !window._ytPlayer) return
    try {
      if (isPlaying) window._ytPlayer.playVideo()
      else           window._ytPlayer.pauseVideo()
    } catch {}
  }, [isPlaying])

  // ── Volume ──────────────────────────────────────────────────
  useEffect(() => {
    if (!window._ytReady || !window._ytPlayer) return
    try { window._ytPlayer.setVolume(isMuted ? 0 : Math.round(volume * 100)) } catch {}
  }, [volume, isMuted])

  // ── Seek ────────────────────────────────────────────────────
  const seek = useCallback((pct: number) => {
    try {
      const dur = window._ytPlayer?.getDuration() || 0
      const to  = (pct / 100) * dur
      window._ytPlayer?.seekTo(to, true)
      setCurrentTime(to)
      setProgress(pct)
    } catch {}
  }, [])

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const s = usePlayerStore.getState()
      if (e.code === 'Space')                    { e.preventDefault(); s.setPlaying(!s.isPlaying) }
      if (e.code === 'ArrowRight' && e.shiftKey) { e.preventDefault(); s.next() }
      if (e.code === 'ArrowLeft'  && e.shiftKey) { e.preventDefault(); s.prev() }
      if (e.code === 'KeyM')                     { s.setMuted(!s.isMuted) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Resume seek ref setter (called from ResumeCard) ─────────
  // Exposed so ResumeCard can set seek position before playContext
  useEffect(() => {
    // If a pending seek was set externally via setPendingSeek(),
    // store it in resumeSeekRef so it fires on next PLAYING event
    if (_pendingSeekTo !== null) {
      resumeSeekRef.current = _pendingSeekTo
    }
  }, [currentTrack?.videoId])

  return { seek }
}


