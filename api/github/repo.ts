import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const owner = Array.isArray(req.query.owner) ? req.query.owner[0] : req.query.owner
    const repo = Array.isArray(req.query.repo) ? req.query.repo[0] : req.query.repo

    if (!owner || !repo) return res.status(400).json({ error: 'owner and repo required' })

    const token = process.env.GITHUB_TOKEN
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    if (!r.ok) {
      const text = await r.text()
      return res.status(r.status).json({ error: text })
    }

    let data
    try {
      data = await r.json()
    } catch {
      return res.status(500).json({ error: 'Failed to parse GitHub response' })
    }

    res.status(200).json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'unknown server error' })
  }
}
