import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  Loader2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { usePersonaStore } from '../../store/persona-store'
import {
  getPlatform,
  getScene,
  PUBLISH_NODES,
  usePublishFlowStore,
  type PublishJob,
  type PublishNodeRun,
  type PublishNodeStatus,
} from '../../store/publish-flow-store'
import { useArtifactStore } from '../../store/artifact-store'
import PublishForm from './PublishForm'

type PublishTab = 'new' | 'history'

/** Popover-style publish flow with tabs — `新发布` for the cascading
 *  pick-scenes form, `历史` for the per-job timeline. Anchored under
 *  the trigger button via `publishFlowStore.anchorRect`. */
export default function PublishFlowModal() {
  const step = usePublishFlowStore((s) => s.step)
  const mode = usePublishFlowStore((s) => s.mode)
  const scenes = usePublishFlowStore((s) => s.scenes)
  const jobs = usePublishFlowStore((s) => s.jobs)
  const anchorRect = usePublishFlowStore((s) => s.anchorRect)
  const toggleScene = usePublishFlowStore((s) => s.toggleScene)
  const submit = usePublishFlowStore((s) => s.submit)
  const confirm = usePublishFlowStore((s) => s.confirm)
  const closeModal = usePublishFlowStore((s) => s.closeModal)
  const personaName = usePersonaStore((s) => s.name)
  const personaPortrait = usePersonaStore((s) => s.portraitUrl)

  const activeProjectId = useArtifactStore((s) => s.activeProjectId)
  const allArtifacts = useArtifactStore((s) => s.artifacts)
  const projectHasSucceededJob = (() => {
    const projectArtifactIds = new Set(
      allArtifacts.filter((a) => a.projectId === activeProjectId).map((a) => a.id),
    )
    return jobs.some(
      (j) =>
        j.status === 'succeeded' &&
        (j.artifactIds.length === 0 ||
          j.artifactIds.some((aid) => projectArtifactIds.has(aid))),
    )
  })()
  const newTabLabel = projectHasSucceededJob ? '更新' : '新发布'

  const open = mode === 'modal' && step !== 'idle'
  const [tab, setTab] = useState<PublishTab>('new')

  useEffect(() => {
    if (!open) return
    // Reset to the new-publish tab whenever the popover opens fresh.
    setTab('new')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeModal])

  if (typeof document === 'undefined') return null

  /* — popover positioning (same as before) — */
  const POPOVER_WIDTH = 520
  const GAP = 8
  let popoverStyle: React.CSSProperties
  if (anchorRect) {
    const top = anchorRect.bottom + GAP
    const right = Math.max(12, window.innerWidth - anchorRect.right)
    popoverStyle = { position: 'fixed', top, right, width: POPOVER_WIDTH, maxWidth: '92vw' }
  } else {
    popoverStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: POPOVER_WIDTH,
      maxWidth: '92vw',
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeModal}
            className="fixed inset-0 z-[290]"
          />
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{ ...popoverStyle, zIndex: 300 }}
            className="flex max-h-[78vh] flex-col overflow-hidden rounded-2xl border border-[var(--divider)] bg-[var(--color-surface-1)] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.55)]"
          >
            {/* Tabs */}
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--divider-soft)] px-3">
              <div className="flex items-center gap-0.5">
                {(
                  [
                    { id: 'new' as const, label: newTabLabel },
                    { id: 'history' as const, label: '历史' },
                  ]
                ).map((t) => {
                  const isActive = tab === t.id
                  const count = t.id === 'history' ? jobs.length : null
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] transition-colors ${
                        isActive
                          ? 'bg-[var(--color-ink)]/[0.08] font-medium text-[var(--color-ink)]'
                          : 'text-[var(--color-ink)]/55 hover:bg-[var(--color-ink)]/[0.04] hover:text-[var(--color-ink)]/85'
                      }`}
                    >
                      <span>{t.label}</span>
                      {count !== null && (
                        <span
                          className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none ${
                            isActive
                              ? 'bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                              : 'bg-[var(--fill-medium)] text-[var(--color-ink)]/75'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="关闭"
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
              >
                <X size={13} strokeWidth={2} />
              </button>
            </div>
            {/* Body */}
            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
              {tab === 'new' ? (
                <div className="px-5 pb-5 pt-3">
                  <PublishForm
                    step={step as 'select' | 'review' | 'confirmed'}
                    scenes={scenes}
                    personaName={personaName}
                    personaPortrait={personaPortrait}
                    onToggle={toggleScene}
                    onSubmit={submit}
                    onConfirm={confirm}
                    variant="modal"
                  />
                  {step === 'confirmed' && (
                    <button
                      type="button"
                      onClick={closeModal}
                      className="mt-4 w-full rounded-md bg-[var(--color-ink)] px-3 py-2 text-[12px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90"
                    >
                      完成
                    </button>
                  )}
                </div>
              ) : (
                <HistoryList jobs={jobs} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ─── History tab ─────────────────────────────────────────────────── */

function HistoryList({ jobs }: { jobs: PublishJob[] }) {
  const [openJobId, setOpenJobId] = useState<string | null>(jobs[0]?.id ?? null)
  if (jobs.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="text-[12.5px] text-[var(--color-ink)]/45">
          还没有任何发布记录
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col">
      {jobs.map((j) => (
        <JobRow
          key={j.id}
          job={j}
          open={openJobId === j.id}
          onToggle={() => setOpenJobId(openJobId === j.id ? null : j.id)}
        />
      ))}
    </div>
  )
}

function JobRow({
  job,
  open,
  onToggle,
}: {
  job: PublishJob
  open: boolean
  onToggle: () => void
}) {
  const totalNodes = job.targets.length * PUBLISH_NODES.length
  const passedNodes = job.targets.reduce(
    (n, t) => n + t.nodes.filter((x) => x.status === 'passed').length,
    0,
  )
  const pct = Math.round((passedNodes / Math.max(1, totalNodes)) * 100)
  return (
    <div className="border-b border-[var(--divider-soft)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--fill-soft)]"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-[12.5px] font-medium text-[var(--color-ink)]">
              {job.title}
            </span>
            <span className={`text-[10.5px] ${statusTone(job.status)}`}>
              ● {statusLabel(job.status)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10.5px] text-[var(--color-ink)]/50">
            <span>{job.id}</span>
            <span>·</span>
            <span>{job.createdBy}</span>
            <span>·</span>
            <span>{relTime(job.createdAt)}</span>
            <span className="ml-auto">{pct}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--fill-subtle)]">
            <div
              className={`h-full ${
                job.status === 'failed'
                  ? 'bg-rose-400/80'
                  : job.status === 'succeeded'
                    ? 'bg-emerald-400/80'
                    : 'bg-amber-400/80'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </button>
      {open && (
        <div className="bg-[var(--fill-subtle)]/40 px-4 pb-4">
          {job.targets.map((t, ti) => {
            const scene = getScene(t.targetId)
            const platform = scene && getPlatform(scene.platformId)
            return (
              <div key={t.targetId} className={ti > 0 ? 'mt-4' : ''}>
                <div className="mb-2 text-[11px] text-[var(--color-ink)]/55">
                  {platform?.label} · {scene?.label}
                </div>
                <NodeTimeline nodes={t.nodes} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Vertical node timeline ─────────────────────────────────────── */

const NODE_STATUS_META: Record<
  PublishNodeStatus,
  { label: string; tone: string; icon: LucideIcon; spin?: boolean }
> = {
  pending: { label: '待执行', tone: 'text-[var(--color-ink)]/40', icon: CircleDashed },
  running: { label: '执行中', tone: 'text-amber-400', icon: Loader2, spin: true },
  passed: { label: '通过', tone: 'text-emerald-400', icon: CheckCircle2 },
  failed: { label: '失败', tone: 'text-rose-400', icon: X },
  'rolled-back': { label: '已回滚', tone: 'text-rose-400', icon: CircleSlash },
}

function NodeTimeline({ nodes }: { nodes: PublishNodeRun[] }) {
  return (
    <ol className="relative ml-1.5 border-l border-[var(--divider)] pl-4">
      {nodes.map((n, idx) => {
        const def = PUBLISH_NODES[idx]
        const meta = NODE_STATUS_META[n.status]
        const Icon = meta.icon
        return (
          <li key={n.id} className="relative mb-3 last:mb-0">
            <span
              className={`absolute -left-[19px] flex h-3 w-3 items-center justify-center rounded-full bg-[var(--color-surface-1)] ${meta.tone}`}
            >
              <Icon
                size={11}
                strokeWidth={2}
                className={meta.spin ? 'animate-spin' : ''}
              />
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] font-medium text-[var(--color-ink)]">
                {def.label}
              </span>
              <span className={`text-[10.5px] ${meta.tone}`}>{meta.label}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-[var(--color-ink)]/50">
              {n.operator && <span>{n.operator}</span>}
              {n.operator && (n.finishedAt || n.startedAt) && <span>·</span>}
              {(n.finishedAt || n.startedAt) && (
                <span>{formatTs((n.finishedAt ?? n.startedAt)!)}</span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ─── Helpers ─────────────────────────────────────────────────────── */

function statusLabel(s: PublishJob['status']): string {
  return {
    draft: '草稿',
    running: '进行中',
    succeeded: '已完成',
    failed: '失败',
    paused: '已暂停',
    'rolled-back': '已回滚',
  }[s]
}

function statusTone(s: PublishJob['status']): string {
  return {
    draft: 'text-[var(--color-ink)]/55',
    running: 'text-amber-400',
    succeeded: 'text-emerald-400',
    failed: 'text-rose-400',
    paused: 'text-[var(--color-ink)]/55',
    'rolled-back': 'text-rose-400',
  }[s]
}

function relTime(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)} 小时前`
  return `${Math.floor(diff / 86_400_000)} 天前`
}

function formatTs(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
