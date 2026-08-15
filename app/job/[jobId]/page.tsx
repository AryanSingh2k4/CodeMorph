'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  GitPullRequest, 
  ArrowLeft, 
  ShieldAlert, 
  FileCode, 
  Terminal, 
  RefreshCw, 
  ExternalLink, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Clock,
  FileDown
} from 'lucide-react'
import StatusTimeline from '@/components/StatusTimeline'
import FindingsList from '@/components/FindingsList'
import DiffViewer from '@/components/DiffViewer'
import SandboxLogs from '@/components/SandboxLogs'
import ASTVisualizer from '@/components/ASTVisualizer'
import { Job, JobFile, Finding, SandboxRun } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getStatusBadgeClass } from '@/lib/utils'

export default function JobDetailPage() {
  const params = useParams()
  const jobId = params.jobId as string

  const [job, setJob] = useState<Job | null>(null)
  const [files, setFiles] = useState<JobFile[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [runs, setRuns] = useState<SandboxRun[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'findings' | 'diffs' | 'sandbox' | 'ast'>('findings')
  const [selectedDiffFile, setSelectedDiffFile] = useState<string | undefined>(undefined)

  const [creatingPR, setCreatingPR] = useState(false)
  const [prUrl, setPrUrl] = useState<string | null>(null)
  const [prError, setPrError] = useState<string | null>(null)
  const [isSimulatedPR, setIsSimulatedPR] = useState(false)

  const supabase = createClient()

  const fetchJobData = async () => {
    try {
      const res = await fetch(`/api/job/${jobId}`)
      if (res.ok) {
        const data = await res.json()
        setJob(data.job)
        setFiles(data.files || [])
        setFindings(data.findings || [])
        setRuns(data.runs || [])
      }
    } catch (err) {
      console.error('Failed to fetch job details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!jobId) return

    fetchJobData()

    try {
      const channel = supabase
        .channel(`job-detail-${jobId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` },
          () => {
            fetchJobData()
          }
        )
        .subscribe()

      const interval = setInterval(() => {
        if (job?.status !== 'done' && job?.status !== 'failed') {
          fetchJobData()
        }
      }, 3000)

      return () => {
        supabase.removeChannel(channel)
        clearInterval(interval)
      }
    } catch {
      const interval = setInterval(fetchJobData, 3000)
      return () => clearInterval(interval)
    }
  }, [jobId, job?.status, supabase])

  const handleCreatePR = async () => {
    setCreatingPR(true)
    setPrError(null)
    setPrUrl(null)

    try {
      const res = await fetch(`/api/job/${jobId}/pr`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create Pull Request')
      }

      setPrUrl(data.prUrl)
      setIsSimulatedPR(Boolean(data.isSimulated))
    } catch (err: any) {
      setPrError(err.message || 'Error generating Pull Request')
    } finally {
      setCreatingPR(false)
    }
  }

  const handleSelectFileFromFinding = (filePath: string) => {
    setSelectedDiffFile(filePath)
    setActiveTab('diffs')
  }

  if (loading && !job) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 font-mono text-xs text-sand-500 bg-[#0f0f0e]">
        <RefreshCw className="w-8 h-8 animate-spin text-terracotta-500" />
        <span>Loading Autonomous Agent Cockpit...</span>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center bg-[#0f0f0e]">
        <AlertTriangle className="w-12 h-12 text-rust-400" />
        <h2 className="text-lg font-serif font-medium text-sand-100">Scan Not Found</h2>
        <p className="text-xs text-sand-500 font-sans">
          The requested job ID could not be located in database or benchmark storage.
        </p>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl bg-[#1d1b18] text-sand-200 hover:bg-[#262420] text-xs font-medium border border-[#343029]"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  const isDone = job.status === 'done'
  const patchedCount = files.filter(f => f.patched_content).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#0f0f0e]">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-xl bg-[#181715] hover:bg-[#22201c] border border-[#2e2a24] text-sand-400 hover:text-sand-100 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-mono text-xs text-sand-500">Scan:</span>
              <h1 className="font-serif font-semibold text-lg text-sand-100">{job.repo_owner} / {job.repo_name}</h1>
              <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-md border font-semibold ${getStatusBadgeClass(job.status)}`}>
                {job.status}
              </span>
            </div>
            <p className="text-xs text-sand-500 font-mono mt-0.5 flex items-center space-x-2">
              <span>{job.repo_url}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-sand-600" />
                <span>{formatDate(job.created_at)}</span>
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchJobData}
            className="p-2.5 rounded-xl bg-[#181715] hover:bg-[#22201c] border border-[#2e2a24] text-sand-400 hover:text-sand-200 transition-colors shadow-sm"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Download Security Report Button */}
          <a
            href={`/api/job/${jobId}/report?download=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#1d1b18] hover:bg-[#282520] border border-[#38342e] text-sand-200 text-xs font-medium transition-colors shadow-sm"
            title="Download Executive Security Audit Report (Markdown)"
          >
            <FileDown className="w-4 h-4 text-terracotta-400" />
            <span className="hidden sm:inline">Export Report</span>
          </a>

          {/* Open PR Button */}
          <button
            onClick={handleCreatePR}
            disabled={!isDone || creatingPR}
            className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-xs transition-all shadow-sm ${
              isDone
                ? 'bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-terracotta cursor-pointer animate-pulse'
                : 'bg-[#1e1c19] text-sand-600 border border-[#2e2a24] cursor-not-allowed opacity-70'
            }`}
          >
            {creatingPR ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Opening Verified Pull Request...</span>
              </>
            ) : (
              <>
                <GitPullRequest className="w-4 h-4" />
                <span>{isDone ? 'Open Verified Pull Request' : 'PR Ready When Verified'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PR Generated Success Banner */}
      {prUrl && (
        <div className="p-4 rounded-2xl bg-sage-950/70 border border-sage-500/40 text-sage-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-warm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sage-900/80 border border-sage-500/40 flex items-center justify-center text-sage-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-sand-100">Pull Request Ready!</h4>
              <p className="text-xs text-sage-300 font-sans">
                {isSimulatedPR
                  ? 'All fixes verified in Sandbox VM. Simulated Pull Request branch synthesized.'
                  : 'Automated Pull Request successfully opened with verified fixes and Sandbox verification details.'}
              </p>
            </div>
          </div>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-black font-medium text-xs transition-colors shrink-0"
          >
            <span>View Pull Request</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* PR Error Banner */}
      {prError && (
        <div className="p-4 rounded-2xl bg-rust-950/70 border border-rust-500/40 text-rust-300 flex items-center space-x-3 shadow-warm">
          <AlertTriangle className="w-5 h-5 text-rust-400 shrink-0" />
          <span className="text-xs font-sans">{prError}</span>
        </div>
      )}

      {/* Orchestration Status Timeline */}
      <StatusTimeline
        status={job.status}
        attemptCount={job.attempt_count}
        maxAttempts={job.max_attempts}
      />

      {/* Cockpit Navigation Tabs */}
      <div className="border-b border-[#292621]">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('findings')}
            className={`pb-3 text-xs font-medium flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'findings'
                ? 'border-terracotta-500 text-terracotta-400'
                : 'border-transparent text-sand-500 hover:text-sand-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Findings ({findings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('diffs')}
            className={`pb-3 text-xs font-medium flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'diffs'
                ? 'border-terracotta-500 text-terracotta-400'
                : 'border-transparent text-sand-500 hover:text-sand-300'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Patches & Diffs ({patchedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`pb-3 text-xs font-medium flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'sandbox'
                ? 'border-terracotta-500 text-terracotta-400'
                : 'border-transparent text-sand-500 hover:text-sand-300'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Sandbox VM Logs ({runs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ast')}
            className={`pb-3 text-xs font-medium flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'ast'
                ? 'border-terracotta-500 text-terracotta-400'
                : 'border-transparent text-sand-500 hover:text-sand-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>AST Breakdown ({files.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab Content Views */}
      <div className="pt-2">
        {activeTab === 'findings' && (
          <FindingsList
            findings={findings}
            onSelectFile={handleSelectFileFromFinding}
          />
        )}

        {activeTab === 'diffs' && (
          <DiffViewer
            files={files}
            initialSelectedFile={selectedDiffFile}
          />
        )}

        {activeTab === 'sandbox' && (
          <SandboxLogs runs={runs} />
        )}

        {activeTab === 'ast' && (
          <ASTVisualizer files={files} />
        )}
      </div>
    </div>
  )
}
