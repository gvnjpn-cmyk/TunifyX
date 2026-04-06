// ─────────────────────────────────────────────────────────────
// TunifyX — Resume System
// Pure helper module. No React, no Zustand.
//
// Structure in localStorage (key: "tx_last_play"):
// {
//   track:     Track        — full track object
//   time:      number       — currentTime in seconds
//   savedAt:   number       — unix timestamp (for expiry check)
//   duration:  number       — total duration (to validate time)
// }
//
// Rules:
//   - Save every 4s (caller's responsibility via interval)
//   - Expire after 30 days
//   - Validate: time must be > 3s AND < duration - 5s
//     (no point resuming from 0:01 or if nearly finished)
//   - Silently ignore any JSON parse / localStorage errors
// ─────────────────────────────────────────────────────────────

import type { Track } from './types'

const KEY     = 'tx_last_play'
const EXPIRY  = 30 * 24 * 60 * 60 * 1000  // 30 days in ms
const MIN_SEC = 3    // don't resume if before 3 seconds
const TAIL_SEC = 5   // don't resume if within 5s of end

export interface ResumeData {
  track:    Track
  time:     number
  savedAt:  number
  duration: number
}

// ── Save ──────────────────────────────────────────────────────
export function saveProgress(track: Track, time: number, duration: number): void {
  if (typeof window === 'undefined') return
  if (!track?.videoId) return

  try {
    const data: ResumeData = {
      track,
      time:     Math.floor(time),
      savedAt:  Date.now(),
      duration: Math.floor(duration),
    }
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

// ── Load & Validate ───────────────────────────────────────────
export function loadResume(): ResumeData | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null

    const data: ResumeData = JSON.parse(raw)

    // Validate shape
    if (!data?.track?.videoId || typeof data.time !== 'number') return null

    // Expired?
    if (Date.now() - (data.savedAt || 0) > EXPIRY) {
      clearResume()
      return null
    }

    // Time sanity check
    // If duration unknown (0), just need time > MIN_SEC
    if (data.time < MIN_SEC) return null
    if (data.duration > 0 && data.time > data.duration - TAIL_SEC) return null

    return data
  } catch {
    // Corrupt data — clean up
    clearResume()
    return null
  }
}

// ── Clear ─────────────────────────────────────────────────────
export function clearResume(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(KEY) } catch {}
}

// ── Update time only (without changing track/savedAt expiry) ──
export function updateResumeTime(time: number, duration: number): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const data: ResumeData = JSON.parse(raw)
    if (!data?.track?.videoId) return
    data.time     = Math.floor(time)
    data.duration = Math.floor(duration)
    data.savedAt  = Date.now()
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {}
}
