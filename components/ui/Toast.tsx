'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ToastItem { id: string; msg: string }

let _addToast: ((msg: string) => void) | null = null
export function toast(msg: string) { _addToast?.(msg) }

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    _addToast = (msg) => {
      const id = Math.random().toString(36).slice(2)
      setToasts(prev => [...prev, { id, msg }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500)
    }
    return () => { _addToast = null }
  }, [])

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none md:bottom-28">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'bg-spotify-card text-white text-sm px-4 py-2.5 rounded-full shadow-lg',
            'animate-slide-up whitespace-nowrap'
          )}
        >
          {t.msg}
        </div>
      ))}
    </div>
  )
}
