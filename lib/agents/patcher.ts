import { callAI, cleanJsonResponse } from './ai'
import { PatcherOutput, JobFile, Finding } from '@/types'

const PATCHER_SYSTEM_PROMPT = `You are a Principal Software Engineer and Security Remediation Specialist.
You will receive source code files along with a list of security vulnerabilities and migration tasks that must be fixed.

Your responsibilities:
1. Fix EVERY issue described thoroughly and securely.
2. Ensure the code compiles cleanly, strictly adhering to TypeScript/JavaScript best practices.
3. Preserve all existing business logic, comments, exports, and public API interfaces.
4. Output the COMPLETE, fully-formed replacement file content for each modified file.
5. Provide a concise summary of what was fixed and why.

Output Format:
You MUST respond ONLY with valid JSON in this exact structure:
{
  "patches": [
    {
      "file_path": "path/to/file.ts",
      "patched_content": "...complete full rewritten file source code...",
      "summary": "Fixed SQL injection by utilizing parameterized query placeholders ($1, $2) and validated input parameters."
    }
  ]
}
Do NOT include explanations outside of the JSON.`

export async function runPatcherAgent(
  files: JobFile[],
  findings: Finding[],
  errorContext?: string
): Promise<PatcherOutput> {
  // Group findings by file
  const findingsByFile = findings.reduce((acc, f) => {
    if (!acc[f.file_path]) acc[f.file_path] = []
    acc[f.file_path].push(f)
    return acc
  }, {} as Record<string, Finding[]>)

  // Filter files that have findings or require patching
  const filesToPatch = files.filter(f => findingsByFile[f.file_path] && findingsByFile[f.file_path].length > 0)

  if (filesToPatch.length === 0) {
    return { patches: [] }
  }

  const promptSections = filesToPatch.map(file => {
    const fileFindings = findingsByFile[file.file_path]
    const issuesList = fileFindings.map((f, i) =>
      `${i + 1}. [${f.type.toUpperCase()}${f.severity ? ` | ${f.severity.toUpperCase()}` : ''}] ${f.title}: ${f.description}${f.line_number ? ` (Line: ${f.line_number})` : ''}`
    ).join('\n')

    return `==============================
TARGET FILE: ${file.file_path}
==============================
IDENTIFIED ISSUES:
${issuesList}

ORIGINAL SOURCE CODE:
\`\`\`
${file.original_content}
\`\`\``
  }).join('\n\n')

  let userMessage = `Generate full, verified patches for the following files:\n\n${promptSections}`

  if (errorContext) {
    userMessage = `[SELF-HEALING RECOVERY MODE]
The previous patch generated failed in the GitHub Actions sandbox environment with the following compiler/linter error:
--------------------------------------------------
${errorContext}
--------------------------------------------------
Please carefully re-evaluate the source code, fix the root cause of this error, and produce the corrected full file content:\n\n${promptSections}`
  }

  const raw = await callAI([
    { role: 'system', content: PATCHER_SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ], true)

  try {
    const parsed = JSON.parse(cleanJsonResponse(raw))
    return {
      patches: Array.isArray(parsed.patches) ? parsed.patches : []
    }
  } catch (err) {
    console.error('Failed to parse patcher agent JSON response:', err, 'Raw was:', raw)
    return { patches: [] }
  }
}
