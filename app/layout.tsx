import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { Asterisk } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CodeMorph | Autonomous Multi-Agent Vulnerability Remediation',
  description: 'Autonomous multi-agent system that scans GitHub repositories, patches vulnerabilities and legacy patterns with LLMs, verifies fixes in isolated GitHub Actions VMs, and opens verified PRs.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#000000] text-[#f2f2f2] antialiased selection:bg-coral-500/30 selection:text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-[#262626] bg-[#000000] py-6 text-caption text-[#8c8c8c]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[#f2f2f2] flex items-center space-x-1.5">
                <Asterisk className="w-3.5 h-3.5 text-coral-500" />
                <span>CodeMorph</span>
              </span>
              <span className="text-[#444444]">•</span>
              <span className="text-[#b6b6b6]">Autonomous Agentic Remediation Engine</span>
            </div>
            <div className="font-mono text-[11px] text-[#666666]">
              Babel AST • LLM Synthesis • Isolated Sandbox VM • Verified PRs
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
