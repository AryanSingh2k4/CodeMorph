import { ASTSummary } from '@/types'

/**
 * Strips comments and docstrings from Python source code to enable
 * accurate AST and pattern analysis without false positives in comments/documentation.
 */
function cleanPythonCode(code: string): { cleanedCode: string; executableLines: string[] } {
  const lines = code.split('\n')
  const executableLines: string[] = []
  let inMultiQuote: string | null = null // '"""' or "'''"

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    let line = rawLine

    // Handle multiline docstrings / strings
    if (inMultiQuote) {
      const closeIdx = line.indexOf(inMultiQuote)
      if (closeIdx !== -1) {
        line = line.slice(closeIdx + 3)
        inMultiQuote = null
      } else {
        // Entire line is inside docstring
        executableLines.push('')
        continue
      }
    }

    // Check for start of multiline docstring
    const doubleTriple = line.indexOf('"""')
    const singleTriple = line.indexOf("'''")

    if (doubleTriple !== -1 && (singleTriple === -1 || doubleTriple < singleTriple)) {
      const afterTriple = line.indexOf('"""', doubleTriple + 3)
      if (afterTriple !== -1) {
        // Opens and closes on same line
        line = line.slice(0, doubleTriple) + ' ' + line.slice(afterTriple + 3)
      } else {
        inMultiQuote = '"""'
        line = line.slice(0, doubleTriple)
      }
    } else if (singleTriple !== -1) {
      const afterTriple = line.indexOf("'''", singleTriple + 3)
      if (afterTriple !== -1) {
        // Opens and closes on same line
        line = line.slice(0, singleTriple) + ' ' + line.slice(afterTriple + 3)
      } else {
        inMultiQuote = "'''"
        line = line.slice(0, singleTriple)
      }
    }

    // Strip single-line comments (# ...) outside of string literals
    let inString: string | null = null
    let commentIdx = -1
    for (let c = 0; c < line.length; c++) {
      const char = line[c]
      if (char === '\\' && inString) {
        c++ // Skip escaped char
        continue
      }
      if ((char === '"' || char === "'") && !inString) {
        inString = char
      } else if (char === inString) {
        inString = null
      } else if (char === '#' && !inString) {
        commentIdx = c
        break
      }
    }

    if (commentIdx !== -1) {
      line = line.slice(0, commentIdx)
    }

    executableLines.push(line)
  }

  return {
    cleanedCode: executableLines.join('\n'),
    executableLines
  }
}

/**
 * Extracts import statements from Python code.
 * Handles `import x`, `import x, y as z`, `from x.y import a, b`, multiline imports, and dynamic imports.
 */
function extractImports(cleanedCode: string, lines: string[], summary: ASTSummary): void {
  // Join multiline from/import parentheses into single statements for parsing
  const fullText = cleanedCode.replace(/from\s+([a-zA-Z0-9_\.]+)\s+import\s*\(([\s\S]*?)\)/g, (_, mod, items) => {
    return `from ${mod} import ${items.replace(/\n/g, ' ')}`
  }).replace(/import\s*\(([\s\S]*?)\)/g, (_, items) => {
    return `import ${items.replace(/\n/g, ' ')}`
  })

  const statementLines = fullText.split('\n')

  for (const rawLine of statementLines) {
    const line = rawLine.trim()
    if (!line) continue

    // 1. `import module1, module2 as alias`
    const standardImportMatch = line.match(/^import\s+(.+)$/)
    if (standardImportMatch) {
      const modulesStr = standardImportMatch[1]
      const parts = modulesStr.split(',')
      for (const part of parts) {
        const item = part.trim()
        if (!item) continue
        const modName = item.split(/\s+as\s+/i)[0].trim()
        if (modName && !modName.startsWith('(')) {
          summary.imports.push(modName)
        }
      }
      continue
    }

    // 2. `from module import item1, item2 as alias`
    const fromImportMatch = line.match(/^from\s+([a-zA-Z0-9_\.]+)\s+import\s+(.+)$/)
    if (fromImportMatch) {
      const moduleName = fromImportMatch[1].trim()
      const symbolsStr = fromImportMatch[2].trim()

      if (moduleName) {
        summary.imports.push(moduleName)
      }

      const symbols = symbolsStr.split(',')
      for (const sym of symbols) {
        const item = sym.trim().replace(/[()]/g, '').trim()
        if (!item || item === '*') continue
        const symName = item.split(/\s+as\s+/i)[0].trim()
        if (symName) {
          summary.imports.push(`${moduleName}.${symName}`)
        }
      }
      continue
    }

    // 3. Dynamic imports: `__import__('os')` or `importlib.import_module('os')`
    const dynamicMatch = line.match(/(?:__import__|importlib\.import_module)\s*\(\s*['"]([^'"]+)['"]/g)
    if (dynamicMatch) {
      for (const match of dynamicMatch) {
        const mod = match.replace(/^(?:__import__|importlib\.import_module)\s*\(\s*['"]/, '').replace(/['"]$/, '')
        if (mod) {
          summary.imports.push(mod)
          summary.patterns.push('dynamic_import')
        }
      }
    }
  }

  // Detect common Python frameworks and databases from imports
  const importList = summary.imports.join(' ')
  if (/\bflask\b/i.test(importList)) summary.patterns.push('framework:flask')
  if (/\bdjango\b/i.test(importList)) summary.patterns.push('framework:django')
  if (/\bfastapi\b/i.test(importList)) summary.patterns.push('framework:fastapi')
  if (/\bsqlite3\b/i.test(importList)) summary.patterns.push('db:sqlite3')
  if (/\bpsycopg2\b/i.test(importList)) summary.patterns.push('db:postgresql')
  if (/\bsqlalchemy\b/i.test(importList)) summary.patterns.push('orm:sqlalchemy')
}

/**
 * Extracts functions (sync and async) and class declarations.
 */
function extractFunctionsAndClasses(lines: string[], summary: ASTSummary): void {
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Function declarations: `def my_func(...)` or `async def async_handler(...)`
    const fnMatch = trimmed.match(/^(?:async\s+)?def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/)
    if (fnMatch && fnMatch[1]) {
      summary.functions.push(fnMatch[1])
      continue
    }

    // Class declarations: `class MyClass:` or `class MyClass(BaseModel):`
    const classMatch = trimmed.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*\((.*?)\))?\s*:/)
    if (classMatch && classMatch[1]) {
      summary.classNames.push(classMatch[1])
      if (classMatch[2] && classMatch[2].trim().length > 0) {
        summary.patterns.push('legacy:class_component_or_oop')
      }
    }
  }
}

/**
 * Scans code for dangerous security vulnerabilities and migration patterns:
 * - Insecure Deserialization (pickle.loads, pickle.load, yaml.unsafe_load, etc.)
 * - Dynamic Code Execution (eval, exec, compile)
 * - Command Injection (subprocess.run shell=True, os.system, popen, spawn)
 * - SQL Injection (f-string SQL, string formatting / concatenation in execute/raw)
 * - Exposed Input & Environment Variables (input, raw_input, os.environ)
 * - Weak Cryptography, SSL bypasses, and Debug mode
 */
function extractSecurityPatterns(code: string, lines: string[], summary: ASTSummary): void {
  // 1. Insecure Deserialization (pickle, _pickle, cPickle, shelve, marshal, unsafe yaml)
  if (/\b(?:pickle|_pickle|cPickle)\.loads\s*\(/i.test(code)) {
    summary.patterns.push('dangerous_call:pickle.loads')
    summary.patterns.push('security:insecure_deserialization:pickle')
  }
  if (/\b(?:pickle|_pickle|cPickle)\.load\s*\(/i.test(code)) {
    summary.patterns.push('dangerous_call:pickle.load')
    summary.patterns.push('security:insecure_deserialization:pickle')
  }
  if (/\bshelve\.open\s*\(/i.test(code)) {
    summary.patterns.push('dangerous_call:shelve.open')
    summary.patterns.push('security:insecure_deserialization')
  }
  if (/\bmarshal\.(?:load|loads)\s*\(/i.test(code)) {
    summary.patterns.push('dangerous_call:marshal.loads')
    summary.patterns.push('security:insecure_deserialization:marshal')
  }
  if (/\byaml\.(?:unsafe_load|load\s*\([\s\S]*?(?:Loader\s*=\s*(?:yaml\.)?(?:UnsafeLoader|Loader|CLoader)|Loader\s*=\s*None)\))/i.test(code) ||
      /\byaml\.load\s*\([^,)]+\)/i.test(code)) {
    summary.patterns.push('dangerous_call:yaml.unsafe_load')
    summary.patterns.push('security:insecure_deserialization:yaml')
  }

  // 2. Dynamic Code Execution (eval, exec, compile)
  for (const line of lines) {
    if (/\beval\s*\(/i.test(line)) {
      summary.patterns.push('dangerous_call:eval')
      summary.patterns.push('dynamic_execution:eval')
    }
    if (/\bexec\s*\(/i.test(line)) {
      summary.patterns.push('dangerous_call:exec')
      summary.patterns.push('dynamic_execution:exec')
    }
    if (/\b__import__\s*\(/i.test(line)) {
      summary.patterns.push('dangerous_call:__import__')
    }
  }

  // 3. Command Injection & Subprocess execution
  // Check for subprocess with shell=True across single and multiline calls
  const subprocessShellMatch = /subprocess\.(?:run|Popen|call|check_output|check_call)\s*\([\s\S]*?shell\s*=\s*(?:True|1|true)/i.test(code)
  if (subprocessShellMatch) {
    summary.patterns.push('subprocess:shell_true')
    summary.patterns.push('dangerous_call:subprocess_shell_true')
    summary.patterns.push('command_injection:subprocess_shell')
  }

  if (/\bsubprocess\.(?:run|Popen|call|check_output|check_call)\s*\(/i.test(code)) {
    summary.patterns.push('suspicious_method:subprocess')
  }

  if (/\bos\.system\s*\(/i.test(code)) {
    summary.patterns.push('dangerous_call:os.system')
    summary.patterns.push('command_injection:os.system')
  }

  if (/\bos\.popen[234]?\s*\(/i.test(code)) {
    summary.patterns.push('dangerous_call:os.popen')
    summary.patterns.push('command_injection:os.popen')
  }

  if (/\bos\.(?:spawn[lvep]+|posix_spawn[p]?)\s*\(/i.test(code)) {
    summary.patterns.push('dangerous_call:os.spawn')
  }

  if (/\bpty\.spawn\s*\(/i.test(code)) {
    summary.patterns.push('dangerous_call:pty.spawn')
  }

  if (/\bcommands\.(?:getoutput|getstatusoutput)\s*\(/i.test(code)) {
    summary.patterns.push('dangerous_call:commands.getoutput')
  }

  // 4. Raw SQL String Concatenation and SQL Injection
  // (e.g. cursor.execute("... %s" % ...), cursor.execute(f"..."), cursor.execute("..." + ...), .raw(f"..."))
  const sqlKeywords = '(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|FROM|WHERE|TABLE|INTO)'
  const sqlKeywordRegex = new RegExp(sqlKeywords, 'i')

  // Check cursor.execute / execute / raw methods
  const executeCallRegex = /(?:\.execute|\.executemany|\.raw|session\.execute|engine\.execute|db\.query)\s*\(\s*([\s\S]*?)\)/gi
  let execMatch: RegExpExecArray | null
  while ((execMatch = executeCallRegex.exec(code)) !== null) {
    const callArgs = execMatch[1]

    summary.patterns.push('suspicious_method:cursor_execute')

    // f-string query execution: f"SELECT ... {var}" or f'...'
    if (/^[fF]["']/.test(callArgs.trim()) || /,\s*[fF]["']/.test(callArgs)) {
      summary.patterns.push('sql_injection:fstring_query')
      summary.patterns.push('sql_injection:cursor_execute')
    }

    // %-formatting inside execute: execute("SELECT ..." % var)
    if (/["'].*?%s.*?["']\s*%/i.test(callArgs) || (/["'].*?["']\s*%/i.test(callArgs) && sqlKeywordRegex.test(callArgs))) {
      summary.patterns.push('sql_injection:raw_formatting')
      summary.patterns.push('sql_injection:cursor_execute')
    }

    // String concatenation inside execute: execute("SELECT ... " + var)
    if ((/["'].*?["']\s*\+/i.test(callArgs) || /\+\s*["'].*?["']/i.test(callArgs)) && sqlKeywordRegex.test(callArgs)) {
      summary.patterns.push('sql_injection:string_concat')
      summary.patterns.push('sql_injection:cursor_execute')
    }

    // .format() inside execute: execute("SELECT ... {}".format(var))
    if (/["'].*?["']\.format\s*\(/i.test(callArgs) && sqlKeywordRegex.test(callArgs)) {
      summary.patterns.push('sql_injection:raw_formatting')
      summary.patterns.push('sql_injection:cursor_execute')
    }
  }

  // Check standalone SQL query construction variables
  // e.g. query = f"SELECT * FROM users WHERE id = '{user_id}'"
  // or query = "SELECT * FROM users WHERE id = " + user_id
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Variable assignment with f-string containing SQL keyword
    if (/(?:query|sql|stmt|command)\s*=\s*[fF]["'][\s\S]*?["']/i.test(trimmed) && sqlKeywordRegex.test(trimmed)) {
      summary.patterns.push('sql_injection:fstring_query')
    }

    // Variable assignment with % formatting containing SQL keyword
    if (/(?:query|sql|stmt|command)\s*=\s*["'][\s\S]*?["']\s*%/i.test(trimmed) && sqlKeywordRegex.test(trimmed)) {
      summary.patterns.push('sql_injection:raw_formatting')
    }

    // Variable assignment with string concatenation containing SQL keyword
    if (/(?:query|sql|stmt|command)\s*=\s*["'][\s\S]*?["']\s*\+/i.test(trimmed) && sqlKeywordRegex.test(trimmed)) {
      summary.patterns.push('sql_injection:string_concat')
    }
  }

  // 5. Exposed Input & Environment Variables
  for (const line of lines) {
    if (/\b(?:raw_)?input\s*\(/i.test(line)) {
      summary.patterns.push('untrusted_input:input')
      summary.patterns.push('dangerous_call:input')
    }
    if (/\bos\.environ\b/i.test(line) || /\bos\.getenv\s*\(/i.test(line)) {
      summary.patterns.push('env_exposure:os.environ')
      summary.patterns.push('dangerous_pattern:os_environ_exposed')
    }
    if (/\bsys\.stdin\.(?:read|readline|readlines)\s*\(/i.test(line)) {
      summary.patterns.push('untrusted_input:stdin')
    }
  }

  // 6. Additional Security & Configuration Checks
  // Debug mode enabled (Flask, Django, FastAPI)
  if (/\b(?:debug|DEBUG)\s*=\s*True\b/i.test(code) || /app\.run\s*\([\s\S]*?debug\s*=\s*True/i.test(code)) {
    summary.patterns.push('config:debug_mode_enabled')
  }

  // Insecure SSL verification disabled
  if (/\bverify\s*=\s*False\b/i.test(code) || /\bverify_ssl\s*=\s*False\b/i.test(code)) {
    summary.patterns.push('security:ssl_verify_disabled')
  }

  // Weak Cryptographic Hashes (MD5, SHA1)
  if (/\bhashlib\.md5\s*\(/i.test(code)) {
    summary.patterns.push('crypto:weak_hash_md5')
  }
  if (/\bhashlib\.sha1\s*\(/i.test(code)) {
    summary.patterns.push('crypto:weak_hash_sha1')
  }

  // Insecure Temporary File Creation
  if (/\btempfile\.mktemp\s*\(/i.test(code)) {
    summary.patterns.push('dangerous_call:tempfile.mktemp')
  }

  // Assert used in security validation
  if (/^\s*assert\s+.*(?:token|auth|admin|permission|user|role|password)/im.test(code)) {
    summary.patterns.push('security:assert_used_for_validation')
  }
}

/**
 * Main parser function to analyze Python source code and extract an ASTSummary.
 *
 * @param code The Python source code string.
 * @param filePath The relative or absolute path of the file.
 * @returns ASTSummary containing imports, declared functions, class names, and flagged patterns.
 */
export function parsePythonCode(code: string, filePath: string = ''): ASTSummary {
  const summary: ASTSummary = {
    imports: [],
    functions: [],
    classNames: [],
    patterns: []
  }

  try {
    if (!code || typeof code !== 'string') {
      return summary
    }

    const normalized = code.replace(/\r\n/g, '\n')
    const { cleanedCode, executableLines } = cleanPythonCode(normalized)

    extractImports(cleanedCode, executableLines, summary)
    extractFunctionsAndClasses(executableLines, summary)
    extractSecurityPatterns(cleanedCode, executableLines, summary)

  } catch (err: any) {
    summary.patterns.push(`parse_warning:${err?.message?.slice(0, 50) || 'python_parse_error'}`)
  }

  // Deduplicate entries
  summary.imports = Array.from(new Set(summary.imports)).filter(Boolean)
  summary.functions = Array.from(new Set(summary.functions)).filter(Boolean)
  summary.classNames = Array.from(new Set(summary.classNames)).filter(Boolean)
  summary.patterns = Array.from(new Set(summary.patterns)).filter(Boolean)

  return summary
}
