'use client'
// TunifyX — App Shell
// FIXED: mobile padding bottom, player ready indicator

import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/lib/store'
import { Sidebar }          from '@/components/layout/Sidebar'
import { MobileNav }        from '@/components/layout/MobileNav'
import { PlayerBar }        from '@/components/player/PlayerBar'
import { FullscreenPlayer } from '@/components/player/FullscreenPlayer'
import { HomeView }         from '@/components/home/HomeView'
import { SearchView }       from '@/components/search/SearchView'
import { LibraryView }      from '@/components/library/LibraryView'
import { useAudio }         from '@/hooks/useAudio'

const GRADIENTS: Record<string, string> = {
  home:    'linear-gradient(180deg, rgba(30,215,96,0.12) 0%, transparent 35%)',
  search:  'linear-gradient(180deg, rgba(83,83,83,0.35) 0%, transparent 35%)',
  library: 'linear-gradient(180deg, rgba(80,56,160,0.25) 0%, transparent 35%)',
}

export default function App() {
  const { activeView, currentTrack } = usePlayerStore()
  const [ytReady, setYtReady] = useState(false)
  useAudio()

  // Poll for YT player ready — shows "Menyiapkan player" hint
  useEffect(() => {
    if (typeof window === 'undefined') return
    const t = setInterval(() => {
      if ((window as any)._ytReady) { setYtReady(true); clearInterval(t) }
    }, 300)
    // Give up after 15s (offline/blocked)
    setTimeout(() => { setYtReady(true); clearInterval(t) }, 15000)
    return () => clearInterval(t)
  }, [])

  const gradientKey = activeView.startsWith('playlist-') ? 'library' : activeView
  const gradient    = GRADIENTS[gradientKey] || GRADIENTS.home

  // FIXED: proper bottom padding for mobile
  // desktop: player bar = 73px
  // mobile: player bar 80px + mobile nav 60px = 140px
  const pb = currentTrack
    ? 'pb-[152px] md:pb-[88px]'
    : 'pb-[72px] md:pb-4'

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
        {/* Gradient bg */}
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-all duration-700"
          style={{ background: gradient }}
        />

        {/* Player not ready hint */}
        {!ytReady && (
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-2 pointer-events-none">
            <div className="bg-black/60 text-white/50 text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
              Menyiapkan player...
            </div>
          </div>
        )}

        {/* Scrollable main — FIXED padding */}
        <div className={`relative z-10 flex-1 overflow-y-auto overflow-x-hidden ${pb}`}>
          {renderView()}
        </div>
      </div>

      <PlayerBar />
      <MobileNav />
      <FullscreenPlayer />
    </div>
  )
}
