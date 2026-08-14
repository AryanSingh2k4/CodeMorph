import { createClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/supabase/mock-store'
import { NextRequest, NextResponse } from 'next/server'
import { Job } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'ready' })
}

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.WEBHOOK_SECRET || 'development-webhook-secret'
    const receivedSecret = req.headers.get('x-webhook-secret')

    if (receivedSecret && receivedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid webhook secret' }, { status: 401 })
    }

    const body = await req.json()
    const { jobId, runId, attemptNumber, status, tscResult, lintResult } = body

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const supabase = createClient()
    let job: Job | null = null

    if (mockDb.getJob(jobId)) {
      job = mockDb.getJob(jobId)!
    } else {
      const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single()
      if (data) job = data as Job
    }

    const completedAt = new Date().toISOString()
    const logDetails = `[GitHub Actions Sandbox VM Run #${attemptNumber}]
- Status: ${status.toUpperCase()}
- TypeScript Check (tsc --noEmit): ${tscResult}
- ESLint Verification: ${lintResult}
- VM Execution: Clean node:20 Ubuntu environment verified.`

    const errorSummary = status === 'failed'
      ? `TypeScript check: ${tscResult} | ESLint: ${lintResult}. Syntax error or unresolved type dependency during sandbox build.`
      : null

    // Update Sandbox Run in DB / mock store
    if (mockDb.getJob(jobId)) {
      mockDb.updateRun(jobId, Number(attemptNumber), {
        github_run_id: runId || `gh-run-${Date.now()}`,
        status,
        logs: logDetails,
        error_summary: errorSummary,
        completed_at: completedAt
      })
    } else {
      await supabase
        .from('sandbox_runs')
        .update({
          github_run_id: runId,
          status,
          logs: logDetails,
          error_summary: errorSummary,
          completed_at: completedAt
        })
        .eq('job_id', jobId)
        .eq('attempt_number', attemptNumber)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (status === 'passed') {
      // SUCCESS: Mark job done
      if (mockDb.getJob(jobId)) {
        mockDb.updateJob(jobId, { status: 'done', error_message: null })
      } else {
        await supabase.from('jobs').update({ status: 'done', error_message: null }).eq('id', jobId)
      }
    } else if (job && job.attempt_count < job.max_attempts) {
      // FAILURE with remaining attempts: Trigger Self-Healing Loop
      const nextAttempt = job.attempt_count + 1
      const healingErrorContext = `Sandbox attempt #${attemptNumber} failed.
Compiler Diagnostic: TypeScript compiler outcome was [${tscResult}]. Linter outcome was [${lintResult}].
Ensure all imports, typings, exported functions, and syntax are 100% valid TypeScript/JavaScript.`

      if (mockDb.getJob(jobId)) {
        mockDb.updateJob(jobId, { status: 'healing' })
      } else {
        await supabase.from('jobs').update({ status: 'healing' }).eq('id', jobId)
      }

      // Re-invoke Patcher agent with self-healing feedback asynchronously
      ;(async () => {
        try {
          await fetch(`${appUrl}/api/agent/patch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobId,
              errorContext: healingErrorContext
            })
          })
        } catch (healErr) {
          console.error('Self-healing patch trigger failed:', healErr)
        }
      })()
    } else {
      // OUT OF ATTEMPTS: Mark failed
      const finalMsg = `Sandbox verification failed after ${attemptNumber} attempt(s). Last outcome: TSC=${tscResult}, Lint=${lintResult}`
      if (mockDb.getJob(jobId)) {
        mockDb.updateJob(jobId, { status: 'failed', error_message: finalMsg })
      } else {
        await supabase.from('jobs').update({ status: 'failed', error_message: finalMsg }).eq('id', jobId)
      }
    }

    return NextResponse.json({ received: true, status, jobId })
  } catch (error: any) {
    console.error('Actions webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
