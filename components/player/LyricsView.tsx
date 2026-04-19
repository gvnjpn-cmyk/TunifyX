'use client'
// TunifyX — LyricsView
// Includes manual search override untuk koreksi lirik salah/tidak ada

import { useRef, useState, useEffect } from 'react'
import { useLyrics } from '@/hooks/useLyrics'
import type { Track } from '@/lib/types'

interface Props {
  track:    Track
  isActive: boolean
}

export function LyricsView({ track, isActive }: Props) {
  const { state, searchManual, retry } = useLyrics(isActive ? track : null)
  const scrollRef  = useRef<HTMLDivElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [formTitle,  setFormTitle]  = useState('')
  const [formArtist, setFormArtist] = useState('')

  // Scroll to top saat lirik baru muncul
  useEffect(() => {
    if (state.status === 'found') {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      setShowForm(false)
    }
  }, [state.status, track?.videoId])

  // Pre-fill form dengan judul yang sudah di-clean sedikit
  function openForm() {
    // Bersihkan judul dari tag YouTube yang paling umum
    const cleaned = track.title
      .replace(/\s*[\(\[][^\)\]]*?(official|lyric|audio|mv|video|hd)[^\)\]]*?[\)\]]/gi, '')
      .replace(/\s*[-–]\s*(official|lyric|audio|mv|video).*/gi, '')
      .replace(/\s+/g, ' ').trim()
    const artist = track.artist
      .replace(/\s*VEVO$/i, '')
      .replace(/\s*Official$/i, '')
      .trim()
    setFormTitle(cleaned)
    setFormArtist(artist)
    setShowForm(true)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) return
    searchManual(formTitle, formArtist)
    setShowForm(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mini header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
        <img
          src={track.thumbnail}
          alt={track.title}
          className="w-9 h-9 rounded-lg object-cover shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{track.title}</p>
          <p className="text-xs text-[#b3b3b3] truncate">{track.artist}</p>
        </div>
        {/* Tombol cari manual */}
        <button
          onClick={openForm}
          className="shrink-0 text-[#b3b3b3] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          title="Cari lirik manual"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </div>

      {/* Manual search form */}
      {showForm && (
        <form
          onSubmit={handleSearch}
          className="px-5 py-3 bg-[#1a1a1a] border-b border-white/10 shrink-0 animate-fade-in"
        >
          <p className="text-xs text-[#b3b3b3] mb-2">
            Koreksi judul / artis untuk hasil lebih akurat:
          </p>
          <input
            type="text"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="Judul lagu..."
            className="w-full bg-[#282828] text-white text-sm rounded-lg px-3 py-2 mb-2 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
          />
          <input
            type="text"
            value={formArtist}
            onChange={e => setFormArtist(e.target.value)}
            placeholder="Artis... (opsional)"
            className="w-full bg-[#282828] text-white text-sm rounded-lg px-3 py-2 mb-3 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!formTitle.trim()}
              className="flex-1 bg-[#1DB954] text-black text-sm font-bold py-2 rounded-full disabled:opacity-40 hover:bg-[#1ed760] transition-colors"
            >
              Cari Lirik
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 text-sm text-[#b3b3b3] hover:text-white transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">

        {/* Loading */}
        {state.status === 'loading' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              width="40" height="40" className="text-[#b3b3b3]/30">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <div className="flex gap-1">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-bounce"
                  style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            <p className="text-sm text-[#b3b3b3]">Mencari lirik...</p>
          </div>
        )}

        {/* Found */}
        {state.status === 'found' && (
          <div className="animate-fade-in pb-8">
            <p className="text-[15px] leading-[1.95] text-white/85 whitespace-pre-line font-light tracking-wide">
              {state.lyrics}
            </p>
            {/* Footer — koreksi */}
            <div className="mt-8 pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-[#b3b3b3]/50 mb-2">Lirik tidak sesuai?</p>
              <button
                onClick={openForm}
                className="text-xs text-[#1DB954] hover:underline"
              >
                Cari dengan judul lain
              </button>
            </div>
          </div>
        )}

        {/* Not found */}
        {state.status === 'not_found' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center animate-fade-in">
            <span className="text-4xl">🎵</span>
            <p className="text-[#b3b3b3] font-medium text-sm">Lirik tidak ditemukan</p>
            <p className="text-[#b3b3b3]/50 text-xs max-w-[220px] leading-relaxed">
              Database mungkin belum punya lirik lagu ini
            </p>
            <button
              onClick={openForm}
              className="mt-2 flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-4 py-2 rounded-full transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Coba judul lain
            </button>
          </div>
        )}

        {/* Error */}
        {state.status === 'error' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center animate-fade-in">
            <span className="text-4xl">⚠️</span>
            <p className="text-[#b3b3b3] font-medium text-sm">{state.message}</p>
            <button
              onClick={retry}
              className="text-xs text-[#1DB954] hover:underline mt-1"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Idle */}
        {state.status === 'idle' && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#b3b3b3]/40 text-sm">Pilih lagu untuk melihat lirik</p>
          </div>
        )}
      </div>
    </div>
  )
}
