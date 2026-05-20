import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  CircleSlash,
  Clock,
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import {
  PUBLISH_NODES,
  PUBLISH_PLATFORMS,
  getPlatform,
  getScene,
  parseTargetId,
  targetId,
  usePublishFlowStore,
  type PublishJob,
  type PublishNodeId,
  type PublishNodeRun,
  type PublishNodeStatus,
  type PublishTargetId,
} from '../../store/publish-flow-store'
import { useArtifactStore } from '../../store/artifact-store'

interface Props {
  projectId: string
}

const NODE_STATUS_META: Record<
  PublishNodeStatus,
  { label: string; tone: string; icon: typeof Check }
> = {
  pending: { label: '待执行', tone: 'text-[var(--color-ink)]/45', icon: CircleDashed },
  running: { label: '执行中', tone: 'text-amber-300', icon: Loader2 },
  passed: { label: '通过', tone: 'text-emerald-300', icon: CheckCircle2 },
  failed: { label: '失败', tone: 'text-rose-300', icon: X },
  'rolled-back': { label: '已回滚', tone: 'text-rose-300', icon: CircleSlash },
}

function formatTs(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function relTime(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)} 小时前`
  return `${Math.floor(diff / 86_400_000)} 天前`
}

export default function PublishCenter({ projectId }: Props) {
  const allJobs = usePublishFlowStore((s) => s.jobs)
  const composerOpen = usePublishFlowStore((s) => s.composerOpen)
  const openComposer = usePublishFlowStore((s) => s.openComposer)
  const selectedJobId = usePublishFlowStore((s) => s.selectedJobId)
  const selectJob = usePublishFlowStore((s) => s.selectJob)
  const advanceTargetNode = usePublishFlowStore((s) => s.advanceTargetNode)

  // Jobs for this project = jobs whose any artifact belongs to it.
  const allArtifacts = useArtifactStore((s) => s.artifacts)
  const projectArtifactIds = useMemo(
    () => new Set(allArtifacts.filter((a) => a.projectId === projectId).map((a) => a.id)),
    [allArtifacts, projectId],
  )
  const jobs = useMemo(
    () =>
      allJobs.filter(
        (j) =>
          j.artifactIds.length === 0 ||
          j.artifactIds.some((aid) => projectArtifactIds.has(aid)),
      ),
    [allJobs, projectArtifactIds],
  )

  const [tab, setTab] = useState<'running' | 'history'>('running')
  const visibleJobs = jobs.filter((j) =>
    tab === 'running'
      ? j.status === 'running' || j.status === 'draft' || j.status === 'paused'
      : j.status === 'succeeded' || j.status === 'failed' || j.status === 'rolled-back',
  )
  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? visibleJobs[0] ?? jobs[0]

  return (
    <div className="flex min-h-0 flex-1">
      {/* List column */}
      <aside className="flex w-[360px] shrink-0 flex-col border-r border-[var(--divider-soft)] bg-[var(--color-surface-0)]">
        <div className="flex h-10 items-center gap-1 border-b border-[var(--divider-soft)] px-3">
          {(['running', 'history'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex h-7 items-center rounded-md px-2.5 text-[12px] transition-colors ${
                tab === t
                  ? 'bg-[var(--fill-medium)] text-[var(--color-ink)]'
                  : 'text-[var(--color-ink)]/60 hover:bg-[var(--fill-soft)]'
              }`}
            >
              {t === 'running' ? '进行中' : '历史'}
              <span className="ml-1.5 text-[10.5px] text-[var(--color-ink)]/50">
                {jobs.filter((j) =>
                  t === 'running'
                    ? j.status === 'running' || j.status === 'draft' || j.status === 'paused'
                    : j.status === 'succeeded' || j.status === 'failed' || j.status === 'rolled-back',
                ).length}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={openComposer}
            className="ml-auto flex h-7 items-center gap-1 rounded-md bg-[var(--color-ink)] px-2.5 text-[11.5px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90"
          >
            <Plus size={11} strokeWidth={2.2} /> 新建发布
          </button>
        </div>
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto p-2">
          {visibleJobs.length === 0 && (
            <div className="px-3 py-12 text-center text-[12px] text-[var(--color-ink)]/50">
              暂无{tab === 'running' ? '进行中' : '历史'}的发布工单
            </div>
          )}
          {visibleJobs.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              active={selectedJob?.id === j.id}
              onClick={() => selectJob(j.id)}
            />
          ))}
        </div>
      </aside>
      {/* Detail column */}
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
        {selectedJob ? (
          <JobDetail
            job={selectedJob}
            onAdvance={(tid) => advanceTargetNode(selectedJob.id, tid)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[12.5px] text-[var(--color-ink)]/50">
            从左侧选择一个发布工单
          </div>
        )}
      </div>

      {composerOpen && <ComposerOverlay projectId={projectId} />}
    </div>
  )
}

function JobCard({
  job,
  active,
  onClick,
}: {
  job: PublishJob
  active: boolean
  onClick: () => void
}) {
  const completed = job.targets.reduce(
    (acc, t) => acc + t.nodes.filter((n) => n.status === 'passed').length,
    0,
  )
  const total = job.targets.length * PUBLISH_NODES.length
  const pct = Math.round((completed / Math.max(1, total)) * 100)
  // Group target ids by platform for compact display.
  const byPlatform = job.targets.reduce<Record<string, string[]>>((acc, t) => {
    const { platformId, sceneId } = parseTargetId(t.targetId)
    const sc = getScene(t.targetId)
    if (!acc[platformId]) acc[platformId] = []
    acc[platformId].push(sc?.label ?? sceneId)
    return acc
  }, {})
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-1.5 flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
        active
          ? 'border-[var(--color-ink)]/35 bg-[var(--fill-medium)]'
          : 'border-[var(--divider-soft)] bg-[var(--color-surface-1)] hover:border-[var(--divider)] hover:bg-[var(--fill-soft)]'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[12.5px] font-semibold text-[var(--color-ink)]">{job.title}</span>
        <span className="shrink-0 text-[10.5px] text-[var(--color-ink)]/50">{job.id}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {Object.entries(byPlatform).map(([pid, scenes]) => {
          const plat = getPlatform(pid as never)
          return (
            <span
              key={pid}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--fill-subtle)] px-1.5 py-0.5 text-[10.5px] text-[var(--color-ink)]/75 ring-1 ring-[var(--divider-soft)]"
            >
              <span className="text-[var(--color-ink)]/85">{plat?.label}</span>
              <span className="text-[var(--color-ink)]/45">·</span>
              <span>{scenes.join(' / ')}</span>
            </span>
          )
        })}
      </div>
      <div className="flex items-center justify-between text-[10.5px] text-[var(--color-ink)]/50">
        <span>
          {job.createdBy} · {relTime(job.createdAt)}
        </span>
        <span className={statusToTone(job.status)}>{statusLabel(job.status)} · {pct}%</span>
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
    </button>
  )
}

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

function statusToTone(s: PublishJob['status']): string {
  return {
    draft: 'text-[var(--color-ink)]/60',
    running: 'text-amber-300',
    succeeded: 'text-emerald-300',
    failed: 'text-rose-300',
    paused: 'text-[var(--color-ink)]/60',
    'rolled-back': 'text-rose-300',
  }[s]
}

function JobDetail({
  job,
  onAdvance,
}: {
  job: PublishJob
  onAdvance: (tid: PublishTargetId) => void
}) {
  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Header */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-ink)]/45">{job.id}</span>
          <span className={`text-[11px] ${statusToTone(job.status)}`}>● {statusLabel(job.status)}</span>
        </div>
        <h2 className="mt-1 text-[18px] font-semibold text-[var(--color-ink)]">{job.title}</h2>
        {job.notes && (
          <p className="mt-1 text-[12.5px] text-[var(--color-ink)]/65">{job.notes}</p>
        )}
        <div className="mt-1.5 text-[11px] text-[var(--color-ink)]/50">
          {job.createdBy} · {formatTs(job.createdAt)}
        </div>
      </div>

      {/* Targets — each one its own flow row */}
      <section className="rounded-xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)] p-4">
        <h3 className="mb-3 text-[13px] font-semibold text-[var(--color-ink)]">发布目标 · {job.targets.length} 个</h3>
        <div className="flex flex-col gap-3">
          {job.targets.map((t) => {
            const scene = getScene(t.targetId)
            const plat = scene && getPlatform(scene.platformId)
            const canAdvance =
              job.status !== 'succeeded' &&
              t.nodes.some((n) => n.status === 'running' || n.status === 'pending')
            return (
              <div key={t.targetId} className="rounded-lg bg-[var(--fill-subtle)] p-3 ring-1 ring-[var(--divider-soft)]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11.5px] text-[var(--color-ink)]/55">{plat?.label}</span>
                    <ChevronRight size={11} className="text-[var(--color-ink)]/40" strokeWidth={1.8} />
                    <span className="text-[12.5px] font-medium text-[var(--color-ink)]">{scene?.label}</span>
                  </div>
                  {canAdvance && (
                    <button
                      type="button"
                      onClick={() => onAdvance(t.targetId)}
                      className="h-6 rounded-md bg-[var(--fill-medium)] px-2.5 text-[10.5px] text-[var(--color-ink)]/80 ring-1 ring-[var(--divider-soft)] transition-colors hover:bg-[var(--fill-strong)] hover:text-[var(--color-ink)]"
                    >
                      推进一步
                    </button>
                  )}
                </div>
                <NodeStrip nodes={t.nodes} />
              </div>
            )
          })}
        </div>
      </section>

      {/* History */}
      <section className="rounded-xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)] p-4">
        <h3 className="mb-3 text-[13px] font-semibold text-[var(--color-ink)]">操作历史</h3>
        <ol className="relative ml-2 border-l border-[var(--divider-soft)] pl-4">
          {job.history.map((h, i) => (
            <li key={i} className="mb-3 last:mb-0">
              <span className="absolute -left-[5px] mt-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[var(--color-ink)]/35" />
              <div className="flex items-baseline gap-2">
                <span className="text-[12px] text-[var(--color-ink)]/90">{h.label}</span>
                {h.targetId && (
                  <span className="text-[10.5px] text-[var(--color-ink)]/45">
                    {(() => {
                      const sc = getScene(h.targetId)
                      const pl = sc && getPlatform(sc.platformId)
                      return sc ? `${pl?.label} · ${sc.label}` : h.targetId
                    })()}
                  </span>
                )}
              </div>
              <div className="text-[10.5px] text-[var(--color-ink)]/50">
                {formatTs(h.ts)} · {h.operator ?? '—'}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function NodeStrip({ nodes }: { nodes: PublishNodeRun[] }) {
  return (
    <div className="flex items-stretch gap-2">
      {nodes.map((n, idx) => {
        const def = PUBLISH_NODES[idx]
        const meta = NODE_STATUS_META[n.status]
        const Icon = meta.icon
        const animSpin = n.status === 'running'
        return (
          <div key={n.id} className="flex flex-1 items-stretch gap-2">
            <div className="flex flex-1 flex-col items-start rounded-md bg-[var(--color-surface-0)] p-2 ring-1 ring-[var(--divider-soft)]">
              <div className="flex items-center gap-1.5">
                <Icon
                  size={11}
                  strokeWidth={2}
                  className={`${meta.tone} ${animSpin ? 'animate-spin' : ''}`}
                />
                <span className="text-[11px] font-medium text-[var(--color-ink)]">{def.label}</span>
              </div>
              <span className={`mt-0.5 text-[10px] ${meta.tone}`}>{meta.label}</span>
              <span className="mt-0.5 text-[9.5px] text-[var(--color-ink)]/45">{def.hint}</span>
              {n.finishedAt && (
                <span className="mt-1 inline-flex items-center gap-1 text-[9.5px] text-[var(--color-ink)]/45">
                  <Clock size={9} strokeWidth={1.8} />
                  {formatTs(n.finishedAt)}
                </span>
              )}
            </div>
            {idx < nodes.length - 1 && (
              <span className="self-center text-[var(--color-ink)]/30">→</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Composer overlay ──────────────────────────────────────────────── */

function ComposerOverlay({ projectId }: { projectId: string }) {
  const closeComposer = usePublishFlowStore((s) => s.closeComposer)
  const composerTargets = usePublishFlowStore((s) => s.composerTargets)
  const toggleComposerTarget = usePublishFlowStore((s) => s.toggleComposerTarget)
  const composerNotes = usePublishFlowStore((s) => s.composerNotes)
  const setComposerNotes = usePublishFlowStore((s) => s.setComposerNotes)
  const submitComposer = usePublishFlowStore((s) => s.submitComposer)
  const allArtifacts = useArtifactStore((s) => s.artifacts)
  const projectArtifacts = useMemo(
    () => allArtifacts.filter((a) => a.projectId === projectId),
    [allArtifacts, projectId],
  )
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>(() =>
    projectArtifacts.filter((a) => a.status === 'draft' || a.status === 'reviewing').map((a) => a.id),
  )
  const [title, setTitle] = useState(() => {
    const first = projectArtifacts[0]
    return first ? `${first.name} · 发布` : '新发布工单'
  })

  const handleSubmit = () => {
    if (composerTargets.length === 0) return
    submitComposer({ title: title.trim() || '新发布工单', artifactIds: selectedArtifactIds })
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm"
      onClick={closeComposer}
    >
      <div
        className="flex max-h-[88vh] w-[720px] max-w-[94vw] flex-col overflow-hidden rounded-2xl border border-[var(--divider)] bg-[var(--color-surface-1)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--divider-soft)] px-5 py-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">新建发布工单</h2>
            <p className="text-[11.5px] text-[var(--color-ink)]/50">
              选择产物 + 投放目标，提交后所有目标统一走 4 步流转。
            </p>
          </div>
          <button
            type="button"
            onClick={closeComposer}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink)]/60 hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
          <div>
            <label className="mb-1.5 block text-[11.5px] font-medium text-[var(--color-ink)]/70">
              工单标题
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：比分卡 v1.2 · 全量发布"
              className="h-8 w-full rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-0)] px-2.5 text-[12.5px] text-[var(--color-ink)] outline-none focus:border-[var(--color-ink)]/40"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label className="text-[11.5px] font-medium text-[var(--color-ink)]/70">包含产物</label>
              <span className="text-[10.5px] text-[var(--color-ink)]/45">
                已选 {selectedArtifactIds.length} / {projectArtifacts.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {projectArtifacts.map((a) => {
                const checked = selectedArtifactIds.includes(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      setSelectedArtifactIds(
                        checked ? selectedArtifactIds.filter((x) => x !== a.id) : [...selectedArtifactIds, a.id],
                      )
                    }
                    className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] transition-colors ${
                      checked
                        ? 'bg-[var(--fill-medium)] text-[var(--color-ink)] ring-1 ring-[var(--divider)]'
                        : 'bg-[var(--fill-subtle)] text-[var(--color-ink)]/65 hover:bg-[var(--fill-soft)]'
                    }`}
                  >
                    <span
                      className={`flex h-3.5 w-3.5 items-center justify-center rounded transition-colors ${
                        checked ? 'bg-[var(--color-ink)] text-[var(--color-ink-contrast)]' : 'ring-1 ring-[var(--divider)]'
                      }`}
                    >
                      {checked && <Check size={9} strokeWidth={3} />}
                    </span>
                    {a.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label className="text-[11.5px] font-medium text-[var(--color-ink)]/70">投放目标</label>
              <span className="text-[10.5px] text-[var(--color-ink)]/45">
                已选 {composerTargets.length} 个
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PUBLISH_PLATFORMS.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-[var(--divider-soft)] bg-[var(--fill-subtle)] p-3"
                >
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-[12px] font-medium text-[var(--color-ink)]">{p.label}</span>
                    <span className="text-[10px] text-[var(--color-ink)]/45">{p.hint}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {p.scenes.map((s) => {
                      const tid = targetId(p.id, s.id)
                      const checked = composerTargets.includes(tid)
                      return (
                        <button
                          key={tid}
                          type="button"
                          onClick={() => toggleComposerTarget(tid)}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11.5px] transition-colors ${
                            checked
                              ? 'bg-[var(--fill-medium)] text-[var(--color-ink)]'
                              : 'text-[var(--color-ink)]/70 hover:bg-[var(--fill-soft)]'
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded transition-colors ${
                              checked
                                ? 'bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                                : 'bg-transparent ring-1 ring-[var(--divider)]'
                            }`}
                          >
                            {checked && <Check size={9} strokeWidth={3} />}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span>{s.label}</span>
                            <span className="text-[10px] text-[var(--color-ink)]/45">{s.description}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11.5px] font-medium text-[var(--color-ink)]/70">
              发布说明（可选）
            </label>
            <textarea
              value={composerNotes}
              onChange={(e) => setComposerNotes(e.target.value)}
              rows={3}
              placeholder="本次发布的变更摘要、关联工单、回归注意点……"
              className="w-full resize-none rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-0)] p-2.5 text-[12px] leading-[1.55] text-[var(--color-ink)] outline-none focus:border-[var(--color-ink)]/40"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--divider-soft)] bg-[var(--color-surface-0)] px-5 py-3">
          <span className="text-[11px] text-[var(--color-ink)]/50">
            提交后所有目标将依次经过：代码检查 → 内容审核 → 灰度 → 全量
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeComposer}
              className="h-8 rounded-md bg-transparent px-3 text-[12px] text-[var(--color-ink)]/70 hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={composerTargets.length === 0}
              className="h-8 rounded-md bg-[var(--color-ink)] px-3 text-[12px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              提交发布
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// `PublishNodeId` is referenced by typings only — silence unused import.
export type { PublishNodeId }
