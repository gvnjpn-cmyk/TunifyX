'use client'
// TunifyX — Sidebar
// FIXED: no more prompt(), inline create form

import { useState } from 'react'
import { usePlayerStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV = [
  {
    id: 'home', label: 'Home',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12.7 2.3a1 1 0 0 0-1.4 0l-9 8.5A1 1 0 0 0 3 12h2v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9h2a1 1 0 0 0 .7-1.7l-9-8z"/></svg>,
  },
  {
    id: 'search', label: 'Cari',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  },
  {
    id: 'library', label: 'Library',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M2 4v16M6 4v16M10 4v16"/><rect x="14" y="2" width="8" height="20" rx="1"/></svg>,
  },
]

export function Sidebar() {
  const { activeView, setActiveView, playlists, createPlaylist } = usePlayerStore()
  const [creating, setCreating] = useState(false)
  const [name, setName]         = useState('')

  function handleCreate() {
    if (!name.trim()) return
    createPlaylist(name.trim())
    setName(''); setCreating(false)
  }

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[#000] h-full overflow-hidden">

      {/* Logo */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1DB954] rounded-full flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="black" width="14" height="14">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight">TunifyX</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 mb-2">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn(
              'w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-medium transition-colors mb-0.5',
              activeView === item.id || (item.id === 'library' && activeView.startsWith('playlist-'))
                ? 'text-white bg-white/10'
                : 'text-[#b3b3b3] hover:text-white hover:bg-white/5'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mx-3 h-px bg-white/10 mb-3" />

      {/* Library section */}
      <div className="flex-1 overflow-y-auto px-3 no-scrollbar">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#b3b3b3]">
            Playlist
          </span>
          <button
            onClick={() => setCreating(c => !c)}
            className={cn(
              'text-[#b3b3b3] hover:text-white transition-colors p-1 rounded',
              creating && 'text-white'
            )}
            title="Buat playlist"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* FIXED: inline form instead of prompt() */}
        {creating && (
          <div className="mx-1 mb-3 animate-slide-down">
            <input
              autoFocus
              type="text"
              value={name}
              maxLength={50}
              placeholder="Nama playlist..."
              onChange={e => setName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') { setCreating(false); setName('') }
              }}
              className="w-full bg-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#1DB954] mb-2"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => { setCreating(false); setName('') }}
                className="flex-1 py-1.5 text-xs text-[#b3b3b3] hover:text-white rounded-md border border-white/10 hover:border-white/20 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="flex-1 py-1.5 text-xs font-bold bg-[#1DB954] text-black rounded-md disabled:opacity-40 hover:bg-[#1ed760] transition-colors"
              >
                Buat
              </button>
            </div>
          </div>
        )}

        {playlists.length === 0 ? (
          <p className="px-3 text-xs text-[#b3b3b3]/40 italic">
            {creating ? '' : 'Belum ada playlist'}
          </p>
        ) : (
          <div className="space-y-0.5">
            {playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => setActiveView(`playlist-${pl.id}`)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  activeView === `playlist-${pl.id}`
                    ? 'text-white bg-white/10'
                    : 'text-[#b3b3b3] hover:text-white hover:bg-white/5'
                )}
              >
                <div className="w-8 h-8 bg-[#282828] rounded shrink-0 overflow-hidden flex items-center justify-center">
                  {pl.tracks[0] ? (
                    <img src={pl.tracks[0].thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" className="text-[#b3b3b3]/40">
                      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
                    </svg>
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm">{pl.name}</p>
                  <p className="text-xs text-[#b3b3b3]/60">{pl.tracks.length} lagu</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[10px] text-[#b3b3b3]/30 leading-relaxed">
          Space = play/pause · Shift+→/← = next/prev · M = mute
        </p>
      </div>
    </aside>
  )
}
