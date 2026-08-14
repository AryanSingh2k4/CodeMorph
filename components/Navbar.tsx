'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, Github, Sparkles } from 'lucide-react'
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
    <header className="sticky top-0 z-50 w-full border-b border-[#282622] bg-[#0f0f0e]/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#1d1b18] border border-[#38342e] group-hover:border-terracotta-500/50 flex items-center justify-center text-terracotta-500 transition-all shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-semibold text-lg text-sand-100 tracking-normal group-hover:text-terracotta-400 transition-colors">
                  Code<span className="text-terracotta-500 font-normal italic">Morph</span>
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#24211c] text-sand-300 border border-[#38342e] font-medium tracking-wide">
                  Claude-Engine
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#282622]">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname.startsWith('/dashboard')
                  ? 'bg-[#22201c] text-sand-100 border border-[#36332d]'
                  : 'text-sand-400 hover:text-sand-200 hover:bg-[#1a1815]'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard?new=true"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-sand-400 hover:text-sand-200 hover:bg-[#1a1815] transition-colors"
            >
              New Scan
            </Link>
          </nav>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#181715] border border-[#2b2823] text-[11px] text-sand-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-500 animate-pulse"></span>
            <span>Sandbox VM: Ready</span>
          </div>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#1a1815] border border-[#2e2a24]">
                <div className="w-5 h-5 rounded-full bg-terracotta-500/20 text-terracotta-400 flex items-center justify-center text-xs font-bold font-mono">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs text-sand-300 max-w-[120px] truncate">{user.email || 'GitHub User'}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs text-sand-400 hover:text-rust-400 transition-colors px-2 py-1"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5">
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#191816] hover:bg-[#23211d] border border-[#312f2a] text-xs font-medium text-sand-300 hover:text-sand-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-terracotta-400" />
                <span>Playground</span>
              </Link>
              <button
                onClick={handleSignIn}
                className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-medium text-xs transition-all shadow-terracotta"
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
