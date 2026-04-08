import { NextRequest, NextResponse } from 'next/server'
import { searchYoutube, smartQuery } from '@/lib/youtube'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: 'Query is required' }, { status: 400 })

  try {
    const query  = smartQuery(q)
    const tracks = await searchYoutube(query, 20)
    return NextResponse.json({ tracks, query, original: q })
  } catch (err: any) {
    console.error('[/api/search]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
