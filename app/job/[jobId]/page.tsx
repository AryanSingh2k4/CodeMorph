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
  Clock
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 font-mono text-xs text-[#8c8c8c] bg-[#000000]">
        <RefreshCw className="w-6 h-6 animate-spin text-coral-500" />
        <span>Loading Autonomous Agent Cockpit...</span>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center bg-[#000000]">
        <AlertTriangle className="w-10 h-10 text-rust-400" />
        <h2 className="text-heading-h2 text-[#f2f2f2]">Scan Not Found</h2>
        <p className="text-caption text-[#8c8c8c] font-sans">
          The requested job ID could not be located in database or benchmark storage.
        </p>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg bg-[#121212] text-[#f2f2f2] hover:bg-[#161616] text-xs font-medium border border-[#262626]"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  const isDone = job.status === 'done'
  const patchedCount = files.filter(f => f.patched_content).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#000000] text-[#f2f2f2]">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg bg-[#121212] hover:bg-[#161616] border border-[#262626] text-[#b6b6b6] hover:text-[#f2f2f2] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-mono text-xs text-[#666666]">Scan:</span>
              <h1 className="font-semibold text-lg text-[#f2f2f2]">{job.repo_owner} / {job.repo_name}</h1>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getStatusBadgeClass(job.status)}`}>
                {job.status}
              </span>
            </div>
            <p className="text-caption text-[#8c8c8c] font-mono mt-0.5 flex items-center space-x-2">
              <span>{job.repo_url}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-[#666666]" />
                <span>{formatDate(job.created_at)}</span>
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchJobData}
            className="p-2 rounded-lg bg-[#121212] hover:bg-[#161616] border border-[#262626] text-[#b6b6b6] hover:text-[#f2f2f2] transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Open PR Button */}
          <button
            onClick={handleCreatePR}
            disabled={!isDone || creatingPR}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              isDone
                ? 'bg-coral-500 hover:bg-coral-600 text-white shadow-coral cursor-pointer'
                : 'bg-[#161616] text-[#666666] border border-[#262626] cursor-not-allowed'
            }`}
          >
            {creatingPR ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Opening Verified Pull Request...</span>
              </>
            ) : (
              <>
                <GitPullRequest className="w-3.5 h-3.5" />
                <span>{isDone ? 'Open Verified Pull Request' : 'PR Ready When Verified'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PR Generated Success Banner */}
      {prUrl && (
        <div className="p-3.5 rounded-xl bg-sage-950/70 border border-sage-500/40 text-sage-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-sage-900/80 border border-sage-500/40 flex items-center justify-center text-sage-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#f2f2f2]">Pull Request Ready</h4>
              <p className="text-caption text-sage-300 font-sans">
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
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sage-500 hover:bg-sage-600 text-black font-medium text-xs transition-colors shrink-0"
          >
            <span>View Pull Request</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* PR Error Banner */}
      {prError && (
        <div className="p-3 rounded-xl bg-rust-950/70 border border-rust-500/40 text-rust-300 flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-rust-400 shrink-0" />
          <span className="text-caption font-sans">{prError}</span>
        </div>
      )}

      {/* Orchestration Status Timeline */}
      <StatusTimeline
        status={job.status}
        attemptCount={job.attempt_count}
        maxAttempts={job.max_attempts}
      />

      {/* Cockpit Navigation Tabs */}
      <div className="border-b border-[#262626]">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('findings')}
            className={`pb-2.5 text-xs font-medium flex items-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'findings'
                ? 'border-coral-500 text-coral-400'
                : 'border-transparent text-[#8c8c8c] hover:text-[#f2f2f2]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Findings ({findings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('diffs')}
            className={`pb-2.5 text-xs font-medium flex items-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'diffs'
                ? 'border-coral-500 text-coral-400'
                : 'border-transparent text-[#8c8c8c] hover:text-[#f2f2f2]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Patches & Diffs ({patchedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`pb-2.5 text-xs font-medium flex items-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'sandbox'
                ? 'border-coral-500 text-coral-400'
                : 'border-transparent text-[#8c8c8c] hover:text-[#f2f2f2]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Sandbox VM Logs ({runs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ast')}
            className={`pb-2.5 text-xs font-medium flex items-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'ast'
                ? 'border-coral-500 text-coral-400'
                : 'border-transparent text-[#8c8c8c] hover:text-[#f2f2f2]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AST Breakdown ({files.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab Content Views */}
      <div className="pt-1">
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
