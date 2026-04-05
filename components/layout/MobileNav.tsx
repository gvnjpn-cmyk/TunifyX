'use client'

import { usePlayerStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV = [
  {
    id: 'home', label: 'Home',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/>
      </svg>
    ),
  },
  {
    id: 'search', label: 'Cari',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? '2.5' : '2'} width="22" height="22">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    id: 'library', label: 'Library',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? '2.5' : '2'} width="22" height="22">
        <path d="M2 4v16M6 4v16M10 4v16"/>
        <rect x="14" y="2" width="8" height="20" rx="1"/>
      </svg>
    ),
  },
]

export function MobileNav() {
  const { activeView, setActiveView, currentTrack } = usePlayerStore()

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-30',
        'bg-spotify-dark border-t border-white/10',
        currentTrack ? 'pb-[80px]' : 'pb-safe'
      )}
      style={{ paddingBottom: currentTrack ? 80 : undefined }}
    >
      <div className="flex">
        {NAV.map(item => {
          const active = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            >
              <span className={active ? 'text-white' : 'text-spotify-light'}>
                {item.icon(active)}
              </span>
              <span className={cn(
                'text-[10px] font-medium',
                active ? 'text-white' : 'text-spotify-light'
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
