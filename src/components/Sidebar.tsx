import React from 'react'
import { useStore } from '../store/useStore'
import { buildTree, filterFiles } from '../utils/tree'
import { estimateTokens, stripComments } from '../utils/transform'
import { toMarkdown } from '../utils/exporter'
import { toRaw } from '../utils/raw'
import globToRegExp from 'glob-to-regexp'

function isValidGlob(pat: string): boolean {
  try {
    globToRegExp(pat, { extended: true, globstar: true })
    return true
  } catch {
    return false
  }
}

export default function Sidebar() {
  const { files, include, exclude, selected, modelPreset, budget,
    setModelPreset, setBudget, setInclude, setExclude, setTree, setSelected,
    setWarnings, setSpec, setMarkdown, setRawText, activePath, setActivePath, setIsStale
  } = useStore()

  const [incInput, setIncInput] = React.useState('')
  const [excInput, setExcInput] = React.useState('')
  
  function addInclude(pat: string) {
    const v = pat.trim()
    if (!v) return
    if (include.includes(v)) return
    setInclude([...include, v])
    setIncInput('')
  }
  function addExclude(pat: string) {
    const v = pat.trim()
    if (!v) return
    if (exclude.includes(v)) return
    setExclude([...exclude, v])
    setExcInput('')
  }
  function removeInclude(pat: string) {
    setInclude(include.filter(p => p !== pat))
  }
  function removeExclude(pat: string) {
    setExclude(exclude.filter(p => p !== pat))
  }
  const prevAllowedRef = React.useRef<string[]>([])
  React.useEffect(() => {
    prevAllowedRef.current = filterFiles(files, include, exclude)
      .filter(f => !f.binary)
      .map(f => f.path)
  }, []) 

  function recomputeAfterFilterChange() {
    setTree(buildTree(files, include, exclude))

    const filteredPaths = filterFiles(files, include, exclude)
      .filter(f => !f.binary)
      .map(f => f.path)

    const { selectionMemory } = useStore.getState()

    const nextSelected = new Set<string>()
    for (const p of filteredPaths) {
      const remembered = selectionMemory[p]
      if (remembered === undefined || remembered === true) nextSelected.add(p)
    }

    setSelected(nextSelected)

    if (activePath && !filteredPaths.includes(activePath)) {
      setActivePath(Array.from(nextSelected)[0] ?? null)
    }

    setSpec(null)
    setMarkdown(null)
    setRawText(null)
    setIsStale(true)
  }

  const autoBuildEnabled = useStore(s => s.autoBuildEnabled)
  const buildProject = useStore(s => s.buildProject)
  
  React.useEffect(() => {
    recomputeAfterFilterChange()

    if (useStore.getState().autoBuildEnabled) {
      // build after state recompute
      useStore.getState().buildProject()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [include, exclude])


  function downloadMarkdown() {
    const md = useStore.getState().markdown
    if (!md) { alert('Build first.'); return }
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'promptpack.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const spec = useStore(s => s.spec)
  const usage = spec?.metadata.totalTokensEstimate ?? 0
  const pct = budget > 0 ? Math.min(100, Math.round((usage / budget) * 100)) : 0

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <section className="config-group">
          <h3>File Filters</h3>

          <div>
            <label>Include Pattern</label>
            <div className="pill-row">
              {include.map(p => {
                const ok = isValidGlob(p)
                return (
                  <span key={p} className={ok ? 'pill' : 'pill pill-bad'} title={ok ? p : 'Invalid glob'}>
                    <span className="pill-text">{p}</span>
                    <button className="pill-x" onClick={() => removeInclude(p)} aria-label="remove">×</button>
                  </span>
                )
              })}
            </div>
            <input
              type="text"
              placeholder="Type a glob and press Enter"
              value={incInput}
              onChange={(e) => setIncInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addInclude(incInput)
                }
              }}
            />
          </div>

          <div>
            <label>Exclude Pattern</label>
            <div className="pill-row">
              {exclude.map(p => {
                const ok = isValidGlob(p)
                return (
                  <span key={p} className={ok ? 'pill' : 'pill pill-bad'} title={ok ? p : 'Invalid glob'}>
                    <span className="pill-text">{p}</span>
                    <button className="pill-x" onClick={() => removeExclude(p)} aria-label="remove">×</button>
                  </span>
                )
              })}
            </div>
            <input
              type="text"
              placeholder="Type a glob and press Enter"
              value={excInput}
              onChange={(e) => setExcInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addExclude(excInput)
                }
              }}
            />
          </div>
        </section>

        <section className="config-group">
          <h3>Configuration</h3>
          <div>
            <label>AI Model Preset</label>
            <select value={modelPreset} onChange={(e) => setModelPreset(e.target.value as any)}>
              <option value="claude-200k">Claude 3 Opus (200k)</option>
              <option value="gpt-128k">GPT-4 Turbo (128k)</option>
              <option value="gemini-1.5">Gemini 1.5 Pro</option>
            </select>
          </div>
          <div>
            <label>Token Budget Limit</label>
            <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value || 0))} />
          </div>
        </section>

      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
          <span>Estimated Tokens</span>
          <span>{usage.toLocaleString()} / {budget.toLocaleString()}</span>
        </div>
        <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--text-primary)' }} />
        </div>

        <button className="btn btn-primary" style={{ width: '100%', height: 50, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 1 }} onClick={buildProject}>
          BUILD PROJECT
        </button>
        <button className="btn" style={{ width: '100%' }} onClick={downloadMarkdown}>
          Download Markdown
        </button>
      </div>
    </aside>
  )
}
