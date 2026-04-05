'use client'
// ─────────────────────────────────────────────────────────────
// TunifyX — useAudio hook
// Controls a single shared HTML5 Audio element.
// When stream source is 'fallback', we defer to YouTube IFrame.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '@/lib/store'

// Singleton audio element
let _audio: HTMLAudioElement | null = null
function getAudio(): HTMLAudioElement {
  if (!_audio && typeof window !== 'undefined') {
    _audio = new Audio()
    _audio.preload = 'auto'
    _audio.crossOrigin = 'anonymous'
  }
  return _audio!
}

export function useAudio() {
  const {
    currentTrack, streamUrl, isPlaying, volume, isMuted,
    setPlaying, setProgress, setDuration, setCurrentTime,
    setLoading, setError, setStreamUrl,
    next, repeatMode,
  } = usePlayerStore()

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // ── Init audio element ───────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = getAudio()
    audioRef.current = audio

    const onTimeUpdate = () => {
      const dur = audio.duration || 0
      const cur = audio.currentTime || 0
      setCurrentTime(cur)
      setProgress(dur > 0 ? (cur / dur) * 100 : 0)
    }
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded  = () => { if (repeatMode !== 'one') next(); else audio.play().catch(() => {}) }
    const onPlay   = () => setPlaying(true)
    const onPause  = () => setPlaying(false)
    const onWaiting = () => setLoading(true)
    const onCanPlay = () => setLoading(false)
    const onError  = () => {
      setLoading(false)
      setError('Gagal memuat audio. Mencoba sumber lain...')
    }

    audio.addEventListener('timeupdate',    onTimeUpdate)
    audio.addEventListener('durationchange',onDurationChange)
    audio.addEventListener('ended',         onEnded)
    audio.addEventListener('play',          onPlay)
    audio.addEventListener('pause',         onPause)
    audio.addEventListener('waiting',       onWaiting)
    audio.addEventListener('canplay',       onCanPlay)
    audio.addEventListener('error',         onError)

    return () => {
      audio.removeEventListener('timeupdate',    onTimeUpdate)
      audio.removeEventListener('durationchange',onDurationChange)
      audio.removeEventListener('ended',         onEnded)
      audio.removeEventListener('play',          onPlay)
      audio.removeEventListener('pause',         onPause)
      audio.removeEventListener('waiting',       onWaiting)
      audio.removeEventListener('canplay',       onCanPlay)
      audio.removeEventListener('error',         onError)
    }
  }, [repeatMode])

  // ── Load stream when track changes ──────────────────────
  useEffect(() => {
    if (!currentTrack) return
    const audio = getAudio()

    // Fetch stream URL from our API
    setLoading(true)
    setError(null)

    fetch(`/api/stream?videoId=${currentTrack.videoId}`)
      .then(r => r.json())
      .then(data => {
        setStreamUrl(data.url)
        if (data.source !== 'fallback') {
          audio.src = data.url
          audio.load()
          audio.play().catch(() => setPlaying(false))
        }
        // If fallback, YouTube IFrame component handles playback
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        setError('Tidak dapat memuat stream')
      })
  }, [currentTrack?.videoId])

  // ── Play/pause ───────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !streamUrl) return
    // Don't control audio if using fallback (YouTube IFrame)
    if (streamUrl.includes('youtube')) return

    if (isPlaying) {
      audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, streamUrl])

  // ── Volume ───────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // ── Seek ─────────────────────────────────────────────────
  const seek = useCallback((pct: number) => {
    const audio = audioRef.current
    if (!audio) return
    const target = (pct / 100) * (audio.duration || 0)
    audio.currentTime = target
    setCurrentTime(target)
  }, [])

  return { seek, audio: audioRef }
}
