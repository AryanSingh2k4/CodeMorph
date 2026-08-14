'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Cpu, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  X,
  GitBranch
} from 'lucide-react'
import JobCard from '@/components/JobCard'
import RepoInput from '@/components/RepoInput'
import { Job } from '@/types'
import { createClient } from '@/lib/supabase/client'

function DashboardContent() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showNewModal, setShowNewModal] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs')
      const data = await res.json()
      if (data.jobs) {
        setJobs(data.jobs)
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()

    if (searchParams.get('new') === 'true') {
      setShowNewModal(true)
    }

    try {
      const channel = supabase
        .channel('dashboard-jobs')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jobs' },
          () => {
            fetchJobs()
          }
        )
        .subscribe()

      const interval = setInterval(fetchJobs, 4000)

      return () => {
        supabase.removeChannel(channel)
        clearInterval(interval)
      }
    } catch {
      const interval = setInterval(fetchJobs, 4000)
      return () => clearInterval(interval)
    }
  }, [searchParams, supabase])

  const handleSeedDemo = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' })
      const data = await res.json()
      if (data.jobId) {
        await fetchJobs()
        router.push(`/job/${data.jobId}`)
      }
    } catch (err) {
      console.error('Failed to seed demo job:', err)
    } finally {
      setSeeding(false)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.repo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.repo_owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.repo_url.toLowerCase().includes(searchQuery.toLowerCase())

    if (filterStatus === 'all') return matchesSearch
    if (filterStatus === 'active') return matchesSearch && !['done', 'failed'].includes(job.status)
    return matchesSearch && job.status === filterStatus
  })

  // Metrics
  const totalScans = jobs.length
  const verifiedDone = jobs.filter(j => j.status === 'done').length
  const inProgress = jobs.filter(j => !['done', 'failed'].includes(j.status)).length
  const healingCount = jobs.filter(j => j.status === 'healing').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#000000] text-[#f2f2f2]">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-h2 text-[#f2f2f2] flex items-center space-x-3">
            <span>Repository Scans</span>
            <span className="text-caption font-mono font-normal px-2.5 py-0.5 rounded bg-[#161616] text-[#b6b6b6] border border-[#262626]">
              {jobs.length} Monitored
            </span>
          </h1>
          <p className="text-caption text-[#8c8c8c] mt-0.5 font-sans">
            Autonomous vulnerability remediation and sandbox verification jobs
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-[#121212] hover:bg-[#161616] border border-[#262626] text-xs font-medium text-[#b6b6b6] hover:text-[#f2f2f2] transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-coral-500" />
            <span>{seeding ? 'Seeding Benchmark...' : 'Seed Benchmark'}</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-coral-500 hover:bg-coral-600 text-white font-medium text-xs transition-all shadow-coral cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#121212] border border-[#262626]">
          <div className="flex items-center justify-between">
            <span className="text-caption font-medium text-[#8c8c8c]">Total Scanned</span>
            <Layers className="w-4 h-4 text-coral-500" />
          </div>
          <div className="text-2xl font-semibold text-[#f2f2f2] mt-1.5">{totalScans}</div>
          <p className="text-[11px] text-[#666666] mt-0.5">Repositories analyzed</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121212] border border-[#262626]">
          <div className="flex items-center justify-between">
            <span className="text-caption font-medium text-[#8c8c8c]">Verified & Ready</span>
            <CheckCircle2 className="w-4 h-4 text-sage-400" />
          </div>
          <div className="text-2xl font-semibold text-sage-400 mt-1.5">{verifiedDone}</div>
          <p className="text-[11px] text-[#666666] mt-0.5">Sandbox tests passed</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121212] border border-[#262626]">
          <div className="flex items-center justify-between">
            <span className="text-caption font-medium text-[#8c8c8c]">Active Pipelines</span>
            <Cpu className="w-4 h-4 text-coral-400" />
          </div>
          <div className="text-2xl font-semibold text-[#f2f2f2] mt-1.5">{inProgress}</div>
          <p className="text-[11px] text-[#666666] mt-0.5">Agents executing</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121212] border border-[#262626]">
          <div className="flex items-center justify-between">
            <span className="text-caption font-medium text-[#8c8c8c]">Self-Healing Retries</span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-semibold text-amber-400 mt-1.5">{healingCount}</div>
          <p className="text-[11px] text-[#666666] mt-0.5">Error-guided replans</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121212] border border-[#262626] p-2.5 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Search repositories by name or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#161616] border border-[#262626] text-xs text-[#f2f2f2] placeholder-[#666666] focus:outline-none focus:border-coral-500 font-sans"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {['all', 'active', 'done', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium uppercase font-mono transition-all ${
                filterStatus === status
                  ? 'bg-[#1a1a1a] text-[#f2f2f2] border border-[#333333]'
                  : 'text-[#8c8c8c] hover:text-[#f2f2f2] hover:bg-[#161616]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards List */}
      {loading ? (
        <div className="p-16 text-center text-[#8c8c8c] font-mono text-xs flex flex-col items-center space-y-3">
          <RefreshCw className="w-5 h-5 animate-spin text-coral-500" />
          <span>Synchronizing repository jobs...</span>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-[#121212] border border-[#262626] rounded-xl">
          <GitBranch className="w-8 h-8 text-[#444444] mx-auto mb-2.5" />
          <h3 className="text-sm font-medium text-[#f2f2f2]">No repositories found</h3>
          <p className="text-caption text-[#8c8c8c] mt-1 max-w-sm mx-auto">
            {searchQuery ? 'No scans matching your search criteria.' : 'Launch your first autonomous scan by providing a GitHub repository.'}
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="mt-3.5 px-4 py-1.5 rounded-lg bg-coral-500 text-white font-medium text-xs hover:bg-coral-600 transition-colors shadow-coral"
          >
            Start New Scan
          </button>
        </div>
      )}

      {/* New Scan Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#121212] border border-[#262626] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
              <div>
                <h3 className="text-sm font-semibold text-[#f2f2f2]">Start New Autonomous Scan</h3>
                <p className="text-caption text-[#8c8c8c] mt-0.5 font-sans">Provide a GitHub repository to trigger the multi-agent pipeline</p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg text-[#8c8c8c] hover:text-[#f2f2f2] hover:bg-[#161616] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <RepoInput
              isModal={true}
              onSuccess={(newJobId) => {
                setShowNewModal(false)
                router.push(`/job/${newJobId}`)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#8c8c8c] font-mono">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
