import { createClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/supabase/mock-store'
import { generateRemediationTests } from '@/lib/agents/test-generator'
import { NextRequest, NextResponse } from 'next/server'
import { Finding, JobFile, Patch } from '@/types'

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
    let findings: Finding[] = []

    if (mockDb.getJob(jobId)) {
      files = mockDb.getFiles(jobId)
      findings = mockDb.getFindings(jobId)
    } else {
      const { data: dbFiles } = await supabase.from('job_files').select('*').eq('job_id', jobId)
      const { data: dbFindings } = await supabase.from('findings').select('*').eq('job_id', jobId)
      if (dbFiles) files = dbFiles as JobFile[]
      if (dbFindings) findings = dbFindings as Finding[]
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files available for test synthesis' }, { status: 404 })
    }

    // Build patches list from files with patched_content
    const patches: Patch[] = files
      .filter(f => Boolean(f.patched_content))
      .map(f => ({
        file_path: f.file_path,
        patched_content: f.patched_content!,
        summary: `Patched remediation for ${f.file_path}`
      }))

    // Run Test Synthesizer Agent
    const testResult = await generateRemediationTests(files, findings, patches)

    return NextResponse.json({
      success: true,
      tests: testResult.tests,
      testCount: testResult.tests.length
    })
  } catch (error: any) {
    console.error('Test synthesizer route error:', error)
    return NextResponse.json({ error: error.message || 'Failed to synthesize test suite' }, { status: 500 })
  }
}
