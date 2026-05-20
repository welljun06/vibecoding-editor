import {
  BadgeCheck,
  Boxes,
  ChevronDown,
  ChevronRight,
  Code2,
  Megaphone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  PLAZA_PRIMARIES,
} from './ResourceLibraryData'
import type {
  NewCategoryTreeNode,
  NewPrimaryCategory,
} from './ResourceLibraryData'
import DouyinMark from './icons/DouyinMark'

/** Capability-centric category tree with the legacy 3-section layout:
 *  广场 sticky-top aggregator, scrollable middle (the 7 plaza
 *  primaries), 空间 sticky-bottom footer. Each primary's leading slot
 *  carries a coloured tile so the rows pick up the same visual
 *  language as the old 官方 / 空间 aggregator rows. */

type TilePrimaryIcon =
  | { kind: 'bare-douyin' }
  | { kind: 'tile'; icon: LucideIcon; tileClass: string }

const PRIMARY_ICONS: Record<NewPrimaryCategory, TilePrimaryIcon> = {
  抖音: { kind: 'bare-douyin' },
  灵感创作: {
    kind: 'tile',
    icon: Sparkles,
    tileClass:
      'bg-[#f1eef9] text-[#5720b7] dark:bg-violet-500/15 dark:text-violet-300',
  },
  数据分析和处理: {
    kind: 'tile',
    icon: TrendingUp,
    tileClass:
      'bg-[#e9f8ee] text-[#007d47] dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  开发工具: {
    kind: 'tile',
    icon: Code2,
    tileClass:
      'bg-[#eaf6f7] text-[#0a7d8a] dark:bg-cyan-500/15 dark:text-cyan-300',
  },
  安全审核: {
    kind: 'tile',
    icon: ShieldCheck,
    tileClass:
      'bg-[#fdeee3] text-[#b9510a] dark:bg-amber-500/15 dark:text-amber-300',
  },
  办公效率: {
    kind: 'tile',
    icon: Megaphone,
    tileClass:
      'bg-[#fce7f6] text-[#b6156b] dark:bg-pink-500/15 dark:text-pink-300',
  },
  其他: {
    kind: 'tile',
    icon: Boxes,
    tileClass:
      'bg-[var(--fill-subtle)] text-[var(--color-ink)]/55',
  },
  空间: {
    kind: 'tile',
    icon: Boxes,
    tileClass:
      'bg-[#f1eef9] text-[#5720b7] dark:bg-violet-500/15 dark:text-violet-300',
  },
}

interface ResourceCategoryTreeProps {
  tree: NewCategoryTreeNode[]
  expandedPrimary: Set<NewPrimaryCategory>
  onTogglePrimary: (primary: NewPrimaryCategory) => void
  selectedPrimary: NewPrimaryCategory | null
  selectedSecondary: string | null
  onSelect: (
    primary: NewPrimaryCategory | null,
    secondary: string | null,
  ) => void
  /** Per-secondary capability count, keyed by `${primary}::${secondary}`. */
  countMap: Map<string, number>
  /** Per-secondary intrinsic count (unfiltered) — drives the "0" vs
   *  "待接入" distinction in the leaf badges. */
  intrinsicCountMap: Map<string, number>
  /** When true, hide leaves whose displayed count is 0 (incl. 待接入). */
  isFiltering: boolean
}

export default function ResourceCategoryTree({
  tree,
  expandedPrimary,
  onTogglePrimary,
  onSelect,
  countMap,
  intrinsicCountMap,
  isFiltering,
}: ResourceCategoryTreeProps) {
  const plazaNodes = tree.filter((n) => PLAZA_PRIMARIES.includes(n.primary))
  const spaceNode = tree.find((n) => n.primary === '空间') ?? null
  // 广场 aggregator = sum of all matching capabilities across the plaza
  // primaries (matches the totalCount the user observed in Figma).
  let plazaTotal = 0
  let plazaIntrinsicTotal = 0
  for (const node of plazaNodes) {
    for (const sec of node.secondaries) {
      plazaTotal += countMap.get(`${node.primary}::${sec}`) ?? 0
      plazaIntrinsicTotal += intrinsicCountMap.get(`${node.primary}::${sec}`) ?? 0
    }
  }
  const plazaZeroLabel = plazaIntrinsicTotal > 0 ? '0' : '待接入'

  return (
    // Single scroll container — 广场 / 空间 sticky-pin only when the
    // middle list overflows. When filtering shrinks the middle, 空间
    // flows naturally right after it (no phantom gap at the bottom of
    // the viewport).
    <div className="thin-scroll flex h-full flex-col overflow-y-auto bg-white">
      {/* ─── 广场 aggregator (sticky top) ─── */}
      <button
        type="button"
        onClick={() => onSelect(null, null)}
        className="sticky top-0 z-[5] flex shrink-0 items-center gap-1.5 bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#f3f3f3]"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#eff8ff] text-[#3370ff] dark:bg-sky-500/15 dark:text-sky-300">
          <BadgeCheck size={12} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-[18px] text-[var(--color-ink)]/85">
          广场
        </span>
        <PillBadge value={plazaTotal} zeroLabel={plazaZeroLabel} />
      </button>

      {/* ─── Middle content (no flex-1 — let it size to content so the
           sticky-bottom 空间 footer can flow up when filtered) ─── */}
      <div className="flex flex-col gap-1 pt-1">
        {plazaNodes.map(({ primary, secondaries }) => {
          const expanded = expandedPrimary.has(primary)
          const ChevIcon = expanded ? ChevronDown : ChevronRight
          const totalCount = secondaries.reduce(
            (sum, sec) => sum + (countMap.get(`${primary}::${sec}`) ?? 0),
            0,
          )
          const intrinsicTotal = secondaries.reduce(
            (sum, sec) => sum + (intrinsicCountMap.get(`${primary}::${sec}`) ?? 0),
            0,
          )
          const primaryZeroLabel = intrinsicTotal > 0 ? '0' : '待接入'
          if (isFiltering && totalCount === 0) return null
          const iconSpec = PRIMARY_ICONS[primary]
          return (
            <div key={primary} className="shrink-0 pl-4 pr-2">
              <div className="group flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] transition-colors hover:bg-[var(--fill-hover)]">
                <button
                  type="button"
                  aria-label={expanded ? '收起' : '展开'}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTogglePrimary(primary)
                  }}
                  className={
                    iconSpec.kind === 'tile'
                      ? // Default: tinted tile + icon. On row hover the
                        // tint drops (bg goes transparent) and the icon
                        // swaps to the chevron — just the chevron, no
                        // background. Hovering the slot itself layers
                        // the neutral grey bg back in as the click
                        // affordance for the expand button.
                        `relative flex h-[14px] w-[14px] shrink-0 items-center justify-center overflow-hidden rounded-[3.5px] transition-colors group-hover:!bg-transparent hover:!bg-[var(--color-ink)]/10 ${iconSpec.tileClass}`
                      : 'relative flex h-[14px] w-[14px] shrink-0 items-center justify-center overflow-hidden rounded-[3.5px] text-[var(--color-ink)]/70 transition-colors hover:bg-[var(--color-ink)]/10 hover:text-[var(--color-ink)]'
                  }
                >
                  {iconSpec.kind === 'bare-douyin' ? (
                    <DouyinMark
                      size={14}
                      className="absolute transition-opacity duration-100 group-hover:opacity-0"
                    />
                  ) : (
                    <iconSpec.icon
                      size={8}
                      strokeWidth={1.8}
                      className="absolute transition-opacity duration-100 group-hover:opacity-0"
                    />
                  )}
                  <ChevIcon
                    size={11}
                    strokeWidth={2}
                    className="absolute text-[var(--color-ink)]/70 opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(primary, null)}
                  className="flex min-w-0 flex-1 items-center justify-between text-left"
                >
                  <span className="min-w-0 truncate text-[13px] font-medium leading-[18px] text-[var(--color-ink)]/85">
                    {primary}
                  </span>
                  <span className="ml-2 shrink-0 text-[12px] leading-4 text-[var(--color-ink)]/35">
                    {totalCount === 0 ? primaryZeroLabel : totalCount}
                  </span>
                </button>
              </div>

              {expanded && secondaries.length > 0 && (
                // Indent chosen so the leaf text aligns with the primary
                // text x. Math: outer pl-4 (16) + this pl-[15px] (15)
                // + 1 (border) + leaf pl-3 (12) = 44px, matching the
                // primary's outer 16 + inner px-2 (8) + icon 14 +
                // gap-1.5 (6) = 44px.
                <div className="pl-[15px] pt-1">
                  <div className="flex flex-col gap-1 border-l border-[rgba(16,18,24,0.08)] pl-px dark:border-[rgba(255,255,255,0.08)]">
                    {secondaries.map((sec) => {
                      const count = countMap.get(`${primary}::${sec}`) ?? 0
                      const intrinsic =
                        intrinsicCountMap.get(`${primary}::${sec}`) ?? 0
                      const isPending = intrinsic === 0
                      if (isFiltering && (count === 0 || isPending)) return null
                      if (isPending) {
                        return (
                          <div
                            key={sec}
                            aria-disabled
                            title={`${sec} 接入中`}
                            className="flex h-7 cursor-not-allowed items-center gap-2 rounded-md py-1 pl-3 pr-2 text-[13px] text-[var(--color-ink)]/80"
                          >
                            <span className="min-w-0 flex-1 truncate text-left leading-[18px]">
                              {sec}
                            </span>
                            <span className="shrink-0 text-[12px] leading-4 text-[var(--color-ink)]/35">
                              待接入
                            </span>
                          </div>
                        )
                      }
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => onSelect(primary, sec)}
                          className="flex h-7 items-center gap-2 rounded-md py-1 pl-3 pr-2 text-[13px] text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
                        >
                          <span className="min-w-0 flex-1 truncate text-left leading-[18px]">
                            {sec}
                          </span>
                          <span className="shrink-0 text-[12px] leading-4 text-[var(--color-ink)]/35">
                            {count}
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

      {/* ─── 空间 footer (sticky bottom) ─── */}
      {spaceNode && (() => {
        const totalCount = spaceNode.secondaries.reduce(
          (sum, sec) =>
            sum + (countMap.get(`${spaceNode.primary}::${sec}`) ?? 0),
          0,
        )
        return (
          <button
            type="button"
            onClick={() => onSelect(spaceNode.primary, null)}
            className={`sticky bottom-0 z-[5] flex shrink-0 items-center gap-1.5 border-t border-[var(--divider-soft)] bg-white px-3 py-3 text-left transition-colors hover:bg-[#f3f3f3] ${
              plazaTotal > 0 ? 'mt-3' : ''
            }`}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#f1eef9] text-[#5720b7] dark:bg-violet-500/15 dark:text-violet-300">
              <Boxes size={12} strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-[18px] text-[var(--color-ink)]/85">
              {spaceNode.primary}
            </span>
            <PillBadge value={totalCount} zeroLabel="0" />
          </button>
        )
      })()}
    </div>
  )
}

function PillBadge({
  value,
  zeroLabel = '待接入',
}: {
  value: number
  zeroLabel?: string
}) {
  const label = value === 0 ? zeroLabel : value
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-white bg-[var(--fill-subtle)] px-1.5 py-px text-[12px] leading-4 text-[var(--color-ink)]/55 dark:border-[var(--color-surface-0)]">
      {label}
    </span>
  )
}
