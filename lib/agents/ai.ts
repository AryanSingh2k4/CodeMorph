export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Rate limiting queue state to stay safely under Google AI Studio limits (30 RPM / 16K TPM)
let lastCallTimestamp = 0
const MIN_CALL_INTERVAL_MS = 1500 // Ensures max ~20 RPM

async function enforceRateLimitPacing() {
  const now = Date.now()
  const timeSinceLastCall = now - lastCallTimestamp
  if (timeSinceLastCall < MIN_CALL_INTERVAL_MS) {
    const delay = MIN_CALL_INTERVAL_MS - timeSinceLastCall
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  lastCallTimestamp = Date.now()
}

export async function callAI(messages: AIMessage[], jsonMode = false, retryCount = 0): Promise<string> {
  const apiKey = process.env.AI_API_KEY
  const baseUrl = (process.env.AI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, '')
  const model = process.env.AI_MODEL || 'gemma-4-26b-a4b-it'

  if (!apiKey) {
    console.warn('AI_API_KEY is not set. Generating intelligent simulated response for testing.')
    return generateFallbackAIResponse(messages, jsonMode)
  }

  await enforceRateLimitPacing()

  try {
    const payload: Record<string, any> = {
      model,
      messages,
      temperature: 0.1,
      max_tokens: 8192
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (response.status === 429 && retryCount < 5) {
      const backoffMs = (retryCount + 1) * 4000
      console.warn(`Rate limit reached (429). Retrying in ${backoffMs / 1000}s (attempt ${retryCount + 1}/5)...`)
      await new Promise((resolve) => setTimeout(resolve, backoffMs))
      return callAI(messages, jsonMode, retryCount + 1)
    }

    if (!response.ok) {
      const errText = await response.text()
      console.error(`AI API error (${response.status}):`, errText)
      throw new Error(`AI API failed with status ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content || ''
    return cleanJsonResponse(rawContent)
  } catch (error: any) {
    console.error('Failed to call AI provider:', error)
    if (!apiKey || error.message.includes('fetch failed')) {
      return generateFallbackAIResponse(messages, jsonMode)
    }
    throw error
  }
}

/**
 * Robust JSON extraction: Strips thought tags (<thought>...</thought>), markdown blocks, isolates JSON body,
 * and repairs unclosed/truncated JSON structures.
 */
export function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim()
  
  // Remove reasoning model thought tags (<thought>...</thought> or <think>...</think>)
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim()
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // Remove markdown codeblock fences
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  // Extract cleanest JSON substring (object or array)
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  const firstBracket = cleaned.indexOf('[')
  const lastBracket = cleaned.lastIndexOf(']')

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    if (lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    } else {
      cleaned = cleaned.substring(firstBrace)
    }
  } else if (firstBracket !== -1) {
    if (lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1)
    } else {
      cleaned = cleaned.substring(firstBracket)
    }
  }

  // Repair unclosed JSON if truncated
  cleaned = repairJson(cleaned.trim())

  return cleaned.trim()
}

/**
 * Repairs unclosed JSON brackets and strings if an LLM response was truncated
 */
function repairJson(jsonStr: string): string {
  try {
    JSON.parse(jsonStr)
    return jsonStr
  } catch {
    // Continue with repair attempt
  }

  let inString = false
  let escaped = false
  const stack: string[] = []

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char)
      } else if (char === '}' && stack[stack.length - 1] === '{') {
        stack.pop()
      } else if (char === ']' && stack[stack.length - 1] === '[') {
        stack.pop()
      }
    }
  }

  let repaired = jsonStr

  // If ended in an open string, close it
  if (inString) {
    repaired += '"'
  }

  // Strip any trailing comma before closing
  repaired = repaired.replace(/,\s*$/, '')

  // Close remaining open brackets in reverse order
  while (stack.length > 0) {
    const openChar = stack.pop()
    if (openChar === '{') repaired += '}'
    else if (openChar === '[') repaired += ']'
  }

  return repaired
}

/**
 * Intelligent simulation fallback when no API key is provided, ensuring seamless demo experience
 */
function generateFallbackAIResponse(messages: AIMessage[], jsonMode: boolean): string {
  const userContent = messages.find(m => m.role === 'user')?.content || ''
  const systemContent = messages.find(m => m.role === 'system')?.content || ''

  if (systemContent.includes('security auditor') || systemContent.includes('Scanner')) {
    // Scanner Agent Simulation
    return JSON.stringify({
      vulnerabilities: [
        {
          file: 'src/api/auth.ts',
          line: 24,
          type: 'SQL Injection',
          severity: 'critical',
          title: 'Unescaped SQL query interpolation',
          description: 'User-controlled input parameters are formatted directly into raw SQL strings without parameterized placeholders.'
        },
        {
          file: 'src/utils/exec.ts',
          line: 15,
          type: 'Remote Code Execution',
          severity: 'high',
          title: 'Unsanitized child_process execSync call',
          description: 'Command string constructed using user input passed directly to execSync leading to potential shell injection.'
        }
      ],
      migrations: [
        {
          file: 'src/components/UserProfile.tsx',
          type: 'Legacy React Class Component',
          title: 'Migrate React.Component to Functional Component',
          description: 'Class component uses deprecated lifecycle methods and should be converted to React hooks (useState, useEffect).'
        }
      ]
    }, null, 2)
  }

  if (systemContent.includes('Patcher') || systemContent.includes('rewrite the file')) {
    // Patcher Agent Simulation
    return JSON.stringify({
      patches: [
        {
          file_path: 'src/api/auth.ts',
          summary: 'Replaced string interpolation with parameterized SQL query placeholders and input validation.',
          patched_content: `import { db } from '../db';

export async function authenticateUser(username: string, passwordHash: string) {
  // Patched: Secure parameterized query
  const query = 'SELECT id, username, email FROM users WHERE username = $1 AND password_hash = $2 LIMIT 1';
  const result = await db.query(query, [username, passwordHash]);
  return result.rows[0] || null;
}`
        },
        {
          file_path: 'src/utils/exec.ts',
          summary: 'Replaced execSync shell execution with safe execFile parameter array.',
          patched_content: `import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function runSafeCommand(binary: string, args: string[]) {
  // Patched: Safe argument list execution without shell expansion
  const { stdout, stderr } = await execFileAsync(binary, args, { timeout: 10000 });
  return { stdout: stdout.trim(), stderr: stderr.trim() };
}`
        }
      ]
    }, null, 2)
  }

  if (systemContent.includes('Test') || systemContent.includes('test') || systemContent.includes('QA') || systemContent.includes('Remediation')) {
    // Test Synthesizer Agent Simulation
    return JSON.stringify({
      tests: [
        {
          file_path: 'src/routes/auth.test.ts',
          framework: 'vitest',
          test_content: `import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from './auth';
import { db } from '../database';

vi.mock('../database', () => ({
  db: {
    query: vi.fn(),
    raw: vi.fn()
  }
}));

describe('Auth Route Security & Functionality Verification', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    vi.clearAllMocks();
  });

  describe('Security Remediation - SQL Injection Prevention', () => {
    it('should reject SQL injection payloads in login credentials without raw query execution', async () => {
      const maliciousPayload = {
        username: "admin' OR '1'='1",
        password: "' OR '1'='1"
      };

      (db.query as any).mockResolvedValue({
        rowCount: 0,
        rows: []
      });

      const res = await request(app)
        .post('/auth/login')
        .send(maliciousPayload);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid credentials' });
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, email FROM users WHERE username = $1 AND password = $2'),
        [maliciousPayload.username, maliciousPayload.password]
      );
      expect(db.raw).not.toHaveBeenCalled();
    });

    it('should reject invalid payload structures with 400 Bad Request', async () => {
      const invalidPayload = {
        username: 12345,
        password: true
      };

      const res = await request(app)
        .post('/auth/login')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Business Logic Integrity', () => {
    it('should successfully authenticate valid user and return jwt session token', async () => {
      const validUser = { id: 1, username: 'johndoe', email: 'john@example.com' };
      (db.query as any).mockResolvedValue({
        rowCount: 1,
        rows: [validUser]
      });

      const res = await request(app)
        .post('/auth/login')
        .send({
          username: 'johndoe',
          password: 'CorrectPassword123!'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token', 'jwt-session-token');
      expect(res.body.user).toEqual(validUser);
    });
  });
});`
        },
        {
          file_path: 'src/components/UserProfile.test.tsx',
          framework: 'vitest',
          test_content: `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import UserProfile from './UserProfile';

describe('UserProfile Component Security & Functionality Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Security Remediation - XSS Prevention', () => {
    it('should safely render user bio without executing malicious HTML or script tags', async () => {
      const xssPayload = '<img src=x onerror=alert(1)>';
      const mockUser = {
        name: 'Alice Security',
        bio: xssPayload
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockUser)
      } as any);

      render(<UserProfile userId="user-42" />);

      await waitFor(() => {
        expect(screen.getByText('Alice Security')).toBeDefined();
      });

      const bioElement = screen.getByText(xssPayload);
      expect(bioElement).toBeDefined();
      expect(bioElement.className).toContain('bio-text');
      expect(document.querySelector('img')).toBeNull();
    });
  });

  describe('Modern Functional Component & Lifecycle', () => {
    it('should display loading state before profile data arrives', () => {
      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
      render(<UserProfile userId="user-99" />);
      expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('should handle fetch failures gracefully without crashing', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      render(<UserProfile userId="user-error" />);

      await waitFor(() => {
        expect(screen.getByText('Error loading profile')).toBeDefined();
      });
    });
  });
});`
        }
      ]
    }, null, 2)
  }

  return jsonMode ? '{}' : 'Simulated AI Response'
}

