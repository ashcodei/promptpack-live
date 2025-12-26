import type { VFile } from '../types/models'
import type { UIFileNode } from '../store/useStore'
import globToRegExp from 'glob-to-regexp'

export function isMatch(path: string, patterns: string[]) {
  if (!patterns || patterns.length === 0) return true
  let matched = false
  for (const pat of patterns) {
    const neg = pat.startsWith('!')
    const glob = neg ? pat.slice(1) : pat
    const re = globToRegExp(glob, { extended: true, globstar: true })
    const ok = re.test(path)
    if (!neg && ok) matched = true
    if (neg && ok) return false
  }
  return matched
}

export function filterFiles(files: VFile[], include: string[], exclude: string[]): VFile[] {
  return files.filter(f => {
    const inc = isMatch(f.path, include.length ? include : ['**/*'])
    const exc = isMatch(f.path, exclude.length ? exclude : [])
    return inc && !exc
  })
}

export function buildTree(files: VFile[], include: string[], exclude: string[]): UIFileNode {
  const filtered = filterFiles(files, include, exclude)
  const root: UIFileNode = { path: '', name: '', children: [], expanded: true }
  for (const f of filtered) {
    const parts = f.path.split('/')
    let cur = root
    let curPath = ''
    for (let i=0;i<parts.length;i++) {
      const name = parts[i]
      curPath = curPath ? `${curPath}/${name}` : name
      let child = cur.children!.find(c => c.name === name)
      if (!child) {
        child = { path: curPath, name, children: [], expanded: i < 2 }
        cur.children!.push(child)
        cur.children!.sort((a,b) => {
          const ad = a.children && a.children.length>0
          const bd = b.children && b.children.length>0
          if (ad != bd) return ad ? -1 : 1
          return a.name.localeCompare(b.name)
        })
      }
      cur = child
    }
    cur.file = f
  }
  return root
}

export function collectDescendantFiles(node: UIFileNode): string[] {
  const out: string[] = []
  const walk = (n: UIFileNode) => {
    if (n.file && !n.file.binary) out.push(n.file.path)
    if (n.children) n.children.forEach(walk)
  }
  if (node.children) node.children.forEach(walk)
  return out
}
