import {
  BadgeCheck,
  Boxes,
  ChevronDown,
  ChevronRight,
  Plug,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { OFFICIAL_DOMAINS } from './ResourceLibraryData'
import type {
  CategoryTreeNode,
  PrimaryCategory,
} from './ResourceLibraryData'
import DouyinMark from './icons/DouyinMark'

/* Renderer per primary category. Most use a lucide icon (rendered inside
 * the standard fill-subtle tile); 官方 uses the colored 抖音 mark, which
 * paints its own dark tile so the parent skips its background. */
type PrimaryRenderer = { kind: 'lucide'; icon: LucideIcon } | { kind: 'douyin' }

const PRIMARY_RENDERER: Record<PrimaryCategory, PrimaryRenderer> = {
  官方: { kind: 'lucide', icon: BadgeCheck },
  业务平台: { kind: 'douyin' },
  舆情监控: { kind: 'douyin' },
  内容理解与生成: { kind: 'douyin' },
  数据分析和处理: { kind: 'douyin' },
  开发和效率: { kind: 'douyin' },
  官方引入: { kind: 'lucide', icon: Plug },
  空间: { kind: 'lucide', icon: Boxes },
}

interface ResourceCategoryTreeProps {
  tree: CategoryTreeNode[]
  expandedPrimary: Set<PrimaryCategory>
  onTogglePrimary: (primary: PrimaryCategory) => void
  selectedPrimary: PrimaryCategory | null
  selectedSecondary: string | null
  onSelect: (primary: PrimaryCategory | null, secondary: string | null) => void
  /** Per-secondary resource count, keyed by `${primary}::${secondary}`. */
  countMap: Map<string, number>
  /** Total count for the 官方 aggregator (it has no own secondaries). */
  officialTotal: number
}

export default function ResourceCategoryTree({
  tree,
  expandedPrimary,
  onTogglePrimary,
  selectedPrimary,
  selectedSecondary,
  onSelect,
  countMap,
  officialTotal,
}: ResourceCategoryTreeProps) {
  return (
    <div className="thin-scroll flex h-full flex-col overflow-y-auto bg-[var(--color-surface-0)]/50 px-2 py-2">
      {tree.map(({ primary, secondaries }) => {
        const renderer = PRIMARY_RENDERER[primary]
        const isPrimaryActive =
          selectedPrimary === primary && selectedSecondary === null
        const isCustomMark = renderer.kind === 'douyin'
        // 空间 has no "integration" concept — empty bucket reads as "0".
        const zeroLabel = primary === '空间' ? '0' : '待接入'
        // 官方 is a virtual aggregator. It has no own secondaries; the
        // row just selects-all-official with no expand affordance.
        const isAggregator = primary === '官方'
        if (isAggregator) {
          const AggIcon =
            renderer.kind === 'lucide' ? renderer.icon : BadgeCheck
          return (
            <div key={primary} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(primary, null)}
                className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                  isPrimaryActive
                    ? 'bg-[var(--fill-hover)] text-[var(--color-ink)]'
                    : 'text-[var(--color-ink)]/85 hover:bg-[var(--fill-hover)]'
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--fill-subtle)] text-[var(--color-ink)]/70">
                  <AggIcon size={12} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1 truncate text-left font-medium">
                  {primary}
                </span>
                <CountBadge value={officialTotal} />
              </button>
            </div>
          )
        }
        const expanded = expandedPrimary.has(primary)
        const ChevIcon = expanded ? ChevronDown : ChevronRight
        const totalCount = secondaries.reduce(
          (sum, sec) => sum + (countMap.get(`${primary}::${sec}`) ?? 0),
          0,
        )
        // Domains under 官方 indent right so they read as a sub-group of
        // the aggregator above them; standalone primaries (空间) keep the
        // flush-left position.
        const isOfficial = OFFICIAL_DOMAINS.includes(primary)
        return (
          <div
            key={primary}
            className={`shrink-0 ${isOfficial ? 'pl-3' : ''}`}
          >
            <div
              className={`group flex w-full items-center gap-1.5 rounded-md pl-2 pr-2 text-[13px] transition-colors ${
                isPrimaryActive
                  ? 'bg-[var(--fill-hover)] text-[var(--color-ink)]'
                  : 'text-[var(--color-ink)]/85 hover:bg-[var(--fill-hover)]'
              }`}
            >
              <button
                type="button"
                aria-label={expanded ? '收起' : '展开'}
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePrimary(primary)
                }}
                className={`relative my-1.5 flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-md text-[var(--color-ink)]/70 transition-colors hover:bg-[var(--color-ink)]/10 hover:text-[var(--color-ink)] ${
                  isCustomMark ? '' : 'bg-[var(--fill-subtle)]'
                }`}
              >
                {renderer.kind === 'lucide' ? (
                  <renderer.icon
                    size={12}
                    strokeWidth={1.8}
                    className="absolute transition-opacity duration-100 group-hover:opacity-0"
                  />
                ) : (
                  <DouyinMark
                    size={20}
                    className="absolute transition-opacity duration-100 group-hover:opacity-0"
                  />
                )}
                <ChevIcon
                  size={12}
                  strokeWidth={2}
                  className="absolute opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                />
              </button>
              <button
                type="button"
                onClick={() => onSelect(primary, null)}
                className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left"
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {primary}
                </span>
                <CountBadge value={totalCount} zeroLabel={zeroLabel} />
              </button>
            </div>

            {expanded && secondaries.length > 0 && (
              <div className="relative ml-[18px] border-l border-[var(--divider-soft)]">
                {secondaries.map((sec) => {
                  const isActive =
                    selectedPrimary === primary && selectedSecondary === sec
                  const count = countMap.get(`${primary}::${sec}`) ?? 0
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onSelect(primary, sec)}
                      className={`flex w-full items-center gap-2 rounded-md py-1 pl-4 pr-2 text-[13px] transition-colors ${
                        isActive
                          ? 'bg-[var(--fill-hover)] text-[var(--color-ink)]'
                          : 'text-[var(--color-ink)]/75 hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate text-left">
                        {sec}
                      </span>
                      <CountBadge value={count} zeroLabel={zeroLabel} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Trailing badge on each tree row. 0 → "待接入" by default so empty
 *  buckets communicate "coming soon" instead of looking real-but-empty.
 *  Caller can override `zeroLabel` (e.g. 空间 has no integration
 *  concept, so it just shows "0"). */
function CountBadge({
  value,
  zeroLabel = '待接入',
}: {
  value: number
  zeroLabel?: string
}) {
  return (
    <span className="shrink-0 text-[11px] text-[var(--color-ink)]/35">
      {value === 0 ? zeroLabel : value}
    </span>
  )
}
