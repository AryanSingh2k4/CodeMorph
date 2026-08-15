import { callAI, cleanJsonResponse } from './ai'
import { JobFile, Finding, Patch, RemediationTest, TestGeneratorOutput } from '@/types'

const TEST_GENERATOR_SYSTEM_PROMPT = `You are a Principal Quality Assurance Engineer and Security Verification Specialist.
Your task is to synthesize comprehensive, passing unit test suites that verify:
1. SECURITY REMEDIATION: Negative test cases asserting that previously identified security vulnerabilities (e.g. SQL Injection, XSS, Command Injection, Path Traversal, SSRF, Broken Auth) are safely rejected, sanitized, parameterized, or neutralized.
2. BUSINESS LOGIC INTEGRITY: Positive and boundary test cases asserting that legitimate functional behavior, public API contracts, return types, and happy path workflows remain intact without regressions.
3. EDGE CASES: Robust handling of missing parameters, empty strings, invalid payload structures, and unexpected input types.

Guidelines:
- Choose the appropriate framework ('jest' | 'vitest' | 'pytest') based on the file type and ecosystem.
  - For JavaScript/TypeScript Node or React projects: use 'vitest' or 'jest'.
  - For Python projects: use 'pytest'.
- Provide the COMPLETE, runnable test file content with all necessary imports, mocks (e.g. vi.fn(), jest.fn(), vi.mock(), jest.mock()), test fixtures, and assertions.
- Choose idiomatic test file paths (e.g., \`src/routes/auth.test.ts\`, \`tests/auth.test.ts\`, \`test_auth.py\`).
- You MUST respond ONLY with valid JSON matching the exact schema below.
- Do NOT include markdown fences, code blocks, or explanatory text outside the JSON object.

Expected JSON Structure:
{
  "tests": [
    {
      "file_path": "src/routes/auth.test.ts",
      "framework": "vitest",
      "test_content": "...complete test suite code..."
    }
  ]
}`

/**
 * Synthesizes automated remediation unit test suites for patched files and security findings.
 */
export async function generateRemediationTests(
  files: JobFile[],
  findings: Finding[],
  patches: Patch[]
): Promise<TestGeneratorOutput> {
  // If no files or patches provided, return empty tests
  if ((!files || files.length === 0) && (!patches || patches.length === 0)) {
    return { tests: [] }
  }

  // Index findings by file path
  const findingsByFile = (findings || []).reduce((acc, f: any) => {
    const key = f.file_path || f.file
    if (key) {
      if (!acc[key]) acc[key] = []
      acc[key].push(f)
    }
    return acc
  }, {} as Record<string, Finding[]>)

  // Index patches by file path
  const patchByFile = (patches || []).reduce((acc, p) => {
    if (p.file_path) {
      acc[p.file_path] = p
    }
    return acc
  }, {} as Record<string, Patch>)

  // Determine relevant target files (either patched or having security findings)
  const candidateFiles = files.filter(f => 
    Boolean(patchByFile[f.file_path]) || 
    Boolean(f.patched_content) || 
    Boolean(findingsByFile[f.file_path]?.length)
  )

  // Fallback to all files if no specific candidate is found
  const targetFiles = candidateFiles.length > 0 ? candidateFiles : files

  const fileSections = targetFiles.map((file, idx) => {
    const patch = patchByFile[file.file_path]
    const patchedContent = patch?.patched_content || file.patched_content || file.original_content
    const fileFindings = findingsByFile[file.file_path] || []

    const issuesSummary = fileFindings.length > 0
      ? fileFindings.map((f, i) => 
          `  ${i + 1}. [${f.type.toUpperCase()}${f.severity ? ` | ${f.severity.toUpperCase()}` : ''}] ${f.title}: ${f.description}${f.line_number ? ` (Line ${f.line_number})` : ''}`
        ).join('\n')
      : '  (No specific static findings recorded, synthesize general business logic and defensive integrity tests)'

    const patchSummary = patch?.summary ? `PATCH SUMMARY: ${patch.summary}` : 'PATCH STATUS: Source code updated'

    return `=======================================================
FILE [${idx + 1}/${targetFiles.length}]: ${file.file_path}
=======================================================
IDENTIFIED SECURITY / MODERNIZATION ISSUES:
${issuesSummary}

${patchSummary}

ORIGINAL CODE:
\`\`\`
${file.original_content}
\`\`\`

REMEDIATED / CURRENT CODE:
\`\`\`
${patchedContent}
\`\`\``
  }).join('\n\n')

  const userPrompt = `Synthesize full, comprehensive, passing unit test suites that verify the security fixes and business logic for the following remediated files:\n\n${fileSections}`

  const rawResponse = await callAI([
    { role: 'system', content: TEST_GENERATOR_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ], true)

  try {
    const parsed = JSON.parse(cleanJsonResponse(rawResponse))
    const rawTests = Array.isArray(parsed?.tests) ? parsed.tests : []

    const validatedTests: RemediationTest[] = rawTests.map((t: any) => {
      let framework: 'jest' | 'vitest' | 'pytest' = 'vitest'
      if (t.framework === 'jest' || t.framework === 'vitest' || t.framework === 'pytest') {
        framework = t.framework
      } else if (typeof t.file_path === 'string' && t.file_path.endsWith('.py')) {
        framework = 'pytest'
      } else if (typeof t.test_content === 'string' && t.test_content.includes('jest.')) {
        framework = 'jest'
      }

      return {
        file_path: String(t.file_path || 'tests/remediation.test.ts'),
        framework,
        test_content: String(t.test_content || '')
      }
    }).filter((t: RemediationTest) => t.test_content.trim().length > 0)

    return { tests: validatedTests }
  } catch (err) {
    console.error('Failed to parse test generator response:', err, 'Raw was:', rawResponse)
    return { tests: [] }
  }
}
