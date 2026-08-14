import { createClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/supabase/mock-store'
import { triggerGitHubSandbox } from '@/lib/github/actions'
import { NextRequest, NextResponse } from 'next/server'
import { Job, JobFile, SandboxRun } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'ready' })
}

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const supabase = createClient()
    let job: Job | null = null
    let patchedFiles: { file_path: string; patched_content?: string | null }[] = []

    if (mockDb.getJob(jobId)) {
      job = mockDb.getJob(jobId)!
      patchedFiles = mockDb.getFiles(jobId).filter(f => Boolean(f.patched_content))
    } else {
      const { data: dbJob } = await supabase.from('jobs').select('*').eq('id', jobId).single()
      const { data: dbFiles } = await supabase
        .from('job_files')
        .select('file_path, patched_content')
        .eq('job_id', jobId)
        .not('patched_content', 'is', null)

      if (dbJob) job = dbJob as Job
      if (dbFiles) patchedFiles = dbFiles
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const attemptNumber = (job.attempt_count || 0) + 1
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const webhookSecret = process.env.WEBHOOK_SECRET || 'development-webhook-secret'

    const newRun: SandboxRun = {
      id: `run-${jobId}-${attemptNumber}`,
      job_id: jobId,
      attempt_number: attemptNumber,
      github_run_id: `gh-run-${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: 'running',
      logs: 'Initiating Ubuntu sandbox runner... Provisioning Node 20 environment...',
      error_summary: null,
      triggered_at: new Date().toISOString(),
      completed_at: null
    }

    if (mockDb.getJob(jobId)) {
      mockDb.updateJob(jobId, { attempt_count: attemptNumber, status: 'testing' })
      mockDb.saveRun(jobId, newRun)
    } else {
      await supabase.from('jobs').update({ attempt_count: attemptNumber, status: 'testing' }).eq('id', jobId)
      await supabase.from('sandbox_runs').insert(newRun)
    }

    const hasRealGithubSandbox = Boolean(
      process.env.GITHUB_PAT &&
      process.env.SANDBOX_REPO_OWNER &&
      process.env.SANDBOX_REPO_NAME
    )

    if (hasRealGithubSandbox) {
      // Trigger real GitHub Actions VM
      const filesPayload = patchedFiles.map(f => ({
        filePath: f.file_path,
        content: f.patched_content || ''
      }))

      const result = await triggerGitHubSandbox({
        jobId,
        attemptNumber,
        files: filesPayload,
        webhookUrl: `${appUrl}/api/webhook/actions`
      })

      if (!result.success) {
        console.warn('GitHub dispatch failed:', result.error)
      }
    } else {
      // Local/Simulated Sandbox execution with asynchronous callback
      ;(async () => {
        // Wait 3 seconds to simulate VM spin up, tsc compilation, and linting
        await new Promise(r => setTimeout(r, 3000))

        const willPass = attemptNumber > 1 || Math.random() > 0.3 // Simulate pass on healed attempts or 70% success
        const tscResult = willPass ? 'success' : 'failure'
        const lintResult = 'success'
        const status = willPass ? 'passed' : 'failed'

        try {
          await fetch(`${appUrl}/api/webhook/actions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-webhook-secret': webhookSecret
            },
            body: JSON.stringify({
              jobId,
              runId: newRun.github_run_id,
              attemptNumber,
              status,
              tscResult,
              lintResult
            })
          })
        } catch (webhookErr) {
          console.error('Simulated webhook dispatch failed:', webhookErr)
        }
      })()
    }

    return NextResponse.json({ success: true, attemptNumber, runId: newRun.id })
  } catch (error: any) {
    console.error('Sandbox trigger error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
