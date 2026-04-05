'use client'
// TunifyX v2 — LibraryView

import { useState } from 'react'
import Image from 'next/image'
import { usePlayerStore } from '@/lib/store'
import { TrackCard } from '@/components/search/TrackCard'
import { toast } from '@/components/ui/Toast'
import type { Playlist } from '@/lib/types'

type Tab = 'playlists' | 'liked' | 'history'

export function LibraryView() {
  const { playlists, createPlaylist, playContext, activeView, setActiveView, likes, history, clearHistory } = usePlayerStore()
  const [tab, setTab] = useState<Tab>('playlists')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const playlistId  = activeView.startsWith('playlist-') ? activeView.replace('playlist-', '') : null
  const openPlaylist = playlistId ? playlists.find(p => p.id === playlistId) : null

  if (openPlaylist) {
    return <PlaylistDetail playlist={openPlaylist} onBack={() => setActiveView('library')} />
  }

  function handleCreate() {
    if (!newName.trim()) return
    createPlaylist(newName.trim())
    setNewName(''); setCreating(false)
    toast('✓ Playlist dibuat')
  }

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'playlists', label: 'Playlist',     count: playlists.length },
    { id: 'liked',     label: 'Liked Songs',  count: likes.length },
    { id: 'history',   label: 'Riwayat',      count: history.length },
  ]

  return (
    <div className="px-4 md:px-8 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Library</h1>
        {tab === 'playlists' && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2 rounded-full hover:scale-105 active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Buat
          </button>
        )}
        {tab === 'history' && history.length > 0 && (
          <button onClick={() => { clearHistory(); toast('Riwayat dihapus') }} className="text-sm text-[#b3b3b3] hover:text-white transition-colors">
            Hapus semua
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? 'text-white border-[#1DB954]' : 'text-[#b3b3b3] border-transparent hover:text-white'
            }`}
          >
            {t.label}
            {t.count > 0 && <span className="ml-1.5 text-xs text-[#b3b3b3]">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Create form */}
      {creating && tab === 'playlists' && (
        <div className="mb-5 bg-[#282828] rounded-xl p-4 animate-slide-up">
          <p className="text-sm font-semibold mb-3">Playlist baru</p>
          <input
            autoFocus type="text" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Nama playlist..."
            className="w-full bg-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#1DB954] mb-3"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setCreating(false); setNewName('') }} className="px-4 py-2 text-sm text-[#b3b3b3] hover:text-white">Batal</button>
            <button onClick={handleCreate} disabled={!newName.trim()}
              className="px-4 py-2 text-sm font-semibold bg-[#1DB954] text-black rounded-full disabled:opacity-40 hover:bg-[#1ed760] transition-colors">
              Buat
            </button>
          </div>
        </div>
      )}

      {/* Playlists tab */}
      {tab === 'playlists' && (
        playlists.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-4">🎵</div>
            <p className="font-semibold text-[#b3b3b3]">Buat playlist pertamamu</p>
            <p className="text-sm text-[#b3b3b3]/60 mt-1">Simpan lagu favorit di sini</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-fade-in">
            {playlists.map(pl => (
              <div key={pl.id} className="group cursor-pointer" onClick={() => setActiveView(`playlist-${pl.id}`)}>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-[#282828] mb-2 flex items-center justify-center">
                  {pl.tracks[0]
                    ? <Image src={pl.tracks[0].thumbnail} alt={pl.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                    : <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40" className="text-[#b3b3b3]/30"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
                  }
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
                    <button onClick={e => { e.stopPropagation(); if (pl.tracks.length) playContext(pl.tracks, 0) }}
                      className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg">
                      <svg viewBox="0 0 24 24" fill="black" width="16" height="16"><polygon points="5,3 19,12 5,21"/></svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium truncate">{pl.name}</p>
                <p className="text-xs text-[#b3b3b3]">{pl.tracks.length} lagu</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* Liked tab */}
      {tab === 'liked' && (
        likes.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-4">♥</div>
            <p className="font-semibold text-[#b3b3b3]">Belum ada Liked Songs</p>
            <p className="text-sm text-[#b3b3b3]/60 mt-1">Klik ♥ pada lagu untuk menyimpan</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => playContext(likes, 0)}
                className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg">
                <svg viewBox="0 0 24 24" fill="black" width="20" height="20"><polygon points="5,3 19,12 5,21"/></svg>
              </button>
              <span className="text-[#b3b3b3] text-sm">{likes.length} lagu</span>
            </div>
            <div className="space-y-0.5">
              {likes.map((t, i) => <TrackCard key={t.videoId} track={t} tracks={likes} index={i} showIndex />)}
            </div>
          </div>
        )
      )}

      {/* History tab */}
      {tab === 'history' && (
        history.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-4">🕐</div>
            <p className="font-semibold text-[#b3b3b3]">Belum ada riwayat</p>
          </div>
        ) : (
          <div className="space-y-0.5 animate-fade-in">
            {history.map((t, i) => <TrackCard key={t.videoId} track={t} tracks={history} index={i} />)}
          </div>
        )
      )}
    </div>
  )
}

// ── Playlist Detail ───────────────────────────────────────────
function PlaylistDetail({ playlist, onBack }: { playlist: Playlist; onBack: () => void }) {
  const { playContext, deletePlaylist, removeFromPlaylist } = usePlayerStore()

  return (
    <div className="px-4 md:px-8 py-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-[#b3b3b3] hover:text-white text-sm mb-6 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Library
      </button>

      <div className="flex items-end gap-6 mb-8">
        <div className="w-36 h-36 md:w-48 md:h-48 rounded-xl bg-[#282828] shrink-0 overflow-hidden flex items-center justify-center shadow-2xl">
          {playlist.tracks[0]
            ? <img src={playlist.tracks[0].thumbnail} alt="" className="w-full h-full object-cover" />
            : <svg viewBox="0 0 24 24" fill="currentColor" width="56" height="56" className="text-[#b3b3b3]/20"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
          }
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#b3b3b3] mb-1">Playlist</p>
          <h1 className="text-2xl md:text-4xl font-black mb-2">{playlist.name}</h1>
          <p className="text-[#b3b3b3] text-sm">{playlist.tracks.length} lagu</p>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => playlist.tracks.length && playContext(playlist.tracks, 0)}
              disabled={!playlist.tracks.length}
              className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 shadow-lg"
            >
              <svg viewBox="0 0 24 24" fill="black" width="20" height="20"><polygon points="5,3 19,12 5,21"/></svg>
            </button>
            <button
              onClick={() => { if (confirm(`Hapus "${playlist.name}"?`)) { deletePlaylist(playlist.id); onBack(); toast('Playlist dihapus') } }}
              className="w-10 h-10 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {playlist.tracks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#b3b3b3]">Belum ada lagu. Tambahkan dari Cari.</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {playlist.tracks.map((t, i) => (
            <div key={t.videoId} className="group flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <TrackCard track={t} tracks={playlist.tracks} index={i} showIndex />
              </div>
              <button
                onClick={() => { removeFromPlaylist(playlist.id, t.videoId); toast('Dihapus dari playlist') }}
                className="opacity-0 group-hover:opacity-100 p-2 text-[#b3b3b3] hover:text-white transition-all shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
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
