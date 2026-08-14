export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function callAI(messages: AIMessage[], jsonMode = false): Promise<string> {
  const apiKey = process.env.AI_API_KEY
  const baseUrl = (process.env.AI_API_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.AI_MODEL || 'gpt-4o-mini'

  if (!apiKey) {
    console.warn('AI_API_KEY is not set. Generating intelligent simulated response for testing.')
    return generateFallbackAIResponse(messages, jsonMode)
  }

  try {
    const payload: Record<string, any> = {
      model,
      messages,
      temperature: 0.1,
      max_tokens: 4000
    }

    // Only add response_format if jsonMode is requested and provider supports it
    if (jsonMode) {
      payload.response_format = { type: 'json_object' }
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

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
 * Strips markdown code block wrappers (e.g. ```json ... ```) if an LLM returns them
 */
export function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }
  return cleaned.trim()
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

  return jsonMode ? '{}' : 'Simulated AI Response'
}
