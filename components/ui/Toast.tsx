'use client'

import { useEffect, useState } from 'react'

interface ToastItem { id: string; msg: string }

let _add: ((msg: string) => void) | null = null
export function toast(msg: string) { _add?.(msg) }

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    _add = (msg) => {
      const id = Math.random().toString(36).slice(2)
      setToasts(p => [...p.slice(-3), { id, msg }]) // max 4
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2800)
    }
    return () => { _add = null }
  }, [])

  return (
    <div className="fixed bottom-28 md:bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className="bg-[#282828] text-white text-sm px-5 py-2.5 rounded-full shadow-xl animate-slide-up whitespace-nowrap border border-white/10">
          {t.msg}
        </div>
      ))}
    </div>
  )
}
