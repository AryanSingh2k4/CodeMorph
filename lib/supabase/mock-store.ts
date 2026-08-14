import { Job, JobFile, Finding, SandboxRun } from '@/types'

// In-memory singleton mock storage for development/demo mode
class MockDatabase {
  private jobs: Map<string, Job> = new Map()
  private files: Map<string, JobFile[]> = new Map()
  private findings: Map<string, Finding[]> = new Map()
  private runs: Map<string, SandboxRun[]> = new Map()

  constructor() {
    this.seedDemoData()
  }

  private seedDemoData() {
    const demoJobId = 'demo-job-express-security'
    const now = new Date().toISOString()

    const demoJob: Job = {
      id: demoJobId,
      user_id: 'demo-user-1',
      repo_url: 'https://github.com/expressjs/sample-vulnerable-api',
      repo_owner: 'expressjs',
      repo_name: 'sample-vulnerable-api',
      status: 'done',
      attempt_count: 1,
      max_attempts: 3,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: now
    }

    const demoFiles: JobFile[] = [
      {
        id: 'f1',
        job_id: demoJobId,
        file_path: 'src/routes/auth.ts',
        original_content: `import express from 'express';
import { db } from '../database';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // VULNERABLE: Direct SQL string concatenation
  const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`;
  const user = await db.raw(query);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  return res.json({ token: 'mock-jwt-token' });
});

export default router;`,
        patched_content: `import express from 'express';
import { db } from '../database';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }

  // PATCHED: Parameterized query preventing SQL injection
  const query = 'SELECT id, username, email FROM users WHERE username = $1 AND password = $2 LIMIT 1';
  const user = await db.query(query, [username, password]);
  
  if (!user || user.rowCount === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  return res.json({ token: 'mock-jwt-token', user: user.rows[0] });
});

export default router;`,
        ast_summary: {
          imports: ['express', '../database'],
          functions: ['router.post'],
          classNames: [],
          patterns: ['suspicious_method:raw']
        }
      },
      {
        id: 'f2',
        job_id: demoJobId,
        file_path: 'src/components/UserProfile.tsx',
        original_content: `import React, { Component } from 'react';

interface Props {
  userId: string;
}

interface State {
  user: any;
  loading: boolean;
}

export default class UserProfile extends Component<Props, State> {
  state: State = {
    user: null,
    loading: true
  };

  componentDidMount() {
    fetch(\`/api/users/\${this.props.userId}\`)
      .then(res => res.json())
      .then(user => this.setState({ user, loading: false }));
  }

  render() {
    if (this.state.loading) return <div>Loading...</div>;
    return (
      <div className="profile">
        <h2>{this.state.user.name}</h2>
        <div dangerouslySetInnerHTML={{ __html: this.state.user.bio }} />
      </div>
    );
  }
}`,
        patched_content: `import React, { useState, useEffect } from 'react';

interface Props {
  userId: string;
}

interface User {
  name: string;
  bio: string;
}

export default function UserProfile({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(\`/api/users/\${encodeURIComponent(userId)}\`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError('Failed to load profile');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error || !user) return <div>Error loading profile</div>;

  return (
    <div className="profile">
      <h2>{user.name}</h2>
      {/* PATCHED: Safe text rendering preventing XSS attacks */}
      <p className="bio-text">{user.bio}</p>
    </div>
  );
}`,
        ast_summary: {
          imports: ['react'],
          functions: ['componentDidMount', 'render'],
          classNames: ['UserProfile'],
          patterns: ['legacy:class_component_or_oop', 'react:dangerouslySetInnerHTML']
        }
      }
    ]

    const demoFindings: Finding[] = [
      {
        id: 'find-1',
        job_id: demoJobId,
        file_path: 'src/routes/auth.ts',
        line_number: 10,
        type: 'vulnerability',
        severity: 'critical',
        title: 'SQL Injection via unsanitized template literal',
        description: 'Parameters extracted from req.body are concatenated directly into raw database query strings, allowing arbitrary SQL execution.'
      },
      {
        id: 'find-2',
        job_id: demoJobId,
        file_path: 'src/components/UserProfile.tsx',
        line_number: 28,
        type: 'vulnerability',
        severity: 'high',
        title: 'Cross-Site Scripting (XSS) via dangerouslySetInnerHTML',
        description: 'Unsanitized user-supplied bio string injected directly into DOM tree via dangerouslySetInnerHTML.'
      },
      {
        id: 'find-3',
        job_id: demoJobId,
        file_path: 'src/components/UserProfile.tsx',
        line_number: 11,
        type: 'migration',
        severity: 'low',
        title: 'Legacy React Class Component to Functional Hooks',
        description: 'Class component using legacy componentDidMount converted to idiomatic functional component with useState and useEffect.'
      }
    ]

    const demoRuns: SandboxRun[] = [
      {
        id: 'run-1',
        job_id: demoJobId,
        attempt_number: 1,
        github_run_id: '9847120349',
        status: 'passed',
        logs: 'TypeScript: success | ESLint: success (0 errors, 0 warnings)',
        error_summary: null,
        triggered_at: new Date(Date.now() - 1800000).toISOString(),
        completed_at: new Date(Date.now() - 1740000).toISOString()
      }
    ]

    this.jobs.set(demoJobId, demoJob)
    this.files.set(demoJobId, demoFiles)
    this.findings.set(demoJobId, demoFindings)
    this.runs.set(demoJobId, demoRuns)
  }

  getJob(id: string) { return this.jobs.get(id) }
  getAllJobs() { return Array.from(this.jobs.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) }
  saveJob(job: Job) { this.jobs.set(job.id, job) }
  updateJob(id: string, updates: Partial<Job>) {
    const current = this.jobs.get(id)
    if (current) {
      this.jobs.set(id, { ...current, ...updates, updated_at: new Date().toISOString() })
    }
  }

  getFiles(jobId: string) { return this.files.get(jobId) || [] }
  saveFiles(jobId: string, files: JobFile[]) { this.files.set(jobId, files) }
  updateFilePatch(jobId: string, filePath: string, patchedContent: string) {
    const list = this.files.get(jobId) || []
    const target = list.find(f => f.file_path === filePath)
    if (target) {
      target.patched_content = patchedContent
    }
  }

  getFindings(jobId: string) { return this.findings.get(jobId) || [] }
  saveFindings(jobId: string, findings: Finding[]) { this.findings.set(jobId, findings) }

  getRuns(jobId: string) { return this.runs.get(jobId) || [] }
  saveRun(jobId: string, run: SandboxRun) {
    const list = this.runs.get(jobId) || []
    list.push(run)
    this.runs.set(jobId, list)
  }
  updateRun(jobId: string, attemptNumber: number, updates: Partial<SandboxRun>) {
    const list = this.runs.get(jobId) || []
    const target = list.find(r => r.attempt_number === attemptNumber)
    if (target) {
      Object.assign(target, updates)
    }
  }
}

// Global singleton instance across Next.js API calls in dev mode
const globalForMock = global as unknown as { mockDb: MockDatabase }
export const mockDb = globalForMock.mockDb || new MockDatabase()
if (process.env.NODE_ENV !== 'production') globalForMock.mockDb = mockDb
