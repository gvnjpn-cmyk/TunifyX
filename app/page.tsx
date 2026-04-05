'use client'
// TunifyX v2 — App Shell

import { usePlayerStore } from '@/lib/store'
import { Sidebar }          from '@/components/layout/Sidebar'
import { MobileNav }        from '@/components/layout/MobileNav'
import { PlayerBar }        from '@/components/player/PlayerBar'
import { FullscreenPlayer } from '@/components/player/FullscreenPlayer'
import { HomeView }         from '@/components/home/HomeView'
import { SearchView }       from '@/components/search/SearchView'
import { LibraryView }      from '@/components/library/LibraryView'

// Mount useAudio globally so keyboard shortcuts + YT player boot once
import { useAudio } from '@/hooks/useAudio'

const GRADIENTS: Record<string, string> = {
  home:    'linear-gradient(180deg, rgba(30,215,96,0.12) 0%, transparent 35%)',
  search:  'linear-gradient(180deg, rgba(83,83,83,0.35) 0%, transparent 35%)',
  library: 'linear-gradient(180deg, rgba(80,56,160,0.25) 0%, transparent 35%)',
}

export default function App() {
  const { activeView, currentTrack } = usePlayerStore()
  useAudio() // boot YouTube IFrame API + keyboard shortcuts

  const gradientKey = activeView.startsWith('playlist-') ? 'library' : activeView
  const gradient    = GRADIENTS[gradientKey] || GRADIENTS.home

  function renderView() {
    if (activeView === 'home')    return <HomeView />
    if (activeView === 'search')  return <SearchView />
    if (activeView === 'library' || activeView.startsWith('playlist-')) return <LibraryView />
    return <HomeView />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#121212]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Animated gradient bg */}
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-all duration-700"
          style={{ background: gradient }}
        />

        {/* Scrollable main */}
        <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden"
          style={{ paddingBottom: currentTrack ? '100px' : '80px' }}>
          {renderView()}
        </div>
      </div>

      <PlayerBar />
      <MobileNav />
      <FullscreenPlayer />
    </div>
  )
}
