import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "N/A"
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch {
    return dateString
  }
}

export function getSeverityBadgeClass(severity?: string | null): string {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-rust-950/80 text-rust-400 border border-rust-500/40"
    case "high":
      return "bg-coral-950/80 text-coral-400 border border-coral-500/40"
    case "medium":
      return "bg-amber-950/80 text-amber-400 border border-amber-500/30"
    case "low":
      return "bg-sage-950/80 text-sage-400 border border-sage-500/40"
    default:
      return "bg-[#161616] text-[#b6b6b6] border border-[#262626]"
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "done":
      return "bg-sage-950/80 text-sage-400 border border-sage-500/40"
    case "failed":
      return "bg-rust-950/80 text-rust-400 border border-rust-500/40"
    case "healing":
      return "bg-amber-950/80 text-amber-400 border border-amber-500/40 animate-pulse"
    case "testing":
      return "bg-coral-950/80 text-coral-400 border border-coral-500/40 animate-pulse"
    case "patching":
      return "bg-[#1a1a1a] text-coral-400 border border-coral-500/30 animate-pulse"
    case "scanning":
      return "bg-[#161616] text-[#f2f2f2] border border-[#333333] animate-pulse"
    case "ingesting":
      return "bg-[#161616] text-[#b6b6b6] border border-[#262626] animate-pulse"
    default:
      return "bg-[#161616] text-[#8c8c8c] border border-[#262626]"
  }
}
