import type { Artifact } from '../../../store/artifact-store'
import SceneSandbox from '../SceneSandbox'

interface Props {
  artifact: Artifact
  /** When the host page already renders its own preview surface (the
   *  phone mockup / web frame for a project's product preview), we let
   *  it pass through. Used by VibeCodingPage to keep its existing
   *  filter chips + 重新加载 / 真机预览 / 发布 buttons row + phone view. */
  hostFallback?: React.ReactNode
}

/** Layer 3 content for the '预览' view tab. Picks a render surface based
 *  on artifact kind. For `mp-page` / `mp-agent` (and any other app-shape
 *  artifact) we defer to the host page's existing preview surface; for
 *  recall artifacts we render the scene sandbox. */
export default function PreviewView({ artifact, hostFallback }: Props) {
  if (artifact.kind === 'scene-card') {
    return (
      <div className="flex min-h-0 flex-1">
        <SceneSandbox artifact={artifact} />
      </div>
    )
  }
  if (artifact.kind === 'persona-card') {
    return (
      <div className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-[680px] rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-6 ring-1 ring-violet-500/15">
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.06em] text-violet-300/80">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-400 text-[10px] text-white">
              ✦
            </span>
            人设召回卡 · 端上 AI 调用预览
          </div>
          <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">{artifact.name}</h2>
          <p className="mt-1 text-[12.5px] text-[var(--color-ink)]/65">{artifact.hint}</p>
          <div className="mt-4 rounded-xl bg-[var(--color-surface-0)] p-4 ring-1 ring-[var(--divider-soft)]">
            <div className="text-[10.5px] uppercase tracking-[0.06em] text-[var(--color-ink)]/45">
              注入端上 AI 的人设片段
            </div>
            <pre className="thin-scroll mt-1 max-h-[260px] overflow-auto whitespace-pre-wrap font-mono text-[11.5px] leading-[1.7] text-[var(--color-ink)]/85">
{artifact.render.preview}
            </pre>
          </div>
          {Boolean(artifact.config) && (
            <div className="mt-3 rounded-xl bg-[var(--color-surface-0)] p-4 ring-1 ring-[var(--divider-soft)]">
              <div className="text-[10.5px] uppercase tracking-[0.06em] text-[var(--color-ink)]/45">
                示例对话样本
              </div>
              <div className="mt-2 space-y-2 text-[12px] leading-[1.6] text-[var(--color-ink)]/85">
                {Array.isArray((artifact.config as { sampleReplies?: string[] })?.sampleReplies) ? (
                  ((artifact.config as { sampleReplies: string[] }).sampleReplies).map((s, i) => (
                    <div key={i} className="rounded-lg bg-[var(--fill-subtle)] px-3 py-2">"{s}"</div>
                  ))
                ) : (
                  <div className="text-[11px] text-[var(--color-ink)]/45">暂未配置示例</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  if (artifact.kind === 'proposal-doc') {
    return (
      <div className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-[820px] rounded-2xl bg-[var(--color-surface-1)] p-8 ring-1 ring-[var(--divider-soft)]">
          <div className="mb-4 text-[10.5px] uppercase tracking-[0.06em] text-[var(--color-ink)]/45">
            提案产物
          </div>
          <h1 className="text-[22px] font-semibold text-[var(--color-ink)]">{artifact.name}</h1>
          <p className="mt-2 text-[13px] text-[var(--color-ink)]/65">{artifact.hint}</p>
          <div className="mt-6 whitespace-pre-wrap text-[12.5px] leading-[1.75] text-[var(--color-ink)]/85">
            {artifact.render.preview}
          </div>
        </div>
      </div>
    )
  }
  // mp-page / mp-agent / fallback — let the host page draw its own
  // preview surface (phone mockup, web frame, etc.) so the existing
  // file-tree drawer, filter chips, and address bar keep working.
  return <>{hostFallback}</>
}
