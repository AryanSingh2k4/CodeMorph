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
  { key: 'scanning', label: 'Scanner Agent', desc: 'Identify flaws & patterns', icon: Search },
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
    <div className="w-full bg-[#121212] border border-[#262626] rounded-xl p-5">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#262626]">
        <div>
          <h2 className="text-sm font-semibold text-[#f2f2f2] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-coral-500 animate-pulse"></span>
            <span>Autonomous Pipeline Orchestration</span>
          </h2>
          <p className="text-caption text-[#8c8c8c] mt-0.5">Real-time multi-agent execution pipeline</p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-caption font-mono px-2.5 py-0.5 rounded bg-[#161616] border border-[#262626] text-[#b6b6b6]">
            Attempt {attemptCount} / {maxAttempts}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STEPS.map((step, idx) => {
          const state = getStepState(step.key)
          const Icon = step.icon

          let bgClass = 'bg-[#161616] border-[#262626] text-[#8c8c8c]'
          let iconClass = 'text-[#8c8c8c] bg-[#1a1a1a]'

          if (state === 'completed') {
            bgClass = 'bg-sage-950/40 border-sage-500/30 text-sage-300'
            iconClass = 'text-sage-400 bg-sage-950/80'
          } else if (state === 'active') {
            bgClass = 'bg-coral-950/30 border-coral-500/60 text-coral-200 ring-1 ring-coral-500/20'
            iconClass = 'text-coral-400 bg-coral-950/80 animate-pulse'
          } else if (state === 'failed') {
            bgClass = 'bg-rust-950/40 border-rust-500/40 text-rust-300'
            iconClass = 'text-rust-400 bg-rust-950/80'
          }

          return (
            <div
              key={step.key}
              className={`rounded-lg border p-3 flex flex-col justify-between transition-all relative overflow-hidden ${bgClass}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-7 h-7 rounded flex items-center justify-center border border-[#262626] ${iconClass}`}>
                  <Icon className={`w-3.5 h-3.5 ${state === 'active' && step.key === 'healing' ? 'animate-spin' : ''}`} />
                </div>
                <span className="text-[10px] font-mono text-[#666666]">0{idx + 1}</span>
              </div>

              <div>
                <div className="flex items-center space-x-1">
                  <h4 className="text-xs font-semibold text-[#f2f2f2]">{step.label}</h4>
                  {state === 'completed' && <CheckCircle2 className="w-3 h-3 text-sage-400" />}
                </div>
                <p className="text-[11px] text-[#8c8c8c] mt-1 leading-tight">{step.desc}</p>
              </div>

              {state === 'active' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-coral-500"></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
