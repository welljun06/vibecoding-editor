import { create } from 'zustand'

/** Per-capability "enabled" flag — driven by the 资源 button popover
 *  (manage mode of MentionPicker). The @ picker reads this so enabled
 *  items can sort to the top of their section.
 *
 *  Keys are capability item ids, exactly as built by
 *  `buildCapabilitySectionsHome` (e.g. "ida:TeaCli:API"). Seeded with
 *  a handful of common picks so the sort-to-top behaviour is visible
 *  on first load. */
interface CapabilityEnableState {
  enabledIds: ReadonlySet<string>
  isEnabled: (id: string) => boolean
  toggle: (id: string) => void
  setEnabled: (id: string, on: boolean) => void
}

const SEED_ENABLED: readonly string[] = [
  // Seeded demo picks — feel free to adjust. The ids must match the
  // shape produced by buildCapabilitySectionsHome.
  'douyin:抖音 Feed 信息流加热建议:',
  'douyin:抖音评论情感分析:',
  'kani:小红书内容分析:',
]

export const useCapabilityEnableStore = create<CapabilityEnableState>(
  (set, get) => ({
    enabledIds: new Set(SEED_ENABLED),
    isEnabled: (id) => get().enabledIds.has(id),
    toggle: (id) =>
      set((s) => {
        const next = new Set(s.enabledIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return { enabledIds: next }
      }),
    setEnabled: (id, on) =>
      set((s) => {
        const next = new Set(s.enabledIds)
        if (on) next.add(id)
        else next.delete(id)
        return { enabledIds: next }
      }),
  }),
)
