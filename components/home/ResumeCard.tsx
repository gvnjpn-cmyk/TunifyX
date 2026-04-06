'use client'
// ─────────────────────────────────────────────────────────────
// TunifyX — ResumeCard
// "Lanjutkan" card that appears on HomeView when there's
// a saved playback position in localStorage.
//
// Flow:
//   1. On mount: read localStorage via loadResume()
//   2. If valid: show card
//   3. User clicks "Lanjutkan":
//      - setPendingSeek(savedTime) so useAudio seeks after load
//      - playContext([track], 0) → triggers track load in useAudio
//      - Card dismisses
//   4. User clicks "✕": clearResume() + dismiss card
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { loadResume, clearResume, type ResumeData } from '@/lib/resume'
import { setPendingSeek } from '@/hooks/useAudio'
import { usePlayerStore } from '@/lib/store'
import { formatTime } from '@/lib/utils'

export function ResumeCard() {
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [visible, setVisible] = useState(false)
  const { playContext, currentTrack } = usePlayerStore()

  // ── Load on mount ─────────────────────────────────────────
  useEffect(() => {
    const data = loadResume()
    if (!data) return
    // Don't show if this track is already playing
    if (currentTrack?.videoId === data.track.videoId) return
    setResume(data)
    // Tiny delay so card animates in after page render
    const t = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(t)
  }, []) // intentionally run once on mount

  // ── Auto-dismiss if user manually plays the same track ────
  useEffect(() => {
    if (!resume) return
    if (currentTrack?.videoId === resume.track.videoId) {
      dismiss(false) // dismiss without clearing (user is already playing it)
    }
  }, [currentTrack?.videoId])

  function dismiss(shouldClear = true) {
    setVisible(false)
    // Remove from DOM after fade-out animation
    setTimeout(() => setResume(null), 300)
    if (shouldClear) clearResume()
  }

  function handleResume() {
    if (!resume) return
    // Tell useAudio to seek to this position on the next PLAYING event
    setPendingSeek(resume.time)
    // Load the track (playContext sets currentTrack → triggers useAudio load)
    playContext([resume.track], 0)
    // Dismiss card (don't clear resume yet — useAudio will update it as it plays)
    setVisible(false)
    setTimeout(() => setResume(null), 300)
  }

  if (!resume) return null

  const pct = resume.duration > 0
    ? Math.min(100, (resume.time / resume.duration) * 100)
    : 0

  return (
    <div
      className={`
        transition-all duration-300 ease-out overflow-hidden
        ${visible ? 'opacity-100 max-h-28 mb-0' : 'opacity-0 max-h-0 mb-0'}
      `}
    >
      <div className="flex items-center gap-3 bg-[#1a1a2e] border border-[#1DB954]/25 rounded-xl p-3 mb-1">
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
          <img
            src={resume.track.thumbnail}
            alt={resume.track.title}
            className="w-full h-full object-cover"
          />
          {/* Mini progress ring overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <svg viewBox="0 0 36 36" width="28" height="28" className="-rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3"/>
              <circle
                cx="18" cy="18" r="14"
                fill="none"
                stroke="#1DB954"
                strokeWidth="3"
                strokeDasharray={`${(pct / 100) * 87.96} 87.96`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[#1DB954] font-semibold uppercase tracking-wider mb-0.5">
            Lanjutkan mendengarkan
          </p>
          <p className="text-sm font-medium text-white truncate">{resume.track.title}</p>
          <p className="text-xs text-[#b3b3b3] truncate">
            {resume.track.artist}
            <span className="mx-1.5 text-[#b3b3b3]/40">·</span>
            {formatTime(resume.time)}
            {resume.duration > 0 && (
              <span className="text-[#b3b3b3]/40"> / {formatTime(resume.duration)}</span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResume}
            className="
              flex items-center gap-1.5
              bg-[#1DB954] hover:bg-[#1ed760] active:scale-95
              text-black text-xs font-bold
              px-3 py-2 rounded-full
              transition-all
            "
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            Lanjutkan
          </button>

          <button
            onClick={() => dismiss(true)}
            className="text-[#b3b3b3] hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
