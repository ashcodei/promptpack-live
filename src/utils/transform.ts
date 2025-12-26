import type { Lang } from '../types/models'

export function stripComments(lang: Lang, code: string): string {
  if (!code) return ''
  if (lang === 'js' || lang === 'ts' || lang === 'tsx' || lang === 'jsx') {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|\s)\/\/.*$/gm, '$1')
  }
  if (lang === 'py') {
    return code.replace(/(^|\s)#.*$/gm, '$1')
  }
  return code
}

export function estimateTokens(text: string): number {
  if (!text) return 0
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.ceil(words * 1.3)
}

export function compactText(text: string): string {
  if (!text) return ''
  let out = text.replace(/[ \t]+$/gm,'')
  out = out.replace(/\n{3,}/g, '\n\n')
  return out.trim()
}
