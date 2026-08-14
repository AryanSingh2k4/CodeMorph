export type JobStatus =
  | 'pending'
  | 'ingesting'
  | 'scanning'
  | 'patching'
  | 'testing'
  | 'healing'
  | 'done'
  | 'failed'

export type FindingType = 'vulnerability' | 'migration'
export type Severity = 'critical' | 'high' | 'medium' | 'low'

export interface Job {
  id: string
  user_id?: string | null
  repo_url: string
  repo_owner: string
  repo_name: string
  status: JobStatus
  attempt_count: number
  max_attempts: number
  error_message?: string | null
  created_at: string
  updated_at: string
}

export interface ASTSummary {
  imports: string[]
  functions: string[]
  classNames: string[]
  patterns: string[]
}

export interface JobFile {
  id: string
  job_id: string
  file_path: string
  original_content: string
  patched_content?: string | null
  ast_summary?: ASTSummary | null
  created_at?: string
}

export interface Finding {
  id: string
  job_id: string
  file_path: string
  line_number?: number | null
  type: FindingType
  severity?: Severity | null
  title: string
  description: string
  created_at?: string
}

export interface SandboxRun {
  id: string
  job_id: string
  attempt_number: number
  github_run_id?: string | null
  status: 'pending' | 'running' | 'passed' | 'failed'
  logs?: string | null
  error_summary?: string | null
  triggered_at: string
  completed_at?: string | null
}

export interface ScannerVulnerability {
  file: string
  line: number
  type: string
  severity: Severity
  title: string
  description: string
}

export interface ScannerMigration {
  file: string
  type: string
  title: string
  description: string
}

export interface ScannerOutput {
  vulnerabilities: ScannerVulnerability[]
  migrations: ScannerMigration[]
}

export interface PatchItem {
  file_path: string
  patched_content: string
  summary: string
}

export interface PatcherOutput {
  patches: PatchItem[]
}

export interface JobDetailResponse {
  job: Job
  files: JobFile[]
  findings: Finding[]
  runs: SandboxRun[]
}
