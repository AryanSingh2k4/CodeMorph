import React from 'react'
import Link from 'next/link'
import { GitBranch, ArrowRight, Clock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { Job } from '@/types'
import { formatDate, getStatusBadgeClass } from '@/lib/utils'

interface JobCardProps {
  job: Job
}

export default function JobCard({ job }: JobCardProps) {
  const isDone = job.status === 'done'
  const isFailed = job.status === 'failed'
  const isHealing = job.status === 'healing'
  const isRunning = !isDone && !isFailed

  return (
    <Link
      href={`/job/${job.id}`}
      className="block group rounded-xl bg-[#121212] hover:bg-[#161616] border border-[#262626] hover:border-[#333333] p-4 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Repo & Header */}
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-coral-500 group-hover:border-coral-500/40 transition-colors shrink-0">
            <GitBranch className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-[#b6b6b6] group-hover:text-[#f2f2f2] transition-colors">
                <span>{job.repo_owner} /</span> <span className="font-semibold text-[#f2f2f2]">{job.repo_name}</span>
              </h3>
            </div>
            <p className="text-caption text-[#8c8c8c] font-mono mt-0.5">{job.repo_url}</p>
          </div>
        </div>

        {/* Status Badge & Actions */}
        <div className="flex items-center space-x-3 shrink-0">
          <span
            className={`text-caption font-mono uppercase px-2.5 py-0.5 rounded-md border font-medium flex items-center space-x-1.5 ${getStatusBadgeClass(
              job.status
            )}`}
          >
            {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-coral-400 animate-ping mr-1"></span>}
            {isHealing && <RefreshCw className="w-3 h-3 animate-spin mr-1 text-amber-400" />}
            {isDone && <CheckCircle2 className="w-3 h-3 mr-1 text-sage-400" />}
            {isFailed && <AlertTriangle className="w-3 h-3 mr-1 text-rust-400" />}
            <span>{job.status}</span>
          </span>

          <div className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-[#8c8c8c] group-hover:text-coral-500 group-hover:border-coral-500/40 transition-colors">
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Meta Footer */}
      <div className="mt-3 pt-3 border-t border-[#262626] flex items-center justify-between text-caption text-[#8c8c8c]">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-[#666666]" />
            <span>{formatDate(job.created_at)}</span>
          </span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#161616] text-[#b6b6b6] border border-[#262626]">
            Attempts: {job.attempt_count} / {job.max_attempts}
          </span>
        </div>

        {job.error_message && (
          <span className="text-[11px] text-rust-400 truncate max-w-[240px]">
            {job.error_message}
          </span>
        )}
      </div>
    </Link>
  )
}
