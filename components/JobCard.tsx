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
      className="block group rounded-2xl bg-[#181715] hover:bg-[#1f1d19] border border-[#2e2a24] hover:border-terracotta-500/40 p-5 transition-all shadow-warm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Repo & Header */}
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#22201c] border border-[#36332c] flex items-center justify-center text-terracotta-500 group-hover:border-terracotta-500/40 transition-all shrink-0">
            <GitBranch className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm text-sand-200 group-hover:text-sand-100 transition-colors">
                <span className="text-sand-400">{job.repo_owner} /</span> <span className="font-semibold text-sand-100">{job.repo_name}</span>
              </h3>
            </div>
            <p className="text-xs text-sand-500 font-mono mt-0.5">{job.repo_url}</p>
          </div>
        </div>

        {/* Status Badge & Actions */}
        <div className="flex items-center space-x-3 shrink-0">
          <span
            className={`text-xs font-mono uppercase px-3 py-1 rounded-full border font-medium flex items-center space-x-1.5 ${getStatusBadgeClass(
              job.status
            )}`}
          >
            {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-terracotta-400 animate-ping mr-1"></span>}
            {isHealing && <RefreshCw className="w-3 h-3 animate-spin mr-1 text-[#f4a261]" />}
            {isDone && <CheckCircle2 className="w-3 h-3 mr-1 text-sage-400" />}
            {isFailed && <AlertTriangle className="w-3 h-3 mr-1 text-rust-400" />}
            <span>{job.status}</span>
          </span>

          <div className="w-8 h-8 rounded-lg bg-[#22201c] border border-[#34312a] flex items-center justify-center text-sand-400 group-hover:text-terracotta-400 group-hover:border-terracotta-500/40 transition-all">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Meta Footer */}
      <div className="mt-4 pt-3.5 border-t border-[#262420] flex items-center justify-between text-xs text-sand-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-sand-600" />
            <span>{formatDate(job.created_at)}</span>
          </span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-[#22201c] text-sand-400 border border-[#312e27]">
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
