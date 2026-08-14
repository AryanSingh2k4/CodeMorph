import React from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {children}
    </div>
  )
}
