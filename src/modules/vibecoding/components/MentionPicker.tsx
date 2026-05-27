import { useEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FileCode2,
  FolderCode,
  FolderTree,
  Layers,
  Library,
  Wrench,
  Zap,
} from 'lucide-react'
import { useCapabilityEnableStore } from '@/modules/editor/store/capability-enable-store'
import DouyinMark from './icons/DouyinMark'
import { PRIMARY_ICONS } from './ResourceCategoryTree'
import type { NewPrimaryCategory } from './ResourceLibraryData'

export interface MentionItem {
  id: string
  name: string
  /** Optional tag shown next to the name (e.g. "AI分身"). */
  tag?: string
}

export type MentionTab =
  | 'all'
  | 'skills'
  | 'tools'
  | 'knowledge'
  | 'files'
  | 'triggers'
  | 'resources'

/** A named bucket of mention items. Drives both the tree-rail rows
 *  (label + count) and the sticky-section headers in the right pane.
 *
 *  Optional levels (outer → inner):
 *  - `group`       — top super-group (e.g. "Skills" / "工具" in 全部 tab).
 *  - `aggregator`  — the resource library's top-tier aggregator
 *                    (e.g. "广场" vs "空间"). Rendered as a subtle
 *                    rail header between group and parent.
 *  - `parent`      — primary category (e.g. "抖音", "灵感创作").
 *                    Acts as the right-pane sticky h3.
 *  - `label`       — the section itself (a secondary, e.g. "抖音feed").
 *                    Acts as the right-pane sticky h4.
 *
 *  Each level is optional; the rail / list collapses gracefully when
 *  any of them is absent. */
export interface MentionSection {
  /** Stable id used for rail keys + scroll-anchor targets. */
  id: string
  label: string
  parent?: string
  aggregator?: string
  group?: string
  items: MentionItem[]
  /** Optional override for the icon rendered next to items. Useful
   *  when the active tab is 'all' and different sections want different
   *  icons (skill vs resource vs tool vs knowledge). */
  itemKind?: MentionTab
}

interface AnchorRect {
  left: number
  top: number
  /** Bottom edge in viewport coords — used when placing the picker
   *  below the anchor (e.g. PlatformHome's hero composer where there
   *  isn't enough space above the textarea). */
  bottom: number
  width: number
}

interface MentionPickerProps {
  open: boolean
  /** Anchor rect of the composer — picker positions itself above it. */
  anchor: AnchorRect | null
  skills: MentionItem[]
  tools: MentionItem[]
  files: MentionItem[]
  triggers: MentionItem[]
  resources: MentionItem[]
  /** Receives the tab so the inserted pill can be color-coded / icon-
   *  prefixed by kind. */
  onInsert: (item: MentionItem, tab: MentionTab) => void
  onClose: () => void
  /** Open the resource library tab in the right preview area. */
  onOpenResourceLibrary?: () => void
  /** Optional whitelist of tabs to show, in the order given. When
   *  omitted, the legacy 5-tab flat layout (skills/tools/resources/
   *  files/triggers) renders — preserved for the workspace composer. */
  tabs?: MentionTab[]
  /** When a tab has sections supplied here, the picker switches to a
   *  tree-rail + sticky-section list layout for that tab. Tabs not in
   *  this map fall back to the flat list using the per-kind arrays
   *  above. The '全部' tab is fed by combining all entries. */
  sectionsByTab?: Partial<Record<MentionTab, MentionSection[]>>
  /** Picker behaviour for item rows.
   *  - `insert` (default): click a row to insert `@name ` into the
   *    composer. Enabled items get a small checkmark + sort to the
   *    top of their section.
   *  - `manage`: each row carries a toggle switch; clicking toggles
   *    the item's enabled state in capability-enable-store. No
   *    insertion happens. Used by the 资源 toolbar button. */
  mode?: 'insert' | 'manage'
}

const ALL_TABS: { id: MentionTab; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: '全部', icon: Layers },
  { id: 'skills', label: 'Skills', icon: FolderCode },
  { id: 'tools', label: '工具', icon: Wrench },
  { id: 'knowledge', label: '知识库', icon: BookOpen },
  { id: 'resources', label: '资源', icon: Library },
  { id: 'files', label: '文件目录', icon: FolderTree },
  { id: 'triggers', label: '触发条件', icon: Zap },
]

const EMPTY_HINT: Partial<Record<MentionTab, string>> = {
  all: '暂无可用资源',
  skills: '暂无可用 Skill',
  tools: '暂无可用工具',
  knowledge: '暂无可用知识库',
  resources: '暂无可用资源平台',
  files: '当前项目暂无文件',
  triggers: '暂无可用触发条件',
}

/**
 * @mention picker — pops up against the chat composer when the user
 * types `@`. Top tabs switch between resource kinds; tabs whose data
 * is supplied via `sectionsByTab` render a tree-rail + grouped list,
 * everything else falls back to the legacy flat list. Click an item
 * to insert `@{name} ` into the draft; clicking outside or pressing
 * Escape closes.
 */
export default function MentionPicker({
  open,
  anchor,
  skills,
  tools,
  files,
  triggers,
  resources,
  onInsert,
  onClose,
  onOpenResourceLibrary,
  tabs,
  sectionsByTab,
  mode = 'insert',
}: MentionPickerProps) {
  const visibleTabs = useMemo(
    () =>
      tabs
        ? ALL_TABS.filter((t) => tabs.includes(t.id)).sort(
            (a, b) => tabs.indexOf(a.id) - tabs.indexOf(b.id),
          )
        : ALL_TABS.filter((t) => t.id !== 'all' && t.id !== 'knowledge'),
    [tabs],
  )
  const [tab, setTab] = useState<MentionTab>(visibleTabs[0]?.id ?? 'skills')
  // Keep the active tab inside the visible set when the whitelist
  // changes between renders (e.g. the host swaps configurations).
  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab) && visibleTabs[0]) {
      setTab(visibleTabs[0].id)
    }
  }, [visibleTabs, tab])
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape. Only attach listeners while open.
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current) return
      if (e.target instanceof Node && !ref.current.contains(e.target)) {
        onClose()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  // Resolve the active tab's data. Sections take precedence; if absent
  // we fall back to the per-kind flat array.
  const flatFor = (t: MentionTab): MentionItem[] => {
    if (t === 'skills') return skills
    if (t === 'tools') return tools
    if (t === 'resources') return resources
    if (t === 'files') return files
    if (t === 'triggers') return triggers
    return []
  }
  const activeSections = useMemo<MentionSection[] | null>(() => {
    if (!sectionsByTab) return null
    const sec = sectionsByTab[tab]
    return sec && sec.length > 0 ? sec : null
  }, [sectionsByTab, tab])
  const activeFlat = activeSections ? null : flatFor(tab)

  // Sizing budget — see comment in the original picker. Prefer placing
  // below the anchor (composer body), fall back above when there's no
  // room. Height shrinks to whatever space is available.
  if (!open || !anchor) return null
  const MIN_USABLE_HEIGHT = 160
  const MAX_HEIGHT = 360
  const viewportW = typeof window === 'undefined' ? 1280 : window.innerWidth
  const viewportH = typeof window === 'undefined' ? 800 : window.innerHeight
  const desiredWidth = activeSections ? 600 : 420
  // Sectioned mode (PlatformHome 全部/Skills/工具/知识库) renders at a
  // fixed width so the panel size is identical whether opened via `@`
  // (zero-width caret anchor) or via the 资源 button (wide composer
  // anchor). Flat mode keeps the legacy "match the input width" feel
  // used by the workspace composer.
  const width = activeSections
    ? Math.min(desiredWidth, viewportW - 16)
    : Math.max(320, Math.min(anchor.width, desiredWidth))
  const left = Math.max(8, Math.min(anchor.left, viewportW - width - 8))
  const spaceAbove = anchor.top - 16
  const spaceBelow = viewportH - anchor.bottom - 16
  let placeAbove: boolean
  if (spaceBelow >= MIN_USABLE_HEIGHT) placeAbove = false
  else if (spaceAbove >= MIN_USABLE_HEIGHT) placeAbove = true
  else placeAbove = spaceAbove > spaceBelow
  const budget = placeAbove ? spaceAbove : spaceBelow
  const maxHeight = Math.min(MAX_HEIGHT, Math.max(MIN_USABLE_HEIGHT, budget))
  const style: React.CSSProperties = placeAbove
    ? {
        position: 'fixed',
        left,
        bottom: viewportH - anchor.top + 8,
        width,
        maxHeight,
        zIndex: 120,
      }
    : {
        position: 'fixed',
        left,
        top: anchor.bottom + 8,
        width,
        maxHeight,
        zIndex: 120,
      }

  const scrollToSection = (sectionId: string) => {
    const root = listRef.current
    if (!root) return
    const target = root.querySelector<HTMLElement>(
      `[data-section-id="${CSS.escape(sectionId)}"]`,
    )
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div
      ref={ref}
      style={style}
      className="flex flex-col overflow-hidden rounded-lg border border-[var(--divider)] bg-[var(--color-surface-0)] shadow-[0_12px_28px_-8px_rgba(16,18,24,0.22)]"
    >
      {/* Tabs */}
      <div className="flex shrink-0 items-center gap-4 overflow-x-auto border-b border-[var(--divider-soft)] px-3 pt-2">
        {visibleTabs.map((t) => {
          const isActive = t.id === tab
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex shrink-0 items-center gap-1.5 pb-2 text-[13px] transition-colors ${
                isActive
                  ? 'font-semibold text-[var(--color-ink)]'
                  : 'text-[var(--color-ink)]/55 hover:text-[var(--color-ink)]/80'
              }`}
            >
              <Icon size={13} strokeWidth={1.8} />
              {t.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-t bg-[var(--color-ink)]" />
              )}
            </button>
          )
        })}
      </div>

      {activeSections ? (
        <SectionedBody
          sections={activeSections}
          tab={tab}
          listRef={listRef}
          scrollToSection={scrollToSection}
          onInsert={onInsert}
          mode={mode}
        />
      ) : (
        <FlatBody
          items={activeFlat ?? []}
          tab={tab}
          onInsert={onInsert}
          mode={mode}
        />
      )}

      {tab === 'resources' && onOpenResourceLibrary && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            onOpenResourceLibrary()
            onClose()
          }}
          className="shrink-0 border-t border-[var(--divider-soft)] px-3 py-2 text-left text-[12px] text-[var(--color-ink)]/65 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
        >
          浏览全部资源 →
        </button>
      )}
    </div>
  )
}

/* ─── Flat (legacy) body — used when no sections are supplied for a tab. */

function FlatBody({
  items,
  tab,
  onInsert,
  mode,
}: {
  items: MentionItem[]
  tab: MentionTab
  onInsert: (item: MentionItem, tab: MentionTab) => void
  mode: 'insert' | 'manage'
}) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-[12px] text-[var(--color-ink)]/45">
        {EMPTY_HINT[tab] ?? '暂无可用资源'}
      </p>
    )
  }
  return (
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto py-1">
      {items.map((item) => (
        <MentionRow
          key={item.id}
          item={item}
          tab={tab}
          onInsert={onInsert}
          mode={mode}
        />
      ))}
    </div>
  )
}

/* ─── Sectioned body — tree-rail (left) + sticky-section list (right). */

function SectionedBody({
  sections: rawSections,
  tab,
  listRef,
  scrollToSection,
  onInsert,
  mode,
}: {
  sections: MentionSection[]
  tab: MentionTab
  listRef: React.RefObject<HTMLDivElement | null>
  scrollToSection: (id: string) => void
  onInsert: (item: MentionItem, tab: MentionTab) => void
  mode: 'insert' | 'manage'
}) {
  // Sort items inside every section so enabled ones float to the top.
  // Subscribing to the store keeps the order live as the user toggles
  // items in manage mode. Stable within the enabled / disabled halves
  // (original source order preserved).
  const enabledIds = useCapabilityEnableStore((s) => s.enabledIds)
  // Per-block expand/collapse state — mirrors ResourceCategoryTree's
  // primary-row chevron behaviour. Default = all expanded; user can
  // collapse blocks they don't care about. Keyed by group|aggregator|
  // parent so the same block is identified across re-renders.
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(
    () => new Set(),
  )
  const toggleBlock = (key: string) =>
    setCollapsedBlocks((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const sections = useMemo<MentionSection[]>(() => {
    return rawSections.map((s) => {
      const enabled: MentionItem[] = []
      const rest: MentionItem[] = []
      for (const it of s.items) {
        if (enabledIds.has(it.id)) enabled.push(it)
        else rest.push(it)
      }
      // Only allocate a new section when ordering actually changed,
      // so referential equality holds when nothing is enabled.
      if (enabled.length === 0) return s
      return { ...s, items: [...enabled, ...rest] }
    })
  }, [rawSections, enabledIds])
  // Track which section is closest to the top of the list — drives the
  // rail's active row. IntersectionObserver picks the first section
  // whose top has crossed the list's top edge.
  const [activeId, setActiveId] = useState<string | null>(
    sections[0]?.id ?? null,
  )
  useEffect(() => {
    setActiveId(sections[0]?.id ?? null)
  }, [sections])
  useEffect(() => {
    const root = listRef.current
    if (!root) return
    const headers = Array.from(
      root.querySelectorAll<HTMLElement>('[data-section-id]'),
    )
    if (headers.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        // Pick the earliest section whose top edge is at-or-above the
        // list's top. Falls back to the first section when nothing has
        // crossed yet (i.e. scroll position is at the very top).
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
        if (visible.length === 0) return
        // Sort by DOM order (matches section order) and take the first.
        visible.sort(
          (a, b) =>
            headers.indexOf(a) - headers.indexOf(b),
        )
        const id = visible[0].dataset.sectionId
        if (id) setActiveId(id)
      },
      { root, threshold: 0, rootMargin: '0px 0px -75% 0px' },
    )
    headers.forEach((h) => io.observe(h))
    return () => io.disconnect()
  }, [sections, listRef])

  if (sections.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-[12px] text-[var(--color-ink)]/45">
        {EMPTY_HINT[tab] ?? '暂无可用资源'}
      </p>
    )
  }

  // Bucket consecutive sections that share the same (group, aggregator,
  // parent) tuple — one bucket becomes one primary-header + secondary
  // rows block in the rail (mirrors ResourceCategoryTree's 2nd / 3rd
  // level visual). The 2nd-level row carries the aggregator + primary
  // breadcrumb together, and reuses the tile icon from PRIMARY_ICONS.
  type Block = {
    group: string | undefined
    aggregator: string | undefined
    parent: string | undefined
    sections: MentionSection[]
  }
  const blocks: Block[] = []
  for (const s of sections) {
    const last = blocks[blocks.length - 1]
    if (
      last &&
      last.group === s.group &&
      last.aggregator === s.aggregator &&
      last.parent === s.parent
    ) {
      last.sections.push(s)
    } else {
      blocks.push({
        group: s.group,
        aggregator: s.aggregator,
        parent: s.parent,
        sections: [s],
      })
    }
  }
  // Drop the `group` segment from primary headers when every section
  // shares the same group (single-kind tab) — repeating the tab name
  // adds noise.
  const firstGroup = sections[0]?.group
  const groupVaries = sections.some((s) => s.group !== firstGroup)
  const primaryHeaderLabel = (b: Block): string => {
    const parts: (string | undefined)[] = []
    if (groupVaries) parts.push(b.group)
    if (b.aggregator) parts.push(b.aggregator)
    if (b.parent) parts.push(b.parent)
    return parts.filter(Boolean).join(' / ')
  }
  return (
    <div className="flex min-h-0 flex-1">
      {/* Rail — reuses the resource library's 2nd / 3rd level styling
       *  (PRIMARY_ICONS tile + h-7 rows). Block header = aggregator /
       *  primary breadcrumb; nested rows = secondaries. */}
      <div className="thin-scroll w-[208px] shrink-0 overflow-y-auto border-r border-[var(--divider-soft)] pb-2">
        {blocks.map((b, bi) => {
          const primary = b.parent as NewPrimaryCategory | undefined
          const iconSpec = primary ? PRIMARY_ICONS[primary] : null
          const headerText = primaryHeaderLabel(b)
          const blockKey = `${b.group ?? ''}|${b.aggregator ?? ''}|${b.parent ?? ''}`
          const expanded = !collapsedBlocks.has(blockKey)
          const ChevIcon = expanded ? ChevronDown : ChevronRight
          // Sum of items across this block — surfaced next to the
          // primary header, mirrors ResourceCategoryTree's row count.
          const blockTotal = b.sections.reduce(
            (sum, s) => sum + s.items.length,
            0,
          )
          return (
            <div key={bi} className="shrink-0 px-1 pt-1.5">
              {/* 2nd-level (primary) header — tile icon ↔ chevron on
               *  hover (matches ResourceCategoryTree). Chevron click
               *  toggles expand/collapse; label click expands and
               *  scrolls to the first child section. */}
              {headerText && (
                <div className="group flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] transition-colors hover:bg-[var(--fill-hover)]">
                  <button
                    type="button"
                    aria-label={expanded ? '收起' : '展开'}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBlock(blockKey)
                    }}
                    className={
                      iconSpec && iconSpec.kind === 'tile'
                        ? `relative flex h-[14px] w-[14px] shrink-0 items-center justify-center overflow-hidden rounded-[3.5px] transition-colors group-hover:!bg-transparent hover:!bg-[var(--color-ink)]/10 ${iconSpec.tileClass}`
                        : 'relative flex h-[14px] w-[14px] shrink-0 items-center justify-center overflow-hidden rounded-[3.5px] text-[var(--color-ink)]/70 transition-colors hover:bg-[var(--color-ink)]/10 hover:text-[var(--color-ink)]'
                    }
                  >
                    {iconSpec?.kind === 'bare-douyin' ? (
                      <DouyinMark
                        size={14}
                        className="absolute transition-opacity duration-100 group-hover:opacity-0"
                      />
                    ) : iconSpec?.kind === 'tile' ? (
                      <iconSpec.icon
                        size={8}
                        strokeWidth={1.8}
                        className="absolute transition-opacity duration-100 group-hover:opacity-0"
                      />
                    ) : null}
                    <ChevIcon
                      size={11}
                      strokeWidth={2}
                      className="absolute text-[var(--color-ink)]/70 opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                    />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      // Expand if collapsed, then scroll to the first
                      // child section so the user sees content in the
                      // list pane immediately.
                      if (!expanded) toggleBlock(blockKey)
                      const first = b.sections[0]
                      if (first) scrollToSection(first.id)
                    }}
                    className="flex min-w-0 flex-1 items-center justify-between text-left"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-[18px] text-[var(--color-ink)]/85">
                      {headerText}
                    </span>
                    <span className="ml-2 shrink-0 text-[12px] leading-4 text-[var(--color-ink)]/35">
                      {blockTotal}
                    </span>
                  </button>
                </div>
              )}
              {/* 3rd-level (secondary) rows — only when expanded.
               *  Indented + left border to match the resource library
               *  tree's secondary block. */}
              {expanded && b.sections.length > 0 && (
                <div className="pl-[15px] pt-1">
                  <div className="flex flex-col gap-1 border-l border-[rgba(16,18,24,0.08)] pl-px dark:border-[rgba(255,255,255,0.08)]">
                    {b.sections.map((s) => {
                      const isActive = s.id === activeId
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            scrollToSection(s.id)
                          }}
                          className={`flex h-7 items-center gap-2 rounded-md py-1 pl-3 pr-2 text-[13px] transition-colors ${
                            isActive
                              ? 'bg-[var(--fill-subtle)] font-medium text-[var(--color-ink)]'
                              : 'text-[var(--color-ink)]/80 hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]'
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate text-left leading-[18px]">
                            {s.label}
                          </span>
                          <span className="shrink-0 text-[12px] leading-4 text-[var(--color-ink)]/35">
                            {s.items.length}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* List — only the section (secondary) sticky header. The
       *  breadcrumb (group / aggregator / parent) is already
       *  communicated by the rail on the left, so repeating it on
       *  the right is just noise. */}
      <div
        ref={listRef}
        className="thin-scroll min-h-0 flex-1 overflow-y-auto py-1"
      >
        {sections.map((s) => (
          <section
            key={s.id}
            data-section-id={s.id}
            className="scroll-mt-1"
          >
            <h3 className="sticky top-0 z-[1] bg-[var(--color-surface-0)]/90 px-3 py-1 text-[10.5px] font-medium uppercase tracking-wide text-[var(--color-ink)]/45 backdrop-blur">
              {s.label}
            </h3>
            {s.items.map((item) => (
              <MentionRow
                key={item.id}
                item={item}
                tab={s.itemKind ?? tab}
                onInsert={onInsert}
                mode={mode}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}

/* ─── Single row — shared by flat + sectioned bodies. ────────────── */

function MentionRow({
  item,
  tab,
  onInsert,
  mode,
}: {
  item: MentionItem
  tab: MentionTab
  onInsert: (item: MentionItem, tab: MentionTab) => void
  mode: 'insert' | 'manage'
}) {
  const enabled = useCapabilityEnableStore((s) => s.enabledIds.has(item.id))
  const toggle = useCapabilityEnableStore((s) => s.toggle)
  const handleMouseDown = (e: React.MouseEvent) => {
    // mousedown fires before the outside-click handler — prevent it
    // so the insert / toggle lands before the picker closes.
    e.preventDefault()
    if (mode === 'manage') toggle(item.id)
    else onInsert(item, tab)
  }
  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[var(--fill-hover)]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-500">
        <MentionIcon tab={tab} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-ink)]">
        {item.name}
      </span>
      {item.tag && (
        <span className="shrink-0 rounded-md border border-[var(--divider)] px-1.5 py-[1px] text-[10.5px] font-medium text-[var(--color-ink)]/70">
          {item.tag}
        </span>
      )}
      {/* Trailing indicator differs by mode:
       *  - insert: small inline checkmark when the item is already
       *    enabled, so the user can see why it's sorted to the top.
       *  - manage: iOS-style toggle switch reflecting / driving the
       *    capability-enable-store state. */}
      {mode === 'insert' && enabled && (
        <Check
          size={12}
          strokeWidth={2.4}
          className="shrink-0 text-indigo-500"
        />
      )}
      {mode === 'manage' && (
        <span
          aria-hidden
          className={`relative inline-flex h-[16px] w-[28px] shrink-0 items-center rounded-full transition-colors ${
            enabled ? 'bg-indigo-500' : 'bg-[var(--fill-medium)]'
          }`}
        >
          <span
            className={`absolute left-[2px] top-[2px] h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-[12px]' : 'translate-x-0'
            }`}
          />
        </span>
      )}
    </button>
  )
}

function MentionIcon({ tab }: { tab: MentionTab }) {
  const common = { size: 11, strokeWidth: 1.8 }
  if (tab === 'skills') return <FolderCode {...common} />
  if (tab === 'tools') return <Wrench {...common} />
  if (tab === 'knowledge') return <BookOpen {...common} />
  if (tab === 'resources') return <Library {...common} />
  if (tab === 'files') return <FileCode2 {...common} />
  if (tab === 'all') return <Layers {...common} />
  return <Zap {...common} />
}
