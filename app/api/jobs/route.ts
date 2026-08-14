import { createClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/supabase/mock-store'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let dbJobs: any[] = []
    try {
      let query = supabase.from('jobs').select('*').order('created_at', { ascending: false })
      if (user) {
        query = query.eq('user_id', user.id)
      }
      const { data, error } = await query
      if (!error && data) {
        dbJobs = data
      }
    } catch {
      // Ignore Supabase connection failures
    }

    const mockJobs = mockDb.getAllJobs()
    // Merge jobs uniquely
    const allJobsMap = new Map()
    for (const j of dbJobs) allJobsMap.set(j.id, j)
    for (const j of mockJobs) allJobsMap.set(j.id, j)

    const jobs = Array.from(allJobsMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({ jobs })
  } catch (error: any) {
    return NextResponse.json({ jobs: mockDb.getAllJobs() })
  }
}
