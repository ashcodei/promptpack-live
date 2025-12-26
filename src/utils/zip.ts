import { unzipSync, strFromU8 } from 'fflate'
import type { VFile } from '../types/models'

function isBinaryPath(path: string) {
  return /\.(png|jpe?g|gif|bmp|ico|pdf|zip|exe|dll|so|dylib|mp3|mp4|mov|woff2?|ttf)$/i.test(path)
}

function inferLang(path: string): VFile['lang'] {
  if (path.endsWith('.ts')) return 'ts'
  if (path.endsWith('.tsx')) return 'tsx'
  if (path.endsWith('.js')) return 'js'
  if (path.endsWith('.jsx')) return 'jsx'
  if (path.endsWith('.py')) return 'py'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.md')) return 'md'
  if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'yml'
  if (path.endsWith('.sh')) return 'sh'
  if (path.endsWith('Dockerfile')) return 'docker'
  return 'other'
}

export async function readZip(file: File | Blob): Promise<VFile[]> {
  const buf = new Uint8Array(await file.arrayBuffer())
  const unzipped = unzipSync(buf, { filter: (f) => !f.name.endsWith('/') })
  const out: VFile[] = []
  for (const [name, data] of Object.entries(unzipped)) {
    const path = name.replace(/^\/*[^/]*\//,'') || name
    if (!path || path.endsWith('/')) continue
    const binary = isBinaryPath(path)
    const content = binary ? undefined : strFromU8(data as Uint8Array)
    out.push({
      id: `${path}:${(data as Uint8Array).length}`,
      path,
      size: (data as Uint8Array).length,
      lang: inferLang(path),
      binary,
      text: content,
    })
  }
  return out
}
