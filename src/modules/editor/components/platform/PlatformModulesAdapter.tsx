import { useEffect, useMemo } from 'react'
import {
  Boxes,
  ChartLine,
  Database,
  Eye,
  Gauge,
  Rocket,
  SquarePen,
  type LucideIcon,
} from 'lucide-react'
import {
  artifactsOfProject,
  condensedToDetailed,
  TAB_LABELS_BY_SCHEME,
  TABS_BY_SCHEME,
  useArtifactStore,
  VIEW_LABELS,
  VIEW_TABS_BY_KIND,
  type ArtifactViewTab,
  type ProjectKindKey,
  type ViewScheme,
} from '../../store/artifact-store'
import {
  diffCount,
  diffEnvs,
  getProjectDb,
  useDbStore,
} from '../../store/db-store'
import { usePublishFlowStore } from '../../store/publish-flow-store'
import PreviewView from './views/PreviewView'
import EditView from './views/EditView'
import DataView from './views/DataView'
import PublishView from './views/PublishView'
import DashboardView from './views/DashboardView'

const VIEW_ICONS: Record<ArtifactViewTab, LucideIcon> = {
  preview: Eye,
  edit: SquarePen,
  data: Database,
  publish: Rocket,
  dashboard: ChartLine,
  artifact: Boxes,
  runtime: Gauge,
}

/** Bridge VibeCodingPage's existing `projectTitle` + `activeProjectKind`
 *  into the artifact store, then expose the active view + setter +
 *  effective view (after scheme/sub-tab mapping). The host page uses
 *  `effectiveView` to gate its hostPreview branches; the tab strip uses
 *  `activeView` directly. */
export function useArtifactViewSync(
  title: string,
  kind: ProjectKindKey,
): {
  projectId: string
  activeView: ArtifactViewTab
  setActiveView: (v: ArtifactViewTab) => void
  viewScheme: ViewScheme
  effectiveView: ArtifactViewTab
  /** True when condensed.产物 is active — host JSX should render its
   *  unified tab strip (产物预览 pseudo-tab + actual file tabs together)
   *  and let the user freely flip between them. */
  isUnifiedArtifactMode: boolean
} {
  const ensureProjectByTitle = useArtifactStore((s) => s.ensureProjectByTitle)
  const setActiveProject = useArtifactStore((s) => s.setActiveProject)
  const activeProjectId = useArtifactStore((s) => s.activeProjectId)
  const activeView = useArtifactStore((s) => s.activeView)
  const setActiveView = useArtifactStore((s) => s.setActiveView)
  const viewScheme = useArtifactStore((s) => s.viewScheme)

  useEffect(() => {
    const id = ensureProjectByTitle(title, kind)
    if (id !== activeProjectId) setActiveProject(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, kind])

  const effectiveView: ArtifactViewTab =
    viewScheme === 'condensed' ? condensedToDetailed(activeView) : activeView

  const isUnifiedArtifactMode =
    viewScheme === 'condensed' && activeView === 'artifact'

  return {
    projectId: activeProjectId,
    activeView,
    setActiveView,
    viewScheme,
    effectiveView,
    isUnifiedArtifactMode,
  }
}

/** Top tab strip — Layer 1 of the artifact workspace. Driven by the
 *  current viewScheme: detailed = up-to-5 per-aspect tabs filtered by
 *  artifact kind; condensed = stable 3 tabs (产物 / 发布 / 运行). */
export function ArtifactViewTabBar({
  activeView,
  onChange,
  viewScheme,
  className = '',
}: {
  activeView: ArtifactViewTab
  onChange: (v: ArtifactViewTab) => void
  viewScheme: ViewScheme
  className?: string
}) {
  const projectId = useArtifactStore((s) => s.activeProjectId)
  const activeArtifactId = useArtifactStore((s) => s.activeArtifactId)
  const artifacts = useArtifactStore((s) => s.artifacts)
  const allJobs = usePublishFlowStore((s) => s.jobs)
  const dbs = useDbStore((s) => s.dbs)

  const activeArtifact = activeArtifactId
    ? artifacts.find((a) => a.id === activeArtifactId)
    : null

  // Tab set: condensed = stable 3; detailed = filtered by kind.
  let tabs: ArtifactViewTab[]
  if (viewScheme === 'condensed') {
    tabs = [...TABS_BY_SCHEME.condensed]
  } else {
    tabs = activeArtifact
      ? VIEW_TABS_BY_KIND[activeArtifact.kind]
      : (['preview'] as ArtifactViewTab[])
  }

  // Per-view badges (run on both schemes, mapping condensed names where
  // appropriate so 发布 still shows the running-job count).
  const projectArtifactIds = useMemo(
    () => new Set(artifactsOfProject(projectId, artifacts).map((a) => a.id)),
    [artifacts, projectId],
  )
  const publishCount = allJobs.filter(
    (j) =>
      (j.status === 'running' || j.status === 'draft' || j.status === 'paused') &&
      (j.artifactIds.length === 0 || j.artifactIds.some((id) => projectArtifactIds.has(id))),
  ).length
  const db = getProjectDb(projectId, dbs)
  const dbDiff = db ? diffCount(diffEnvs(db)) : 0
  const badges: Partial<Record<ArtifactViewTab, number>> = {
    publish: publishCount,
    data: dbDiff,
    // Condensed: surface dbDiff under '产物' (since 数据库 is folded in).
    artifact: dbDiff,
  }

  const schemeLabels = TAB_LABELS_BY_SCHEME[viewScheme]
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {tabs.map((v) => {
        const Icon = VIEW_ICONS[v]
        const isActive = v === activeView
        const badge = badges[v]
        const label = schemeLabels[v] ?? VIEW_LABELS[v]
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] transition-colors ${
              isActive
                ? 'bg-[var(--color-ink)]/[0.08] text-[var(--color-ink)]'
                : 'text-[var(--color-ink)]/55 hover:bg-[var(--color-ink)]/[0.04] hover:text-[var(--color-ink)]/85'
            }`}
          >
            <Icon size={12} strokeWidth={1.7} />
            <span>{label}</span>
            {badge !== undefined && badge > 0 && (
              <span
                className={`ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none ${
                  isActive
                    ? 'bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                    : 'bg-[var(--fill-medium)] text-[var(--color-ink)]/75'
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Dispatcher for Layer 3 content based on the *effective* view tab
 *  (after scheme + sub-tab mapping) and artifact kind. The host page's
 *  preview surface is used when `hostFallback` is supplied and the
 *  effective view is 'preview' or 'edit' for an app-shape artifact. */
export function ArtifactViewContent({
  effectiveView,
  hostFallback,
}: {
  effectiveView: ArtifactViewTab
  hostFallback?: React.ReactNode
}) {
  const projectId = useArtifactStore((s) => s.activeProjectId)
  const artifacts = useArtifactStore((s) => s.artifacts)
  const activeArtifactId = useArtifactStore((s) => s.activeArtifactId)
  const projectArtifacts = artifactsOfProject(projectId, artifacts)
  const artifact = activeArtifactId
    ? projectArtifacts.find((a) => a.id === activeArtifactId)
    : projectArtifacts[0]

  if (!artifact) return <EmptyProject />

  if (effectiveView === 'preview')
    return <PreviewView artifact={artifact} hostFallback={hostFallback} />
  if (effectiveView === 'edit') return <EditView artifact={artifact} />
  if (effectiveView === 'data') return <DataView artifact={artifact} />
  if (effectiveView === 'publish') return <PublishView artifact={artifact} />
  if (effectiveView === 'dashboard') return <DashboardView artifact={artifact} />
  return null
}

function EmptyProject() {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="flex max-w-[400px] flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--fill-medium)] text-[var(--color-ink)]/55">
          <SquarePen size={20} strokeWidth={1.4} />
        </span>
        <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">这个项目还没有产物</h2>
        <p className="text-[12px] leading-[1.6] text-[var(--color-ink)]/55">
          在左栏点 "+ 新建产物"，或在聊天里告诉 AI 想做什么。
        </p>
      </div>
    </div>
  )
}
