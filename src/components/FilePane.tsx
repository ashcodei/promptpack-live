import React from 'react'
import { useStore, UIFileNode } from '../store/useStore'
import { collectDescendantFiles, filterFiles } from '../utils/tree'

function Node({ node }: { node: UIFileNode }) {
  const { selected, setSelected, activePath, setActivePath, setIsStale, autoBuildEnabled, buildProject } = useStore()
  const hasChildren = !!(node.children && node.children.length > 0)
  const [isExpanded, setIsExpanded] = React.useState(node.expanded ?? true)
  
  const isFile = !!node.file
  const isActive = isFile && activePath === node.file!.path
  const checked = isFile
    ? selected.has(node.file!.path)
    : (hasChildren ? collectDescendantFiles(node).every(p => selected.has(p)) : false)
  const { selectionMemory, setSelectionMemory } = useStore()
  function onCheck(e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation()

    const on = e.target.checked
    const nextSelected = new Set(selected)
    const nextMem = { ...selectionMemory }

    const mark = (p: string) => {
      if (on) nextSelected.add(p)
      else nextSelected.delete(p)
      nextMem[p] = on // ✅ remember user intent
    }

    if (node.file && !node.file.binary) {
      mark(node.file.path)
    } else if (hasChildren) {
      const paths = collectDescendantFiles(node)
      for (const p of paths) mark(p)
    }

    setSelectionMemory(nextMem)
    setSelected(nextSelected)

    setIsStale(true)
    if (autoBuildEnabled) buildProject()
  }


  function activateFirstFileInFolder() {
    const files = collectDescendantFiles(node)
    if (files.length > 0) setActivePath(files[0])
  }

  function toggleFolder() {
    const nextExpanded = !isExpanded
    setIsExpanded(nextExpanded)
    if (nextExpanded) activateFirstFileInFolder()
  }

  function onRowClick() {
    if (isFile) {
      setActivePath(node.file!.path)
      return
    }
    if (!hasChildren) return
    toggleFolder()
  }

  const FolderIconOpen = (
    <svg className="icon-sm folder-icon" viewBox="0 0 24 24">
      <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"></path>
    </svg>
  )

  const FolderIconClosed = (
    <svg className="icon-sm folder-icon" viewBox="0 0 24 24">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path>
    </svg>
  )

  return (
    <li>
      <div
        className={isActive ? 'tree-item active' : 'tree-item'}
        onClick={onRowClick}
        data-expanded={isExpanded ? 'true' : 'false'}
      >
        {hasChildren ? (
          <span className="folder-toggle" onClick={(e) => { e.stopPropagation(); toggleFolder() }}>
            <svg className="icon-sm chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
        ) : (
          <span style={{ width: 14 }} />
        )}

        <input
          type="checkbox"
          checked={checked}
          onChange={onCheck}
          onClick={(e) => e.stopPropagation()}
        />

        {hasChildren ? (isExpanded ? FolderIconOpen : FolderIconClosed) : (
          <svg className="icon-sm" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        )}

        <span>{node.name}</span>
      </div>

      {hasChildren && (
        <ul className={isExpanded ? 'tree-ul' : 'tree-ul collapsed'}>
          {node.children!.map(child => <Node key={child.path} node={child} />)}
        </ul>
      )}
    </li>
  )
}

export default function FilePane() {
  const { tree, files, include, exclude, setSelected, setActivePath, sourceType, sourceLabel, autoBuildEnabled, buildProject, setSelectionMemory, selectionMemory } = useStore()
  const setIsStale = useStore(s => s.setIsStale)
  const setMarkdown = useStore(s => s.setMarkdown)
  const setRawText = useStore(s => s.setRawText)
  const setSpec = useStore(s => s.setSpec)
  function selectAll() {
    const filtered = filterFiles(files, include, exclude).filter(f => !f.binary).map(f => f.path)
    setSelected(new Set(filtered))
    setActivePath(filtered[0] ?? null)
    const nextMem = { ...selectionMemory }
    for (const p of filtered) nextMem[p] = true
    setSelectionMemory(nextMem)
    setSpec(null)
    setMarkdown(null)
    setRawText(null)
    setIsStale(true)
    if (autoBuildEnabled) buildProject()
  }
  function selectNone() {
    const filtered = filterFiles(files, include, exclude)
      .filter(f => !f.binary)
      .map(f => f.path)

    setSelected(new Set())
    setActivePath(null)
    const nextMem = { ...selectionMemory }
    for (const p of filtered) nextMem[p] = false
    setSelectionMemory(nextMem)

    setSpec(null)
    setMarkdown(null)
    setRawText(null)
    setIsStale(true)

    if (autoBuildEnabled) buildProject()
  }
  return (
    <div className="file-pane">
      <div className="pane-toolbar">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <h3>Project Files</h3>
            {sourceType && sourceLabel ? (
              <span className="source-pill" title={`${sourceType}: ${sourceLabel}`}>{sourceType}: {sourceLabel}</span>
            ) : null}
          </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-icon" title="Select All" onClick={selectAll}>
            <svg className="icon-sm" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </button>
          <button className="btn btn-ghost btn-icon" title="Select None" onClick={selectNone}>
            <svg className="icon-sm" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
          </button>
        </div>
      </div>

      <div className="tree-container">
        {!tree ? (
          <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Load a ZIP or GitHub repo.</div>
        ) : (
          <ul className="root-list">
            {tree.children?.map(child => <Node key={child.path} node={child} />)}
          </ul>
        )}
      </div>
    </div>
  )
}
