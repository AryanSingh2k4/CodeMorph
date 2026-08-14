'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Asterisk, Github } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user)
      }
    }).catch(() => {})

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo',
          redirectTo: `${window.location.origin}/api/auth/callback`
        }
      })
    } catch {
      window.location.href = '/dashboard'
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#262626] bg-[#000000]/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#121212] border border-[#262626] group-hover:border-coral-500/50 flex items-center justify-center text-coral-500 transition-colors">
              <Asterisk className="w-4 h-4 text-coral-500" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-base text-[#f2f2f2] tracking-tight group-hover:text-coral-400 transition-colors">
                CodeMorph
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161616] text-[#b6b6b6] border border-[#262626] font-medium">
                v1.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#262626]">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname.startsWith('/dashboard')
                  ? 'bg-[#161616] text-[#f2f2f2] border border-[#333333]'
                  : 'text-[#b6b6b6] hover:text-[#f2f2f2] hover:bg-[#121212]'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard?new=true"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#b6b6b6] hover:text-[#f2f2f2] hover:bg-[#121212] transition-colors"
            >
              New Scan
            </Link>
          </nav>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#121212] border border-[#262626] text-[11px] text-[#b6b6b6] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-500 animate-pulse"></span>
            <span>Sandbox VM: Ready</span>
          </div>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#121212] border border-[#262626]">
                <div className="w-5 h-5 rounded bg-coral-500/20 text-coral-400 flex items-center justify-center text-xs font-bold font-mono">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs text-[#f2f2f2] max-w-[120px] truncate">{user.email || 'GitHub User'}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs text-[#b6b6b6] hover:text-rust-400 transition-colors px-2 py-1"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#161616] border border-[#262626] text-xs font-medium text-[#f2f2f2] transition-colors"
              >
                <span>Console</span>
              </Link>
              <button
                onClick={handleSignIn}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-coral-500 hover:bg-coral-600 text-white font-medium text-xs transition-all shadow-coral"
              >
                <Github className="w-3.5 h-3.5 text-white" />
                <span>Sign in with GitHub</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
