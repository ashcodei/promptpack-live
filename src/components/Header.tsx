import React from 'react'
import { readZip } from '../utils/zip'
import { readFolder } from '../utils/folder'
import { buildTree, filterFiles } from '../utils/tree'
import { useStore } from '../store/useStore'

type Branch = { name: string }

function parseRepo(input: string): { owner: string; repo: string } | null {
  const s = input.trim()
  if (!s) return null
  let m = s.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/|$)/)
  if (m) return { owner: m[1], repo: m[2] }
  m = s.match(/^([^/]+)\/([^/]+)$/)
  if (m) return { owner: m[1], repo: m[2] }
  return null
}

export default function Header() {
  const { include, exclude, setFiles, setTree, setSelected, setActivePath, resetWorkspace, setSource, setIsStale } = useStore()
  const fileRef = React.useRef<HTMLInputElement | null>(null)

  const [repoInput, setRepoInput] = React.useState('')
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [branch, setBranch] = React.useState('main')
  const [loadingBranches, setLoadingBranches] = React.useState(false)
  const repoNameParsed = parseRepo(repoInput)
  const canFetch = !!repoNameParsed && branches.length > 0 && !loadingBranches
  
  async function loadIntoApp(all: any[], sourceType: 'GIT'|'ZIP'|'FOLDER', sourceLabel: string) {
    resetWorkspace()
    setSource(sourceType, sourceLabel)
    setFiles(all as any)
    setTree(buildTree(all as any, include, exclude))
    const filtered = filterFiles(all as any, include, exclude).filter(x => !x.binary).map(x => x.path)
    setSelected(new Set(filtered))
    setActivePath(filtered[0] ?? null)
    setIsStale(true)
  }

function triggerZip() { fileRef.current?.click() }

  async function onZipChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const all = await readZip(f)
    await loadIntoApp(all, 'ZIP', f.name)
  }

    async function loadBranches(input: string) {
    const parsed = parseRepo(input)
    if (!parsed) { setBranches([]); return }
    try {
      setLoadingBranches(true)

      let defaultBranch = 'main'
      const repoRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`)
      if (repoRes.ok) {
        const repoData = await repoRes.json() as any
        if (repoData?.default_branch) defaultBranch = String(repoData.default_branch)
      }

      const brRes = await fetch(`/api/github/branches?owner=${parsed.owner}&repo=${parsed.repo}`)
      if (!brRes.ok) throw new Error('branch fetch failed')
      const data = await brRes.json() as any[]
      const list = data.map(b => ({ name: b.name as string }))
      setBranches(list)

      const preferred =
        list.find(b => b.name === defaultBranch)?.name
        ?? list.find(b => b.name === 'main')?.name
        ?? list.find(b => b.name === 'master')?.name
        ?? list[0]?.name
        ?? 'main'
      setBranch(preferred)
    } catch {
      setBranches([])
      setBranch('main')
    } finally {
      setLoadingBranches(false)
    }
  }

  React.useEffect(() => {
    if (!repoInput.trim()) return
    const id = setTimeout(() => loadBranches(repoInput), 600)
    return () => clearTimeout(id)
  }, [repoInput])

  async function fetchGitHub() {
    if (!canFetch) return;
    const parsed = parseRepo(repoInput)
    if (!parsed) { alert('Enter owner/repo or full GitHub URL'); return }
    const ref = branch || 'main'
    const url = `/api/github/archive?owner=${parsed.owner}&repo=${parsed.repo}&ref=${branch}`
    const res = await fetch(url)
    if (!res.ok) { alert('Fetch failed: ' + res.status); return }
    const blob = await res.blob()
    const all = await readZip(blob)
    await loadIntoApp(all, 'GIT', parsed ? parsed.owner+'/'+parsed.repo : 'repo')
  }

  async function openFolder() {
    try {
      const all = await readFolder()
      if (!all) return
      // @ts-ignore
      const name = (all as any)._folderName ?? 'folder'
      await loadIntoApp(all, 'FOLDER', name)
    } catch (e) {
      console.warn(e)
    }
  }

  return (
    <header className="app-header">
      <div className="header-section header-logo">
        <svg width="50" height="39" viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="7" y="11" width="24" height="24" rx="5" stroke="black" strokeWidth="3"/>
<path d="M36.0179 8.40719C37.3446 7.62598 39.0195 8.57389 39.0327 10.1134L39.1738 26.5673C39.187 28.1069 37.5287 29.0834 36.1888 28.325L21.8687 20.2203C20.5289 19.462 20.5123 17.5376 21.839 16.7564L36.0179 8.40719Z" stroke="black" strokeWidth="3"/>
<circle cx="7.5" cy="31.5" r="6.5" stroke="black" strokeWidth="3"/>
</svg>
        {/* <h1>PromptPack</h1> */}
        <div className="brand">
          <span className="brand-mark" aria-label="PromptPack">
            <span className="p p1">P</span>
            <span className="fill fill-rom">ROM</span>
            <span className="p p2">P</span>
            <span className="fill fill-t">T</span>
            <span className="p p3">P</span>
            <span className="fill fill-ack">ACK</span>
          </span>
        </div>
      </div>

      <div className="header-section" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="github-bar">
          <input
            type="text"
            placeholder="github_url"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            style={{ width: 240, fontWeight: 500 }}
          />
          <div className="divider"></div>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            style={{ width: 120, textAlign: 'center', color: 'var(--text-secondary)', border: 'none', background: 'transparent' }}
          >
            {branches.length===0 ? (
              <option value={branch}>{loadingBranches ? 'loading…' : branch}</option>
            ) : null}
            {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
          <button className={`btn btn-primary ${!canFetch ? 'btn-disabled' : ''}`} disabled={!canFetch} style={{ border: 'none', borderRadius: 2, height: 32, margin: 4, marginLeft: 8 }} onClick={fetchGitHub} title={!canFetch ? 'Paste a valid repo and wait for branches to load' : 'Fetch repo'}>
            FETCH
          </button>
        </div>
      </div>

      <div className="header-section">
        <input ref={fileRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={onZipChange} />
        <button className="btn" onClick={triggerZip}>
          <svg className="icon-sm" viewBox="0 0 24 24" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload Zip
        </button>
        <button className="btn" onClick={openFolder}>
          <svg className="icon-sm" viewBox="0 0 24 24" style={{ marginRight: 6 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Open Folder
        </button>
      </div>
    </header>
  )
}