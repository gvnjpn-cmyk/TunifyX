'use client'

import { useState } from 'react'
import Image from 'next/image'
import { usePlayerStore } from '@/lib/store'
import { TrackCard } from '@/components/search/TrackCard'
import { toast } from '@/components/ui/Toast'
import type { Playlist } from '@/lib/types'

export function LibraryView() {
  const { playlists, createPlaylist, deletePlaylist, setQueue, activeView, setActiveView } = usePlayerStore()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  // Check if viewing a specific playlist
  const playlistId = activeView.startsWith('playlist-') ? activeView.replace('playlist-', '') : null
  const openPlaylist = playlistId ? playlists.find(p => p.id === playlistId) : null

  if (openPlaylist) {
    return <PlaylistDetail playlist={openPlaylist} onBack={() => setActiveView('library')} />
  }

  function handleCreate() {
    if (!newName.trim()) return
    createPlaylist(newName.trim())
    setNewName('')
    setCreating(false)
    toast('✓ Playlist dibuat')
  }

  return (
    <div className="px-4 md:px-8 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Library</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2 rounded-full hover:scale-105 transition-transform"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Buat Playlist
        </button>
      </div>

      {/* Create playlist inline */}
      {creating && (
        <div className="mb-6 bg-spotify-card rounded-lg p-4 animate-slide-up">
          <p className="text-sm font-semibold mb-3">Playlist baru</p>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Nama playlist..."
            className="w-full bg-white/10 rounded-md px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-spotify-green mb-3"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setCreating(false); setNewName('') }}
              className="px-4 py-2 text-sm text-spotify-light hover:text-white"
            >
              Batal
            </button>
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-4 py-2 text-sm font-semibold bg-spotify-green text-black rounded-full disabled:opacity-40 hover:bg-spotify-green-dim transition-colors"
            >
              Buat
            </button>
          </div>
        </div>
      )}

      {/* Playlists */}
      {playlists.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto mb-4 text-spotify-light/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56">
            <path d="M9 19V6l12-3v13M9 19a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2 2 2 0 0 1 2 2zm12-3a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2 2 2 0 0 1 2 2z"/>
          </svg>
          <p className="text-spotify-light font-medium">Buat playlist pertamamu</p>
          <p className="text-spotify-light/60 text-sm mt-1">Simpan lagu favoritmu di sini</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {playlists.map(pl => (
            <div
              key={pl.id}
              className="group cursor-pointer"
              onClick={() => setActiveView(`playlist-${pl.id}`)}
            >
              <div className="relative aspect-square rounded-md overflow-hidden bg-spotify-card mb-2 flex items-center justify-center">
                {pl.tracks[0] ? (
                  <Image src={pl.tracks[0].thumbnail} alt={pl.name} fill className="object-cover" unoptimized/>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40" className="text-spotify-light/40">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
                  </svg>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
                  <button
                    onClick={e => { e.stopPropagation(); if (pl.tracks.length) setQueue(pl.tracks, 0) }}
                    className="w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center shadow-lg"
                  >
                    <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                      <polygon points="5,3 19,12 5,21"/>
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium truncate">{pl.name}</p>
              <p className="text-xs text-spotify-light">{pl.tracks.length} lagu</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlaylistDetail({ playlist, onBack }: { playlist: Playlist; onBack: () => void }) {
  const { setQueue, deletePlaylist, removeFromPlaylist } = usePlayerStore()

  function handleDelete() {
    if (!confirm(`Hapus playlist "${playlist.name}"?`)) return
    deletePlaylist(playlist.id)
    onBack()
    toast('Playlist dihapus')
  }

  return (
    <div className="px-4 md:px-8 py-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-spotify-light hover:text-white text-sm mb-6 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Library
      </button>

      {/* Header */}
      <div className="flex items-end gap-6 mb-8">
        <div className="w-40 h-40 md:w-52 md:h-52 rounded-lg bg-spotify-card shrink-0 overflow-hidden flex items-center justify-center">
          {playlist.tracks[0] ? (
            <img src={playlist.tracks[0].thumbnail} alt="" className="w-full h-full object-cover"/>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64" className="text-spotify-light/30">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
            </svg>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-spotify-light mb-1">Playlist</p>
          <h1 className="text-3xl md:text-5xl font-black mb-4">{playlist.name}</h1>
          <p className="text-spotify-light text-sm">{playlist.tracks.length} lagu</p>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => playlist.tracks.length && setQueue(playlist.tracks, 0)}
              disabled={!playlist.tracks.length}
              className="w-14 h-14 rounded-full bg-spotify-green flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40 shadow-lg"
            >
              <svg viewBox="0 0 24 24" fill="black" width="22" height="22">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="w-10 h-10 flex items-center justify-center text-spotify-light hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tracks */}
      {playlist.tracks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-spotify-light">Belum ada lagu. Tambahkan dari halaman Cari.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {playlist.tracks.map((track, i) => (
            <div key={track.videoId} className="group flex items-center">
              <div className="flex-1 min-w-0">
                <TrackCard track={track} tracks={playlist.tracks} index={i} showIndex />
              </div>
              <button
                onClick={() => { removeFromPlaylist(playlist.id, track.videoId); toast('Dihapus dari playlist') }}
                className="opacity-0 group-hover:opacity-100 mr-2 text-spotify-light hover:text-white transition-all p-2"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
