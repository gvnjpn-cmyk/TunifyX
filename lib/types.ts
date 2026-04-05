// ─────────────────────────────────────────────────────────────
// TunifyX — Shared Types
// ─────────────────────────────────────────────────────────────

export interface Track {
  videoId:   string
  title:     string
  artist:    string   // channel name
  thumbnail: string
  duration:  string   // "3:45"
  durationSec?: number
}

export interface SearchResult {
  tracks:  Track[]
  total:   number
  query:   string
}

export interface StreamResult {
  url:       string          // audio stream URL
  source:    'youtube-embed' | 'invidious' | 'piped' | 'fallback'
  videoId:   string
  expiresAt?: number         // unix timestamp
}

export interface Playlist {
  id:        string
  name:      string
  cover?:    string
  tracks:    Track[]
  createdAt: number
}

export interface PlayerState {
  currentTrack:  Track | null
  queue:         Track[]
  queueIndex:    number
  isPlaying:     boolean
  progress:      number      // 0–100
  duration:      number      // seconds
  currentTime:   number      // seconds
  volume:        number      // 0–1
  isMuted:       boolean
  isShuffle:     boolean
  repeatMode:    'off' | 'one' | 'all'
  streamUrl:     string | null
  isLoading:     boolean
  error:         string | null
}
