import { Clock, TrendingUp } from 'lucide-react'
import type { Capability, Resource } from './ResourceLibraryData'
import { CAPABILITY_LABEL, inferCapabilityTag } from './ResourceLibraryData'
import { CAPABILITY_TYPE_TONE, capabilityVisual } from './ResourceIconMap'
import {
  formatCallCount,
  formatRelativeDays,
  mockCallCount,
  mockHealthStatus,
  mockOwner,
  mockUpdatedDays,
  ownerAvatarTone,
  type HealthStatus,
} from './ResourceMockMetrics'

const HEALTH_VISUAL: Record<HealthStatus, { label: string; dot: string; text: string }> = {
  healthy: {
    label: '健康',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    label: '需关注',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
  },
  unhealthy: {
    label: '异常',
    dot: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
  },
}

/**
 * Rich card layout — banner with a colored gradient + grain texture
 * holding a frosted-glass icon, then title / description / arrow CTA
 * underneath. Selected via the layout toggle in ResourceLibraryView's
 * filter row. Compact card stays the default for dense browsing.
 */

interface RichCapabilityCardProps {
  capability: Capability
  platform: Resource
  onClick: () => void
}

/* Pre-rendered banner backgrounds (png) shipped from /public/bg/blue.
 * Hashed by capability seed so each card picks a stable image and the
 * rotation looks varied across a grid. Add new files to
 * public/bg/blue/ and append the path here to expand. */
const BANNERS: string[] = Array.from(
  { length: 15 },
  (_, i) => `/bg/blue/blue-${i + 1}.png`,
)

function hashIdx(s: string, mod: number): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % mod
}

export default function RichCapabilityCard({
  capability,
  platform,
  onClick,
}: RichCapabilityCardProps) {
  const { icon: Icon } = capabilityVisual(capability)
  const seed = `${platform.id}::${capability.name}::${capability.category ?? ''}`
  const banner = BANNERS[hashIdx(seed, BANNERS.length)]
  const description = capabilityDescription(capability, platform)
  const owner = mockOwner(seed)
  const ownerInitial = ownerInitialChar(owner)
  const ownerTone = ownerAvatarTone(owner)
  const updatedDays = mockUpdatedDays(seed)
  const callCount = mockCallCount(seed)
  const healthVisual =
    capability.type === 'skill'
      ? HEALTH_VISUAL[mockHealthStatus(seed)]
      : null
  return (
    <button
      type="button"
      onClick={onClick}
      title={capability.name}
      className="group flex flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--divider-soft)] bg-[var(--color-surface-0)] p-2 text-left transition-colors hover:border-[var(--color-ink)]/20 hover:bg-[var(--fill-subtle)]"
    >
      {/* Banner — pre-rendered ColorFlow mesh gradient + frosted icon. */}
      <div className="relative h-[72px] w-full overflow-hidden rounded-xl bg-[var(--fill-subtle)]">
        <img
          src={banner}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Centered frosted-glass icon tile. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/12 text-white backdrop-blur-md"
            style={{
              boxShadow:
                'inset 0 0 0 0.5px rgba(255,255,255,0.18), 0 3px 10px -6px rgba(0,0,0,0.22)',
            }}
          >
            <Icon size={20} strokeWidth={1.6} />
          </span>
        </div>
      </div>

      {/* Body — title / description / meta row. */}
      <div className="flex flex-col gap-1.5 px-2 pb-2 pt-1">
        <div className="flex items-center gap-2">
          <h4 className="line-clamp-1 min-w-0 flex-1 text-[14px] font-semibold leading-[1.3] text-[var(--color-ink)]">
            {capability.name}
          </h4>
          {healthVisual && (
            <span
              className={`inline-flex shrink-0 items-center gap-1 text-[11px] ${healthVisual.text}`}
            >
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${healthVisual.dot}`} />
              {healthVisual.label}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${CAPABILITY_TYPE_TONE[capability.type]}`}
          >
            {CAPABILITY_LABEL[capability.type]}
          </span>
          <span className="rounded-md bg-[var(--fill-subtle)] px-1.5 py-0.5 text-[11px] text-[var(--color-ink)]/70">
            {inferCapabilityTag(capability.name)}
          </span>
        </div>
        <p className="line-clamp-1 text-[12px] leading-[1.55] text-[var(--color-ink)]/55">
          {description}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink)]/55">
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-medium ${ownerTone}`}
          >
            {ownerInitial}
          </span>
          <span className="min-w-0 truncate text-[var(--color-ink)]/75">
            {owner}
          </span>
          <span className="text-[var(--color-ink)]/25">·</span>
          <span className="inline-flex shrink-0 items-center gap-0.5">
            <Clock size={10.5} strokeWidth={1.6} />
            {formatRelativeDays(updatedDays)}
          </span>
          <span className="text-[var(--color-ink)]/25">·</span>
          <span className="inline-flex shrink-0 items-center gap-0.5">
            <TrendingUp size={10.5} strokeWidth={1.6} />
            {formatCallCount(callCount)}
          </span>
        </div>
      </div>
    </button>
  )
}

function ownerInitialChar(name: string): string {
  for (const ch of name) {
    if (ch.trim()) return ch.toUpperCase()
  }
  return '?'
}

function capabilityDescription(cap: Capability, platform: Resource): string {
  if (cap.description) return cap.description
  const typeDesc = {
    skill: '可调用的智能技能',
    tool: '可触发的功能工具',
    knowledge: '可检索的知识库',
  }[cap.type]
  return `${platform.name} · ${typeDesc}${cap.category ? ` · ${cap.category}` : ''}`
}
