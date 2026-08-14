'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Sparkles,
  GitPullRequest,
  Cpu,
  RefreshCw,
  ArrowRight,
  Terminal,
  Layers,
  CheckCircle2,
  Asterisk
} from 'lucide-react'
import RepoInput from '@/components/RepoInput'

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-[#000000] text-[#f2f2f2]">
      {/* Hero Section */}
      <section className="pt-16 pb-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#121212] border border-[#262626] text-[#b6b6b6] text-caption font-medium mb-6">
          <Asterisk className="w-3.5 h-3.5 text-coral-500" />
          <span>Autonomous Multi-Agent Vulnerability Remediation</span>
        </div>

        <h1 className="text-display-h1 text-[#f2f2f2] tracking-tight max-w-3xl mx-auto">
          Autonomous Code Remediation,{' '}
          <span className="text-coral-500 font-semibold">
            Verified in Real Sandboxes.
          </span>
        </h1>

        <p className="mt-4 text-body text-[#b6b6b6] max-w-2xl mx-auto">
          CodeMorph ingests GitHub repositories, identifies AST-level security flaws and legacy patterns, synthesizes type-safe LLM patches, and verifies fixes inside an isolated Ubuntu VM with self-healing feedback.
        </p>

        {/* Interactive Prompt Launcher */}
        <div className="mt-8 max-w-2xl mx-auto">
          <RepoInput />
        </div>

        {/* Guarantees Bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-caption text-[#8c8c8c] font-mono">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-sage-400" />
            <span>Zero-Trust Sandbox VMs</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-sage-400" />
            <span>Babel AST Pattern Graph</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-sage-400" />
            <span>Automated Verified PRs</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-sage-400" />
            <span>Self-Healing Compiler Loop</span>
          </div>
        </div>
      </section>

      {/* Autonomous Flow Visualizer */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#262626]">
        <div className="text-center mb-10">
          <h2 className="text-heading-h2 text-[#f2f2f2] tracking-tight">
            The Autonomous Multi-Agent Loop
          </h2>
          <p className="text-caption text-[#8c8c8c] mt-1.5">
            Continuous orchestration from raw source code to verified Pull Request
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Phase 1 */}
          <div className="p-5 rounded-xl bg-[#121212] border border-[#262626] hover:border-[#333333] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#161616] border border-[#262626] text-coral-500 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-coral-400 uppercase font-semibold">Phase 01</span>
            <h3 className="text-sm font-semibold text-[#f2f2f2] mt-1">Repo Ingestion & AST</h3>
            <p className="text-caption text-[#b6b6b6] mt-1.5 leading-relaxed">
              Fetches full Git trees via GitHub REST, analyzes AST structures, dangerous calls, and imports.
            </p>
          </div>

          {/* Phase 2 */}
          <div className="p-5 rounded-xl bg-[#121212] border border-[#262626] hover:border-[#333333] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#161616] border border-[#262626] text-amber-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold">Phase 02</span>
            <h3 className="text-sm font-semibold text-[#f2f2f2] mt-1">AI Scanner Agent</h3>
            <p className="text-caption text-[#b6b6b6] mt-1.5 leading-relaxed">
              Pinpoints SQL injections, XSS vulnerabilities, command injection risks, and deprecated framework patterns.
            </p>
          </div>

          {/* Phase 3 */}
          <div className="p-5 rounded-xl bg-[#121212] border border-[#262626] hover:border-[#333333] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#161616] border border-[#262626] text-sage-400 flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-sage-400 uppercase font-semibold">Phase 03</span>
            <h3 className="text-sm font-semibold text-[#f2f2f2] mt-1">Sandbox VM Verification</h3>
            <p className="text-caption text-[#b6b6b6] mt-1.5 leading-relaxed">
              Dispatches patched source code to isolated GitHub Actions runners executing strict TypeScript and ESLint checks.
            </p>
          </div>

          {/* Phase 4 */}
          <div className="p-5 rounded-xl bg-[#121212] border border-[#262626] hover:border-[#333333] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#161616] border border-[#262626] text-coral-400 flex items-center justify-center mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-coral-400 uppercase font-semibold">Phase 04</span>
            <h3 className="text-sm font-semibold text-[#f2f2f2] mt-1">Self-Healing & PR</h3>
            <p className="text-caption text-[#b6b6b6] mt-1.5 leading-relaxed">
              If sandbox validation fails, compiler diagnostics are fed back to the LLM until all checks pass, then opens a PR.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Feature Showcase */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#262626]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-caption font-mono uppercase text-coral-500 font-semibold tracking-wider">
              Autonomous Precision
            </span>
            <h2 className="text-heading-h2 text-[#f2f2f2] mt-2">
              Human-in-the-Loop or Autonomous Execution
            </h2>
            <p className="text-body text-[#b6b6b6] mt-3">
              Inspect side-by-side unified diffs, review categorized security findings with severity ratings, stream live sandbox execution logs, and open verified Pull Requests directly to your repository with a single click.
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="flex items-start space-x-2.5">
                <div className="w-4 h-4 rounded bg-[#161616] border border-[#262626] text-coral-500 flex items-center justify-center text-[10px] mt-0.5">✓</div>
                <span className="text-caption text-[#b6b6b6]">Multi-model LLM engine with fallback orchestration</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="w-4 h-4 rounded bg-[#161616] border border-[#262626] text-coral-500 flex items-center justify-center text-[10px] mt-0.5">✓</div>
                <span className="text-caption text-[#b6b6b6]">Supabase Realtime status updates across all pipeline phases</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="w-4 h-4 rounded bg-[#161616] border border-[#262626] text-coral-500 flex items-center justify-center text-[10px] mt-0.5">✓</div>
                <span className="text-caption text-[#b6b6b6]">Isolated repository dispatch execution with secure webhooks</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-[#121212] hover:bg-[#161616] border border-[#262626] text-[#f2f2f2] font-medium text-xs transition-colors"
              >
                <span>Explore Scans Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 text-coral-500" />
              </Link>
            </div>
          </div>

          {/* Terminal Console Mockup */}
          <div className="rounded-xl border border-[#262626] bg-[#000000] p-4 font-mono text-xs text-[#b6b6b6]">
            <div className="flex items-center space-x-2 pb-2.5 border-b border-[#262626] text-[#8c8c8c]">
              <Terminal className="w-4 h-4 text-coral-500" />
              <span>codemorph-agent --target https://github.com/expressjs/sample-vulnerable-api</span>
            </div>
            <div className="mt-3 space-y-1.5 text-[12px]">
              <div className="text-[#8c8c8c]">[1/4] INGESTION: Cloned git tree (14 source files, AST extracted)</div>
              <div className="text-rust-400">[2/4] SCANNER: Flagged 2 Vulnerabilities (1 Critical SQLi, 1 High XSS)</div>
              <div className="text-coral-400">[3/4] PATCHER: Synthesized type-safe remediations with parameterized queries</div>
              <div className="text-[#b6b6b6]">[4/4] SANDBOX: Triggered GitHub Actions VM (Run #9847120349)</div>
              <div className="text-sage-400 pl-4">└─ TypeScript: success • ESLint: success (0 errors)</div>
              <div className="text-[#f2f2f2] font-semibold mt-3 pt-2 border-t border-[#262626] flex items-center space-x-2">
                <GitPullRequest className="w-4 h-4 text-coral-500" />
                <span>Pull Request Ready: codemorph/patch-8f2a1b9c</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
