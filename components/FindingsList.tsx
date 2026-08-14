'use client'

import React, { useState } from 'react'
import { Finding } from '@/types'
import { getSeverityBadgeClass } from '@/lib/utils'
import { ShieldAlert, Sparkles, FileCode, CheckCircle } from 'lucide-react'

interface FindingsListProps {
  findings: Finding[]
  onSelectFile?: (filePath: string) => void
}

export default function FindingsList({ findings, onSelectFile }: FindingsListProps) {
  const [filterType, setFilterType] = useState<'all' | 'vulnerability' | 'migration'>('all')

  const vulnerabilities = findings.filter(f => f.type === 'vulnerability')
  const migrations = findings.filter(f => f.type === 'migration')

  const filtered = findings.filter(f => {
    if (filterType !== 'all' && f.type !== filterType) return false
    return true
  })

  const criticalCount = findings.filter(f => f.severity?.toLowerCase() === 'critical').length
  const highCount = findings.filter(f => f.severity?.toLowerCase() === 'high').length

  if (findings.length === 0) {
    return (
      <div className="bg-[#121212] border border-[#262626] rounded-xl p-10 text-center">
        <div className="w-10 h-10 rounded-lg bg-sage-950/60 border border-sage-500/30 text-sage-400 mx-auto flex items-center justify-center mb-3">
          <CheckCircle className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-[#f2f2f2]">No issues found</h3>
        <p className="text-caption text-[#8c8c8c] mt-1 max-w-sm mx-auto">
          The scanner agent evaluated your repository AST and found no immediate security threats or deprecated patterns.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 font-sans">
      {/* Filter Tabs & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121212] border border-[#262626] p-2.5 rounded-xl">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'all'
                ? 'bg-coral-500 text-white shadow-coral'
                : 'text-[#b6b6b6] hover:text-[#f2f2f2] hover:bg-[#161616]'
            }`}
          >
            All Findings ({findings.length})
          </button>
          <button
            onClick={() => setFilterType('vulnerability')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              filterType === 'vulnerability'
                ? 'bg-rust-500 text-white shadow-sm'
                : 'text-[#b6b6b6] hover:text-[#f2f2f2] hover:bg-[#161616]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Vulnerabilities ({vulnerabilities.length})</span>
          </button>
          <button
            onClick={() => setFilterType('migration')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              filterType === 'migration'
                ? 'bg-[#333333] text-[#f2f2f2] shadow-sm'
                : 'text-[#b6b6b6] hover:text-[#f2f2f2] hover:bg-[#161616]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Migrations ({migrations.length})</span>
          </button>
        </div>

        {/* Severity Badges Filter */}
        <div className="flex items-center space-x-2 text-xs">
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-rust-950 text-rust-400 border border-rust-500/40 text-[11px] font-mono font-medium">
              {criticalCount} Critical
            </span>
          )}
          {highCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-coral-950 text-coral-400 border border-coral-500/40 text-[11px] font-mono font-medium">
              {highCount} High
            </span>
          )}
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-2.5">
        {filtered.map((item) => {
          const isVuln = item.type === 'vulnerability'

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#121212] hover:bg-[#161616] border border-[#262626] hover:border-[#333333] transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isVuln
                        ? 'bg-rust-950/80 border-rust-500/30 text-rust-400'
                        : 'bg-[#1a1a1a] border-coral-500/30 text-coral-400'
                    }`}
                  >
                    {isVuln ? <ShieldAlert className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-[#f2f2f2] group-hover:text-coral-400 transition-colors">
                        {item.title}
                      </h4>
                      {item.severity && (
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold ${getSeverityBadgeClass(
                            item.severity
                          )}`}
                        >
                          {item.severity}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#161616] text-[#b6b6b6] border border-[#262626]">
                        {item.type}
                      </span>
                    </div>

                    <p className="text-caption text-[#b6b6b6] mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                {/* File Location */}
                <div className="flex sm:flex-col items-end justify-between shrink-0 gap-2">
                  <button
                    onClick={() => onSelectFile && onSelectFile(item.file_path)}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#161616] hover:bg-[#222222] text-[#b6b6b6] hover:text-[#f2f2f2] border border-[#262626] text-xs font-mono transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5 text-coral-500" />
                    <span>{item.file_path}</span>
                    {item.line_number && <span className="text-coral-400">:{item.line_number}</span>}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
