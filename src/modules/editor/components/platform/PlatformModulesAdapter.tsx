import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  artifactsOfProject,
  getActiveWorkspaceTabId,
  getLayer2SubKind,
  getWorkspaceTabs,
  useArtifactStore,
  type Artifact,
  type ArtifactKind,
} from '../../store/artifact-store'
import {
  ADDABLE_NODES_BY_KIND,
  NODE_ICONS,
  NODE_LABELS,
  SUB_KINDS_BY_NODE,
  SUB_TAB_LABELS,
  type ProjectKind,
  type WorkspaceNodeKind,
} from '../../store/workspace-nodes'
import PreviewView from './views/PreviewView'
import EditView from './views/EditView'
import DataView from './views/DataView'

/** Sync VibeCodingPage's project state into the artifact store and
 *  expose the resolved workspace context for the right pane. */
export function useArtifactViewSync(
  title: string,
  kind: ProjectKind,
): {
  projectId: string
  /** Layer-1 tabs for the current project (saved layout or default). */
  workspaceTabs: ReturnType<typeof getWorkspaceTabs>
  /** Active Layer-1 tab id. */
  activeTabId: string | null
  /** The active tab's node kind (resolved from workspaceTabs). */
  activeNodeKind: WorkspaceNodeKind | null
  /** Active Layer-2 sub-tab (ArtifactKind) for the current node. */
  activeSubKind: ArtifactKind | null
  /** Currently focused artifact, after preferring one whose kind
   *  matches the active sub-kind (so switching Layer-2 picks the
   *  right artifact in the same project). */
  activeArtifact: Artifact | null
} {
  const ensureProjectByTitle = useArtifactStore((s) => s.ensureProjectByTitle)
  const setActiveProject = useArtifactStore((s) => s.setActiveProject)
  const activeProjectId = useArtifactStore((s) => s.activeProjectId)
  const projects = useArtifactStore((s) => s.projects)
  const artifacts = useArtifactStore((s) => s.artifacts)
  const workspaceTabsByProject = useArtifactStore((s) => s.workspaceTabsByProject)
  const activeWorkspaceTabByProject = useArtifactStore(
    (s) => s.activeWorkspaceTabByProject,
  )
  const layer2SubKindByContext = useArtifactStore((s) => s.layer2SubKindByContext)
  const activeArtifactId = useArtifactStore((s) => s.activeArtifactId)

  useEffect(() => {
    const id = ensureProjectByTitle(title, kind)
    if (id !== activeProjectId) setActiveProject(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, kind])

  const workspaceTabs = useMemo(
    () => getWorkspaceTabs({ workspaceTabsByProject, projects }, activeProjectId),
    [workspaceTabsByProject, projects, activeProjectId],
  )
  const activeTabId = getActiveWorkspaceTabId(
    { workspaceTabsByProject, activeWorkspaceTabByProject, projects },
    activeProjectId,
  )
  const activeNodeKind = activeTabId
    ? workspaceTabs.find((t) => t.id === activeTabId)?.kind ?? null
    : null
  const activeSubKind = activeNodeKind
    ? getLayer2SubKind({ layer2SubKindByContext }, activeProjectId, activeNodeKind)
    : null

  // Prefer an artifact whose kind matches the active sub-kind. Falls
  // back to the store's activeArtifactId or the first project artifact.
  const projectArtifacts = useMemo(
    () => artifactsOfProject(activeProjectId, artifacts),
    [activeProjectId, artifacts],
  )
  const activeArtifact = useMemo(() => {
    if (activeSubKind) {
      const match = projectArtifacts.find((a) => a.kind === activeSubKind)
      if (match) return match
    }
    if (activeArtifactId) {
      const direct = projectArtifacts.find((a) => a.id === activeArtifactId)
      if (direct) return direct
    }
    return projectArtifacts[0] ?? null
  }, [projectArtifacts, activeSubKind, activeArtifactId])

  return {
    projectId: activeProjectId,
    workspaceTabs,
    activeTabId,
    activeNodeKind,
    activeSubKind,
    activeArtifact,
  }
}

/* ─── Layer 1 — workspace tab strip ───────────────────────────────── */

interface TabBarProps {
  projectId: string
  projectKind: ProjectKind
  tabs: ReturnType<typeof getWorkspaceTabs>
  activeTabId: string | null
  className?: string
}

/** Top-row workspace tab strip. Tabs are derived from the left-side
 *  project directory (界面预览 / 数据库 / 代码文件 / …). User can add
 *  more via the "+" picker and close closable tabs with the X. */
export function WorkspaceTabBar({
  projectId,
  projectKind,
  tabs,
  activeTabId,
  className = '',
}: TabBarProps) {
  const setActiveWorkspaceTab = useArtifactStore((s) => s.setActiveWorkspaceTab)
  const addWorkspaceTab = useArtifactStore((s) => s.addWorkspaceTab)
  const closeWorkspaceTab = useArtifactStore((s) => s.closeWorkspaceTab)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Default-pinned kinds for this project type — those tabs aren't
  // closable. User-added extras are closable.
  const defaults = useMemo(
    () => new Set<WorkspaceNodeKind>(),
    [],
  )
  // Compute the addable list — full catalog minus already-open kinds.
  const addable = useMemo(() => {
    const open = new Set(tabs.map((t) => t.kind))
    return (ADDABLE_NODES_BY_KIND[projectKind] ?? []).filter((k) => !open.has(k))
  }, [tabs, projectKind])

  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [pickerOpen])

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {tabs.map((tab) => {
        const Icon = NODE_ICONS[tab.kind]
        const isActive = tab.id === activeTabId
        const closable = !defaults.has(tab.kind) && tabs.length > 1
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveWorkspaceTab(projectId, tab.id)}
            className={`group flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] transition-colors ${
              isActive
                ? 'bg-[var(--color-ink)]/[0.08] text-[var(--color-ink)]'
                : 'text-[var(--color-ink)]/55 hover:bg-[var(--color-ink)]/[0.04] hover:text-[var(--color-ink)]/85'
            }`}
          >
            <Icon size={12} strokeWidth={1.7} />
            <span>{NODE_LABELS[tab.kind]}</span>
            {closable && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation()
                  closeWorkspaceTab(projectId, tab.id)
                }}
                className={`-mr-1 flex h-3.5 w-3.5 items-center justify-center rounded transition-opacity ${
                  isActive
                    ? 'opacity-50 hover:bg-[var(--color-ink)]/15 hover:opacity-100'
                    : 'opacity-0 group-hover:opacity-50 hover:bg-[var(--color-ink)]/15 hover:opacity-100'
                }`}
              >
                <X size={10} strokeWidth={2} />
              </span>
            )}
          </button>
        )
      })}
      {/* + picker */}
      <div ref={pickerRef} className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          disabled={addable.length === 0}
          title={addable.length === 0 ? '没有可添加的节点' : '添加节点'}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            pickerOpen
              ? 'bg-[var(--color-ink)]/[0.08] text-[var(--color-ink)]'
              : 'text-[var(--color-ink)]/55 hover:bg-[var(--color-ink)]/[0.04] hover:text-[var(--color-ink)]/85'
          } ${addable.length === 0 ? 'cursor-default opacity-40' : ''}`}
        >
          <Plus size={13} strokeWidth={1.8} />
        </button>
        {pickerOpen && addable.length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-1 w-[180px] overflow-hidden rounded-lg border border-[var(--divider)] bg-[var(--color-surface-2)] shadow-[0_20px_50px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--color-ink)]/40">
              添加节点
            </div>
            {addable.map((k) => {
              const Icon = NODE_ICONS[k]
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    addWorkspaceTab(projectId, k)
                    setPickerOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-[var(--color-ink)]/85 transition-colors hover:bg-[var(--fill-soft)]"
                >
                  <Icon size={12} strokeWidth={1.7} className="text-[var(--color-ink)]/55" />
                  {NODE_LABELS[k]}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Layer 2 — artifact-kind sub-tab strip ────────────────────────── */

interface SubTabBarProps {
  projectId: string
  nodeKind: WorkspaceNodeKind
  activeSubKind: ArtifactKind | null
  className?: string
}

export function NodeSubTabBar({
  projectId,
  nodeKind,
  activeSubKind,
  className = '',
}: SubTabBarProps) {
  const setLayer2SubKind = useArtifactStore((s) => s.setLayer2SubKind)
  const subs = SUB_KINDS_BY_NODE[nodeKind] ?? []
  if (subs.length === 0) return null
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {subs.map((s) => {
        const isActive = s === activeSubKind
        return (
          <button
            key={s}
            type="button"
            onClick={() => setLayer2SubKind(projectId, nodeKind, s)}
            className={`flex h-7 items-center rounded-md px-2.5 text-[12px] transition-colors ${
              isActive
                ? 'bg-[var(--color-ink)]/[0.08] text-[var(--color-ink)]'
                : 'text-[var(--color-ink)]/55 hover:bg-[var(--color-ink)]/[0.04] hover:text-[var(--color-ink)]/85'
            }`}
          >
            {SUB_TAB_LABELS[s]}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Layer 3 — content dispatcher by node kind ─────────────────────── */

interface ContentProps {
  nodeKind: WorkspaceNodeKind
  artifact: Artifact | null
  /** Host page's existing preview surface (phone mockup + filter chips
   *  + reload/真机预览 buttons). Used for 界面预览 on app-shape
   *  artifacts. */
  hostFallback?: React.ReactNode
}

export function WorkspaceNodeContent({
  nodeKind,
  artifact,
  hostFallback,
}: ContentProps) {
  if (!artifact) return <EmptyNodeState />

  if (nodeKind === 'preview') {
    return <PreviewView artifact={artifact} hostFallback={hostFallback} />
  }
  if (nodeKind === 'database') {
    return <DataView artifact={artifact} />
  }
  if (nodeKind === 'code') {
    // Code-file editing always lives in the host's multi-file tab
    // system; this branch is reached when the host hostFallback isn't
    // passed (e.g. recall artifact). Show empty state.
    return hostFallback ? <>{hostFallback}</> : <CodeFallback />
  }
  if (nodeKind === 'agent' || nodeKind === 'persona' || nodeKind === 'persona-prompt') {
    return <EditView artifact={artifact} />
  }
  if (nodeKind === 'knowledge' || nodeKind === 'skills' || nodeKind === 'triggers') {
    return <EditView artifact={artifact} />
  }
  if (nodeKind === 'mp-settings' || nodeKind === 'assets') {
    return <EditView artifact={artifact} />
  }
  if (nodeKind === 'proposal-doc') {
    return <PreviewView artifact={artifact} hostFallback={hostFallback} />
  }
  if (nodeKind === 'proposal-dashboard') {
    return <EditView artifact={artifact} />
  }
  return <EmptyNodeState />
}

function EmptyNodeState() {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="text-[12px] text-[var(--color-ink)]/45">该节点暂无内容</div>
    </div>
  )
}

function CodeFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="text-[12px] text-[var(--color-ink)]/55">
        该产物类型暂无代码文件
      </div>
    </div>
  )
}
