import type { PromptSpec } from '../types/models'

export async function toMarkdown(spec: PromptSpec, getFileText: (p: string)=>Promise<string|undefined>) {
  const lines: string[] = []
  for (const entry of spec.files) {
    const text = (await getFileText(entry.path)) || ''
    lines.push(`## File: ${entry.path}`)
    lines.push('')
    lines.push('```')
    lines.push(text)
    lines.push('```')
    lines.push('')
  }
  return lines.join('\n')
}
