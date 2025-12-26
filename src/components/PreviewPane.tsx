import React from 'react'
import { useStore } from '../store/useStore'
import { compactText } from '../utils/transform'

function highlightBasic(code: string) {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Apply a transform ONLY to text outside HTML tags we injected
  const mapOutsideTags = (html: string, fn: (text: string) => string) => {
    // Split into ["text", "<tag...>", "text", "<tag...>", ...]
    return html
      .split(/(<[^>]+>)/g)
      .map(part => (part.startsWith('<') ? part : fn(part)))
      .join('')
  }

  let out = escape(code)

  // comments
  out = out.replace(
    /(^|\n)(\s*)(\/\/.*)$/g,
    (_m, a, ws, c) => `${a}${ws}<span class="com">${c}</span>`
  )
  out = out.replace(
    /(^|\n)(\s*)(#.*)$/g,
    (_m, a, ws, c) => `${a}${ws}<span class="com">${c}</span>`
  )

  // strings
  out = out.replace(
    /(['"`])((?:\\.|(?!\1).)*)\1/g,
    `<span class="str">$&</span>`
  )

  // keywords + function calls — IMPORTANT: run only outside tags
  out = mapOutsideTags(out, (txt) => {
    let t = txt

    t = t.replace(
      /\b(import|from|export|const|let|var|function|return|async|await|if|else|try|catch|throw|class|new)\b/g,
      `<span class="kwd">$1</span>`
    )

    t = t.replace(
      /\b([A-Za-z_][A-Za-z0-9_]*)\s*(?=\()/g,
      `<span class="fn">$1</span>`
    )

    return t
  })

  return out
}


type PreviewTarget = 'file' | 'bundle'
type BundleMode = 'markdown' | 'raw'

export default function PreviewPane() {
  const { files, activePath } = useStore()
  const { markdown, rawText } = useStore()

  const [target, setTarget] = React.useState<PreviewTarget>('file')
  const [bundleMode, setBundleMode] = React.useState<BundleMode>('markdown')
  const [fileMode, setFileMode] = React.useState<'code'|'raw'>('code')
  const [copied, setCopied] = React.useState(false)
  const copiedTimer = React.useRef<number | null>(null)
  const { isStale, buildProject, isBuilding } = useStore()
  const file = activePath ? files.find(f => f.path === activePath) : null
  const code = file?.text || ''
  // If user just built, auto switch to bundle so they can SEE the result
  React.useEffect(() => {
    if ((markdown || rawText) && target === 'file') setTarget('bundle')
  }, [markdown, rawText])

  const prevStaleRef = React.useRef<boolean>(true)

  React.useEffect(() => {
    const wasStale = prevStaleRef.current
    const nowStale = isStale
    prevStaleRef.current = nowStale
    if (wasStale && !nowStale) {
      setTarget('bundle')
    }
  }, [isStale])
 
  const shownText =
    target === 'bundle'
      ? (bundleMode === 'markdown' ? (markdown || '') : (rawText || ''))
      : (fileMode === 'raw' ? compactText(code) : code)

  async function copy() {
    if (!shownText.trim()) { alert('Nothing to copy'); return }
    try {
      await navigator.clipboard.writeText(shownText)
      setCopied(true)
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch { alert('Copy failed') }
  }

  function download() {
    if (!shownText.trim()) { alert('Nothing to download'); return }
    const name =
      target === 'bundle'
        ? (bundleMode === 'markdown' ? 'promptpack.md' : 'promptpack.raw.txt')
        : ((activePath || 'file').replace(/\//g, '_') + (fileMode === 'raw' ? '.raw.txt' : '.txt'))

    const blob = new Blob([shownText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="preview-pane">
      <div className="preview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="file-path">
            {target === 'bundle'
              ? (bundleMode === 'markdown' ? 'BUNDLE: markdown' : 'BUNDLE: raw')
              : (activePath || '—')}
          </span>

          <div className="view-toggle">
            <div className={target === 'file' ? 'toggle-opt active' : 'toggle-opt'} onClick={() => setTarget('file')}>File</div>
            <div className={target === 'bundle' ? 'toggle-opt active' : 'toggle-opt'} onClick={() => setTarget('bundle')}>Bundle</div>
          </div>

          {target === 'bundle' ? (
            <div className="view-toggle">
              <div className={bundleMode === 'markdown' ? 'toggle-opt active' : 'toggle-opt'} onClick={() => setBundleMode('markdown')}>Markdown</div>
              <div className={bundleMode === 'raw' ? 'toggle-opt active' : 'toggle-opt'} onClick={() => setBundleMode('raw')}>Raw</div>
            </div>
          ) : (
            <div className="view-toggle">
              <div className={fileMode === 'code' ? 'toggle-opt active' : 'toggle-opt'} onClick={() => setFileMode('code')}>Code</div>
              <div className={fileMode === 'raw' ? 'toggle-opt active' : 'toggle-opt'} onClick={() => setFileMode('raw')}>Raw</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isBuilding ? (
            <button className="btn btn-primary btn-icon" title="Updating" disabled>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Updating</span>
              <svg className="icon-sm" viewBox="0 0 24 24">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          ) : isStale ? (
            <button className="btn btn-primary btn-icon" title="Update" onClick={buildProject}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Update</span>
              <svg className="icon-sm" viewBox="0 0 24 24">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          ) : (
            <button className="btn btn-ghost btn-icon" title="Updated">
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Updated</span>
              <svg className="icon-sm" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
          <button className="btn btn-ghost btn-icon" title="Copy" onClick={copy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {copied ? (
              <>
                <svg className="icon-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Copied</span>
              </>
            ) : (
              <>
                <svg className="icon-sm" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Copy</span>
              </>
            )}
          </button>
          <button className="btn btn-ghost btn-icon" title="Download" onClick={download}>
            <svg className="icon-sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      </div>

      <div className="code-area">
        {target === 'bundle' ? (
          <pre>{shownText || 'Click BUILD PROJECT to generate the bundle.'}</pre>
        ) : !file ? (
          <pre>Select a file from the tree to preview.</pre>
        ) : fileMode === 'raw' ? (
          <pre>{shownText}</pre>
        ) : (
          <pre dangerouslySetInnerHTML={{ __html: highlightBasic(shownText) }} />
        )}
      </div>
    </div>
  )
}
