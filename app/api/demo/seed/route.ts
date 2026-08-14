import { mockDb } from '@/lib/supabase/mock-store'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'ready' })
}

export async function POST(req: NextRequest) {
  try {
    const { scenario } = await req.json().catch(() => ({ scenario: 'full' }))
    const customJobId = `benchmark-${Date.now().toString(36)}`
    const jobId = mockDb.seedDemoData(customJobId)

    return NextResponse.json({ success: true, jobId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
