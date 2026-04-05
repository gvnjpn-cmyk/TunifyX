'use client'

import { usePlayerStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV = [
  {
    id: 'home', label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M12.7 2.3a1 1 0 0 0-1.4 0l-9 8.5A1 1 0 0 0 3 12h2v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9h2a1 1 0 0 0 .7-1.7l-9-8z"/>
      </svg>
    ),
  },
  {
    id: 'search', label: 'Cari',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    id: 'library', label: 'Library',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M2 4v16M6 4v16M10 4v16M14 2v20M18 6v12a2 2 0 0 0 2 2 2 2 0 0 0 2-2V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2z"/>
      </svg>
    ),
  },
]

export function Sidebar() {
  const { activeView, setActiveView, playlists, setQueue, createPlaylist } = usePlayerStore()

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-spotify-black h-full overflow-hidden">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">TunifyX</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-1">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn(
              'w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
              activeView === item.id
                ? 'text-white bg-spotify-card'
                : 'text-spotify-light hover:text-white hover:bg-white/5'
            )}
          >
            <span className={cn(activeView === item.id ? 'text-white' : 'text-spotify-light')}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mx-3 mt-4 h-px bg-white/10" />

      {/* Library */}
      <div className="flex-1 overflow-y-auto px-3 mt-4 no-scrollbar">
        <div className="flex items-center justify-between px-3 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-spotify-light">
            Playlist
          </span>
          <button
            onClick={() => {
              const name = prompt('Nama playlist:')
              if (name?.trim()) createPlaylist(name.trim())
            }}
            className="text-spotify-light hover:text-white transition-colors"
            title="Buat playlist"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {playlists.length === 0 ? (
          <p className="px-3 text-xs text-spotify-light/60">Belum ada playlist</p>
        ) : (
          <div className="space-y-1">
            {playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => setActiveView(`playlist-${pl.id}`)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors truncate',
                  activeView === `playlist-${pl.id}`
                    ? 'text-white'
                    : 'text-spotify-light hover:text-white'
                )}
              >
                <div className="w-8 h-8 bg-spotify-card rounded shrink-0 flex items-center justify-center text-spotify-light">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
                  </svg>
                </div>
                <span className="truncate">{pl.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
