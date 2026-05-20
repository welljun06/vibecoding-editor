import { Database } from 'lucide-react'
import type { Artifact } from '../../../store/artifact-store'
import DatabaseModule from '../DatabaseModule'

interface Props {
  artifact: Artifact
}

/** Layer 3 content for the '数据' view tab.
 *  - mp-page / mp-agent: project's database tables (the artifact backs
 *    or reads from these tables, so they're the relevant "data").
 *  - persona-card: knowledge-fragment table (mock for now).
 *  - scene-card: recall-hit samples (mock).
 *  - proposal-doc: not shown — proposals are static deliverables. */
export default function DataView({ artifact }: Props) {
  if (artifact.kind === 'mp-page' || artifact.kind === 'mp-agent') {
    return <DatabaseModule projectId={artifact.projectId} />
  }
  if (artifact.kind === 'persona-card') {
    return (
      <EmptyData
        title="知识引用"
        description={`这个人设召回卡正在被端上 AI 调用时，可以参考下面的知识片段表。\nv1：从项目共享知识库读取；下一版加入按 ${artifact.name} 维度过滤的命中样本。`}
      />
    )
  }
  if (artifact.kind === 'scene-card') {
    return (
      <EmptyData
        title="召回命中样本"
        description="近 30 天端上 AI 命中本卡片的请求样本（关键词 + 用户分群 + 命中位置）。下一轮接入。"
      />
    )
  }
  return (
    <EmptyData title="该产物类型暂无数据视图" description="提案文档等静态产物不挂载数据。" />
  )
}

function EmptyData({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="flex max-w-[400px] flex-col items-center gap-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--fill-medium)] text-[var(--color-ink)]/55">
          <Database size={20} strokeWidth={1.4} />
        </span>
        <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">{title}</h2>
        <p className="whitespace-pre-line text-[12px] leading-[1.6] text-[var(--color-ink)]/55">
          {description}
        </p>
      </div>
    </div>
  )
}
