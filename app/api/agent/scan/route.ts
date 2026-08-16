import { createClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/supabase/mock-store'
import { runScannerAgent } from '@/lib/agents/scanner'
import { NextRequest, NextResponse } from 'next/server'
import { Finding, JobFile } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
    let files: JobFile[] = []

    // Check Supabase first, then fallback to mock store
    const { data, error } = await supabase
      .from('job_files')
      .select('*')
      .eq('job_id', jobId)

    if (!error && data && data.length > 0) {
      files = data as JobFile[]
    } else if (mockDb.getJob(jobId)) {
      files = mockDb.getFiles(jobId)
    }

    if (!files || files.length === 0) {
      mockDb.updateJob(jobId, { status: 'failed', error_message: 'No files found to scan' })
      return NextResponse.json({ error: 'No files found' }, { status: 400 })
    }

    // Run Scanner Agent
    const scanResult = await runScannerAgent(files)

    const findingsToInsert: Finding[] = [
      ...scanResult.vulnerabilities.map((v) => ({
        id: crypto.randomUUID(),
        job_id: jobId,
        file_path: v.file,
        line_number: v.line,
        type: 'vulnerability' as const,
        severity: v.severity,
        title: v.title,
        description: v.description,
        created_at: new Date().toISOString()
      })),
      ...scanResult.migrations.map((m) => ({
        id: crypto.randomUUID(),
        job_id: jobId,
        file_path: m.file,
        type: 'migration' as const,
        severity: 'low' as const,
        title: m.title,
        description: m.description,
        created_at: new Date().toISOString()
      }))
    ]

    // Save findings
    if (mockDb.getJob(jobId)) {
      mockDb.saveFindings(jobId, findingsToInsert)
      mockDb.updateJob(jobId, { status: 'patching' })
    } else {
      if (findingsToInsert.length > 0) {
        await supabase.from('findings').insert(findingsToInsert)
      }
      await supabase.from('jobs').update({ status: 'patching' }).eq('id', jobId)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Automatically trigger Patcher Agent
    ;(async () => {
      try {
        await fetch(`${appUrl}/api/agent/patch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId })
        })
      } catch (patchErr) {
        console.error('Failed to automatically call patcher route:', patchErr)
      }
    })()

    return NextResponse.json({
      success: true,
      findingsCount: findingsToInsert.length
    })
  } catch (error: any) {
    console.error('Scanner route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
