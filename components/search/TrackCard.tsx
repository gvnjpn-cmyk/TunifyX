'use client'

import { useState } from 'react'
import Image from 'next/image'
import { usePlayerStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import type { Track } from '@/lib/types'

interface TrackCardProps {
  track:      Track
  tracks:     Track[]
  index:      number
  showIndex?: boolean
  compact?:   boolean
}

export function TrackCard({ track, tracks, index, showIndex, compact }: TrackCardProps) {
  const { setQueue, addToQueue, addToPlaylist, playlists, currentTrack, isPlaying } = usePlayerStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = currentTrack?.videoId === track.videoId

  function play() { setQueue(tracks, index) }

  function handleAddToPlaylist(pl: any) {
    addToPlaylist(pl.id, track)
    toast(`✓ Ditambahkan ke ${pl.name}`)
    setMenuOpen(false)
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-md cursor-pointer transition-colors',
        compact ? 'p-2' : 'p-2 hover:bg-white/5',
        isActive && 'bg-white/5'
      )}
      onClick={play}
    >
      {/* Index / equalizer */}
      {showIndex && (
        <div className="w-4 text-center shrink-0">
          {isActive && isPlaying ? (
            <div className="flex items-end gap-0.5 h-4 justify-center">
              <div className="eq-bar w-[3px] h-full origin-bottom" />
              <div className="eq-bar w-[3px] h-full origin-bottom" />
              <div className="eq-bar w-[3px] h-full origin-bottom" />
            </div>
          ) : (
            <span className={cn('text-sm group-hover:hidden', isActive ? 'text-spotify-green' : 'text-spotify-light')}>
              {index + 1}
            </span>
          )}
          {!isActive && (
            <svg className="hidden group-hover:block mx-auto" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative w-10 h-10 md:w-12 md:h-12 shrink-0 rounded overflow-hidden">
        <Image src={track.thumbnail} alt={track.title} fill className="object-cover" unoptimized />
        {!showIndex && !isActive && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </div>
        )}
        {isActive && isPlaying && !showIndex && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="flex items-end gap-0.5 h-4">
              <div className="eq-bar w-[3px] h-full origin-bottom" />
              <div className="eq-bar w-[3px] h-full origin-bottom" />
              <div className="eq-bar w-[3px] h-full origin-bottom" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isActive ? 'text-spotify-green' : 'text-white')}>
          {track.title}
        </p>
        <p className="text-xs text-spotify-light truncate">{track.artist}</p>
      </div>

      {/* Duration */}
      <span className="text-xs text-spotify-light shrink-0 hidden sm:block">{track.duration}</span>

      {/* Context menu */}
      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="w-8 h-8 flex items-center justify-center text-spotify-light opacity-0 group-hover:opacity-100 hover:text-white transition-all"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}/>
            <div className="absolute right-0 bottom-full mb-1 w-52 bg-spotify-card rounded-md shadow-xl z-50 py-1 animate-fade-in">
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors"
                onClick={() => { addToQueue(track); toast('✓ Ditambahkan ke antrian'); setMenuOpen(false) }}
              >
                Tambah ke Antrian
              </button>
              {playlists.length > 0 && <div className="h-px bg-white/10 my-1"/>}
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors truncate"
                  onClick={() => handleAddToPlaylist(pl)}
                >
                  + {pl.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Grid card (home/trending) ─────────────────────────────────
export function GridCard({ track, tracks, index }: { track: Track; tracks: Track[]; index: number }) {
  const { setQueue, currentTrack, isPlaying } = usePlayerStore()
  const isActive = currentTrack?.videoId === track.videoId

  return (
    <div className="group cursor-pointer animate-fade-in" onClick={() => setQueue(tracks, index)}>
      <div className="relative aspect-square rounded-md overflow-hidden mb-2 bg-spotify-card">
        <Image src={track.thumbnail} alt={track.title} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
          <button className="w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center shadow-lg translate-y-2 group-hover:translate-y-0 transition-transform">
            {isActive && isPlaying ? (
              <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <p className={cn('text-sm font-medium truncate', isActive ? 'text-spotify-green' : 'text-white')}>
        {track.title}
      </p>
      <p className="text-xs text-spotify-light truncate mt-0.5">{track.artist}</p>
    </div>
  )
}
