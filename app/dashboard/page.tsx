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
    <div className="space-y-8 bg-[#0f0f0e]">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-sand-50 tracking-tight flex items-center space-x-3">
            <span>Repository Scans</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-[#1e1c18] text-sand-400 border border-[#312e27]">
              {jobs.length} Monitored
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-sand-400 mt-1 font-sans">
            Autonomous vulnerability remediation and sandbox verification jobs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-[#191816] hover:bg-[#22201c] border border-[#2e2a24] text-xs font-medium text-sand-300 hover:text-white transition-all disabled:opacity-50 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
            <span>{seeding ? 'Seeding Benchmark...' : 'Seed Benchmark'}</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-medium text-xs transition-all shadow-terracotta cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#181715] border border-[#2e2a24] shadow-warm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sand-400">Total Scanned</span>
            <Layers className="w-4 h-4 text-terracotta-500" />
          </div>
          <div className="text-2xl font-serif font-medium text-sand-100 mt-2">{totalScans}</div>
          <p className="text-[11px] text-sand-500 mt-1 font-sans">Repositories analyzed</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#181715] border border-[#2e2a24] shadow-warm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sand-400">Verified & Ready</span>
            <CheckCircle2 className="w-4 h-4 text-sage-400" />
          </div>
          <div className="text-2xl font-serif font-medium text-sage-400 mt-2">{verifiedDone}</div>
          <p className="text-[11px] text-sand-500 mt-1 font-sans">Sandbox tests passed</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#181715] border border-[#2e2a24] shadow-warm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sand-400">Active Pipelines</span>
            <Cpu className="w-4 h-4 text-sand-300" />
          </div>
          <div className="text-2xl font-serif font-medium text-sand-200 mt-2">{inProgress}</div>
          <p className="text-[11px] text-sand-500 mt-1 font-sans">Agents executing</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#181715] border border-[#2e2a24] shadow-warm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sand-400">Self-Healing Retries</span>
            <RefreshCw className="w-4 h-4 text-[#f4a261]" />
          </div>
          <div className="text-2xl font-serif font-medium text-[#f4a261] mt-2">{healingCount}</div>
          <p className="text-[11px] text-sand-500 mt-1 font-sans">Error-guided replans</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181715] border border-[#2e2a24] p-3 rounded-2xl shadow-warm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-600" />
          <input
            type="text"
            placeholder="Search repositories by name or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#131210] border border-[#2e2a24] text-xs text-sand-200 placeholder-sand-600 focus:outline-none focus:border-terracotta-500/60 font-sans"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {['all', 'active', 'done', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium uppercase font-mono transition-all ${
                filterStatus === status
                  ? 'bg-[#22201c] text-sand-100 border border-[#38342c] shadow-sm'
                  : 'text-sand-500 hover:text-sand-300 hover:bg-[#1a1815]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards List */}
      {loading ? (
        <div className="p-16 text-center text-sand-500 font-mono text-xs flex flex-col items-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-terracotta-500" />
          <span>Synchronizing repository jobs...</span>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-[#181715] border border-[#2e2a24] rounded-2xl shadow-warm">
          <GitBranch className="w-10 h-10 text-sand-700 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-sand-200">No repositories found</h3>
          <p className="text-xs text-sand-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'No scans matching your search criteria.' : 'Launch your first autonomous scan by providing a GitHub repository.'}
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-terracotta-500 text-white font-medium text-xs hover:bg-terracotta-600 transition-colors shadow-terracotta"
          >
            Start New Scan
          </button>
        </div>
      )}

      {/* New Scan Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#181715] border border-[#2e2a24] p-6 shadow-warm-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#292621]">
              <div>
                <h3 className="text-base font-serif font-medium text-sand-50">Start New Autonomous Scan</h3>
                <p className="text-xs text-sand-500 mt-0.5 font-sans">Provide a GitHub repository to trigger the multi-agent pipeline</p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 rounded-xl text-sand-400 hover:text-white hover:bg-[#22201c] transition-colors"
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-sand-500 font-mono">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
