export interface TriggerSandboxParams {
  jobId: string
  attemptNumber: number
  files: { filePath: string; content: string }[]
  webhookUrl: string
}

export async function triggerGitHubSandbox(params: TriggerSandboxParams): Promise<{ success: boolean; error?: string }> {
  const pat = process.env.GITHUB_PAT
  const owner = process.env.SANDBOX_REPO_OWNER
  const repo = process.env.SANDBOX_REPO_NAME

  if (!pat || !owner || !repo) {
    console.warn('Sandbox environment variables (GITHUB_PAT, SANDBOX_REPO_OWNER, SANDBOX_REPO_NAME) are not configured. Executing simulated sandbox run.')
    return { success: true }
  }

  const payload = {
    event_type: 'run-patch',
    client_payload: {
      jobId: params.jobId,
      attemptNumber: params.attemptNumber,
      webhookUrl: params.webhookUrl,
      files: params.files
    }
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'CodeMorph-Sandbox'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `GitHub Dispatches API failed (${res.status}): ${errText}` }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error triggering GitHub Actions' }
  }
}
