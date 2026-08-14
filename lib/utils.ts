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
      return "bg-terracotta-950/80 text-terracotta-300 border border-terracotta-500/40"
    case "medium":
      return "bg-[#2d2417] text-[#e9c46a] border border-[#e9c46a]/30"
    case "low":
      return "bg-sage-950/80 text-sage-400 border border-sage-500/40"
    default:
      return "bg-charcoal-850 text-sand-400 border border-[#312f2b]"
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "done":
      return "bg-sage-950/80 text-sage-400 border border-sage-500/40"
    case "failed":
      return "bg-rust-950/80 text-rust-400 border border-rust-500/40"
    case "healing":
      return "bg-[#2d2417] text-[#f4a261] border border-[#f4a261]/40 animate-pulse"
    case "testing":
      return "bg-terracotta-950/80 text-terracotta-300 border border-terracotta-500/40 animate-pulse"
    case "patching":
      return "bg-[#26201a] text-terracotta-400 border border-terracotta-500/30 animate-pulse"
    case "scanning":
      return "bg-charcoal-850 text-sand-300 border border-sand-500/30 animate-pulse"
    case "ingesting":
      return "bg-charcoal-850 text-sand-400 border border-[#312f2b] animate-pulse"
    default:
      return "bg-charcoal-850 text-sand-500 border border-[#312f2b]"
  }
}
