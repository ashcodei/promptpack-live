import { create } from 'zustand'
import type { VFile, PromptSpec } from '../types/models'
import { toMarkdown } from '../utils/exporter'
import { toRaw } from '../utils/raw'
export type UIFileNode = {
  path: string
  name: string
  children?: UIFileNode[]
  file?: VFile
  expanded?: boolean
}

export type ViewMode = 'code' | 'raw'

interface State {
  files: VFile[]
  tree: UIFileNode | null
  include: string[]
  exclude: string[]
  selected: Set<string>
  activePath: string | null

  modelPreset: string
  budget: number

  spec: PromptSpec | null
  markdown: string | null
  rawText: string | null
  viewMode: ViewMode
  warnings: string[]

  setFiles: (f: VFile[]) => void
  setTree: (t: UIFileNode | null) => void
  setInclude: (g: string[]) => void
  setExclude: (g: string[]) => void
  setSelected: (s: Set<string>) => void
  setActivePath: (p: string | null) => void
  setSource: (t: 'GIT'|'ZIP'|'FOLDER'|null, label: string | null) => void
  setModelPreset: (m: string) => void
  setBudget: (b: number) => void
  setSpec: (s: PromptSpec | null) => void
  setMarkdown: (m: string | null) => void
  setRawText: (r: string | null) => void
  setViewMode: (v: ViewMode) => void
  setWarnings: (w: string[]) => void
  resetWorkspace: () => void
  sourceType: 'GIT' | 'ZIP' | 'FOLDER' | null
  sourceLabel: string | null
  isStale: boolean
  setIsStale: (v: boolean) => void
  buildProject: () => Promise<void>
  autoBuildEnabled: boolean
  setAutoBuildEnabled: (v: boolean) => void
  isBuilding: boolean
  setIsBuilding: (v: boolean) => void
  selectionMemory: Record<string, boolean>
  setSelectionMemory: (m: Record<string, boolean>) => void
}

export const useStore = create<State>((set, get) => ({
  files: [],
  tree: null,
  include: ['**/*'],
  exclude: ['**/node_modules/**','**/.git/**','**/*.png','**/*.jpg','**/*.jpeg','**/*.gif','**/*.zip','**/*.pdf'],
  selected: new Set<string>(),
  activePath: null,
  sourceType: null,
  sourceLabel: null,
  modelPreset: 'Claude 3 Opus (200k)',
  budget: 180000,

  spec: null,
  markdown: null,
  rawText: null,
  viewMode: 'code',
  warnings: [],

  setFiles: (f) => set({ files: f }),
  setTree: (t) => set({ tree: t }),
  setInclude: (g) => set({ include: g }),
  setExclude: (g) => set({ exclude: g }),
  setSelected: (s) => set({ selected: s }),
  setActivePath: (p) => set({ activePath: p }),
  setSource: (t, label) => set({ sourceType: t, sourceLabel: label }),
  setModelPreset: (m) => set({ modelPreset: m }),
  setBudget: (b) => set({ budget: b }),
  setSpec: (s) => set({ spec: s }),
  setMarkdown: (m) => set({ markdown: m }),
  setRawText: (r) => set({ rawText: r }),
  setViewMode: (v) => set({ viewMode: v }),
  setWarnings: (w) => set({ warnings: w }),
  resetWorkspace: () => set({
    spec: null,
    markdown: null,
    rawText: null,
    warnings: [],
    activePath: null,
    sourceType: null,
    sourceLabel: null,
    isStale: true,
    autoBuildEnabled: false,
    isBuilding: false,
    selectionMemory: {},
  }),
  isStale: true,
  setIsStale: (v) => set({ isStale: v }),
  buildProject: async () => {
    set({ isBuilding: true })
    try {
      const {
        files,
        selected,
        modelPreset,
        budget,
        sourceType,
        sourceLabel,
        activePath
      } = get()
      const chosen = files
        .filter(f => !f.binary)
        .filter(f => selected.has(f.path))

      const byPath = new Map<string, string>()
      let total = 0
      const warnings: string[] = []

      for (const f of chosen) {
        const text = (f as any).text ?? (f as any).content ?? ''
        byPath.set(f.path, text)
        const est = Math.ceil(text.length / 4)
        total += est
      }

      if (total > budget) {
        warnings.push(`Estimated tokens (${total}) exceed budget (${budget})`)
      }

      const getText = async (p: string) => byPath.get(p)
      const spec: PromptSpec = {
        version: 1,
        modelPreset,
        targetTokenBudget: budget,
        layout: 'single',
        metadata: {
          totalTokensEstimate: total,
          warnings
        },
        files: chosen.map(f => ({
          path: f.path,
          mode: 'stripped',
          tokenEstimate: Math.ceil((byPath.get(f.path)?.length ?? 0) / 4)
        }))
      }
      const markdown = await toMarkdown(spec, getText)
      const rawText = await toRaw(spec, getText)

      set({
        spec,
        markdown,
        rawText,
        warnings,
        isStale: false,
        autoBuildEnabled: true,
      })
      if (activePath && !chosen.some(f => f.path === activePath)) {
        set({ activePath: chosen[0]?.path ?? null })
      }
    } finally {
      set({ isBuilding: false })
    }
  },
  autoBuildEnabled: false,
  setAutoBuildEnabled: (v) => set({ autoBuildEnabled: v }),

  isBuilding: false,
  setIsBuilding: (v) => set({ isBuilding: v }),
  selectionMemory: {},
  setSelectionMemory: (m) => set({ selectionMemory: m }),
}))
