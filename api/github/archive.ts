import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { owner, repo, ref } = req.query;
    if (!owner || !repo) return res.status(400).json({ error: "owner and repo required" });

    const token = process.env.GITHUB_TOKEN;
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/${ref || "main"}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!r.ok) return res.status(r.status).send(await r.text());

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Cache-Control", "no-store");
    const buf = Buffer.from(await r.arrayBuffer());
    res.status(200).send(buf);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "unknown error" });
  }
}
