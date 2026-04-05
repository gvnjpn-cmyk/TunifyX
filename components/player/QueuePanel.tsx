'use client'
// ─────────────────────────────────────────────────────────────
// TunifyX — QueuePanel
// Shows: upNext (manual adds) + context (current list)
// Supports: remove, reorder, play from any position
// ─────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { usePlayerStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import type { Track } from '@/lib/types'

// ── Single row ────────────────────────────────────────────────
function QueueRow({
  track, index, isActive, isUpNext,
  onPlay, onRemove,
}: {
  track:     Track
  index:     number
  isActive:  boolean
  isUpNext:  boolean
  onPlay:    () => void
  onRemove:  () => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)

  // Scroll active row into view
  useEffect(() => {
    if (isActive) {
      rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isActive])

  return (
    <div
      ref={rowRef}
      className={cn(
        'group flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer relative',
        isActive ? 'bg-white/10' : 'hover:bg-white/5'
      )}
      onClick={onPlay}
    >
      {/* Active indicator / number */}
      <div className="w-4 shrink-0 text-center">
        {isActive ? (
          <div className="flex items-end justify-center gap-[2px] h-4">
            <div className="eq-bar w-[3px] h-full" />
            <div className="eq-bar w-[3px] h-full" />
            <div className="eq-bar w-[3px] h-full" />
          </div>
        ) : (
          <span className="text-xs text-[#b3b3b3] group-hover:hidden">{index + 1}</span>
        )}
        {!isActive && (
          <svg className="hidden group-hover:block mx-auto" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative w-9 h-9 rounded overflow-hidden shrink-0">
        <Image src={track.thumbnail} alt={track.title} fill className="object-cover" unoptimized />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium truncate', isActive ? 'text-[#1DB954]' : 'text-white')}>
          {track.title}
        </p>
        <p className="text-[11px] text-[#b3b3b3] truncate">{track.artist}</p>
      </div>

      {/* Duration */}
      <span className="text-[11px] text-[#b3b3b3] shrink-0 hidden sm:block pr-1">
        {track.duration}
      </span>

      {/* Remove button */}
      <button
        onClick={e => { e.stopPropagation(); onRemove() }}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-[#b3b3b3] hover:text-white p-1 transition-all rounded hover:bg-white/10"
        title="Hapus dari antrian"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

// ── Main QueuePanel ───────────────────────────────────────────
export function QueuePanel({ onClose }: { onClose: () => void }) {
  const {
    currentTrack,
    upNext, context, contextIndex,
    removeFromUpNext, removeFromContext,
    playFromContext, playFromUpNext,
    clearUpNext,
    reorderUpNext,
  } = usePlayerStore()

  // Context tracks excluding what already played (show from current)
  const contextAhead  = context.slice(contextIndex + 1)
  const totalInQueue  = upNext.length + contextAhead.length
  const hasAnything   = !!currentTrack || upNext.length > 0 || contextAhead.length > 0

  // ── Drag-to-reorder upNext ────────────────────────────────
  const dragFrom = useRef<number | null>(null)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
        <div>
          <h2 className="font-bold text-base">Antrian</h2>
          <p className="text-xs text-[#b3b3b3] mt-0.5">
            {totalInQueue > 0 ? `${totalInQueue} lagu berikutnya` : 'Tidak ada lagu berikutnya'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {upNext.length > 0 && (
            <button
              onClick={() => { clearUpNext(); toast('Antrian manual dikosongkan') }}
              className="text-xs text-[#b3b3b3] hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
            >
              Kosongkan
            </button>
          )}
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!hasAnything ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" className="text-[#b3b3b3]/30">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/>
            </svg>
            <p className="text-[#b3b3b3] text-sm font-medium">Antrian kosong</p>
            <p className="text-[#b3b3b3]/60 text-xs">Klik ⊕ di lagu untuk tambah ke antrian</p>
          </div>
        ) : (
          <>
            {/* Now playing */}
            {currentTrack && (
              <div className="px-5 pt-4 pb-2">
                <p className="text-[11px] font-bold text-[#b3b3b3] uppercase tracking-wider mb-2">Sedang diputar</p>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                    <Image src={currentTrack.thumbnail} alt={currentTrack.title} fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="flex items-end gap-[2px] h-4">
                        <div className="eq-bar w-[3px] h-full" />
                        <div className="eq-bar w-[3px] h-full" />
                        <div className="eq-bar w-[3px] h-full" />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-[#1DB954]">{currentTrack.title}</p>
                    <p className="text-xs text-[#b3b3b3] truncate">{currentTrack.artist}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Up Next (manual queue) */}
            {upNext.length > 0 && (
              <div className="pt-3">
                <div className="flex items-center justify-between px-5 mb-1">
                  <p className="text-[11px] font-bold text-[#b3b3b3] uppercase tracking-wider">
                    Selanjutnya dalam antrian
                  </p>
                  <span className="text-[10px] text-[#b3b3b3]/60 bg-white/10 px-2 py-0.5 rounded-full">
                    {upNext.length}
                  </span>
                </div>
                {upNext.map((track, i) => (
                  <QueueRow
                    key={`upnext-${i}-${track.videoId}`}
                    track={track}
                    index={i}
                    isActive={false}
                    isUpNext={true}
                    onPlay={() => usePlayerStore.getState().playFromUpNext(i)}
                    onRemove={() => {
                      removeFromUpNext(i)
                      toast(`Dihapus dari antrian`)
                    }}
                  />
                ))}
              </div>
            )}

            {/* Context ahead */}
            {contextAhead.length > 0 && (
              <div className="pt-3 pb-4">
                <div className="flex items-center justify-between px-5 mb-1">
                  <p className="text-[11px] font-bold text-[#b3b3b3] uppercase tracking-wider">
                    Berikutnya
                  </p>
                  <span className="text-[10px] text-[#b3b3b3]/60 bg-white/10 px-2 py-0.5 rounded-full">
                    {contextAhead.length}
                  </span>
                </div>
                {contextAhead.map((track, i) => {
                  const ctxIdx = contextIndex + 1 + i
                  return (
                    <QueueRow
                      key={`ctx-${ctxIdx}-${track.videoId}`}
                      track={track}
                      index={i}
                      isActive={false}
                      isUpNext={false}
                      onPlay={() => playFromContext(ctxIdx)}
                      onRemove={() => {
                        removeFromContext(ctxIdx)
                        toast(`Dihapus dari daftar`)
                      }}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
