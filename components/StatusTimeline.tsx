import React from 'react'
import { JobStatus } from '@/types'
import { 
  DownloadCloud, 
  Search, 
  Wrench, 
  Cpu, 
  RefreshCw, 
  CheckCircle2
} from 'lucide-react'

interface StatusTimelineProps {
  status: JobStatus
  attemptCount: number
  maxAttempts: number
}

const STEPS = [
  { key: 'ingesting', label: 'Ingestion', desc: 'Fetch Git tree & AST parse', icon: DownloadCloud },
  { key: 'scanning', label: 'Scanner Agent', desc: 'Identify flaws & migrations', icon: Search },
  { key: 'patching', label: 'Patcher Agent', desc: 'Synthesize code remakes', icon: Wrench },
  { key: 'testing', label: 'Sandbox VM', desc: 'TypeScript & ESLint in Ubuntu', icon: Cpu },
  { key: 'healing', label: 'Self-Healing', desc: 'Loop errors back to LLM', icon: RefreshCw },
  { key: 'done', label: 'Verified & Ready', desc: 'Open verified Pull Request', icon: CheckCircle2 },
]

export default function StatusTimeline({ status, attemptCount, maxAttempts }: StatusTimelineProps) {
  const getStepState = (stepKey: string) => {
    const order = ['pending', 'ingesting', 'scanning', 'patching', 'testing', 'done']
    const currentIndex = order.indexOf(status)
    const stepIndex = order.indexOf(stepKey)

    if (status === 'failed') {
      if (stepKey === 'testing') return 'failed'
    }

    if (status === 'healing' && stepKey === 'healing') return 'active'

    if (status === 'done') return 'completed'
    if (currentIndex === -1) return 'pending'

    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <div className="w-full bg-[#181715] border border-[#2e2a24] rounded-2xl p-6 shadow-warm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#292621]">
        <div>
          <h2 className="text-sm font-serif font-semibold text-sand-100 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-terracotta-500 animate-pulse"></span>
            <span>Autonomous Pipeline Orchestration</span>
          </h2>
          <p className="text-xs text-sand-500 mt-0.5">Real-time multi-agent execution pipeline</p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#22201c] border border-[#36332c] text-sand-300">
            Cycle: Attempt {attemptCount} / {maxAttempts}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STEPS.map((step, idx) => {
          const state = getStepState(step.key)
          const Icon = step.icon

          let bgClass = 'bg-[#141311] border-[#292621] text-sand-600'
          let iconClass = 'text-sand-500 bg-[#1c1a17]'

          if (state === 'completed') {
            bgClass = 'bg-[#121c15] border-sage-500/30 text-sage-300'
            iconClass = 'text-sage-400 bg-sage-950/60'
          } else if (state === 'active') {
            bgClass = 'bg-[#241c17] border-terracotta-500/60 text-terracotta-200 ring-1 ring-terracotta-500/30 shadow-sm'
            iconClass = 'text-terracotta-400 bg-terracotta-950/80 animate-pulse'
          } else if (state === 'failed') {
            bgClass = 'bg-rust-950/40 border-rust-500/40 text-rust-300'
            iconClass = 'text-rust-400 bg-rust-950/80'
          }

          return (
            <div
              key={step.key}
              className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all relative overflow-hidden ${bgClass}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-[#343029] ${iconClass}`}>
                  <Icon className={`w-4 h-4 ${state === 'active' && step.key === 'healing' ? 'animate-spin' : ''}`} />
                </div>
                <span className="text-[10px] font-mono text-sand-600">0{idx + 1}</span>
              </div>

              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="text-xs font-semibold text-sand-200">{step.label}</h4>
                  {state === 'completed' && <CheckCircle2 className="w-3 h-3 text-sage-400" />}
                </div>
                <p className="text-[11px] text-sand-500 mt-1 leading-tight">{step.desc}</p>
              </div>

              {state === 'active' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terracotta-500"></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
