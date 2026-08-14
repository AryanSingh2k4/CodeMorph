import { createClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/supabase/mock-store'
import { createPR } from '@/lib/github/pr'
import { NextRequest, NextResponse } from 'next/server'
import { Job, JobFile, Finding } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'ready' })
}

export async function POST(req: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const { jobId } = params

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const supabase = createClient()
    let token: string | undefined = process.env.GITHUB_PAT

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.provider_token) {
        token = session.provider_token
      }
    } catch {
      // Use fallback GITHUB_PAT if session not present
    }

    let job: Job | null = null
    let files: JobFile[] = []
    let findings: Finding[] = []

    if (mockDb.getJob(jobId)) {
      job = mockDb.getJob(jobId)!
      files = mockDb.getFiles(jobId).filter(f => f.patched_content)
      findings = mockDb.getFindings(jobId)
    } else {
      const { data: dbJob } = await supabase.from('jobs').select('*').eq('id', jobId).single()
      const { data: dbFiles } = await supabase
        .from('job_files')
        .select('*')
        .eq('job_id', jobId)
        .not('patched_content', 'is', null)
      const { data: dbFindings } = await supabase.from('findings').select('*').eq('job_id', jobId)

      if (dbJob) job = dbJob as Job
      if (dbFiles) files = dbFiles as JobFile[]
      if (dbFindings) findings = dbFindings as Finding[]
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No patched files found to create a PR' }, { status: 400 })
    }

    const patches = files.map(f => ({
      file_path: f.file_path,
      patched_content: f.patched_content!,
      summary: `Remediate security flaws and modernize ${f.file_path}`
    }))

    if (!token) {
      // Generate a simulated PR URL if GitHub token is not provided
      const prUrl = `https://github.com/${job.repo_owner}/${job.repo_name}/pull/new/codemorph/patch-${job.id.slice(0, 8)}`
      return NextResponse.json({
        success: true,
        prUrl,
        isSimulated: true,
        message: 'Simulated PR created. Set GITHUB_PAT or sign in with GitHub OAuth to push live branches to GitHub.'
      })
    }

    const prUrl = await createPR({
      accessToken: token,
      owner: job.repo_owner,
      repo: job.repo_name,
      jobId,
      patches,
      findings
    })

    return NextResponse.json({ success: true, prUrl })
  } catch (error: any) {
    console.error('PR creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to open Pull Request' }, { status: 500 })
  }
}
