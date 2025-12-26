// api/github/branches.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

function json(res: VercelResponse, status: number, body: any) {
  res.status(status).setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const owner = String(req.query.owner || '').trim()
    const repo = String(req.query.repo || '').trim()

    if (!owner || !repo) return json(res, 400, { error: 'owner and repo are required' })

    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_FINE_GRAINED_TOKEN

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    if (token) headers.Authorization = `Bearer ${token}`

    // 1) Get repo info so we can default-select the real default branch
    const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
    const repoJson: any = await repoResp.json().catch(() => ({}))

    if (!repoResp.ok) {
      // Pass through the real GitHub error instead of 500
      return json(res, repoResp.status, {
        error: repoJson?.message || 'Failed to fetch repo',
      })
    }

    const defaultBranch = repoJson?.default_branch ?? 'main'

    // 2) List branches
    const brResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
      { headers }
    )
    const brJson: any = await brResp.json().catch(() => ({}))

    if (!brResp.ok) {
      return json(res, brResp.status, {
        error: brJson?.message || 'Failed to fetch branches',
        defaultBranch,
      })
    }

    const branches = Array.isArray(brJson) ? brJson.map((b) => b?.name).filter(Boolean) : []
    return json(res, 200, { owner, repo, defaultBranch, branches })
  } catch (err: any) {
    return json(res, 500, { error: 'Internal Server Error', detail: String(err?.message || err) })
  }
}
