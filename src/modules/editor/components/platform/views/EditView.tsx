import { useState } from 'react'
import { Check, Plus, Tag, Target, Trash2, Zap, type LucideIcon } from 'lucide-react'
import {
  KIND_LABELS,
  STATUS_LABELS,
  useArtifactStore,
  type Artifact,
  type ArtifactStatus,
  type RecallTrigger,
} from '../../../store/artifact-store'
import {
  PUBLISH_PLATFORMS,
  targetId,
  type PublishTargetId,
} from '../../../store/publish-flow-store'

interface Props {
  artifact: Artifact
}

const TRIGGER_KIND_LABEL: Record<RecallTrigger['kind'], string> = {
  intent: '意图',
  entity: '实体',
  context: '场景',
}

const TRIGGER_KIND_ICON: Record<RecallTrigger['kind'], LucideIcon> = {
  intent: Target,
  entity: Tag,
  context: Zap,
}

const STATUSES: ArtifactStatus[] = ['draft', 'reviewing', 'live', 'paused']

/** '编辑' view content for recall-shape artifacts (scene-card /
 *  persona-card / proposal-doc). App-shape artifacts (mp-page / mp-agent)
 *  use the host page's multi-file tab system instead — those never reach
 *  this component. */
export default function EditView({ artifact }: Props) {
  const updateArtifact = useArtifactStore((s) => s.updateArtifact)
  const deleteArtifact = useArtifactStore((s) => s.deleteArtifact)
  const toggleArtifactTarget = useArtifactStore((s) => s.toggleArtifactTarget)
  const [newTriggerKind, setNewTriggerKind] = useState<RecallTrigger['kind']>('intent')
  const [newTriggerMatch, setNewTriggerMatch] = useState('')

  const handleAddTrigger = () => {
    if (!newTriggerMatch.trim()) return
    const next: RecallTrigger = {
      id: `t-${Date.now().toString(36)}`,
      kind: newTriggerKind,
      match: newTriggerMatch.trim(),
    }
    updateArtifact(artifact.id, { triggers: [...artifact.triggers, next] })
    setNewTriggerMatch('')
  }

  const handleRemoveTrigger = (id: string) => {
    updateArtifact(artifact.id, { triggers: artifact.triggers.filter((t) => t.id !== id) })
  }

  return (
    <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
      {/* Identity */}
      <section className="flex items-start justify-between gap-3 rounded-xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)] p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-ink)]/45">
            {KIND_LABELS[artifact.kind]}
          </span>
          <input
            value={artifact.name}
            onChange={(e) => updateArtifact(artifact.id, { name: e.target.value })}
            className="bg-transparent text-[17px] font-semibold text-[var(--color-ink)] outline-none focus:ring-0"
          />
          <input
            value={artifact.hint}
            onChange={(e) => updateArtifact(artifact.id, { hint: e.target.value })}
            placeholder="一句话描述这个产物的用途"
            className="bg-transparent text-[12px] text-[var(--color-ink)]/65 outline-none focus:text-[var(--color-ink)]/90"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 items-center gap-0.5 rounded-md bg-[var(--fill-medium)] p-0.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateArtifact(artifact.id, { status: s })}
                className={`flex h-6 items-center rounded px-2 text-[11px] transition-colors ${
                  artifact.status === s
                    ? 'bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                    : 'text-[var(--color-ink)]/65 hover:text-[var(--color-ink)]'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => deleteArtifact(artifact.id)}
            title="删除产物"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-soft)] hover:text-rose-300"
          >
            <Trash2 size={13} strokeWidth={1.7} />
          </button>
        </div>
      </section>

      {/* Recall triggers */}
      <Card title="召回触发器" hint="端上 AI 在以下条件下，把这个产物拉入它的工作集。">
        <div className="flex flex-col gap-2">
          {artifact.triggers.length === 0 && (
            <span className="text-[11.5px] text-[var(--color-ink)]/45">
              还没有触发器。添加一个意图 / 实体 / 场景作为召回入口。
            </span>
          )}
          {artifact.triggers.map((t) => {
            const Icon = TRIGGER_KIND_ICON[t.kind]
            return (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-md bg-[var(--fill-subtle)] px-2.5 py-1.5 ring-1 ring-[var(--divider-soft)]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--fill-medium)] text-[var(--color-ink)]/70">
                  <Icon size={11} strokeWidth={1.8} />
                </span>
                <span className="text-[10.5px] uppercase tracking-[0.05em] text-[var(--color-ink)]/45">
                  {TRIGGER_KIND_LABEL[t.kind]}
                </span>
                <span className="flex-1 text-[12.5px] text-[var(--color-ink)]">{t.match}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTrigger(t.id)}
                  className="text-[11px] text-[var(--color-ink)]/45 hover:text-rose-300"
                >
                  移除
                </button>
              </div>
            )
          })}
          <div className="mt-1 flex items-center gap-2">
            <select
              value={newTriggerKind}
              onChange={(e) => setNewTriggerKind(e.target.value as RecallTrigger['kind'])}
              className="h-7 rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-0)] px-2 text-[11.5px] text-[var(--color-ink)]/85 outline-none"
            >
              <option value="intent">意图</option>
              <option value="entity">实体</option>
              <option value="context">场景</option>
            </select>
            <input
              value={newTriggerMatch}
              onChange={(e) => setNewTriggerMatch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTrigger()
              }}
              placeholder="例如：查询比分、体育/电竞-赛事比分、搜索结果页"
              className="h-7 flex-1 rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-0)] px-2 text-[11.5px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink)]/35 focus:border-[var(--color-ink)]/40"
            />
            <button
              type="button"
              onClick={handleAddTrigger}
              disabled={!newTriggerMatch.trim()}
              className="flex h-7 items-center gap-1 rounded-md bg-[var(--color-ink)] px-2.5 text-[11.5px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Plus size={11} strokeWidth={2.2} /> 添加
            </button>
          </div>
        </div>
      </Card>

      {/* Render spec */}
      <Card title="渲染规格" hint="召回后端上 AI 把这个产物渲染成什么样的视觉块。">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-16 text-[11px] text-[var(--color-ink)]/55">模板</span>
            <select
              value={artifact.render.template}
              onChange={(e) =>
                updateArtifact(artifact.id, {
                  render: { ...artifact.render, template: e.target.value as Artifact['render']['template'] },
                })
              }
              className="h-7 rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-0)] px-2 text-[11.5px] text-[var(--color-ink)]/85"
            >
              <option value="text">纯文本（注入 prompt）</option>
              <option value="card">富卡片</option>
              <option value="list">列表 / 轮播</option>
              <option value="rich-message">富消息（含头像 / emoji）</option>
            </select>
          </div>
          <div>
            <div className="mb-1.5 text-[11px] text-[var(--color-ink)]/55">预览示例</div>
            <textarea
              value={artifact.render.preview}
              onChange={(e) =>
                updateArtifact(artifact.id, {
                  render: { ...artifact.render, preview: e.target.value },
                })
              }
              rows={3}
              className="w-full resize-none rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-0)] p-2.5 text-[12px] leading-[1.55] text-[var(--color-ink)] outline-none focus:border-[var(--color-ink)]/40"
            />
          </div>
        </div>
      </Card>

      {/* Publish targets */}
      <Card title="投放目标" hint="该产物可被投放到的 (平台 × 场景)。在「发布渠道」tab 里打包成工单。">
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
                  const tid: PublishTargetId = targetId(p.id, s.id)
                  const checked = artifact.targets.includes(tid)
                  return (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => toggleArtifactTarget(artifact.id, tid)}
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
                      <span className="flex-1">{s.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Kind-specific config (free-shape) */}
      {artifact.config && (
        <Card title="高级配置" hint="该类型产物的扩展字段（只读）。">
          <pre className="thin-scroll max-h-60 overflow-auto rounded-md bg-[var(--fill-subtle)] p-3 text-[11px] leading-[1.6] text-[var(--color-ink)]/75 ring-1 ring-[var(--divider-soft)]">
            {JSON.stringify(artifact.config, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}

function Card({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">{title}</h3>
        {hint && <span className="text-[10.5px] text-[var(--color-ink)]/50">{hint}</span>}
      </div>
      {children}
    </section>
  )
}
