'use client'
// TunifyX v2 — TrackCard + GridCard

import { useState } from 'react'
import Image from 'next/image'
import { usePlayerStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import type { Track } from '@/lib/types'

// ── List TrackCard ────────────────────────────────────────────
export function TrackCard({ track, tracks, index, showIndex }: {
  track: Track; tracks: Track[]; index: number; showIndex?: boolean
}) {
  const { setQueue, addToQueue, addToPlaylist, playlists, currentTrack, isPlaying, isLiked, toggleLike } = usePlayerStore()
  const [menu, setMenu] = useState(false)

  const isActive = currentTrack?.videoId === track.videoId
  const liked    = isLiked(track.videoId)

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors select-none',
        isActive ? 'bg-white/10' : 'hover:bg-white/5'
      )}
      onClick={() => setQueue(tracks, index)}
    >
      {/* Index / eq */}
      {showIndex && (
        <div className="w-5 text-center shrink-0">
          {isActive && isPlaying ? (
            <div className="flex items-end gap-0.5 h-4 justify-center">
              <div className="eq-bar w-[3px] h-full" /><div className="eq-bar w-[3px] h-full" /><div className="eq-bar w-[3px] h-full" />
            </div>
          ) : (
            <>
              <span className={cn('text-sm group-hover:hidden', isActive ? 'text-[#1DB954]' : 'text-[#b3b3b3]')}>{index + 1}</span>
              <svg className="hidden group-hover:block mx-auto" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </>
          )}
        </div>
      )}

      {/* Thumb */}
      <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
        <Image src={track.thumbnail} alt={track.title} fill className="object-cover" unoptimized />
        {!showIndex && (
          <div className={cn(
            'absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity',
            isActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}>
            {isActive && isPlaying
              ? <div className="flex items-end gap-0.5 h-4"><div className="eq-bar w-[3px] h-full" /><div className="eq-bar w-[3px] h-full" /><div className="eq-bar w-[3px] h-full" /></div>
              : <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><polygon points="5,3 19,12 5,21"/></svg>
            }
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isActive ? 'text-[#1DB954]' : 'text-white')}>{track.title}</p>
        <p className="text-xs text-[#b3b3b3] truncate">{track.artist}</p>
      </div>

      {/* Duration */}
      <span className="text-xs text-[#b3b3b3] hidden sm:block shrink-0">{track.duration}</span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => { toggleLike(track); toast(liked ? 'Dihapus dari Liked Songs' : '♥ Liked') }}
          className={cn('p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110',
            liked ? 'opacity-100 text-[#1DB954]' : 'text-[#b3b3b3] hover:text-white'
          )}
        >
          <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        <div className="relative">
          <button
            onClick={() => setMenu(o => !o)}
            className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 text-[#b3b3b3] hover:text-white transition-all"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>

          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <div className="absolute right-0 bottom-full mb-1 w-52 bg-[#282828] rounded-md shadow-2xl z-50 py-1 animate-scale-in">
                <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors"
                  onClick={() => { addToQueue(track); toast('✓ Ditambahkan ke antrian'); setMenu(false) }}>
                  Tambah ke Antrian
                </button>
                {playlists.length > 0 && <div className="h-px bg-white/10 my-1" />}
                {playlists.map(pl => (
                  <button key={pl.id} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors truncate"
                    onClick={() => { addToPlaylist(pl.id, track); toast(`✓ Ditambahkan ke ${pl.name}`); setMenu(false) }}>
                    + {pl.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Grid Card ─────────────────────────────────────────────────
export function GridCard({ track, tracks, index }: { track: Track; tracks: Track[]; index: number }) {
  const { setQueue, currentTrack, isPlaying, isLiked, toggleLike } = usePlayerStore()
  const isActive = currentTrack?.videoId === track.videoId
  const liked    = isLiked(track.videoId)

  return (
    <div className="group cursor-pointer animate-fade-in" onClick={() => setQueue(tracks, index)}>
      <div className="relative aspect-square rounded-md overflow-hidden mb-2 bg-[#282828]">
        <Image src={track.thumbnail} alt={track.title} fill className="object-cover transition-transform group-hover:scale-105 duration-300" unoptimized />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Like btn */}
        <button
          onClick={e => { e.stopPropagation(); toggleLike(track); toast(liked ? 'Dihapus' : '♥ Liked') }}
          className={cn('absolute top-2 right-2 p-1.5 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all hover:scale-110',
            liked && 'opacity-100 text-[#1DB954]'
          )}
        >
          <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Play button */}
        <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center shadow-xl">
            {isActive && isPlaying
              ? <svg viewBox="0 0 24 24" fill="black" width="16" height="16"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              : <svg viewBox="0 0 24 24" fill="black" width="16" height="16"><polygon points="5,3 19,12 5,21"/></svg>
            }
          </div>
        </div>
      </div>
      <p className={cn('text-sm font-medium truncate', isActive ? 'text-[#1DB954]' : 'text-white')}>{track.title}</p>
      <p className="text-xs text-[#b3b3b3] truncate mt-0.5">{track.artist}</p>
    </div>
  )
}
