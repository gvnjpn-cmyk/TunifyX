import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const MOOD_PRESETS = [
  { label: 'Galau',    emoji: '😢', query: 'lagu galau indonesia',       color: '#6366f1' },
  { label: 'Semangat', emoji: '🔥', query: 'lagu semangat motivasi',      color: '#f97316' },
  { label: 'Santai',   emoji: '🌊', query: 'lagu santai lofi',            color: '#0ea5e9' },
  { label: 'Anime',    emoji: '⛩️',  query: 'anime ost opening',           color: '#ec4899' },
  { label: 'K-Pop',    emoji: '💫', query: 'kpop hits 2024',              color: '#a855f7' },
  { label: 'Hip-Hop',  emoji: '🎤', query: 'hip hop rap 2024',            color: '#eab308' },
  { label: 'Study',    emoji: '📚', query: 'lofi study music',            color: '#10b981' },
  { label: 'Party',    emoji: '🎉', query: 'party dance hits',            color: '#ef4444' },
]
