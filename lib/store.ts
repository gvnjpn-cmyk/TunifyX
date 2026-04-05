'use client'
// ─────────────────────────────────────────────────────────────
// TunifyX — Global Player Store (Zustand)
// Handles all playback state: queue, track, controls
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand'
import type { Track, PlayerState, Playlist } from './types'
import { generateId } from './utils'

// ── LocalStorage helpers ─────────────────────────────────────
function loadPlaylists(): Playlist[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('tunifyx_playlists') || '[]') } catch { return [] }
}
function savePlaylists(playlists: Playlist[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('tunifyx_playlists', JSON.stringify(playlists))
}
function loadHistory(): Track[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('tunifyx_history') || '[]') } catch { return [] }
}
function saveHistory(tracks: Track[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('tunifyx_history', JSON.stringify(tracks.slice(0, 30)))
}

// ── Player Store ─────────────────────────────────────────────
interface PlayerStore extends PlayerState {
  // Actions
  setQueue:        (tracks: Track[], index?: number) => void
  playTrack:       (track: Track) => void
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
  setStreamUrl:    (url: string | null) => void
  setLoading:      (v: boolean) => void
  setError:        (msg: string | null) => void

  // Playlist actions
  playlists:       Playlist[]
  createPlaylist:  (name: string) => Playlist
  deletePlaylist:  (id: string) => void
  addToPlaylist:   (playlistId: string, track: Track) => void
  removeFromPlaylist: (playlistId: string, videoId: string) => void

  // History
  history:         Track[]
  addToHistory:    (track: Track) => void

  // UI
  isFullscreen:    boolean
  setFullscreen:   (v: boolean) => void
  activeView:      string
  setActiveView:   (v: string) => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────
  currentTrack:  null,
  queue:         [],
  queueIndex:    -1,
  isPlaying:     false,
  progress:      0,
  duration:      0,
  currentTime:   0,
  volume:        0.8,
  isMuted:       false,
  isShuffle:     false,
  repeatMode:    'off',
  streamUrl:     null,
  isLoading:     false,
  error:         null,
  playlists:     loadPlaylists(),
  history:       loadHistory(),
  isFullscreen:  false,
  activeView:    'home',

  // ── Playback ───────────────────────────────────────────────
  setQueue(tracks, index = 0) {
    set({ queue: tracks, queueIndex: index, currentTrack: tracks[index] || null })
  },

  playTrack(track) {
    const { queue } = get()
    const idx = queue.findIndex(t => t.videoId === track.videoId)
    if (idx >= 0) {
      set({ queueIndex: idx, currentTrack: track, streamUrl: null })
    } else {
      const newQueue = [...queue, track]
      set({ queue: newQueue, queueIndex: newQueue.length - 1, currentTrack: track, streamUrl: null })
    }
    get().addToHistory(track)
  },

  addToQueue(track) {
    const { queue } = get()
    if (queue.some(t => t.videoId === track.videoId)) return
    set({ queue: [...queue, track] })
  },

  removeFromQueue(index) {
    const { queue, queueIndex } = get()
    const newQueue = queue.filter((_, i) => i !== index)
    const newIdx   = index < queueIndex ? queueIndex - 1 : queueIndex
    set({ queue: newQueue, queueIndex: Math.min(newIdx, newQueue.length - 1) })
  },

  next() {
    const { queue, queueIndex, isShuffle, repeatMode } = get()
    if (!queue.length) return

    let nextIdx: number
    if (repeatMode === 'one') {
      nextIdx = queueIndex
    } else if (isShuffle) {
      do { nextIdx = Math.floor(Math.random() * queue.length) }
      while (nextIdx === queueIndex && queue.length > 1)
    } else {
      nextIdx = queueIndex + 1
      if (nextIdx >= queue.length) {
        nextIdx = repeatMode === 'all' ? 0 : -1
      }
    }

    if (nextIdx < 0) {
      set({ isPlaying: false })
      return
    }
    set({ queueIndex: nextIdx, currentTrack: queue[nextIdx], streamUrl: null })
    get().addToHistory(queue[nextIdx])
  },

  prev() {
    const { queue, queueIndex, currentTime } = get()
    if (!queue.length) return
    // If >3s in, restart current track
    if (currentTime > 3) {
      set({ currentTime: 0, progress: 0 })
      return
    }
    const prevIdx = Math.max(0, queueIndex - 1)
    set({ queueIndex: prevIdx, currentTrack: queue[prevIdx], streamUrl: null })
  },

  setPlaying:    (v) => set({ isPlaying: v }),
  setProgress:   (v) => set({ progress: v }),
  setDuration:   (v) => set({ duration: v }),
  setCurrentTime:(v) => set({ currentTime: v }),
  setVolume:     (v) => set({ volume: v, isMuted: v === 0 }),
  setMuted:      (v) => set({ isMuted: v }),
  setStreamUrl:  (url) => set({ streamUrl: url }),
  setLoading:    (v) => set({ isLoading: v }),
  setError:      (msg) => set({ error: msg }),

  toggleShuffle() { set(s => ({ isShuffle: !s.isShuffle })) },
  toggleRepeat() {
    set(s => ({
      repeatMode: s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off'
    }))
  },

  // ── Playlists ──────────────────────────────────────────────
  createPlaylist(name) {
    const pl: Playlist = { id: generateId(), name, tracks: [], createdAt: Date.now() }
    const next = [...get().playlists, pl]
    set({ playlists: next }); savePlaylists(next)
    return pl
  },
  deletePlaylist(id) {
    const next = get().playlists.filter(p => p.id !== id)
    set({ playlists: next }); savePlaylists(next)
  },
  addToPlaylist(playlistId, track) {
    const playlists = get().playlists.map(p => {
      if (p.id !== playlistId) return p
      if (p.tracks.some(t => t.videoId === track.videoId)) return p
      return { ...p, tracks: [...p.tracks, track] }
    })
    set({ playlists }); savePlaylists(playlists)
  },
  removeFromPlaylist(playlistId, videoId) {
    const playlists = get().playlists.map(p =>
      p.id !== playlistId ? p : { ...p, tracks: p.tracks.filter(t => t.videoId !== videoId) }
    )
    set({ playlists }); savePlaylists(playlists)
  },

  // ── History ────────────────────────────────────────────────
  addToHistory(track) {
    const h = [track, ...get().history.filter(t => t.videoId !== track.videoId)].slice(0, 30)
    set({ history: h }); saveHistory(h)
  },

  // ── UI ─────────────────────────────────────────────────────
  setFullscreen: (v) => set({ isFullscreen: v }),
  setActiveView: (v) => set({ activeView: v }),
}))
