import { callAI, cleanJsonResponse } from './ai'
import { ScannerOutput, JobFile } from '@/types'

const SCANNER_SYSTEM_PROMPT = `You are an expert cybersecurity auditor and legacy code migration specialist.
You will be provided with source code files from a JavaScript/TypeScript/Python repository alongside their AST analysis.

Your task is to thoroughly analyze the files and return:
1. Security vulnerabilities (e.g. SQL Injection, XSS, Command Injection, Prototype Pollution, Insecure Deserialization, Hardcoded Secrets, Insecure Deps, Open Redirects, Path Traversal, eval/exec RCE, pickle deserialization)
2. Migration and modernization recommendations (e.g. Class components to React Hooks, CommonJS to ESM, Callback hell to async/await, Deprecated APIs, legacy Python 2 idioms, insecure patterns)

Rules:
- You MUST respond ONLY with valid JSON matching the exact schema below.
- Do NOT include markdown fences, code blocks, or explanations outside the JSON.
- If no issues are found, return empty arrays.

Expected JSON Structure:
{
  "vulnerabilities": [
    {
      "file": "src/path/to/file.ts",
      "line": 42,
      "type": "SQL Injection",
      "severity": "critical",
      "title": "Unsanitized user input in raw SQL query",
      "description": "The request body parameter is concatenated directly into the database query string without parameterization or escaping."
    }
  ],
  "migrations": [
    {
      "file": "src/components/MyComponent.tsx",
      "type": "Legacy Class Component",
      "title": "Convert class component to functional component with React hooks",
      "description": "The component can be modernized using React functional syntax and hooks for cleaner state management and better performance."
    }
  ]
}`

export async function runScannerAgent(files: JobFile[]): Promise<ScannerOutput> {
  if (!files || files.length === 0) {
    return { vulnerabilities: [], migrations: [] }
  }

  // Prioritize files that contain flagged AST patterns
  const prioritizedFiles = [...files].sort((a, b) => {
    const aPatterns = a.ast_summary?.patterns?.length || 0
    const bPatterns = b.ast_summary?.patterns?.length || 0
    return bPatterns - aPatterns
  }).slice(0, 8) // Limit to top 8 most critical files to stay safely under 16K TPM limit

  // Build a compact, structured file summary for the LLM
  const filesSummary = prioritizedFiles.map((f, idx) => {
    const ast = f.ast_summary
    const truncatedContent = f.original_content.length > 2500
      ? f.original_content.slice(0, 2500) + '\n... [Truncated for brevity]'
      : f.original_content

    return `### FILE [${idx + 1}/${prioritizedFiles.length}]: ${f.file_path}
- IMPORTS: ${ast?.imports?.length ? ast.imports.slice(0, 8).join(', ') : 'none'}
- FUNCTIONS: ${ast?.functions?.length ? ast.functions.slice(0, 8).join(', ') : 'none'}
- DETECTED AST PATTERNS: ${ast?.patterns?.length ? ast.patterns.join(', ') : 'none'}

\`\`\`
${truncatedContent}
\`\`\``
  }).join('\n\n')

  const prompt = `Analyze these repository source files for vulnerabilities and modernization opportunities:\n\n${filesSummary}`

  const raw = await callAI([
    { role: 'system', content: SCANNER_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ], true)

  try {
    const parsed = JSON.parse(cleanJsonResponse(raw))
    return {
      vulnerabilities: Array.isArray(parsed.vulnerabilities) ? parsed.vulnerabilities : [],
      migrations: Array.isArray(parsed.migrations) ? parsed.migrations : []
    }
  } catch (err) {
    console.error('Failed to parse scanner agent JSON response:', err, 'Raw was:', raw)
    // Fallback if parsing failed
    return { vulnerabilities: [], migrations: [] }
  }
}
