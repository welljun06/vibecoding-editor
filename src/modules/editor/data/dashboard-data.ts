/* ─── Operations-dashboard mock data ──────────────────────────────────
 *
 * The dashboard is read-only in the demo — every project gets a fresh
 * snapshot built from a deterministic per-project seed so the chart
 * shapes feel different across projects without us hand-curating each
 * one. Real product would replace this with backend reads.
 */

export type DashboardChannel = 'all' | 'mini-program' | 'douyin-app' | 'douyin-xiaohua'
export type DashboardTimeRange = 'yesterday' | '7d' | '30d' | '90d' | 'custom'

export const CHANNEL_OPTIONS: Array<{ id: DashboardChannel; label: string }> = [
  { id: 'all', label: '全部渠道' },
  { id: 'mini-program', label: '小程序' },
  { id: 'douyin-app', label: '抖音 APP' },
  { id: 'douyin-xiaohua', label: '抖音小花' },
]

export const TIME_RANGE_OPTIONS: Array<{ id: DashboardTimeRange; label: string }> = [
  { id: 'yesterday', label: '昨天' },
  { id: '7d', label: '近7天' },
  { id: '30d', label: '近30天' },
  { id: '90d', label: '近90天' },
  { id: 'custom', label: '自定义' },
]

export interface KpiCard {
  label: string
  /** Formatted display value (already includes thousands separator). */
  value: string
  /** Percent change vs previous period. Positive = up, negative = down. */
  delta: number
}

export interface ChartSeries {
  name: string
  /** Tailwind-readable color (used by both the path stroke and legend swatch). */
  color: string
  /** Y values; length matches `xLabels.length` in the parent chart. */
  data: number[]
}

export interface SideStatRow {
  label: string
  value: string
  /** Optional delta vs previous period. */
  delta?: number
  /** Optional bullet color (matches a series in the parent chart). */
  color?: string
  /** Hint shown under the value as a subtitle. */
  hint?: string
  /** Nested sub-rows shown below this row, indented. */
  sub?: Array<{ label: string; value: string }>
}

export interface DashboardChart {
  /** Chart panel title — "曝光" / "访问" / "启动" / "对话" etc. */
  title: string
  series: ChartSeries[]
  /** Aligned with `series[i].data`. */
  xLabels: string[]
  /** Right-side breakdown stats column. */
  stats: SideStatRow[]
}

export interface DashboardSection {
  /** Sequence index — drawn in the top-left badge. */
  index: number
  title: string
  charts: DashboardChart[]
}

export interface DashboardSnapshot {
  /** Top-row KPI cards. */
  kpis: KpiCard[]
  /** Body sections — 触达 / 使用 / etc. */
  sections: DashboardSection[]
  /** "环比口径 · 次日更新(T+1)" string shown in the section title bar. */
  comparisonHint: string
}

/* ── Deterministic PRNG (mulberry32) ──────────────────────────────── */

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ── Smooth random series ─────────────────────────────────────────── */

/** Pseudo-random walk with mean-reversion — gives charts that look like
 *  organic traffic rather than the spiky noise of plain `Math.random`.
 *  Returns `n` integer samples in [floor, floor + amp]. */
function smoothSeries(
  rng: () => number,
  n: number,
  floor: number,
  amp: number,
): number[] {
  const out: number[] = []
  let v = floor + amp * 0.5
  for (let i = 0; i < n; i++) {
    const drift = (rng() - 0.5) * amp * 0.32
    const meanRevert = (floor + amp * 0.5 - v) * 0.18
    v = Math.max(floor, Math.min(floor + amp, v + drift + meanRevert))
    out.push(Math.round(v))
  }
  // Inject 1-2 peaks so charts feel like real traffic events
  const peakAt = Math.floor(n * 0.3 + rng() * n * 0.5)
  if (peakAt >= 1 && peakAt < n - 1) {
    out[peakAt] = Math.round(out[peakAt] + amp * 0.6)
    out[peakAt - 1] = Math.round(out[peakAt - 1] + amp * 0.25)
    out[peakAt + 1] = Math.round(out[peakAt + 1] + amp * 0.3)
  }
  return out
}

/** Pretty-print a number with thousands separators. */
function fmt(n: number): string {
  return n.toLocaleString('en-US')
}

/** Generate the days-array x axis labels — e.g. ["12-01", "12-02", …]. */
function xLabelsForRange(rangeId: DashboardTimeRange): string[] {
  const days = rangeId === 'yesterday' ? 1 : rangeId === '7d' ? 7 : rangeId === '30d' ? 30 : 90
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const labels: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(end.getDate() - i)
    labels.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return labels
}

/* ── Snapshot builder ─────────────────────────────────────────────── */

export function buildDashboardSnapshot(
  projectId: string,
  channel: DashboardChannel,
  range: DashboardTimeRange,
): DashboardSnapshot {
  // Seed combines project + filters so swapping a filter regenerates a
  // visibly different chart, but the same (project, channel, range)
  // tuple is stable across re-renders.
  const seed = hashString(`${projectId}|${channel}|${range}`)
  const rng = mulberry32(seed)
  const xLabels = xLabelsForRange(range)
  const n = xLabels.length
  // Channel-specific multiplier — 全部渠道 is bigger than a single channel.
  const channelMul = channel === 'all' ? 1 : channel === 'mini-program' ? 0.42 : channel === 'douyin-app' ? 0.34 : 0.24

  const exposureCount = smoothSeries(rng, n, 800, 1800).map((v) => Math.round(v * channelMul))
  const exposureUsers = exposureCount.map((v) => Math.round(v * (0.55 + rng() * 0.08)))
  const visitCount = exposureCount.map((v) => Math.round(v * (0.32 + rng() * 0.06)))
  const visitUsers = visitCount.map((v) => Math.round(v * (0.68 + rng() * 0.08)))
  const revisitUsers = visitUsers.map((v) => Math.round(v * (0.18 + rng() * 0.04)))
  const launchCount = visitCount.map((v) => Math.round(v * (0.86 + rng() * 0.06)))
  const launchUsers = launchCount.map((v) => Math.round(v * (0.7 + rng() * 0.05)))
  const convCount = visitCount.map((v) => Math.round(v * (0.45 + rng() * 0.1)))
  const convUsers = convCount.map((v) => Math.round(v * (0.7 + rng() * 0.05)))
  const avgDuration = smoothSeries(rng, n, 60, 110).map((v) => Math.round(v * 0.8))
  const avgTurns = smoothSeries(rng, n, 4, 8)

  const sumExposureCount = exposureCount.reduce((a, b) => a + b, 0)
  const sumExposureUsers = exposureUsers.reduce((a, b) => a + b, 0)
  const sumVisitCount = visitCount.reduce((a, b) => a + b, 0)
  const sumVisitUsers = visitUsers.reduce((a, b) => a + b, 0)
  const sumConvCount = convCount.reduce((a, b) => a + b, 0)
  const sumConvUsers = convUsers.reduce((a, b) => a + b, 0)
  const sumLaunchCount = launchCount.reduce((a, b) => a + b, 0)
  const sumLaunchUsers = launchUsers.reduce((a, b) => a + b, 0)
  const sumRevisitUsers = revisitUsers.reduce((a, b) => a + b, 0)
  const sumAvgDuration = Math.round(avgDuration.reduce((a, b) => a + b, 0) / Math.max(1, avgDuration.length))
  const sumAvgTurns = Math.round((avgTurns.reduce((a, b) => a + b, 0) / Math.max(1, avgTurns.length)) * 10) / 10

  // Deltas — vary slightly per metric using rng.
  const d = () => Math.round((1 + rng() * 16) * 100) / 100
  const dMinus = () => -Math.round((0.5 + rng() * 4) * 100) / 100

  const kpis: KpiCard[] = [
    { label: '曝光次数', value: fmt(sumExposureCount), delta: d() },
    { label: '曝光用户数', value: fmt(sumExposureUsers), delta: d() },
    { label: '访问次数', value: fmt(sumVisitCount), delta: rng() > 0.7 ? dMinus() : d() },
    { label: '访问用户数', value: fmt(sumVisitUsers), delta: d() },
    { label: '对话次数', value: fmt(sumConvCount), delta: d() },
    { label: '对话用户数', value: fmt(sumConvUsers), delta: d() },
  ]

  const sections: DashboardSection[] = [
    {
      index: 1,
      title: '触达',
      charts: [
        {
          title: '曝光',
          xLabels,
          series: [
            { name: '曝光次数', color: '#3b82f6', data: exposureCount },
            { name: '曝光用户数', color: '#10b981', data: exposureUsers },
          ],
          stats: [
            {
              label: '曝光次数',
              value: fmt(sumExposureCount),
              delta: d(),
              color: '#3b82f6',
              sub: [
                { label: '视频播放量', value: fmt(Math.round(sumExposureCount * 4.2)) },
                { label: '短视频曝光次数', value: fmt(Math.round(sumExposureCount * 0.7)) },
                { label: '个人页曝光次数', value: fmt(Math.round(sumExposureCount * 0.21)) },
              ],
            },
            {
              label: '曝光用户数',
              value: fmt(sumExposureUsers),
              delta: d(),
              color: '#10b981',
              sub: [
                { label: '短视频曝光用户数', value: fmt(Math.round(sumExposureUsers * 0.18)) },
                { label: '个人页锚点曝光用户数', value: fmt(Math.round(sumExposureUsers * 0.28)) },
              ],
            },
          ],
        },
        {
          title: '访问',
          xLabels,
          series: [
            { name: '访问次数', color: '#3b82f6', data: visitCount },
            { name: '访问用户数', color: '#10b981', data: visitUsers },
            { name: '复访用户数', color: '#f59e0b', data: revisitUsers },
          ],
          stats: [
            {
              label: '访问次数',
              value: fmt(sumVisitCount),
              delta: d(),
              color: '#3b82f6',
              sub: [
                { label: '短视频锚点访问用户数', value: fmt(Math.round(sumVisitCount * 0.42)) },
                { label: '个人页锚点访问用户数', value: fmt(Math.round(sumVisitCount * 0.31)) },
              ],
            },
            {
              label: '访问用户数',
              value: fmt(sumVisitUsers),
              delta: d(),
              color: '#10b981',
              sub: [
                { label: '短视频锚点点击用户数', value: fmt(Math.round(sumVisitUsers * 0.18)) },
                { label: '个人页锚点点击用户数', value: fmt(Math.round(sumVisitUsers * 0.28)) },
              ],
            },
            {
              label: '复访用户数',
              value: fmt(sumRevisitUsers),
              delta: d(),
              color: '#f59e0b',
            },
          ],
        },
        {
          title: '启动',
          xLabels,
          series: [
            { name: '启动次数', color: '#3b82f6', data: launchCount },
            { name: '启动用户', color: '#10b981', data: launchUsers },
          ],
          stats: [
            { label: '启动次数', value: fmt(sumLaunchCount), delta: d(), color: '#3b82f6' },
            { label: '启动用户', value: fmt(sumLaunchUsers), delta: d(), color: '#10b981' },
          ],
        },
      ],
    },
    {
      index: 2,
      title: '使用',
      charts: [
        {
          title: '对话',
          xLabels,
          series: [
            { name: '对话次数', color: '#3b82f6', data: convCount },
            { name: '对话用户数', color: '#10b981', data: convUsers },
            { name: '人均对话时长', color: '#f59e0b', data: avgDuration },
            { name: '人均对话轮数', color: '#06b6d4', data: avgTurns },
          ],
          stats: [
            { label: '对话次数', value: fmt(sumConvCount), delta: d(), color: '#3b82f6' },
            { label: '对话用户数', value: fmt(sumConvUsers), delta: d(), color: '#10b981' },
            { label: '人均对话时长', value: `${sumAvgDuration} 秒`, delta: d(), color: '#f59e0b' },
            { label: '人均对话轮数', value: `${sumAvgTurns}`, delta: d(), color: '#06b6d4' },
          ],
        },
      ],
    },
  ]

  const comparisonHint = '环比口径 · 次日更新（T+1）'

  return { kpis, sections, comparisonHint }
}
