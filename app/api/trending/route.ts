import { NextResponse } from 'next/server'
import { getTrending } from '@/lib/youtube'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const tracks = await getTrending(16)
    return NextResponse.json({ tracks })
  } catch (err: any) {
    console.error('[/api/trending]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
