'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitBranch, ArrowRight, Loader2, Sparkles, ShieldAlert } from 'lucide-react'

interface RepoInputProps {
  onSuccess?: (jobId: string) => void
  isModal?: boolean
}

const PRESET_REPOSITORIES = [
  {
    name: 'Vulnerable Express API',
    url: 'https://github.com/expressjs/sample-vulnerable-api',
    tag: 'SQLi & RCE Flaws',
    tagClass: 'bg-rust-950/80 text-rust-400 border border-rust-500/30'
  },
  {
    name: 'Legacy React Codebase',
    url: 'https://github.com/facebook/sample-legacy-react',
    tag: 'Class Components & Hooks',
    tagClass: 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
  },
  {
    name: 'Node Authentication Service',
    url: 'https://github.com/auth0/sample-auth-service',
    tag: 'JWT & DOM XSS',
    tagClass: 'bg-sage-950/80 text-sage-400 border border-sage-500/30'
  }
]

export default function RepoInput({ onSuccess, isModal = false }: RepoInputProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e?: React.FormEvent, presetUrl?: string) => {
    if (e) e.preventDefault()
    const targetUrl = presetUrl || repoUrl.trim()

    if (!targetUrl) {
      setError('Please provide a valid GitHub repository URL')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/job/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: targetUrl })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize scan')
      }

      if (onSuccess) {
        onSuccess(data.jobId)
      } else {
        router.push(`/job/${data.jobId}`)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating job')
      setLoading(false)
    }
  }

  return (
    <div className={`w-full ${isModal ? '' : 'max-w-2xl mx-auto'}`}>
      <form onSubmit={(e) => handleSubmit(e)} className="relative">
        <div className="relative flex items-center bg-[#121212] border border-[#262626] focus-within:border-coral-500 focus-within:ring-1 focus-within:ring-coral-500/20 rounded-xl p-1.5 transition-all">
          <div className="pl-3 pr-2 text-[#b6b6b6]">
            <GitBranch className="w-4 h-4 text-coral-500" />
          </div>
          <input
            type="text"
            placeholder="Enter GitHub repository URL (e.g. github.com/owner/repo)..."
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={loading}
            className="w-full bg-transparent text-sm text-[#f2f2f2] placeholder-[#666666] focus:outline-none px-2 py-2 font-sans"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-coral-500 hover:bg-coral-600 text-white font-medium text-xs transition-all shadow-coral disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scanning Repository...</span>
              </>
            ) : (
              <>
                <span>Launch Scan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-rust-950/60 border border-rust-500/40 text-rust-400 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rust-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Repositories */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption text-[#8c8c8c] flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-coral-500" />
            <span>Or explore standard benchmark projects:</span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_REPOSITORIES.map((preset) => (
            <button
              key={preset.url}
              type="button"
              onClick={() => {
                setRepoUrl(preset.url)
                handleSubmit(undefined, preset.url)
              }}
              disabled={loading}
              className="text-left p-3 rounded-lg bg-[#121212] hover:bg-[#161616] border border-[#262626] hover:border-[#333333] transition-all group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#f2f2f2] group-hover:text-coral-400 truncate">
                  {preset.name}
                </span>
              </div>
              <span className={`inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded font-mono ${preset.tagClass}`}>
                {preset.tag}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
