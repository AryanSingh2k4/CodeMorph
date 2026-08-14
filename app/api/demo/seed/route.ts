import { mockDb } from '@/lib/supabase/mock-store'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'ready' })
}

export async function POST(req: NextRequest) {
  try {
    const { scenario } = await req.json().catch(() => ({ scenario: 'full' }))
    const jobId = `demo-seed-${Date.now().toString(36)}`

    const demoJob = {
      id: jobId,
      user_id: 'demo-user-1',
      repo_url: 'https://github.com/expressjs/sample-vulnerable-api',
      repo_owner: 'expressjs',
      repo_name: 'sample-vulnerable-api',
      status: 'done' as const,
      attempt_count: 1,
      max_attempts: 3,
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockDb.saveJob(demoJob)

    return NextResponse.json({ success: true, jobId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
