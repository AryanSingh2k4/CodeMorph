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
      <div className="bg-[#181715] border border-[#2e2a24] rounded-2xl p-12 text-center font-mono shadow-warm">
        <Cpu className="w-8 h-8 text-terracotta-500 mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-sand-200">Sandbox runner standing by</p>
        <p className="text-xs text-sand-500 mt-1">
          Once the patcher agent finishes generating fixes, an isolated GitHub Actions VM will spin up.
        </p>
      </div>
    )
  }

  const currentRun = runs.find(r => r.attempt_number === selectedAttempt) || runs[runs.length - 1]

  return (
    <div className="space-y-4 font-mono">
      {/* Attempt Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#181715] border border-[#2e2a24] p-3 rounded-2xl shadow-warm">
        <div className="flex items-center space-x-2">
          {runs.map((run) => {
            const isSelected = run.attempt_number === selectedAttempt
            const isPassed = run.status === 'passed'
            const isFailed = run.status === 'failed'

            return (
              <button
                key={run.id || run.attempt_number}
                onClick={() => setSelectedAttempt(run.attempt_number)}
                className={`px-3 py-1.5 rounded-xl text-xs flex items-center space-x-2 transition-all ${
                  isSelected
                    ? 'bg-[#26231e] text-sand-100 border border-terracotta-500/40 shadow-sm'
                    : 'bg-[#141311] text-sand-500 hover:text-sand-300 border border-[#2e2a24]'
                }`}
              >
                <span>Attempt #{run.attempt_number}</span>
                {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-sage-400" />}
                {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-rust-400" />}
                {run.status === 'running' && <RefreshCw className="w-3.5 h-3.5 text-terracotta-500 animate-spin" />}
              </button>
            )
          })}
        </div>

        {/* Run Metadata */}
        <div className="flex items-center space-x-3 text-xs text-sand-500">
          {currentRun.github_run_id && (
            <span className="px-2 py-0.5 rounded-md bg-[#22201c] text-sand-400 border border-[#312e28]">
              Run ID: {currentRun.github_run_id}
            </span>
          )}
          <span className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-sand-600" />
            <span>{formatDate(currentRun.triggered_at)}</span>
          </span>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="rounded-2xl border border-[#2e2a24] bg-[#121110] overflow-hidden shadow-warm">
        {/* Terminal Header */}
        <div className="bg-[#181715] px-4 py-3 border-b border-[#2e2a24] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rust-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#f4a261]/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-sage-500/80"></div>
            </div>
            <span className="text-xs text-sand-400 ml-2 font-mono flex items-center space-x-1">
              <Terminal className="w-3.5 h-3.5 text-terracotta-500" />
              <span>ubuntu-latest • node:20 • sandbox-vm</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-[10px] uppercase px-2.5 py-0.5 rounded-md border font-semibold ${
                currentRun.status === 'passed'
                  ? 'bg-sage-950 text-sage-400 border-sage-500/30'
                  : currentRun.status === 'failed'
                  ? 'bg-rust-950 text-rust-400 border-rust-500/30'
                  : 'bg-[#2d2417] text-[#f4a261] border-[#f4a261]/30 animate-pulse'
              }`}
            >
              {currentRun.status}
            </span>
          </div>
        </div>

        {/* Terminal Output */}
        <div className="p-5 text-xs text-sand-300 font-mono space-y-2 overflow-x-auto">
          <div className="text-sand-600">$ [INIT] Provisioning isolated runner environment...</div>
          <div className="text-terracotta-400">✓ GitHub Actions repository dispatch received</div>
          <div className="text-sand-400">✓ Patched files written to virtual filesystem</div>
          <div className="text-sand-400">✓ Dependencies mapped and installed</div>
          
          <div className="pt-2 text-sand-600">$ [STEP 1] npx tsc --noEmit --skipLibCheck</div>
          {currentRun.status === 'passed' ? (
            <div className="text-sage-400">✓ TypeScript compilation passed: 0 type errors detected.</div>
          ) : (
            <div className="text-rust-400">
              {currentRun.error_summary || '✗ TypeScript compiler found issues during type validation.'}
            </div>
          )}

          <div className="pt-2 text-sand-600">$ [STEP 2] npx eslint . --max-warnings 0</div>
          {currentRun.status === 'passed' ? (
            <div className="text-sage-400">✓ ESLint verification passed: 0 warnings, 0 errors.</div>
          ) : (
            <div className="text-[#f4a261]">! Linter check complete. Result captured.</div>
          )}

          {currentRun.logs && (
            <div className="mt-4 pt-3 border-t border-[#292621] text-sand-500 whitespace-pre-wrap">
              {currentRun.logs}
            </div>
          )}

          {currentRun.status === 'passed' && (
            <div className="mt-4 p-3 rounded-xl bg-sage-950/50 border border-sage-500/30 text-sage-300 text-xs">
              ✓ All sandbox validation gates passed. Code is ready for Pull Request generation.
            </div>
          )}

          {currentRun.status === 'failed' && (
            <div className="mt-4 p-3 rounded-xl bg-rust-950/50 border border-rust-500/30 text-rust-300 text-xs">
              ⚠ Build failed in sandbox. Self-healing loop automatically extracting errors and re-prompting Patcher Agent.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
