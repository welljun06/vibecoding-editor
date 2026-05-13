import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Clock,
  LayoutGrid,
  Rows3,
  Search,
} from 'lucide-react'
import CapabilityCard from './CapabilityCard'
import CapabilityDetailView from './CapabilityDetailView'
import ResourceCategoryTree from './ResourceCategoryTree'
import RichCapabilityCard from './RichCapabilityCard'
import EmptySearchMark from './icons/EmptySearchMark'
import {
  CAPABILITY_LABEL,
  CAPABILITY_TAGS,
  OFFICIAL_DOMAINS,
  PRIMARY_CATEGORIES,
  RESOURCES,
  buildCategoryTree,
  inferCapabilityTag,
} from './ResourceLibraryData'
import type {
  Capability,
  CapabilityTag,
  PrimaryCategory,
  Resource,
} from './ResourceLibraryData'

/** Top-level resource section. `skill-tool` and `knowledge` show
 *  capability cards; `model` and `publisher` are placeholder sections
 *  for upcoming resource types. `all` is the default unfiltered cards
 *  view (no tab highlighted). */
export type TypeFilter =
  | 'all'
  | 'skill-tool'
  | 'knowledge'
  | 'model'
  | 'publisher'

export interface CapabilityRef {
  platformId: string
  name: string
  category: string | null
}

interface ResourceLibraryViewProps {
  selectedPrimary: PrimaryCategory | null
  selectedSecondary: string | null
  selectedCapability: CapabilityRef | null
  expandedPrimary: Set<PrimaryCategory>
  searchQuery: string
  typeFilter: TypeFilter
  onTogglePrimary: (primary: PrimaryCategory) => void
  onSelectCategory: (primary: PrimaryCategory | null, secondary: string | null) => void
  onSelectCapability: (ref: CapabilityRef | null) => void
  onSearchChange: (q: string) => void
  onTypeFilterChange: (t: TypeFilter) => void
  onUseCapabilityInChat: (platform: Resource, capability: Capability) => void
  /** Switch to a project (called from the lineage section in detail
   *  views). Also closes the resource library page. */
  onOpenProject: (projectName: string) => void
}

const TYPE_TABS: { id: TypeFilter; label: string }[] = [
  { id: 'skill-tool', label: 'Skills / 工具' },
  { id: 'knowledge', label: CAPABILITY_LABEL.knowledge },
  { id: 'model', label: '模型' },
  { id: 'publisher', label: '发布器' },
]

const COMING_SOON_COPY: Partial<Record<TypeFilter, { title: string; hint: string }>> = {
  knowledge: {
    title: '知识库',
    hint: '统一接入团队 wiki / 文档 / 数据资产作为对话上下文，敬请期待。',
  },
  model: {
    title: '模型',
    hint: '统一管理可调用的大模型 / 微调模型 / 端侧模型，敬请期待。',
  },
  publisher: {
    title: '发布器',
    hint: '把对话中沉淀的能力一键发布为应用、卡片、推送，敬请期待。',
  },
}

const UPDATE_TIME_OPTIONS = [
  { id: 'all', label: '全部时间' },
  { id: '7d', label: '最近一周' },
  { id: '30d', label: '最近一月' },
  { id: '90d', label: '最近三月' },
] as const

const MODE_OPTIONS = [
  { id: 'all', label: '全部模式' },
  { id: 'public', label: '公开' },
  { id: 'private', label: '私有' },
] as const

const PER_PLATFORM_PREVIEW_LIMIT = 12

export default function ResourceLibraryView({
  selectedPrimary,
  selectedSecondary,
  selectedCapability,
  expandedPrimary,
  searchQuery,
  typeFilter,
  onTogglePrimary,
  onSelectCategory,
  onSelectCapability,
  onSearchChange,
  onTypeFilterChange,
  onUseCapabilityInChat,
  onOpenProject,
}: ResourceLibraryViewProps) {
  const tree = useMemo(() => buildCategoryTree(), [])

  // Visual-only filters — wired to UI state but not yet to the data layer
  // (catalogs don't carry timestamps / ownership). Persisted in local state.
  const [updateTime, setUpdateTime] = useState<string>('all')
  const [mode, setMode] = useState<string>('all')
  const [onlyMine, setOnlyMine] = useState(false)
  const [cardLayout, setCardLayout] = useState<'compact' | 'rich'>('compact')
  const [tagFilter, setTagFilter] = useState<CapabilityTag | 'all'>('all')

  const treeCountMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of RESOURCES) {
      const k = `${r.primaryCategory}::${r.secondaryCategory}`
      m.set(k, (m.get(k) ?? 0) + r.capabilities.length)
    }
    return m
  }, [])

  const platformsInScope = useMemo(() => {
    return RESOURCES.filter((r) => {
      if (selectedPrimary) {
        // 官方 is a virtual aggregator — match resources from any of the
        // four official domains rather than literal '官方'.
        if (selectedPrimary === '官方') {
          if (!OFFICIAL_DOMAINS.includes(r.primaryCategory)) return false
        } else if (r.primaryCategory !== selectedPrimary) {
          return false
        }
      }
      if (selectedSecondary && r.secondaryCategory !== selectedSecondary) return false
      return true
    })
  }, [selectedPrimary, selectedSecondary])

  // 官方 has no own resources, so the tree row needs an explicit total
  // computed from the aggregator subset (every capability in OFFICIAL_DOMAINS).
  const officialTotal = useMemo(() => {
    return RESOURCES.filter((r) =>
      OFFICIAL_DOMAINS.includes(r.primaryCategory),
    ).reduce((sum, r) => sum + r.capabilities.length, 0)
  }, [])

  const groups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const out: { platform: Resource; caps: Capability[]; total: number }[] = []
    for (const platform of platformsInScope) {
      const matches = platform.capabilities.filter((c) => {
        if (typeFilter === 'skill-tool' && c.type !== 'skill' && c.type !== 'tool') return false
        if (typeFilter === 'knowledge' && c.type !== 'knowledge') return false
        if (tagFilter !== 'all' && inferCapabilityTag(c.name) !== tagFilter) return false
        if (q) {
          const hay = [c.name, c.category ?? '', platform.name].join(' ').toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      if (matches.length > 0) {
        out.push({ platform, caps: matches, total: matches.length })
      }
    }
    return out
  }, [platformsInScope, typeFilter, searchQuery, tagFilter])

  // Capability detail takes precedence — user clicked a capability card.
  if (selectedCapability) {
    const platform = RESOURCES.find((r) => r.id === selectedCapability.platformId)
    const capability = platform?.capabilities.find(
      (c) =>
        c.name === selectedCapability.name &&
        (c.category ?? null) === selectedCapability.category,
    )
    if (platform && capability) {
      return (
        <CapabilityDetailView
          capability={capability}
          platform={platform}
          onBack={() => onSelectCapability(null)}
          onUseInChat={() => onUseCapabilityInChat(platform, capability)}
          onOpenProject={onOpenProject}
        />
      )
    }
  }

  const isFiltering = !!selectedPrimary || !!selectedSecondary || !!searchQuery.trim()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-surface-0)]">
      {/* ── Top bar — page title with resource-type tabs trailing it.
           Use baseline alignment + matching pb-3 so the title text and
           tab text share the same baseline, and the active tab's
           underline lines up with the container's bottom border. ── */}
      <div className="flex shrink-0 items-baseline gap-6 border-b border-[var(--divider-soft)] px-6 pt-5">
        <h1 className="shrink-0 pb-3 text-[20px] font-semibold leading-[1.2] text-[var(--color-ink)]">
          资源库
        </h1>
        <div className="flex items-baseline gap-6">
          {TYPE_TABS.map((t) => {
            const active = typeFilter === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTypeFilterChange(active ? 'all' : t.id)}
                className={`relative pb-3 text-[14px] leading-[1.2] transition-colors ${
                  active
                    ? 'font-semibold text-[var(--color-ink)]'
                    : 'text-[var(--color-ink)]/55 hover:text-[var(--color-ink)]/85'
                }`}
              >
                {t.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-t bg-[var(--color-ink)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Body: tree (left) + scrollable cards (right). Placeholder
           sections (模型 / 发布器) take over the full body and skip both
           the tree and the filter row. ── */}
      {COMING_SOON_COPY[typeFilter] ? (
        <ComingSoonView copy={COMING_SOON_COPY[typeFilter]!} />
      ) : (
      <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* ── Left tree column (independent scroll) ── */}
      <div className="flex w-[220px] shrink-0 flex-col border-r border-[var(--divider-soft)]">
        <div className="min-h-0 flex-1 overflow-hidden pt-1">
          <ResourceCategoryTree
            tree={tree}
            expandedPrimary={expandedPrimary}
            onTogglePrimary={onTogglePrimary}
            selectedPrimary={selectedPrimary}
            selectedSecondary={selectedSecondary}
            officialTotal={officialTotal}
            onSelect={(p, s) => onSelectCategory(p, s)}
            countMap={treeCountMap}
          />
        </div>
      </div>

      {/* ── Right column: sticky filter + cards ── */}
      <div className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Sticky filter row */}
        <div className="sticky top-0 z-10 shrink-0 bg-[var(--color-surface-0)]">
          <div className="flex flex-wrap items-center gap-3 px-8 py-3">
            <div className="relative flex h-9 w-[300px] items-center">
              <Search
                size={14}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-3.5 text-[var(--color-ink)]/40"
              />
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="搜索"
                className="h-full w-full rounded-full border border-[var(--divider-soft)] bg-[var(--color-surface-0)] pl-9 pr-4 text-[13px] text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-ink)]/35 focus:border-[var(--color-ink)]/40"
              />
            </div>

            <FilterDropdown
              label="更新时间"
              value={updateTime}
              options={UPDATE_TIME_OPTIONS}
              onChange={setUpdateTime}
            />
            <FilterDropdown
              label="模式"
              value={mode}
              options={MODE_OPTIONS}
              onChange={setMode}
            />
            <CheckboxButton
              label="我创建的"
              checked={onlyMine}
              onChange={setOnlyMine}
            />

            <LayoutToggle value={cardLayout} onChange={setCardLayout} />
          </div>
          <CategoryStrip value={tagFilter} onChange={setTagFilter} />
        </div>

        {/* ── Cards area ── */}
        <div className="flex min-h-0 flex-1 flex-col">
          {isFiltering && (
            <div className="flex flex-wrap items-center gap-1.5 px-8 pt-5 text-[12px] text-[var(--color-ink)]/55">
              <button
                type="button"
                onClick={() => {
                  onSelectCategory(null, null)
                  onSearchChange('')
                }}
                className="rounded-md px-1 py-0.5 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
              >
                全部
              </button>
              {selectedPrimary && (
                <>
                  <span>/</span>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(selectedPrimary, null)}
                    className={`rounded-md px-1 py-0.5 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)] ${
                      selectedSecondary ? '' : 'text-[var(--color-ink)]/85'
                    }`}
                  >
                    {selectedPrimary}
                  </button>
                </>
              )}
              {selectedSecondary && (
                <>
                  <span>/</span>
                  <span className="text-[var(--color-ink)]/85">{selectedSecondary}</span>
                </>
              )}
              {searchQuery.trim() && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-[var(--chat-form-option-bg)] px-2 py-0.5 text-[var(--color-ink)]/75">
                  搜索: {searchQuery.trim()}
                </span>
              )}
            </div>
          )}

          {groups.length === 0 ? (
            <EmptyResultState
              tagFilter={tagFilter}
              searchQuery={searchQuery}
              selectedPrimary={selectedPrimary}
              selectedSecondary={selectedSecondary}
              onReset={() => {
                setTagFilter('all')
                onSelectCategory('官方', null)
                onSearchChange('')
              }}
            />
          ) : (
            <div className="flex flex-col gap-8 px-8 pt-5 pb-10">
              {!isFiltering ? (
                PRIMARY_CATEGORIES.map((primary) => {
                  const groupsInPrimary = groups.filter(
                    (g) => g.platform.primaryCategory === primary,
                  )
                  if (groupsInPrimary.length === 0) return null
                  return (
                    <div key={primary} className="flex flex-col gap-5">
                      <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink)]/45">
                        <span>{primary}</span>
                        <span className="h-px flex-1 bg-[var(--divider-soft)]" />
                      </div>
                      {groupsInPrimary.map((g) => (
                        <PlatformGroup
                          key={g.platform.id}
                          group={g}
                          layout={cardLayout}
                          onSelectCapability={(cap) =>
                            onSelectCapability({
                              platformId: g.platform.id,
                              name: cap.name,
                              category: cap.category ?? null,
                            })
                          }
                        />
                      ))}
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col gap-7">
                  {groups.map((g) => (
                    <PlatformGroup
                      key={g.platform.id}
                      group={g}
                      layout={cardLayout}
                      onSelectCapability={(cap) =>
                        onSelectCapability({
                          platformId: g.platform.id,
                          name: cap.name,
                          category: cap.category ?? null,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      )}
    </div>
  )
}

function EmptyResultState({
  tagFilter,
  searchQuery,
  selectedPrimary,
  selectedSecondary,
  onReset,
}: {
  tagFilter: CapabilityTag | 'all'
  searchQuery: string
  selectedPrimary: PrimaryCategory | null
  selectedSecondary: string | null
  onReset: () => void
}) {
  const hasSearch = searchQuery.trim().length > 0
  const hasTag = tagFilter !== 'all'
  // Build a copy line that explains *why* the list is empty. Tag-driven
  // empties read very differently from "this category is genuinely
  // empty", so we surface the active filter explicitly.
  let title = '没有符合条件的能力'
  let hint = '试试更换筛选项或清空搜索。'
  if (hasTag && hasSearch) {
    title = `在「${tagFilter}」分类下没有命中「${searchQuery.trim()}」`
    hint = '当前同时启用了分类筛选和搜索，可清空筛选再回到全部资源。'
  } else if (hasTag) {
    title = `「${tagFilter}」分类下还没有能力`
    hint =
      selectedPrimary && selectedSecondary
        ? `当前定位在 ${selectedPrimary} / ${selectedSecondary}，这个分类筛选可能太窄了。`
        : '可能是当前分类筛选太窄，可以清空筛选回到全部资源。'
  } else if (hasSearch) {
    title = `没有命中「${searchQuery.trim()}」的能力`
    hint = '换个关键词，或清空搜索回到全部资源。'
  } else if (selectedPrimary || selectedSecondary) {
    title = '当前分类下还没有能力'
    hint = '这个类目还在接入，先回到全部看看其他资源。'
  }
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-8 py-12">
      <div className="flex max-w-[440px] flex-col items-center gap-5 text-center">
        <EmptySearchMark size={80} />
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[15px] font-semibold text-[var(--color-ink)]">
            {title}
          </h3>
          <p className="text-[12.5px] leading-[1.7] text-[var(--color-ink)]/55">
            {hint}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-[12.5px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90"
        >
          回到全部资源
        </button>
      </div>
    </div>
  )
}

function ComingSoonView({
  copy,
}: {
  copy: { title: string; hint: string }
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-8 py-12">
      <div className="flex max-w-[420px] flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--fill-subtle)] text-[var(--color-ink)]/55">
          <Clock size={22} strokeWidth={1.6} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">
            {copy.title} · 敬请期待
          </h2>
          <p className="text-[13px] leading-[1.7] text-[var(--color-ink)]/55">
            {copy.hint}
          </p>
        </div>
      </div>
    </div>
  )
}

function PlatformGroup({
  group,
  layout,
  onSelectCapability,
}: {
  group: { platform: Resource; caps: Capability[]; total: number }
  layout: 'compact' | 'rich'
  onSelectCapability: (capability: Capability) => void
}) {
  const visible = group.caps.slice(0, PER_PLATFORM_PREVIEW_LIMIT)
  const hidden = Math.max(0, group.total - visible.length)
  const gridCols =
    layout === 'rich'
      ? 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]'
      : 'grid-cols-[repeat(auto-fill,minmax(260px,1fr))]'
  return (
    <section className="flex flex-col gap-3">
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="min-w-0 text-[14px] font-semibold text-[var(--color-ink)]">
          {group.platform.secondaryCategory}
        </span>
        <span className="shrink-0 text-[11.5px] text-[var(--color-ink)]/45">
          {group.total} 个能力
        </span>
      </div>

      <div className={`grid ${gridCols} gap-3`}>
        {visible.map((cap, idx) =>
          layout === 'rich' ? (
            <RichCapabilityCard
              key={`${cap.name}-${cap.category ?? ''}-${idx}`}
              capability={cap}
              platform={group.platform}
              onClick={() => onSelectCapability(cap)}
            />
          ) : (
            <CapabilityCard
              key={`${cap.name}-${cap.category ?? ''}-${idx}`}
              capability={cap}
              platform={group.platform}
              onClick={() => onSelectCapability(cap)}
            />
          ),
        )}
        {hidden > 0 && (
          <div
            className="flex min-h-[112px] items-center justify-center rounded-xl border border-dashed border-[var(--divider)] bg-transparent text-[12.5px] text-[var(--color-ink)]/55"
          >
            + 还有 {hidden} 个能力（请用搜索筛选）
          </div>
        )}
      </div>
    </section>
  )
}

function CategoryStrip({
  value,
  onChange,
}: {
  value: CapabilityTag | 'all'
  onChange: (v: CapabilityTag | 'all') => void
}) {
  const items: { id: CapabilityTag | 'all'; label: string }[] = [
    { id: 'all', label: '全部' },
    ...CAPABILITY_TAGS.map((t) => ({ id: t, label: t })),
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 px-8 pb-2">
      {items.map((it) => {
        const active = value === it.id
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-[13px] transition-colors ${
              active
                ? 'bg-[var(--fill-hover)] font-medium text-[var(--color-ink)]'
                : 'text-[var(--color-ink)]/65 hover:bg-[var(--fill-subtle)] hover:text-[var(--color-ink)]'
            }`}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

function LayoutToggle({
  value,
  onChange,
}: {
  value: 'compact' | 'rich'
  onChange: (v: 'compact' | 'rich') => void
}) {
  const items: { id: 'compact' | 'rich'; icon: typeof LayoutGrid; label: string }[] = [
    { id: 'compact', icon: Rows3, label: '紧凑列表' },
    { id: 'rich', icon: LayoutGrid, label: '卡片视图' },
  ]
  return (
    <div className="ml-auto inline-flex items-center gap-0.5 rounded-full border border-[var(--divider-soft)] bg-[var(--color-surface-0)] p-0.5">
      {items.map((it) => {
        const active = value === it.id
        const Icon = it.icon
        return (
          <button
            key={it.id}
            type="button"
            title={it.label}
            aria-label={it.label}
            onClick={() => onChange(it.id)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              active
                ? 'bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                : 'text-[var(--color-ink)]/55 hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]'
            }`}
          >
            <Icon size={13} strokeWidth={1.8} />
          </button>
        )
      })}
    </div>
  )
}

/* ─── Filter row helpers ─── */

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly { id: string; label: string }[]
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current) return
      if (e.target instanceof Node && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const active = value !== 'all'
  const current = options.find((o) => o.id === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 items-center gap-1.5 rounded-full border bg-[var(--color-surface-0)] px-3.5 text-[13px] transition-colors ${
          active
            ? 'border-[var(--color-ink)]/40 text-[var(--color-ink)]'
            : 'border-[var(--divider-soft)] text-[var(--color-ink)]/75 hover:border-[var(--color-ink)]/30 hover:text-[var(--color-ink)]'
        }`}
      >
        <span>{active && current ? current.label : label}</span>
        <ChevronDown
          size={13}
          strokeWidth={1.8}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-[var(--divider)] bg-[var(--color-surface-0)] shadow-[0_12px_28px_-8px_rgba(16,18,24,0.22)]">
          {options.map((o) => {
            const isCurrent = o.id === value
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onChange(o.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                  isCurrent
                    ? 'bg-[var(--fill-hover)] text-[var(--color-ink)]'
                    : 'text-[var(--color-ink)]/80 hover:bg-[var(--fill-hover)]'
                }`}
              >
                {o.label}
                {isCurrent && <Check size={12} strokeWidth={2} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CheckboxButton({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex h-9 items-center gap-2 rounded-full border bg-[var(--color-surface-0)] px-3.5 text-[13px] transition-colors ${
        checked
          ? 'border-[var(--color-ink)]/40 text-[var(--color-ink)]'
          : 'border-[var(--divider-soft)] text-[var(--color-ink)]/75 hover:border-[var(--color-ink)]/30 hover:text-[var(--color-ink)]'
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
          checked
            ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface-0)]'
            : 'border-[var(--divider)] bg-[var(--color-surface-0)]'
        }`}
      >
        {checked && <Check size={10} strokeWidth={2.5} />}
      </span>
      {label}
    </button>
  )
}
