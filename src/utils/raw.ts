import type { PromptSpec } from '../types/models'
import { compactText } from './transform'

export async function toRaw(spec: PromptSpec, getFileText: (p: string)=>Promise<string|undefined>) {
  const parts: string[] = []
  for (const entry of spec.files) {
    const text = (await getFileText(entry.path)) || ''
    if (!text.trim()) continue
    parts.push(`FILE:${entry.path}\n${text.trim()}`)
  }
  return compactText(parts.join('\n\n'))
}
