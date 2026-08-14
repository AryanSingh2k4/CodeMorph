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
      <div className="bg-[#181715] border border-[#2e2a24] rounded-2xl p-12 text-center shadow-warm">
        <div className="w-12 h-12 rounded-xl bg-[#121c15] border border-sage-500/30 text-sage-400 mx-auto flex items-center justify-center mb-3">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-medium text-sand-200">No issues found</h3>
        <p className="text-xs text-sand-500 mt-1 max-w-sm mx-auto">
          The scanner agent evaluated your repository AST and found no immediate security threats or deprecated patterns.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181715] border border-[#2e2a24] p-3 rounded-2xl shadow-warm">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterType === 'all'
                ? 'bg-terracotta-500 text-white shadow-terracotta'
                : 'text-sand-400 hover:text-sand-200 hover:bg-[#22201c]'
            }`}
          >
            All Findings ({findings.length})
          </button>
          <button
            onClick={() => setFilterType('vulnerability')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
              filterType === 'vulnerability'
                ? 'bg-rust-500 text-white shadow-sm'
                : 'text-sand-400 hover:text-sand-200 hover:bg-[#22201c]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Vulnerabilities ({vulnerabilities.length})</span>
          </button>
          <button
            onClick={() => setFilterType('migration')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
              filterType === 'migration'
                ? 'bg-[#4a3f35] text-sand-100 shadow-sm'
                : 'text-sand-400 hover:text-sand-200 hover:bg-[#22201c]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Migrations ({migrations.length})</span>
          </button>
        </div>

        {/* Severity Badges Filter */}
        <div className="flex items-center space-x-2 text-xs">
          {criticalCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-rust-950 text-rust-400 border border-rust-500/40 text-[11px] font-mono font-medium">
              {criticalCount} Critical
            </span>
          )}
          {highCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-terracotta-950 text-terracotta-300 border border-terracotta-500/40 text-[11px] font-mono font-medium">
              {highCount} High
            </span>
          )}
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isVuln = item.type === 'vulnerability'

          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-[#181715] hover:bg-[#1e1c19] border border-[#2e2a24] hover:border-[#3d3931] transition-all group shadow-warm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isVuln
                        ? 'bg-rust-950/80 border-rust-500/30 text-rust-400'
                        : 'bg-[#26201a] border-terracotta-500/30 text-terracotta-400'
                    }`}
                  >
                    {isVuln ? <ShieldAlert className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h4 className="text-sm font-semibold text-sand-100 group-hover:text-terracotta-300 transition-colors">
                        {item.title}
                      </h4>
                      {item.severity && (
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md border font-semibold ${getSeverityBadgeClass(
                            item.severity
                          )}`}
                        >
                          {item.severity}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[#22201c] text-sand-400 border border-[#312e27]">
                        {item.type}
                      </span>
                    </div>

                    <p className="text-xs text-sand-400 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                {/* File Location */}
                <div className="flex sm:flex-col items-end justify-between shrink-0 gap-2">
                  <button
                    onClick={() => onSelectFile && onSelectFile(item.file_path)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#22201c] hover:bg-[#2c2923] text-sand-300 hover:text-sand-100 border border-[#34312a] text-xs font-mono transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5 text-terracotta-500" />
                    <span>{item.file_path}</span>
                    {item.line_number && <span className="text-terracotta-400">:{item.line_number}</span>}
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
