'use client'
// ─────────────────────────────────────────────────────────────
// TunifyX v2 — Global Store (Zustand)
// Queue: pisah antara "context queue" (list lagu saat ini)
// dan "up next queue" (lagu yang user tambahkan manual)
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand'
import type { Track, Playlist } from './types'
import { generateId } from './utils'

const ls = {
  get: (k: string) => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } },
  set: (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}
function initFromLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  return ls.get(key) ?? fallback
}

// ─────────────────────────────────────────────────────────────
// QUEUE MODEL
//
// Spotify-style queue punya 2 layer:
//   1. upNext  — lagu yang user tambahkan via "Add to Queue"
//      diputar SEBELUM context queue berlanjut
//   2. context — list lagu saat ini (hasil search/playlist/trending)
//      + contextIndex = posisi saat ini di context
//
// currentTrack selalu = track yang sedang diputar
//
// next() logic:
//   if upNext.length > 0 → ambil upNext[0], shift upNext
//   else if contextIndex+1 < context.length → contextIndex++
//   else if repeat=all → contextIndex = 0
//   else → stop
// ─────────────────────────────────────────────────────────────

interface PlayerStore {
  // ── Playback ──────────────────────────────────────────────
  currentTrack:  Track | null
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

  // ── Queue ──────────────────────────────────────────────────
  // context = lagu yang sedang diputar dalam satu "sesi" (e.g. hasil search)
  context:       Track[]
  contextIndex:  number
  // upNext = antrian manual dari user (add to queue)
  upNext:        Track[]

  // ── Queue actions ─────────────────────────────────────────
  // Play list lagu mulai dari index (set context baru)
  playContext:       (tracks: Track[], index?: number) => void
  // Tambah ke upNext (tidak ganggu lagu sekarang)
  addToQueue:        (track: Track) => void
  // Tambah banyak sekaligus
  addManyToQueue:    (tracks: Track[]) => void
  // Hapus dari upNext by index
  removeFromUpNext:  (index: number) => void
  // Hapus dari context by index
  removeFromContext: (index: number) => void
  // Clear semua upNext
  clearUpNext:       () => void
  // Pindah urutan upNext (drag & drop ready)
  reorderUpNext:     (fromIndex: number, toIndex: number) => void
  // Langsung play track tertentu dari context
  playFromContext:   (index: number) => void
  // Langsung play track dari upNext
  playFromUpNext:    (index: number) => void
  // Next / Prev
  next:  () => void
  prev:  () => void

  // ── Playback setters ──────────────────────────────────────
  setPlaying:     (v: boolean) => void
  setProgress:    (v: number) => void
  setDuration:    (v: number) => void
  setCurrentTime: (v: number) => void
  setVolume:      (v: number) => void
  setMuted:       (v: boolean) => void
  toggleShuffle:  () => void
  toggleRepeat:   () => void
  setLoading:     (v: boolean) => void
  setError:       (msg: string | null) => void

  // ── Likes ─────────────────────────────────────────────────
  likes:      Track[]
  toggleLike: (track: Track) => void
  isLiked:    (videoId: string) => boolean

  // ── Playlists ─────────────────────────────────────────────
  playlists:          Playlist[]
  createPlaylist:     (name: string) => Playlist
  deletePlaylist:     (id: string) => void
  addToPlaylist:      (playlistId: string, track: Track) => boolean
  removeFromPlaylist: (playlistId: string, videoId: string) => void

  // ── History ───────────────────────────────────────────────
  history:      Track[]
  addToHistory: (track: Track) => void
  clearHistory: () => void

  // ── UI ────────────────────────────────────────────────────
  isFullscreen:  boolean
  setFullscreen: (v: boolean) => void
  activeView:    string
  setActiveView: (v: string) => void
  showQueue:     boolean
  setShowQueue:  (v: boolean) => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────
  currentTrack: null,
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

  context:      [],
  contextIndex: -1,
  upNext:       [],

  // ── Play a context (list lagu baru) ───────────────────────
  playContext(tracks, index = 0) {
    if (!tracks.length) return
    const idx   = Math.max(0, Math.min(index, tracks.length - 1))
    const track = tracks[idx]
    set({
      context:      tracks,
      contextIndex: idx,
      currentTrack: track,
      isPlaying:    true,
      progress:     0,
      currentTime:  0,
      error:        null,
    })
    get().addToHistory(track)
  },

  // ── Add to upNext (tidak interrupt lagu sekarang) ─────────
  addToQueue(track) {
    // Allow duplicates — user intentionally added it
    set(s => ({ upNext: [...s.upNext, track] }))
  },

  addManyToQueue(tracks) {
    set(s => ({ upNext: [...s.upNext, ...tracks] }))
  },

  removeFromUpNext(index) {
    set(s => ({
      upNext: s.upNext.filter((_, i) => i !== index)
    }))
  },

  removeFromContext(index) {
    const { context, contextIndex, currentTrack } = get()
    const newContext = context.filter((_, i) => i !== index)

    // Jika hapus lagu yang sedang aktif
    if (index === contextIndex) {
      if (newContext.length === 0) {
        // Context habis, stop
        set({ context: [], contextIndex: -1, currentTrack: null, isPlaying: false })
        return
      }
      // Lanjut ke lagu berikutnya (atau prev jika ini terakhir)
      const nextIdx = Math.min(index, newContext.length - 1)
      set({
        context:      newContext,
        contextIndex: nextIdx,
        currentTrack: newContext[nextIdx],
        isPlaying:    true,
        progress:     0,
        currentTime:  0,
      })
      return
    }

    // Hapus lagu sebelum yang aktif → shift index
    const newIdx = index < contextIndex ? contextIndex - 1 : contextIndex
    set({ context: newContext, contextIndex: newIdx })
  },

  clearUpNext() {
    set({ upNext: [] })
  },

  reorderUpNext(from, to) {
    const { upNext } = get()
    if (from === to) return
    const arr  = [...upNext]
    const item = arr.splice(from, 1)[0]
    arr.splice(to, 0, item)
    set({ upNext: arr })
  },

  playFromContext(index) {
    const { context } = get()
    if (!context[index]) return
    set({
      contextIndex: index,
      currentTrack: context[index],
      isPlaying:    true,
      progress:     0,
      currentTime:  0,
      error:        null,
    })
    get().addToHistory(context[index])
  },

  playFromUpNext(index) {
    const { upNext, context, contextIndex } = get()
    if (!upNext[index]) return
    const track   = upNext[index]
    const newUpNext = upNext.filter((_, i) => i !== index)
    set({
      upNext:      newUpNext,
      currentTrack: track,
      isPlaying:   true,
      progress:    0,
      currentTime: 0,
      error:       null,
    })
    get().addToHistory(track)
  },

  // ── Next ──────────────────────────────────────────────────
  next() {
    const { upNext, context, contextIndex, isShuffle, repeatMode } = get()

    // 1. Ada di upNext → ambil pertama
    if (upNext.length > 0) {
      const [next, ...rest] = upNext
      set({
        upNext:       rest,
        currentTrack: next,
        isPlaying:    true,
        progress:     0,
        currentTime:  0,
        error:        null,
      })
      get().addToHistory(next)
      return
    }

    // 2. Tidak ada upNext → lanjut context
    if (!context.length) {
      set({ isPlaying: false })
      return
    }

    let nextIdx: number
    if (repeatMode === 'one') {
      nextIdx = contextIndex
    } else if (isShuffle) {
      // Random tapi hindari lagu yang sama
      do { nextIdx = Math.floor(Math.random() * context.length) }
      while (nextIdx === contextIndex && context.length > 1)
    } else {
      nextIdx = contextIndex + 1
      if (nextIdx >= context.length) {
        if (repeatMode === 'all') nextIdx = 0
        else { set({ isPlaying: false }); return }
      }
    }

    set({
      contextIndex: nextIdx,
      currentTrack: context[nextIdx],
      isPlaying:    true,
      progress:     0,
      currentTime:  0,
      error:        null,
    })
    get().addToHistory(context[nextIdx])
  },

  // ── Prev ──────────────────────────────────────────────────
  prev() {
    const { context, contextIndex, currentTime } = get()

    // Jika >3 detik → restart lagu sekarang
    if (currentTime > 3) {
      try { (window as any)._ytPlayer?.seekTo(0, true) } catch {}
      set({ currentTime: 0, progress: 0 })
      return
    }

    if (!context.length) return
    const prevIdx = Math.max(0, contextIndex - 1)
    set({
      contextIndex: prevIdx,
      currentTrack: context[prevIdx],
      isPlaying:    true,
      progress:     0,
      currentTime:  0,
      error:        null,
    })
  },

  // ── Setters ───────────────────────────────────────────────
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
      const r = s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off'
      ls.set('tx_repeat', r)
      return { repeatMode: r }
    })
  },

  // ── Likes ─────────────────────────────────────────────────
  likes: initFromLS('tx_likes', []),
  toggleLike(track) {
    const exists = get().likes.some(t => t.videoId === track.videoId)
    const next   = exists
      ? get().likes.filter(t => t.videoId !== track.videoId)
      : [track, ...get().likes]
    set({ likes: next }); ls.set('tx_likes', next)
  },
  isLiked(videoId) { return get().likes.some(t => t.videoId === videoId) },

  // ── Playlists ─────────────────────────────────────────────
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
    const h = [track, ...get().history.filter(t => t.videoId !== track.videoId)].slice(0, 50)
    set({ history: h }); ls.set('tx_history', h)
  },
  clearHistory() { set({ history: [] }); ls.set('tx_history', []) },

  // ── UI ────────────────────────────────────────────────────
  isFullscreen:  false,
  setFullscreen: (v) => set({ isFullscreen: v }),
  activeView:    'home',
  setActiveView: (v) => set({ activeView: v }),
  showQueue:     false,
  setShowQueue:  (v) => set({ showQueue: v }),
}))

// ── Backward compat shim ──────────────────────────────────────
// Komponen lama masih pakai setQueue/queue/queueIndex
// Shim ini biar tidak perlu update semua komponen sekaligus
export function getQueueCompat() {
  const s = usePlayerStore.getState()
  return {
    queue:      [...s.upNext, ...s.context.slice(s.contextIndex)],
    queueIndex: s.upNext.length, // current = setelah upNext habis
  }
}
