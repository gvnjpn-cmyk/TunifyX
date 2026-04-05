'use client'
// ─────────────────────────────────────────────────────────────
// TunifyX v2 — Global Store (Zustand)
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand'
import type { Track, Playlist } from './types'
import { generateId } from './utils'

// ── LocalStorage ──────────────────────────────────────────────
const ls = {
  get: (k: string) => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } },
  set: (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}

function initFromLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  return ls.get(key) ?? fallback
}

// ── Types ─────────────────────────────────────────────────────
interface PlayerStore {
  // Playback
  currentTrack:  Track | null
  queue:         Track[]
  queueIndex:    number
  isPlaying:     boolean
  progress:      number
  duration:      number
  currentTime:   number
  volume:        number
  isMuted:       boolean
  isShuffle:     boolean
  repeatMode:    'off' | 'one' | 'all'
  isLoading:     boolean
  error:         string | null

  // Actions
  setQueue:        (tracks: Track[], index?: number) => void
  addToQueue:      (track: Track) => void
  removeFromQueue: (index: number) => void
  next:            () => void
  prev:            () => void
  setPlaying:      (v: boolean) => void
  setProgress:     (v: number) => void
  setDuration:     (v: number) => void
  setCurrentTime:  (v: number) => void
  setVolume:       (v: number) => void
  setMuted:        (v: boolean) => void
  toggleShuffle:   () => void
  toggleRepeat:    () => void
  setLoading:      (v: boolean) => void
  setError:        (msg: string | null) => void

  // Likes
  likes:        Track[]
  toggleLike:   (track: Track) => void
  isLiked:      (videoId: string) => boolean

  // Playlists
  playlists:          Playlist[]
  createPlaylist:     (name: string) => Playlist
  deletePlaylist:     (id: string) => void
  addToPlaylist:      (playlistId: string, track: Track) => boolean
  removeFromPlaylist: (playlistId: string, videoId: string) => void

  // History
  history:      Track[]
  addToHistory: (track: Track) => void
  clearHistory: () => void

  // UI
  isFullscreen: boolean
  setFullscreen: (v: boolean) => void
  activeView:   string
  setActiveView: (v: string) => void
  showQueue:    boolean
  setShowQueue: (v: boolean) => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // ── Playback state ────────────────────────────────────────
  currentTrack: null,
  queue:        [],
  queueIndex:   -1,
  isPlaying:    false,
  progress:     0,
  duration:     0,
  currentTime:  0,
  volume:       initFromLS('tx_volume', 0.8),
  isMuted:      false,
  isShuffle:    false,
  repeatMode:   initFromLS('tx_repeat', 'off') as 'off'|'one'|'all',
  isLoading:    false,
  error:        null,

  // ── Queue ──────────────────────────────────────────────────
  setQueue(tracks, index = 0) {
    const track = tracks[index]
    set({ queue: tracks, queueIndex: index, currentTrack: track, isPlaying: true, progress: 0, currentTime: 0, error: null })
    if (track) get().addToHistory(track)
  },

  addToQueue(track) {
    const { queue } = get()
    if (queue.some(t => t.videoId === track.videoId)) return
    set({ queue: [...queue, track] })
  },

  removeFromQueue(index) {
    const { queue, queueIndex } = get()
    const next = queue.filter((_, i) => i !== index)
    const ni   = index < queueIndex ? queueIndex - 1 : Math.min(queueIndex, next.length - 1)
    set({ queue: next, queueIndex: ni })
  },

  next() {
    const { queue, queueIndex, isShuffle, repeatMode } = get()
    if (!queue.length) return
    let idx: number
    if (repeatMode === 'one') {
      idx = queueIndex
    } else if (isShuffle) {
      do { idx = Math.floor(Math.random() * queue.length) }
      while (idx === queueIndex && queue.length > 1)
    } else {
      idx = queueIndex + 1
      if (idx >= queue.length) idx = repeatMode === 'all' ? 0 : -1
    }
    if (idx < 0) { set({ isPlaying: false }); return }
    set({ queueIndex: idx, currentTrack: queue[idx], progress: 0, currentTime: 0, isPlaying: true })
    get().addToHistory(queue[idx])
  },

  prev() {
    const { queue, queueIndex, currentTime } = get()
    if (!queue.length) return
    if (currentTime > 3) {
      // restart current
      try { (window as any)._ytPlayer?.seekTo(0, true) } catch {}
      set({ currentTime: 0, progress: 0 })
      return
    }
    const idx = Math.max(0, queueIndex - 1)
    set({ queueIndex: idx, currentTrack: queue[idx], progress: 0, currentTime: 0, isPlaying: true })
  },

  setPlaying:    (v) => set({ isPlaying: v }),
  setProgress:   (v) => set({ progress: v }),
  setDuration:   (v) => set({ duration: v }),
  setCurrentTime:(v) => set({ currentTime: v }),
  setMuted:      (v) => set({ isMuted: v }),
  setLoading:    (v) => set({ isLoading: v }),
  setError:      (v) => set({ error: v }),

  setVolume(v) {
    set({ volume: v, isMuted: v === 0 })
    ls.set('tx_volume', v)
  },

  toggleShuffle() { set(s => ({ isShuffle: !s.isShuffle })) },

  toggleRepeat() {
    set(s => {
      const next = s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off'
      ls.set('tx_repeat', next)
      return { repeatMode: next }
    })
  },

  // ── Likes ─────────────────────────────────────────────────
  likes: initFromLS('tx_likes', []),

  toggleLike(track) {
    const { likes } = get()
    const exists = likes.some(t => t.videoId === track.videoId)
    const next   = exists ? likes.filter(t => t.videoId !== track.videoId) : [track, ...likes]
    set({ likes: next })
    ls.set('tx_likes', next)
  },

  isLiked(videoId) {
    return get().likes.some(t => t.videoId === videoId)
  },

  // ── Playlists ──────────────────────────────────────────────
  playlists: initFromLS('tx_playlists', []),

  createPlaylist(name) {
    const pl: Playlist = { id: generateId(), name, tracks: [], createdAt: Date.now() }
    const next = [...get().playlists, pl]
    set({ playlists: next }); ls.set('tx_playlists', next)
    return pl
  },

  deletePlaylist(id) {
    const next = get().playlists.filter(p => p.id !== id)
    set({ playlists: next }); ls.set('tx_playlists', next)
  },

  addToPlaylist(playlistId, track) {
    const playlists = get().playlists.map(p => {
      if (p.id !== playlistId) return p
      if (p.tracks.some(t => t.videoId === track.videoId)) return p
      return { ...p, tracks: [...p.tracks, track] }
    })
    set({ playlists }); ls.set('tx_playlists', playlists)
    return true
  },

  removeFromPlaylist(playlistId, videoId) {
    const playlists = get().playlists.map(p =>
      p.id !== playlistId ? p : { ...p, tracks: p.tracks.filter(t => t.videoId !== videoId) }
    )
    set({ playlists }); ls.set('tx_playlists', playlists)
  },

  // ── History ───────────────────────────────────────────────
  history: initFromLS('tx_history', []),

  addToHistory(track) {
    const h = [track, ...get().history.filter(t => t.videoId !== track.videoId)].slice(0, 30)
    set({ history: h }); ls.set('tx_history', h)
  },

  clearHistory() { set({ history: [] }); ls.set('tx_history', []) },

  // ── UI ────────────────────────────────────────────────────
  isFullscreen: false,
  setFullscreen: (v) => set({ isFullscreen: v }),
  activeView:   'home',
  setActiveView: (v) => set({ activeView: v }),
  showQueue:    false,
  setShowQueue: (v) => set({ showQueue: v }),
}))
