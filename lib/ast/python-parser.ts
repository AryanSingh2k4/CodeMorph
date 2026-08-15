import { ASTSummary } from '@/types'

/**
 * Lightweight AST pattern extractor for Python source files
 */
export function parsePythonCode(code: string, filePath: string): ASTSummary {
  const imports: string[] = []
  const functions: string[] = []
  const classNames: string[] = []
  const patterns: string[] = []

  const lines = code.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Extract imports
    const importMatch = line.match(/^import\s+([a-zA-Z0-9_,\s]+)/)
    if (importMatch) {
      importMatch[1].split(',').forEach(m => {
        const mod = m.trim().split(/\s+as\s+/)[0]
        if (mod && !imports.includes(mod)) imports.push(mod)
      })
    }

    const fromImportMatch = line.match(/^from\s+([a-zA-Z0-9_.]+)\s+import/)
    if (fromImportMatch) {
      const mod = fromImportMatch[1]
      if (mod && !imports.includes(mod)) imports.push(mod)
    }

    // Extract functions
    const defMatch = line.match(/^def\s+([a-zA-Z0-9_]+)\s*\(/)
    if (defMatch) {
      functions.push(defMatch[1])
    }

    // Extract classes
    const classMatch = line.match(/^class\s+([a-zA-Z0-9_]+)/)
    if (classMatch) {
      classNames.push(classMatch[1])
    }

    // Detect dangerous Python patterns
    // 1. Insecure Deserialization
    if (line.includes('pickle.loads') || line.includes('pickle.load') || line.includes('_pickle.loads')) {
      if (!patterns.includes('python:insecure_deserialization_pickle')) {
        patterns.push('python:insecure_deserialization_pickle')
      }
    }
    if (line.includes('yaml.load(') && !line.includes('SafeLoader')) {
      if (!patterns.includes('python:insecure_yaml_load')) {
        patterns.push('python:insecure_yaml_load')
      }
    }

    // 2. Dynamic Code Execution
    if (line.match(/\beval\s*\(/) || line.match(/\bexec\s*\(/) || line.match(/__import__\s*\(/)) {
      if (!patterns.includes('python:dynamic_eval_or_exec')) {
        patterns.push('python:dynamic_eval_or_exec')
      }
    }

    // 3. Command Injection
    if (
      line.includes('shell=True') ||
      line.includes('os.system(') ||
      line.includes('os.popen(') ||
      line.includes('commands.getoutput(')
    ) {
      if (!patterns.includes('python:command_injection_risk')) {
        patterns.push('python:command_injection_risk')
      }
    }

    // 4. Raw SQL String Concatenation
    if (
      (line.includes('execute(') || line.includes('raw(') || line.includes('cursor.')) &&
      (line.includes('%') || line.includes('f"') || line.includes("f'") || line.includes('.format(') || line.includes('+'))
    ) {
      if (!patterns.includes('python:raw_sql_interpolation')) {
        patterns.push('python:raw_sql_interpolation')
      }
    }

    // 5. Insecure Temporary Files
    if (line.includes('tempfile.mktemp(')) {
      if (!patterns.includes('python:insecure_mktemp')) {
        patterns.push('python:insecure_mktemp')
      }
    }
  }

  return {
    imports,
    functions,
    classNames,
    patterns
  }
}
