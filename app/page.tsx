'use client'

import { usePlayerStore } from '@/lib/store'
import { Sidebar }          from '@/components/layout/Sidebar'
import { MobileNav }        from '@/components/layout/MobileNav'
import { PlayerBar }        from '@/components/player/PlayerBar'
import { FullscreenPlayer } from '@/components/player/FullscreenPlayer'
import { HomeView }         from '@/components/home/HomeView'
import { SearchView }       from '@/components/search/SearchView'
import { LibraryView }      from '@/components/library/LibraryView'

export default function App() {
  const { activeView } = usePlayerStore()

  function renderView() {
    if (activeView === 'home')    return <HomeView />
    if (activeView === 'search')  return <SearchView />
    if (activeView === 'library' || activeView.startsWith('playlist-')) return <LibraryView />
    return <HomeView />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-spotify-black">

      {/* Sidebar (desktop only) */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Gradient header */}
        <div className="relative flex-1 overflow-hidden">
          {/* Background gradient that shifts per view */}
          <div
            className="absolute inset-0 pointer-events-none z-0 transition-all duration-700"
            style={{
              background: activeView === 'home'
                ? 'linear-gradient(180deg, rgba(30,215,96,0.15) 0%, transparent 40%)'
                : activeView === 'search'
                ? 'linear-gradient(180deg, rgba(83,83,83,0.4) 0%, transparent 40%)'
                : 'linear-gradient(180deg, rgba(80,56,160,0.3) 0%, transparent 40%)',
            }}
          />

          {/* Scrollable content */}
          <div className="relative z-10 h-full overflow-y-auto pb-36 md:pb-28">
            {renderView()}
          </div>
        </div>
      </div>

      {/* Player bar (fixed bottom) */}
      <PlayerBar />

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Fullscreen player overlay */}
      <FullscreenPlayer />
    </div>
  )
}
