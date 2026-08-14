import { parseFileAST } from '@/lib/ast/parser'
import { ASTSummary } from '@/types'

export interface IngestedFile {
  path: string
  content: string
  ast_summary: ASTSummary
}

const ALLOWED_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs']
const MAX_FILES = 30
const MAX_FILE_SIZE = 60000 // 60KB limit per file for LLM context management

export async function ingestRepo(
  owner: string,
  repo: string,
  accessToken?: string
): Promise<IngestedFile[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'CodeMorph-Agent'
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  try {
    // 1. Get repository metadata & default branch
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
    if (!repoRes.ok) {
      throw new Error(`GitHub API error (${repoRes.status}): ${await repoRes.text()}`)
    }
    const repoData = await repoRes.json()
    const defaultBranch = repoData.default_branch || 'main'

    // 2. Fetch recursive git tree
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    )
    if (!treeRes.ok) {
      throw new Error(`GitHub Tree API error (${treeRes.status}): ${await treeRes.text()}`)
    }
    const treeData = await treeRes.json()

    // 3. Filter to eligible source files
    const treeItems = treeData.tree || []
    const sourceFiles = treeItems
      .filter((f: any) =>
        f.type === 'blob' &&
        ALLOWED_EXTENSIONS.some(ext => f.path.endsWith(ext)) &&
        !f.path.includes('node_modules') &&
        !f.path.includes('.next') &&
        !f.path.includes('dist') &&
        !f.path.includes('build') &&
        !f.path.includes('.git') &&
        !f.path.endsWith('.d.ts') &&
        (f.size || 0) <= MAX_FILE_SIZE
      )
      .slice(0, MAX_FILES)

    if (sourceFiles.length === 0) {
      throw new Error('No supported JavaScript/TypeScript source files found in repository.')
    }

    // 4. Fetch content in concurrent batches of 5
    const results: IngestedFile[] = []
    const BATCH_SIZE = 5

    for (let i = 0; i < sourceFiles.length; i += BATCH_SIZE) {
      const batch = sourceFiles.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (file: any) => {
          try {
            const contentRes = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${defaultBranch}`,
              { headers }
            )
            if (!contentRes.ok) return null
            const contentData = await contentRes.json()

            let decodedContent = ''
            if (contentData.encoding === 'base64' && contentData.content) {
              decodedContent = Buffer.from(contentData.content, 'base64').toString('utf-8')
            } else if (contentData.download_url) {
              const rawRes = await fetch(contentData.download_url)
              decodedContent = await rawRes.text()
            }

            if (!decodedContent) return null

            const ast_summary = parseFileAST(decodedContent, file.path)
            return {
              path: file.path,
              content: decodedContent,
              ast_summary
            }
          } catch (err) {
            console.warn(`Failed to fetch file ${file.path}:`, err)
            return null
          }
        })
      )

      for (const item of batchResults) {
        if (item) results.push(item)
      }
    }

    return results
  } catch (error: any) {
    console.error('Error during repository ingestion:', error)
    throw error
  }
}
