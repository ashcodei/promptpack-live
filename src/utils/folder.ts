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

async function walk(dir: FileSystemDirectoryHandle, prefix: string, out: VFile[]) {
  // @ts-ignore - TS lib.dom types vary between versions
  for await (const [name, handle] of dir.entries()) {
    const path = prefix ? `${prefix}/${name}` : name
    if (handle.kind === 'directory') {
      await walk(handle as FileSystemDirectoryHandle, path, out)
    } else {
      const file = await (handle as FileSystemFileHandle).getFile()
      const binary = isBinaryPath(path)
      const text = binary ? undefined : await file.text()
      out.push({
        id: `${path}:${file.size}:${file.lastModified}`,
        path,
        size: file.size,
        lang: inferLang(path),
        binary,
        text,
      })
    }
  }
}

export async function readFolder(): Promise<VFile[] | null> {
  if (!('showDirectoryPicker' in window)) {
    alert('Your browser does not support folder picking (File System Access API). Use ZIP or GitHub.')
    return null
  }
  // @ts-ignore
  const dir = await window.showDirectoryPicker()
  const out: VFile[] = []
  ;(out as any)._folderName = dir.name
  await walk(dir, '', out)
  return out
}
