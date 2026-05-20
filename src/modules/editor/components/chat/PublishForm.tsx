import { motion } from 'framer-motion'
import { Check, CheckCircle2 } from 'lucide-react'
import {
  PUBLISH_PLATFORMS,
  getPlatform,
  getScene,
  parseTargetId,
  targetId,
  type PublishStep,
} from '../../store/publish-flow-store'

interface PublishFormProps {
  step: Exclude<PublishStep, 'idle'>
  /** Selected publish targets — each item is `${platformId}:${sceneId}`
   *  (i.e. a PublishTargetId). The legacy single-platform shape — just
   *  scene names — is no longer supported here; older usages must
   *  migrate. */
  scenes: string[]
  personaName: string
  personaPortrait: string
  onToggle: (s: string) => void
  onSubmit: () => void
  onConfirm: () => void
  /** 'chat' renders compact pills for in-chat context; 'modal' renders
   *  a 2-col card grid grouped by platform. */
  variant?: 'chat' | 'modal'
}

/** Aggregate target count for the header — full catalog size. */
const TOTAL_TARGETS = PUBLISH_PLATFORMS.reduce(
  (n, p) => n + p.scenes.length,
  0,
)

export default function PublishForm({
  step,
  scenes,
  personaName,
  personaPortrait,
  onToggle,
  onSubmit,
  onConfirm,
  variant = 'chat',
}: PublishFormProps) {
  const showReview = step === 'review' || step === 'confirmed'
  const isModal = variant === 'modal'
  const showSelectStep = true
  const showReviewStep = showReview
  const locked = step !== 'select'

  return (
    <div
      className={
        isModal
          ? 'space-y-5'
          : 'space-y-5 rounded-xl bg-[var(--fill-subtle)] p-4 ring-1 ring-[var(--divider-soft)]'
      }
    >
      {/* Step 1 — pick targets */}
      {showSelectStep && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="text-[13px] font-medium text-[var(--color-ink)]/75">
              1&nbsp; 选择发布场景
            </div>
            {isModal && (
              <div className="text-[11px] text-[var(--color-ink)]/45">
                可多选 · 已选 {scenes.length}/{TOTAL_TARGETS}
              </div>
            )}
          </div>
          {isModal ? (
            <div className="space-y-3">
              {PUBLISH_PLATFORMS.map((platform) => (
                <div key={platform.id}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[11.5px] font-medium text-[var(--color-ink)]/75">
                      {platform.label}
                    </span>
                    <span className="text-[10px] text-[var(--color-ink)]/45">
                      {platform.hint}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {platform.scenes.map((s) => {
                      const tid = targetId(platform.id, s.id)
                      const checked = scenes.includes(tid)
                      return (
                        <button
                          key={tid}
                          type="button"
                          disabled={locked}
                          onClick={() => onToggle(tid)}
                          className={`group relative flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-all ${
                            checked
                              ? 'bg-[var(--fill-medium)] ring-1 ring-[var(--divider)]'
                              : 'bg-[var(--fill-subtle)] ring-1 ring-[var(--divider-soft)] hover:bg-[var(--fill-soft)] hover:ring-[var(--divider)]'
                          } ${locked ? 'cursor-default' : ''}`}
                        >
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pr-6">
                            <span
                              className={`text-[12.5px] font-medium ${
                                checked ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink)]/85'
                              }`}
                            >
                              {s.label}
                            </span>
                            <span className="text-[10.5px] leading-[1.55] text-[var(--color-ink)]/55">
                              {s.description}
                            </span>
                          </div>
                          <span
                            className={`absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded transition-all ${
                              checked
                                ? 'bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                                : 'bg-transparent ring-1 ring-[var(--divider)] group-hover:ring-[var(--divider)]'
                            }`}
                          >
                            {checked && <Check size={9} strokeWidth={3} />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {PUBLISH_PLATFORMS.flatMap((p) =>
                p.scenes.map((s) => ({ tid: targetId(p.id, s.id), label: `${p.label} · ${s.label}` })),
              ).map(({ tid, label }) => {
                const checked = scenes.includes(tid)
                return (
                  <button
                    key={tid}
                    type="button"
                    disabled={locked}
                    onClick={() => onToggle(tid)}
                    className={`rounded-lg px-3 py-1.5 text-[12.5px] transition-colors ${
                      checked
                        ? 'bg-[var(--fill-strong)] text-[var(--color-ink)] ring-1 ring-[var(--divider)]'
                        : 'bg-[var(--fill-subtle)] text-[var(--color-ink)]/60 hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]/85'
                    } ${locked ? 'cursor-default' : ''}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}
          {step === 'select' && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={scenes.length === 0}
              className={`${
                isModal
                  ? 'w-full rounded-md bg-[var(--color-ink)] px-3 py-2 text-[12px] font-medium'
                  : 'rounded-md bg-[var(--color-ink)] px-3 py-1 text-[11px] font-medium'
              } text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90 disabled:opacity-40`}
            >
              下一步
            </button>
          )}
        </div>
      )}

      {/* Step 2 — review */}
      {showReviewStep && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className={isModal ? 'space-y-4' : 'space-y-2'}
        >
          <div className="text-[13px] font-medium text-[var(--color-ink)]/75">
            2&nbsp; 确认发布信息
          </div>
          <div className="overflow-hidden rounded-xl bg-[var(--fill-subtle)] ring-1 ring-[var(--divider-soft)]">
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--divider)]">
                <img
                  src={personaPortrait}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ objectPosition: '50% 25%' }}
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] text-[var(--color-ink)]/50">发布对象</span>
                <span className="truncate text-[12px] font-medium text-[var(--color-ink)]">
                  {personaName || 'AI 分身'}
                </span>
              </div>
              <span className="ml-auto text-[10.5px] text-[var(--color-ink)]/40">
                发布至 {scenes.length} 个场景
              </span>
            </div>
            <div className="h-px bg-[var(--fill-soft)]" />
            <div className="flex flex-col">
              {scenes.map((tid, i) => {
                const { platformId } = parseTargetId(tid)
                const platform = getPlatform(platformId)
                const scene = getScene(tid)
                return (
                  <div
                    key={tid}
                    className={`flex items-start gap-2.5 px-3 py-2.5 ${
                      i > 0 ? 'border-t border-[var(--divider-soft)]' : ''
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[12px] font-medium text-[var(--color-ink)]">
                        {platform?.label} · {scene?.label}
                      </span>
                      <span className="text-[10.5px] leading-[1.5] text-[var(--color-ink)]/55">
                        {scene?.description ?? '即将上线'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={onConfirm}
            disabled={step !== 'review'}
            className={`${
              isModal
                ? 'w-full rounded-md bg-[var(--color-ink)] px-3 py-2 text-[12px] font-medium'
                : 'rounded-md bg-[var(--color-ink)] px-3 py-1 text-[11px] font-medium'
            } text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-60`}
          >
            {step === 'review' ? '确认发布' : '已确认'}
          </button>
          {step === 'confirmed' && (
            <div className="flex items-center gap-1.5 pt-1 text-[12px] text-[var(--color-ink)]/55">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>已提交发布～发布记录可点击右上角查看</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
