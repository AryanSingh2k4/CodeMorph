import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/supabase/mock-store'
import { generateReportData, generateMarkdownReport, generateHtmlReport } from '@/lib/report/generator'
import { Job, JobFile, Finding, SandboxRun } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
  }

  let job: Job | null = null
  let files: JobFile[] = []
  let findings: Finding[] = []
  let runs: SandboxRun[] = []

  // 1. Check in-memory mock store for demo jobs
  const mockJob = mockDb.getJob(jobId)
  if (mockJob) {
    job = mockJob
    files = mockDb.getFiles(jobId)
    findings = mockDb.getFindings(jobId)
    runs = mockDb.getRuns(jobId)
  } else {
    // 2. Fetch from Supabase database
    try {
      const supabase = createClient()
      const { data: dbJob, error: jobErr } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobErr || !dbJob) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      job = dbJob as Job

      const { data: dbFiles } = await supabase
        .from('job_files')
        .select('*')
        .eq('job_id', jobId)

      const { data: dbFindings } = await supabase
        .from('findings')
        .select('*')
        .eq('job_id', jobId)

      const { data: dbRuns } = await supabase
        .from('sandbox_runs')
        .select('*')
        .eq('job_id', jobId)
        .order('attempt_number', { ascending: true })

      files = (dbFiles as JobFile[]) || []
      findings = (dbFindings as Finding[]) || []
      runs = (dbRuns as SandboxRun[]) || []
    } catch (err: any) {
      console.error('Error fetching job details for security report:', err)
      return NextResponse.json(
        { error: err.message || 'Failed to retrieve job report data' },
        { status: 500 }
      )
    }
  }

  if (!job) {
    return NextResponse.json({ error: 'Job record not located' }, { status: 404 })
  }

  // Parse query parameters
  const { searchParams } = new URL(req.url)
  const isDownload = searchParams.get('download') === 'true' || searchParams.get('download') === '1'
  const format = (searchParams.get('format') || '').toLowerCase()

  // Generate complete report data model
  const reportData = generateReportData(job, files, findings, runs)
  const safeRepoName = (job.repo_name || 'report').replace(/[^a-zA-Z0-9_-]/g, '_')
  const shortId = job.id.replace(/-/g, '').slice(0, 8)

  // Determine rendering format (Markdown vs HTML)
  // If format=html or accessed in browser without download/format specified -> Render Executive HTML
  // If format=md or download=true without format=html -> Render and/or Download Markdown report.md
  if (format === 'html' || (!isDownload && format !== 'md' && format !== 'markdown')) {
    const htmlReport = generateHtmlReport(reportData)
    const headers: Record<string, string> = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0'
    }

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="codemorph-security-report-${safeRepoName}-${shortId}.html"`
    }

    return new Response(htmlReport, {
      status: 200,
      headers
    })
  }

  // Generate Markdown report
  const markdownReport = generateMarkdownReport(reportData)
  const headers: Record<string, string> = {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0'
  }

  if (isDownload) {
    headers['Content-Disposition'] = `attachment; filename="codemorph-security-report-${safeRepoName}-${shortId}.md"`
  }

  return new Response(markdownReport, {
    status: 200,
    headers
  })
}
