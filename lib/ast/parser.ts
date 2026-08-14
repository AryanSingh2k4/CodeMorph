import * as babelParser from '@babel/parser'
import _traverse from '@babel/traverse'
import { ASTSummary } from '@/types'

// Handle default or direct export of babel traverse across bundlers
const traverse = typeof _traverse === 'function' ? _traverse : (_traverse as any).default || _traverse

export function parseFileAST(content: string, filePath: string): ASTSummary {
  const summary: ASTSummary = {
    imports: [],
    functions: [],
    classNames: [],
    patterns: []
  }

  try {
    const isTS = filePath.endsWith('.ts') || filePath.endsWith('.tsx')
    const isJSX = filePath.endsWith('.jsx') || filePath.endsWith('.tsx')

    const plugins: babelParser.ParserPlugin[] = [
      'decorators-legacy',
      'classProperties',
      'asyncGenerators',
      'dynamicImport',
      'objectRestSpread',
      'exportDefaultFrom',
      'exportNamespaceFrom'
    ]

    if (isTS) plugins.push('typescript')
    if (isJSX) plugins.push('jsx')

    const ast = babelParser.parse(content, {
      sourceType: 'module',
      plugins,
      errorRecovery: true
    })

    traverse(ast, {
      ImportDeclaration(path: any) {
        const { node } = path
        if (node?.source?.value) {
          summary.imports.push(node.source.value)
        }
      },
      CallExpression(path: any) {
        const { node } = path
        // require calls (CommonJS)
        if (
          node?.callee?.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments?.length > 0 &&
          node.arguments[0]?.type === 'StringLiteral'
        ) {
          summary.imports.push(node.arguments[0].value)
          summary.patterns.push('commonjs:require')
        }

        // Dangerous execution calls
        if (node?.callee?.type === 'Identifier') {
          const name = node.callee.name
          if (['eval', 'exec', 'execSync', 'spawn', 'spawnSync', 'Function'].includes(name)) {
            summary.patterns.push(`dangerous_call:${name}`)
          }
        } else if (node?.callee?.type === 'MemberExpression' && node.callee.property?.type === 'Identifier') {
          const propName = node.callee.property.name
          if (['exec', 'execSync', 'spawn', 'spawnSync', 'query', 'raw'].includes(propName)) {
            summary.patterns.push(`suspicious_method:${propName}`)
          }
        }
      },
      FunctionDeclaration(path: any) {
        const { node } = path
        if (node?.id?.name) {
          summary.functions.push(node.id.name)
        }
      },
      ArrowFunctionExpression(path: any) {
        const { node, parent } = path
        // Capture named arrow functions: const foo = () => {}
        if (parent?.type === 'VariableDeclarator' && parent?.id?.type === 'Identifier') {
          summary.functions.push(parent.id.name)
        }
      },
      FunctionExpression(path: any) {
        const { node, parent } = path
        if (node?.id?.name) {
          summary.functions.push(node.id.name)
        } else if (parent?.type === 'VariableDeclarator' && parent?.id?.type === 'Identifier') {
          summary.functions.push(parent.id.name)
        }
      },
      ClassDeclaration(path: any) {
        const { node } = path
        if (node?.id?.name) {
          summary.classNames.push(node.id.name)
        }
        if (node?.superClass) {
          summary.patterns.push('legacy:class_component_or_oop')
        }
      },
      JSXAttribute(path: any) {
        const { node } = path
        if (node?.name?.name === 'dangerouslySetInnerHTML') {
          summary.patterns.push('react:dangerouslySetInnerHTML')
        }
      },
      AssignmentExpression(path: any) {
        const { node } = path
        if (
          node?.left?.type === 'MemberExpression' &&
          node?.left?.property?.type === 'Identifier' &&
          node?.left?.property?.name === 'innerHTML'
        ) {
          summary.patterns.push('dom:direct_innerHTML_assignment')
        }
      }
    })
  } catch (err: any) {
    summary.patterns.push(`parse_warning:${err?.message?.slice(0, 50) || 'syntax_error'}`)
  }

  // Deduplicate entries
  summary.imports = Array.from(new Set(summary.imports))
  summary.functions = Array.from(new Set(summary.functions))
  summary.classNames = Array.from(new Set(summary.classNames))
  summary.patterns = Array.from(new Set(summary.patterns))

  return summary
}
