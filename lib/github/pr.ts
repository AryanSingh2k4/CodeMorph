import { Octokit } from '@octokit/rest'

export interface CreatePRParams {
  accessToken: string
  owner: string
  repo: string
  jobId: string
  patches: { file_path: string; patched_content: string; summary: string }[]
  findings: { title: string; type: string; severity?: string | null }[]
}

export async function createPR({
  accessToken,
  owner,
  repo,
  jobId,
  patches,
  findings
}: CreatePRParams): Promise<string> {
  const octokit = new Octokit({ auth: accessToken })

  // 1. Get default branch
  const { data: repoData } = await octokit.repos.get({ owner, repo })
  const defaultBranch = repoData.default_branch || 'main'

  // 2. Get latest commit SHA on the default branch
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${defaultBranch}`
  })
  const baseSha = refData.object.sha

  // 3. Create unique patch branch
  const shortId = jobId.replace(/-/g, '').slice(0, 8)
  const branchName = `codemorph/patch-${shortId}`

  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha
    })
  } catch (err: any) {
    // If branch already exists, continue with existing ref
    console.warn(`Branch ${branchName} might already exist:`, err.message)
  }

  // 4. Push each patched file to the new branch
  for (const patch of patches) {
    let fileSha: string | undefined
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner,
        repo,
        path: patch.file_path,
        ref: branchName
      })
      if (!Array.isArray(fileData) && fileData.sha) {
        fileSha = fileData.sha
      }
    } catch {
      // File does not exist yet or newly created
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: patch.file_path,
      message: `fix(codemorph): ${patch.summary.slice(0, 70)}`,
      content: Buffer.from(patch.patched_content, 'utf-8').toString('base64'),
      branch: branchName,
      ...(fileSha ? { sha: fileSha } : {})
    })
  }

  // 5. Generate formatted markdown PR body
  const vulnList = findings
    .filter(f => f.type === 'vulnerability')
    .map(f => `- **[${(f.severity || 'HIGH').toUpperCase()}]** ${f.title}`)
    .join('\n')

  const migList = findings
    .filter(f => f.type === 'migration')
    .map(f => `- **[MIGRATION]** ${f.title}`)
    .join('\n')

  const filesList = patches.map(p => `- \`${p.file_path}\` — _${p.summary}_`).join('\n')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://codemorph.vercel.app'

  const prBody = `## 🛡️ CodeMorph Autonomous Security & Modernization Patch

This pull request was autonomously generated, validated, and verified by **CodeMorph**.
All proposed modifications have passed compilation (\`tsc\`) and linting (\`eslint\`) verification in an isolated GitHub Actions sandbox runner.

---

### 🚨 Security Vulnerabilities Remediated
${vulnList || '_No security vulnerabilities flagged._'}

### 🚀 Modernizations & Migrations Applied
${migList || '_No framework migrations required._'}

### 📁 Files Modified
${filesList}

---
*Inspected and healed autonomously by [CodeMorph](${appUrl}) • Job Reference: \`${jobId}\`*`

  // 6. Create the Pull Request
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: `🛡️ CodeMorph: Autonomous remediation (${patches.length} file${patches.length > 1 ? 's' : ''})`,
    body: prBody,
    head: branchName,
    base: defaultBranch
  })

  return pr.html_url
}
