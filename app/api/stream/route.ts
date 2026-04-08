import { NextRequest, NextResponse } from 'next/server'
import { resolveStreamCached } from '@/lib/stream'

export const runtime = 'edge'
// Vercel max duration for hobby: 10s, pro: 60s

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId')?.trim()
  if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 })

  try {
    const result = await resolveStreamCached(videoId)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[/api/stream]', err.message)
    // Always return a fallback so the client can use YouTube embed
    return NextResponse.json({
      url:    `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`,
      source: 'fallback',
      videoId,
    })
  }
}
