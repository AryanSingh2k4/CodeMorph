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
  CheckCircle2
} from 'lucide-react'
import RepoInput from '@/components/RepoInput'

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-[#0f0f0e]">
      {/* Subtle Warm Canvas Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[420px] bg-gradient-to-b from-terracotta-500/10 via-sand-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#1c1a17] border border-[#36322b] text-sand-300 text-xs font-medium mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
          <span>Autonomous Multi-Agent Vulnerability Remediation</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-[40px] lg:text-[45px] font-serif font-normal text-sand-50 tracking-tight max-w-3xl mx-auto leading-[1.2]">
          Autonomous Code Remediation,{' '}
          <span className="italic font-normal text-terracotta-400">
            Verified in Real Sandboxes.
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-sand-400 max-w-2xl mx-auto leading-relaxed font-sans">
          CodeMorph ingests GitHub repositories, identifies AST-level security flaws and legacy patterns, synthesizes type-safe LLM patches, and verifies fixes inside an isolated Ubuntu VM with self-healing feedback.
        </p>

        {/* Interactive Prompt Launcher */}
        <div className="mt-8 max-w-2xl mx-auto">
          <RepoInput />
        </div>

        {/* Guarantees Bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-sand-500 font-mono">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-sage-500" />
            <span>Zero-Trust Sandbox VMs</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-sage-500" />
            <span>Babel AST Pattern Graph</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-sage-500" />
            <span>Automated Octokit PRs</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-sage-500" />
            <span>Self-Healing Compiler Loop</span>
          </div>
        </div>
      </section>

      {/* Autonomous Flow Visualizer */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#23211c]">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-sand-100 tracking-tight">
            The Autonomous Multi-Agent Loop
          </h2>
          <p className="text-sm text-sand-500 mt-2 font-sans">
            Continuous orchestration from raw source code to verified Pull Request
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Phase 1 */}
          <div className="p-6 rounded-2xl bg-[#181715] border border-[#2e2a24] relative group hover:border-terracotta-500/40 transition-all shadow-warm">
            <div className="w-11 h-11 rounded-xl bg-[#24201a] border border-[#3b342a] text-terracotta-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-terracotta-400 uppercase font-semibold">Phase 01</span>
            <h3 className="text-sm font-semibold text-sand-100 mt-1">Repo Ingestion & AST</h3>
            <p className="text-xs text-sand-400 mt-2 leading-relaxed">
              Fetches full Git trees via GitHub REST, analyzes AST structures, dangerous calls (eval, execSync), and imports.
            </p>
          </div>

          {/* Phase 2 */}
          <div className="p-6 rounded-2xl bg-[#181715] border border-[#2e2a24] relative group hover:border-terracotta-500/40 transition-all shadow-warm">
            <div className="w-11 h-11 rounded-xl bg-[#26201a] border border-[#3d3328] text-[#f4a261] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-[#f4a261] uppercase font-semibold">Phase 02</span>
            <h3 className="text-sm font-semibold text-sand-100 mt-1">AI Scanner Agent</h3>
            <p className="text-xs text-sand-400 mt-2 leading-relaxed">
              Pinpoints SQL injections, XSS vulnerabilities, command injection risks, and deprecated framework patterns.
            </p>
          </div>

          {/* Phase 3 */}
          <div className="p-6 rounded-2xl bg-[#181715] border border-[#2e2a24] relative group hover:border-terracotta-500/40 transition-all shadow-warm">
            <div className="w-11 h-11 rounded-xl bg-[#1c1f1c] border border-[#2e372e] text-sage-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-sage-400 uppercase font-semibold">Phase 03</span>
            <h3 className="text-sm font-semibold text-sand-100 mt-1">Sandbox VM Verification</h3>
            <p className="text-xs text-sand-400 mt-2 leading-relaxed">
              Dispatches patched source code to isolated GitHub Actions runners executing strict TypeScript and ESLint checks.
            </p>
          </div>

          {/* Phase 4 */}
          <div className="p-6 rounded-2xl bg-[#181715] border border-[#2e2a24] relative group hover:border-terracotta-500/40 transition-all shadow-warm">
            <div className="w-11 h-11 rounded-xl bg-[#241d1a] border border-[#3b2c26] text-terracotta-400 flex items-center justify-center mb-4">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-terracotta-400 uppercase font-semibold">Phase 04</span>
            <h3 className="text-sm font-semibold text-sand-100 mt-1">Self-Healing & PR</h3>
            <p className="text-xs text-sand-400 mt-2 leading-relaxed">
              If sandbox validation fails, compiler diagnostics are fed back to the LLM until all checks pass, then opens a PR.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Feature Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#23211c]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-mono uppercase text-terracotta-500 font-semibold tracking-wider">
              Autonomous Precision
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-sand-100 mt-2 leading-tight">
              Human-in-the-Loop or 100% Autonomous Execution
            </h2>
            <p className="text-sand-400 text-sm mt-4 leading-relaxed font-sans">
              Inspect side-by-side unified diffs, review categorized security findings with severity ratings, stream live sandbox execution logs, and open verified Pull Requests directly to your repository with a single click.
            </p>

            <div className="mt-6 space-y-3 font-sans">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-md bg-[#22201c] border border-[#36322b] text-terracotta-400 flex items-center justify-center text-xs mt-0.5">✓</div>
                <span className="text-xs text-sand-300">Support for Claude 3.7 Sonnet, OpenAI, Groq, Ollama, and OpenRouter</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-md bg-[#22201c] border border-[#36322b] text-terracotta-400 flex items-center justify-center text-xs mt-0.5">✓</div>
                <span className="text-xs text-sand-300">Supabase Realtime status updates across all pipeline phases</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-md bg-[#22201c] border border-[#36322b] text-terracotta-400 flex items-center justify-center text-xs mt-0.5">✓</div>
                <span className="text-xs text-sand-300">Isolated repository dispatch execution with secure webhooks</span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#1d1b18] hover:bg-[#262420] border border-[#36332c] text-sand-100 font-medium text-xs transition-colors shadow-sm"
              >
                <span>Explore Scans Dashboard</span>
                <ArrowRight className="w-4 h-4 text-terracotta-500" />
              </Link>
            </div>
          </div>

          {/* Terminal Console Mockup */}
          <div className="rounded-2xl border border-[#2e2a24] bg-[#121110] p-5 shadow-warm font-mono text-xs text-sand-300">
            <div className="flex items-center space-x-2 pb-3 border-b border-[#292621] text-sand-600">
              <Terminal className="w-4 h-4 text-terracotta-500" />
              <span>codemorph-agent --target https://github.com/expressjs/sample-vulnerable-api</span>
            </div>
            <div className="mt-4 space-y-2 text-[12px]">
              <div className="text-sand-400">[1/4] INGESTION: Cloned git tree (14 source files, AST extracted)</div>
              <div className="text-rust-400">[2/4] SCANNER: Flagged 2 Vulnerabilities (1 Critical SQLi, 1 High XSS)</div>
              <div className="text-terracotta-400">[3/4] PATCHER: Synthesized type-safe remediations with parameterized queries</div>
              <div className="text-sand-300">[4/4] SANDBOX: Triggered GitHub Actions VM (Run #9847120349)</div>
              <div className="text-sage-400 pl-4">└─ TypeScript: success • ESLint: success (0 errors)</div>
              <div className="text-sand-100 font-semibold mt-4 pt-2 border-t border-[#292621] flex items-center space-x-2">
                <GitPullRequest className="w-4 h-4 text-terracotta-500" />
                <span>Pull Request Ready: codemorph/patch-8f2a1b9c</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
