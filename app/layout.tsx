import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'CodeMorph — Autonomous Multi-Agent Vulnerability Remediation',
  description: 'Autonomous multi-agent system that scans GitHub repositories, patches vulnerabilities and legacy patterns with LLMs, verifies fixes in isolated GitHub Actions VMs, and opens verified PRs.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0f0f0e] text-sand-100 antialiased selection:bg-terracotta-500/30 selection:text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-[#23211c] bg-[#0c0c0b] py-8 text-center text-xs text-sand-500 font-sans">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-serif font-medium text-sand-300">Code<span className="text-terracotta-500 italic">Morph</span></span>
              <span className="text-sand-600">•</span>
              <span>Autonomous Agentic Remediation Engine</span>
            </div>
            <div className="font-mono text-[11px] text-sand-600">
              Babel AST • Anthropic/OpenAI LLMs • GitHub Actions Sandbox • Self-Healing PRs
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
