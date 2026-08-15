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
      max_tokens: 4000
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (response.status === 429 && retryCount < 3) {
      console.warn(`Rate limit reached (429). Retrying in ${(retryCount + 1) * 3} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, (retryCount + 1) * 3000))
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
 * Robust JSON extraction: Strips thought tags (<thought>...</thought>), markdown blocks, and isolates JSON body
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

  if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1)
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
