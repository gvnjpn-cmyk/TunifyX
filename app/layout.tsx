import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'TunifyX',
  description: 'Streaming musik modern — search, play, enjoy.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.svg' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#121212',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-spotify-black text-white overflow-hidden h-screen">
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
