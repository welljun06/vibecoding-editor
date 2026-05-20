import { useMemo, useState } from 'react'
import { ChartLine, ChevronDown, ChevronUp } from 'lucide-react'
import {
  buildDashboardSnapshot,
  CHANNEL_OPTIONS,
  TIME_RANGE_OPTIONS,
  type DashboardChannel,
  type DashboardChart,
  type DashboardSection,
  type DashboardSnapshot,
  type DashboardTimeRange,
  type KpiCard,
  type SideStatRow,
} from '../../data/dashboard-data'

interface Props {
  projectId: string
}

type SubTabId = 'metrics' | 'audience' | 'performance'

const SUB_TABS: Array<{ id: SubTabId; label: string }> = [
  { id: 'metrics', label: '运营数据' },
  { id: 'audience', label: '用户画像' },
  { id: 'performance', label: '性能数据' },
]

export default function DashboardModule({ projectId }: Props) {
  const [channel, setChannel] = useState<DashboardChannel>('mini-program')
  const [range, setRange] = useState<DashboardTimeRange>('30d')
  const [subTab, setSubTab] = useState<SubTabId>('metrics')
  const [filterOpenChannel, setFilterOpenChannel] = useState(true)
  const [filterOpenRange, setFilterOpenRange] = useState(true)

  const snapshot = useMemo(
    () => buildDashboardSnapshot(projectId, channel, range),
    [projectId, channel, range],
  )

  return (
    <div className="flex min-h-0 flex-1">
      {/* ── Left filter panel ── */}
      <FilterPanel
        channel={channel}
        range={range}
        onChannel={setChannel}
        onRange={setRange}
        openChannel={filterOpenChannel}
        openRange={filterOpenRange}
        toggleChannel={() => setFilterOpenChannel((v) => !v)}
        toggleRange={() => setFilterOpenRange((v) => !v)}
      />
      {/* ── Right main column ── */}
      <div className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--color-surface-0)]">
        {/* Sub-tab strip */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--divider-soft)] bg-[var(--color-surface-1)]/40 px-4">
          <div className="flex items-center gap-3">
            {SUB_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`relative h-10 text-[13px] transition-colors ${
                  subTab === t.id
                    ? 'text-[var(--color-ink)]'
                    : 'text-[var(--color-ink)]/50 hover:text-[var(--color-ink)]/80'
                }`}
              >
                {t.label}
                {subTab === t.id && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[var(--color-ink)]" />
                )}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[var(--color-ink)]/45">{snapshot.comparisonHint}</span>
        </div>

        {subTab === 'metrics' && <MetricsTab snapshot={snapshot} />}
        {subTab === 'audience' && (
          <UpcomingTab
            title="用户画像"
            description="按性别 / 地域 / 设备 / 兴趣维度拆解的用户分布，下一轮接入。"
          />
        )}
        {subTab === 'performance' && (
          <UpcomingTab
            title="性能数据"
            description="渲染时延、模型耗时、错误率与回归历史，下一轮接入。"
          />
        )}
      </div>
    </div>
  )
}

/* ─── Filter panel ────────────────────────────────────────────────── */

function FilterPanel({
  channel,
  range,
  onChannel,
  onRange,
  openChannel,
  openRange,
  toggleChannel,
  toggleRange,
}: {
  channel: DashboardChannel
  range: DashboardTimeRange
  onChannel: (v: DashboardChannel) => void
  onRange: (v: DashboardTimeRange) => void
  openChannel: boolean
  openRange: boolean
  toggleChannel: () => void
  toggleRange: () => void
}) {
  return (
    <aside className="flex w-[224px] shrink-0 flex-col gap-3 border-r border-[var(--divider-soft)] bg-[var(--color-surface-0)] p-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] font-medium text-[var(--color-ink)]/85">筛选</span>
      </div>
      <FilterGroup label="发布渠道" open={openChannel} onToggle={toggleChannel}>
        {CHANNEL_OPTIONS.map((opt) => (
          <RadioRow
            key={opt.id}
            label={opt.label}
            checked={channel === opt.id}
            onClick={() => onChannel(opt.id)}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="时间范围" open={openRange} onToggle={toggleRange}>
        {TIME_RANGE_OPTIONS.map((opt) => (
          <RadioRow
            key={opt.id}
            label={opt.label}
            checked={range === opt.id}
            onClick={() => onRange(opt.id)}
          />
        ))}
      </FilterGroup>
    </aside>
  )
}

function FilterGroup({
  label,
  open,
  onToggle,
  children,
}: {
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-[var(--divider-soft)] bg-[var(--color-surface-1)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-t-lg px-3 py-2 text-left text-[12px] font-medium text-[var(--color-ink)]/85 hover:bg-[var(--fill-soft)]"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-[var(--color-ink)]/55">·</span>
          {label}
        </span>
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && <div className="flex flex-col gap-0.5 px-2 pb-2">{children}</div>}
    </section>
  )
}

function RadioRow({
  label,
  checked,
  onClick,
}: {
  label: string
  checked: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 items-center gap-2 rounded-md px-2 text-left text-[12px] transition-colors ${
        checked
          ? 'bg-[var(--fill-medium)] text-[var(--color-ink)]'
          : 'text-[var(--color-ink)]/70 hover:bg-[var(--fill-soft)]'
      }`}
    >
      <span
        className={`relative flex h-3 w-3 items-center justify-center rounded-full border ${
          checked ? 'border-[var(--color-ink)]' : 'border-[var(--divider)]'
        }`}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]" />}
      </span>
      <span>{label}</span>
    </button>
  )
}

/* ─── Metrics tab body ────────────────────────────────────────────── */

function MetricsTab({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* KPI row */}
      <div className="rounded-xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)] p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--fill-medium)] text-[var(--color-ink)]/75">
            <ChartLine size={11} strokeWidth={1.7} />
          </span>
          <span className="text-[13px] font-semibold text-[var(--color-ink)]">运营数据</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 @md:grid-cols-3 @lg:grid-cols-6">
          {snapshot.kpis.map((k) => (
            <KpiCardView key={k.label} kpi={k} />
          ))}
        </div>
      </div>
      {/* Sections */}
      {snapshot.sections.map((sec) => (
        <SectionBlock key={sec.index} section={sec} />
      ))}
    </div>
  )
}

function KpiCardView({ kpi }: { kpi: KpiCard }) {
  const up = kpi.delta >= 0
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11.5px] text-[var(--color-ink)]/55">{kpi.label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[22px] font-semibold tabular-nums text-[var(--color-ink)]">
          {kpi.value}
        </span>
        <span className={`text-[11px] ${up ? 'text-rose-400' : 'text-emerald-400'}`}>
          {up ? '+' : ''}
          {kpi.delta}% {up ? '▲' : '▼'}
        </span>
      </div>
    </div>
  )
}

/* ─── Section ─────────────────────────────────────────────────────── */

function SectionBlock({ section }: { section: DashboardSection }) {
  return (
    <section className="rounded-xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 text-[11px] font-semibold text-blue-400">
          {section.index}
        </span>
        <span className="text-[13px] font-semibold text-[var(--color-ink)]">{section.title}</span>
      </div>
      <div className="flex flex-col gap-4">
        {section.charts.map((c) => (
          <ChartBlock key={c.title} chart={c} />
        ))}
      </div>
    </section>
  )
}

function ChartBlock({ chart }: { chart: DashboardChart }) {
  return (
    <div className="grid grid-cols-1 gap-4 @lg:grid-cols-[1fr_240px]">
      <div className="rounded-lg bg-[var(--color-surface-0)] p-3 ring-1 ring-[var(--divider-soft)]">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-medium text-[var(--color-ink)]/90">{chart.title}</span>
          <ChartLegend chart={chart} />
        </div>
        <LineChart chart={chart} />
        <ChartXAxis labels={chart.xLabels} />
      </div>
      <aside className="flex flex-col gap-3 rounded-lg bg-[var(--color-surface-0)] p-3 ring-1 ring-[var(--divider-soft)]">
        <div className="flex items-baseline justify-between text-[11px] text-[var(--color-ink)]/55">
          <span>{chart.title}</span>
          <span className="font-mono text-[10.5px]">
            ({chart.xLabels[0]} ～ {chart.xLabels[chart.xLabels.length - 1]})
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {chart.stats.map((s) => (
            <StatRow key={s.label} row={s} />
          ))}
        </div>
      </aside>
    </div>
  )
}

function ChartLegend({ chart }: { chart: DashboardChart }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chart.series.map((s) => (
        <span key={s.name} className="inline-flex items-center gap-1 text-[10.5px] text-[var(--color-ink)]/65">
          <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  )
}

function StatRow({ row }: { row: SideStatRow }) {
  const up = (row.delta ?? 0) >= 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="flex items-center gap-1.5 text-[var(--color-ink)]/80">
          {row.color && (
            <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
          )}
          {row.label}
        </span>
        <span className="flex items-baseline gap-1">
          <span className="font-semibold tabular-nums text-[var(--color-ink)]">{row.value}</span>
          {row.delta !== undefined && (
            <span className={`text-[10.5px] ${up ? 'text-rose-400' : 'text-emerald-400'}`}>
              {up ? '↑' : '↓'} {Math.abs(row.delta).toFixed(2)}%
            </span>
          )}
        </span>
      </div>
      {row.sub && (
        <div className="ml-3.5 flex flex-col gap-0.5">
          {row.sub.map((s) => (
            <div
              key={s.label}
              className="flex items-baseline justify-between text-[10.5px] text-[var(--color-ink)]/55"
            >
              <span>{s.label}</span>
              <span className="font-mono tabular-nums text-[var(--color-ink)]/75">{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── SVG line chart ──────────────────────────────────────────────── */

function LineChart({ chart }: { chart: DashboardChart }) {
  const width = 640
  const height = 180
  const padding = { top: 8, right: 8, bottom: 4, left: 8 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  // Find max across all series so they share a Y axis.
  const allValues = chart.series.flatMap((s) => s.data)
  const max = Math.max(1, ...allValues)
  const min = 0

  const xAt = (i: number, n: number) => padding.left + (innerW * i) / Math.max(1, n - 1)
  const yAt = (v: number) =>
    padding.top + innerH - ((v - min) / (max - min)) * innerH

  // Build the path string with smooth Catmull–Rom-like curves.
  function pathFor(values: number[]): string {
    const n = values.length
    if (n === 0) return ''
    let d = `M ${xAt(0, n)} ${yAt(values[0])}`
    for (let i = 1; i < n; i++) {
      const x0 = xAt(i - 1, n)
      const y0 = yAt(values[i - 1])
      const x1 = xAt(i, n)
      const y1 = yAt(values[i])
      const cx = (x0 + x1) / 2
      d += ` Q ${cx} ${y0} ${cx} ${(y0 + y1) / 2}`
      d += ` Q ${cx} ${y1} ${x1} ${y1}`
    }
    return d
  }

  // Y gridlines — 4 evenly spaced.
  const gridYs = [0.0, 0.33, 0.66, 1.0].map(
    (t) => padding.top + innerH - t * innerH,
  )

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${chart.title} 折线图`}
      className="block w-full"
      style={{ height: 180 }}
    >
      {/* gridlines */}
      {gridYs.map((y, i) => (
        <line
          key={i}
          x1={padding.left}
          x2={width - padding.right}
          y1={y}
          y2={y}
          stroke="currentColor"
          strokeOpacity={0.07}
          strokeDasharray="3 4"
        />
      ))}
      {chart.series.map((s) => (
        <g key={s.name}>
          <path
            d={pathFor(s.data)}
            fill="none"
            stroke={s.color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </svg>
  )
}

function ChartXAxis({ labels }: { labels: string[] }) {
  // Show ~6 ticks max — sample evenly.
  const max = 8
  const step = Math.max(1, Math.ceil(labels.length / max))
  const ticks = labels.filter((_, i) => i % step === 0 || i === labels.length - 1)
  return (
    <div className="mt-1 flex justify-between px-1 font-mono text-[9.5px] text-[var(--color-ink)]/40">
      {ticks.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  )
}

/* ─── Placeholder for the two non-built sub-tabs ──────────────────── */

function UpcomingTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="flex max-w-[380px] flex-col items-center gap-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--fill-medium)] text-[var(--color-ink)]/55">
          <ChartLine size={20} strokeWidth={1.4} />
        </span>
        <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">{title}</h2>
        <p className="text-[12px] leading-[1.6] text-[var(--color-ink)]/55">{description}</p>
        <span className="mt-1 inline-flex h-5 items-center rounded-full bg-[var(--fill-subtle)] px-2 text-[10.5px] text-[var(--color-ink)]/55 ring-1 ring-[var(--divider-soft)]">
          敬请期待
        </span>
      </div>
    </div>
  )
}
