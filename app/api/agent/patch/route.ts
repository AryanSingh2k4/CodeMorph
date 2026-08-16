import { createClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/supabase/mock-store'
import { runPatcherAgent } from '@/lib/agents/patcher'
import { NextRequest, NextResponse } from 'next/server'
import { Finding, JobFile } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  return NextResponse.json({ status: 'ready' })
}

export async function POST(req: NextRequest) {
  try {
    const { jobId, errorContext } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const supabase = createClient()
    let files: JobFile[] = []
    let findings: Finding[] = []

    const { data: dbFiles } = await supabase.from('job_files').select('*').eq('job_id', jobId)
    const { data: dbFindings } = await supabase.from('findings').select('*').eq('job_id', jobId)

    if (dbFiles && dbFiles.length > 0) {
      files = dbFiles as JobFile[]
      findings = (dbFindings || []) as Finding[]
    } else if (mockDb.getJob(jobId)) {
      files = mockDb.getFiles(jobId)
      findings = mockDb.getFindings(jobId)
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files available for patching' }, { status: 404 })
    }

    // Run Patcher Agent
    const patchResult = await runPatcherAgent(files, findings, errorContext)

    // Save patched contents
    for (const patch of patchResult.patches) {
      if (mockDb.getJob(jobId)) {
        mockDb.updateFilePatch(jobId, patch.file_path, patch.patched_content)
      } else {
        await supabase
          .from('job_files')
          .update({ patched_content: patch.patched_content })
          .eq('job_id', jobId)
          .eq('file_path', patch.file_path)
      }
    }

    // Update status to testing
    if (mockDb.getJob(jobId)) {
      mockDb.updateJob(jobId, { status: 'testing' })
    } else {
      await supabase.from('jobs').update({ status: 'testing' }).eq('id', jobId)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Automatically trigger Sandbox
    ;(async () => {
      try {
        await fetch(`${appUrl}/api/sandbox/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId })
        })
      } catch (sandboxErr) {
        console.error('Failed to automatically call sandbox route:', sandboxErr)
      }
    })()

    return NextResponse.json({
      success: true,
      patchCount: patchResult.patches.length
    })
  } catch (error: any) {
    console.error('Patcher route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
