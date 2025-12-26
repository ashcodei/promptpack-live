import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { owner, repo } = req.query;
    if (!owner || !repo) return res.status(400).json({ error: "owner and repo required" });

    const token = process.env.GITHUB_TOKEN;
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    const data = await r.json();
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "unknown error" });
  }
}
