export type Lang =
  | 'ts' | 'tsx' | 'js' | 'jsx' | 'py' | 'json'
  | 'md' | 'yml' | 'sh' | 'docker' | 'other'

export interface VFile {
  id: string
  path: string
  size: number
  lang: Lang
  binary: boolean
  text?: string
}

export interface PromptFileEntry {
  path: string
  mode: 'stripped'
  tokenEstimate: number
}

export interface PromptSpec {
  version: 1
  modelPreset: string
  targetTokenBudget: number
  layout: 'single'
  files: PromptFileEntry[]
  metadata: { totalTokensEstimate: number; warnings: string[] }
}
