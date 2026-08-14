'use client'

import React, { useState } from 'react'
import { SandboxRun } from '@/types'
import { Terminal, CheckCircle2, AlertTriangle, Cpu, RefreshCw, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface SandboxLogsProps {
  runs: SandboxRun[]
}

export default function SandboxLogs({ runs }: SandboxLogsProps) {
  const [selectedAttempt, setSelectedAttempt] = useState<number>(
    runs.length > 0 ? runs[runs.length - 1].attempt_number : 1
  )

  if (runs.length === 0) {
    return (
      <div className="bg-[#121212] border border-[#262626] rounded-xl p-10 text-center font-mono">
        <Cpu className="w-8 h-8 text-coral-500 mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-[#f2f2f2]">Sandbox runner standing by</p>
        <p className="text-caption text-[#8c8c8c] mt-1 font-sans">
          Once the patcher agent finishes generating fixes, an isolated GitHub Actions VM will spin up.
        </p>
      </div>
    )
  }

  const currentRun = runs.find(r => r.attempt_number === selectedAttempt) || runs[runs.length - 1]

  return (
    <div className="space-y-3 font-mono">
      {/* Attempt Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121212] border border-[#262626] p-2.5 rounded-xl">
        <div className="flex items-center space-x-2">
          {runs.map((run) => {
            const isSelected = run.attempt_number === selectedAttempt
            const isPassed = run.status === 'passed'
            const isFailed = run.status === 'failed'

            return (
              <button
                key={run.id || run.attempt_number}
                onClick={() => setSelectedAttempt(run.attempt_number)}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center space-x-2 transition-all ${
                  isSelected
                    ? 'bg-[#1a1a1a] text-[#f2f2f2] border border-coral-500/40 shadow-sm'
                    : 'bg-[#161616] text-[#8c8c8c] hover:text-[#f2f2f2] border border-[#262626]'
                }`}
              >
                <span>Attempt #{run.attempt_number}</span>
                {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-sage-400" />}
                {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-rust-400" />}
                {run.status === 'running' && <RefreshCw className="w-3.5 h-3.5 text-coral-500 animate-spin" />}
              </button>
            )
          })}
        </div>

        {/* Run Metadata */}
        <div className="flex items-center space-x-3 text-caption text-[#8c8c8c]">
          {currentRun.github_run_id && (
            <span className="px-2 py-0.5 rounded bg-[#161616] text-[#b6b6b6] border border-[#262626]">
              Run ID: {currentRun.github_run_id}
            </span>
          )}
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-[#666666]" />
            <span>{formatDate(currentRun.triggered_at)}</span>
          </span>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="rounded-xl border border-[#262626] bg-[#000000] overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-[#121212] px-4 py-2.5 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rust-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-sage-500/80"></div>
            </div>
            <span className="text-caption text-[#8c8c8c] ml-2 font-mono flex items-center space-x-1">
              <Terminal className="w-3.5 h-3.5 text-coral-500" />
              <span>ubuntu-latest • node:20 • sandbox-vm</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-[10px] uppercase px-2 py-0.5 rounded border font-semibold ${
                currentRun.status === 'passed'
                  ? 'bg-sage-950 text-sage-400 border-sage-500/30'
                  : currentRun.status === 'failed'
                  ? 'bg-rust-950 text-rust-400 border-rust-500/30'
                  : 'bg-amber-950 text-amber-400 border-amber-500/30 animate-pulse'
              }`}
            >
              {currentRun.status}
            </span>
          </div>
        </div>

        {/* Terminal Output */}
        <div className="p-4 text-xs text-[#f2f2f2] font-mono space-y-2 overflow-x-auto">
          <div className="text-[#666666]">$ [INIT] Provisioning isolated runner environment...</div>
          <div className="text-coral-400">✓ GitHub Actions repository dispatch received</div>
          <div className="text-[#b6b6b6]">✓ Patched files written to virtual filesystem</div>
          <div className="text-[#b6b6b6]">✓ Dependencies mapped and installed</div>
          
          <div className="pt-2 text-[#666666]">$ [STEP 1] npx tsc --noEmit --skipLibCheck</div>
          {currentRun.status === 'passed' ? (
            <div className="text-sage-400">✓ TypeScript compilation passed: 0 type errors detected.</div>
          ) : (
            <div className="text-rust-400">
              {currentRun.error_summary || '✗ TypeScript compiler found issues during type validation.'}
            </div>
          )}

          <div className="pt-2 text-[#666666]">$ [STEP 2] npx eslint . --max-warnings 0</div>
          {currentRun.status === 'passed' ? (
            <div className="text-sage-400">✓ ESLint verification passed: 0 warnings, 0 errors.</div>
          ) : (
            <div className="text-amber-400">! Linter check complete. Result captured.</div>
          )}

          {currentRun.logs && (
            <div className="mt-3 pt-3 border-t border-[#262626] text-[#8c8c8c] whitespace-pre-wrap">
              {currentRun.logs}
            </div>
          )}

          {currentRun.status === 'passed' && (
            <div className="mt-3 p-2.5 rounded-lg bg-sage-950/40 border border-sage-500/30 text-sage-300 text-xs font-sans">
              ✓ All sandbox validation gates passed. Code is ready for Pull Request generation.
            </div>
          )}

          {currentRun.status === 'failed' && (
            <div className="mt-3 p-2.5 rounded-lg bg-rust-950/40 border border-rust-500/30 text-rust-300 text-xs font-sans">
              ⚠ Build failed in sandbox. Self-healing loop automatically extracting errors and re-prompting Patcher Agent.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
