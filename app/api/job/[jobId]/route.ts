import { createClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/supabase/mock-store'
import { NextRequest, NextResponse } from 'next/server'
import { Job, JobFile, Finding, SandboxRun } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const { jobId } = params

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
  }

  // Check mock store first for quick demo retrieval
  const mockJob = mockDb.getJob(jobId)
  if (mockJob) {
    return NextResponse.json({
      job: mockJob,
      files: mockDb.getFiles(jobId),
      findings: mockDb.getFindings(jobId),
      runs: mockDb.getRuns(jobId)
    })
  }

  try {
    const supabase = createClient()
    const { data: job, error: jobErr } = await supabase.from('jobs').select('*').eq('id', jobId).single()

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const { data: files } = await supabase.from('job_files').select('*').eq('job_id', jobId)
    const { data: findings } = await supabase.from('findings').select('*').eq('job_id', jobId)
    const { data: runs } = await supabase.from('sandbox_runs').select('*').eq('job_id', jobId).order('attempt_number', { ascending: true })

    return NextResponse.json({
      job,
      files: files || [],
      findings: findings || [],
      runs: runs || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch job' }, { status: 500 })
  }
}
