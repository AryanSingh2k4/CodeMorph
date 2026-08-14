-- ==========================================
-- CodeMorph Supabase PostgreSQL Database Schema
-- ==========================================

-- Enable pgcrypto for UUID generation (enabled by default on Supabase)
create extension if not exists "pgcrypto";

-- 1. Jobs Table
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  repo_url text not null,
  repo_owner text not null,
  repo_name text not null,
  status text not null default 'pending',
  -- status values: pending | ingesting | scanning | patching | testing | healing | done | failed
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Job Files Table
create table if not exists job_files (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  file_path text not null,
  original_content text not null,
  patched_content text,
  ast_summary jsonb,
  created_at timestamptz default now()
);

-- 3. Findings Table
create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  file_path text not null,
  line_number integer,
  type text not null,           -- 'vulnerability' | 'migration'
  severity text,                -- 'critical' | 'high' | 'medium' | 'low'
  title text not null,
  description text not null,
  created_at timestamptz default now()
);

-- 4. Sandbox Runs Table
create table if not exists sandbox_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  attempt_number integer not null,
  github_run_id text,
  status text not null default 'pending',
  -- status values: pending | running | passed | failed
  logs text,
  error_summary text,
  triggered_at timestamptz default now(),
  completed_at timestamptz
);

-- Indices for rapid querying
create index if not exists idx_jobs_user_id on jobs(user_id);
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_job_files_job_id on job_files(job_id);
create index if not exists idx_findings_job_id on findings(job_id);
create index if not exists idx_sandbox_runs_job_id on sandbox_runs(job_id);

-- Enable Row Level Security
alter table jobs enable row level security;
alter table job_files enable row level security;
alter table findings enable row level security;
alter table sandbox_runs enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Users see own jobs" on jobs;
drop policy if exists "Users insert own jobs" on jobs;
drop policy if exists "Users update own jobs" on jobs;
drop policy if exists "Users delete own jobs" on jobs;

drop policy if exists "Users see own files" on job_files;
drop policy if exists "Users insert own files" on job_files;
drop policy if exists "Users update own files" on job_files;

drop policy if exists "Users see own findings" on findings;
drop policy if exists "Users insert own findings" on findings;

drop policy if exists "Users see own runs" on sandbox_runs;
drop policy if exists "Users insert own runs" on sandbox_runs;
drop policy if exists "Users update own runs" on sandbox_runs;

-- Policies: users can interact with their own jobs
create policy "Users see own jobs" on jobs for select using (
  auth.uid() = user_id or user_id is null
);
create policy "Users insert own jobs" on jobs for insert with check (
  auth.uid() = user_id or auth.uid() is not null or user_id is null
);
create policy "Users update own jobs" on jobs for update using (
  auth.uid() = user_id or user_id is null
);
create policy "Users delete own jobs" on jobs for delete using (
  auth.uid() = user_id or user_id is null
);

create policy "Users see own files" on job_files for select using (
  job_id in (select id from jobs where user_id = auth.uid() or user_id is null)
);
create policy "Users insert own files" on job_files for insert with check (
  job_id in (select id from jobs where user_id = auth.uid() or user_id is null)
);
create policy "Users update own files" on job_files for update using (
  job_id in (select id from jobs where user_id = auth.uid() or user_id is null)
);

create policy "Users see own findings" on findings for select using (
  job_id in (select id from jobs where user_id = auth.uid() or user_id is null)
);
create policy "Users insert own findings" on findings for insert with check (
  job_id in (select id from jobs where user_id = auth.uid() or user_id is null)
);

create policy "Users see own runs" on sandbox_runs for select using (
  job_id in (select id from jobs where user_id = auth.uid() or user_id is null)
);
create policy "Users insert own runs" on sandbox_runs for insert with check (
  job_id in (select id from jobs where user_id = auth.uid() or user_id is null)
);
create policy "Users update own runs" on sandbox_runs for update using (
  job_id in (select id from jobs where user_id = auth.uid() or user_id is null)
);

-- Enable realtime on jobs and sandbox_runs table for live updates
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table sandbox_runs;
alter publication supabase_realtime add table findings;
