import { create } from 'zustand'
import type { PublishTargetId } from './publish-flow-store'
import {
  DEFAULT_NODES_BY_KIND,
  SUB_KINDS_BY_NODE,
  type WorkspaceNodeKind,
} from './workspace-nodes'

/* ─── Artifact model ─────────────────────────────────────────────────────
 *
 * Every project is a workshop that produces *artifacts* — recall-ready
 * units the end-device AI pulls in when answering a user. They are
 * flat (no "main persona" privilege) and individually addressable.
 *
 * Kinds:
 *   persona-card  — a persona recall card. Injected into the end-device
 *                   AI's prompt so it speaks in that voice / role.
 *   scene-card    — a rich scene card (比分卡 / 评论卡 / IM 卡 / 底 bar 卡 …).
 *                   Recalled by intent + entity match and rendered into
 *                   the host scene.
 *   mp-page       — a mini-program page.
 *   mp-agent      — an in-mini-program agent.
 *   proposal-doc  — a proposal artifact document (markdown).
 */

export type ArtifactKind =
  | 'persona-card'
  | 'scene-card'
  | 'mp-page'
  | 'mp-agent'
  | 'proposal-doc'

export type ArtifactStatus = 'draft' | 'reviewing' | 'live' | 'paused'

/** Semantic condition under which the end-device AI calls this artifact
 *  into its working set. Three kinds — intent (verbatim intent label
 *  like "查询比分"), entity (named-entity tag like "体育/电竞-赛事比分"),
 *  context (host scene id like "搜索结果页"). */
export interface RecallTrigger {
  id: string
  kind: 'intent' | 'entity' | 'context'
  /** Free-text match phrase. Real product would back this by a classifier. */
  match: string
}

/** What the artifact renders into once recalled. `template` picks the
 *  base render shape; `body` is the kind-specific config (free-shape so
 *  each editor panel can extend it without store churn). */
export interface RenderSpec {
  template: 'text' | 'card' | 'list' | 'rich-message'
  /** Sample preview text / JSON / markdown — shown in the right-rail. */
  preview: string
}

export interface Artifact {
  id: string
  projectId: string
  name: string
  kind: ArtifactKind
  /** Free-text one-liner used for the artifact list subtitle. */
  hint: string
  status: ArtifactStatus
  triggers: RecallTrigger[]
  render: RenderSpec
  /** Which (platform × scene) targets this artifact is configured for. */
  targets: PublishTargetId[]
  updatedAt: number
  /** Optional kind-specific config blob. Persona uses it for tone/style;
   *  scene cards use it for layout slots. Free-shape on purpose. */
  config?: Record<string, unknown>
}

/* ─── Project model ───────────────────────────────────────────────────── */

export type ProjectKindKey = 'ai-avatar' | 'mini-program' | 'ops-proposal' | 'web-app'

export interface ProjectSummary {
  id: string
  name: string
  kind: ProjectKindKey
  updatedAt: number
  /** Convenience — the most recently selected artifact in this project,
   *  so re-entering the project restores the last view. */
  lastArtifactId?: string
}

/* ─── Seed data ───────────────────────────────────────────────────────── */

const now = Date.now()

const SEED_PROJECTS: ProjectSummary[] = [
  { id: 'ai-fans-bot', name: '粉丝互动机器人', kind: 'ai-avatar', updatedAt: now - 86_400_000, lastArtifactId: 'persona-card-main' },
  { id: 'mp-tarot', name: '第五人格塔罗小程序', kind: 'mini-program', updatedAt: now - 172_800_000, lastArtifactId: 'mp-page-tarot' },
  { id: 'mp-checkin', name: '每日打卡小程序', kind: 'mini-program', updatedAt: now - 432_000_000, lastArtifactId: 'mp-page-checkin' },
  { id: 'ops-shanghai', name: '沪上火锅·五一种草提案', kind: 'ops-proposal', updatedAt: now - 86_400_000 * 7, lastArtifactId: 'doc-goal' },
  { id: 'web-portfolio', name: '个人作品集网站', kind: 'web-app', updatedAt: now - 86_400_000 * 12, lastArtifactId: 'mp-page-home' },
]

/** Known title → projectId for the VibeCodingPage's existing project
 *  catalog. Titles outside this map call `ensureProjectByTitle` which
 *  registers a stub project so the module shell always has something
 *  to render against. */
export const PROJECT_TITLE_TO_ID: Record<string, string> = {
  '每日打卡小程序': 'mp-checkin',
  '第五人格塔罗小程序': 'mp-tarot',
  '探店视频创作助手': 'mp-explore',
  '粉丝互动机器人': 'ai-fans-bot',
  '陶白白 Sensei 分身': 'ai-taobaibai',
  '沪上火锅·五一种草提案': 'ops-shanghai',
  '个人作品集网站': 'web-portfolio',
}

function slugFromTitle(t: string): string {
  return `proj-${t.replace(/[^a-zA-Z0-9一-龥]/g, '').slice(0, 24)}-${Math.abs(
    Array.from(t).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0),
  ).toString(36)}`
}

const SEED_ARTIFACTS: Artifact[] = [
  /* — 粉丝互动机器人 — */
  {
    id: 'persona-card-main',
    projectId: 'ai-fans-bot',
    name: '主分身人设召回卡',
    kind: 'persona-card',
    hint: '端上 AI 扮演时使用，定义口吻、世界观、回应原则',
    status: 'live',
    triggers: [
      { id: 't1', kind: 'context', match: '抖音作品评论区' },
      { id: 't2', kind: 'intent', match: '粉丝互动 / 安慰 / 鼓励' },
    ],
    render: {
      template: 'text',
      preview: '人设：温柔陪伴型偶像，回答控制在 30 字以内，遇到负面情绪先共情再建议。',
    },
    targets: ['douyin:comment', 'douyin:dm', 'douyin-xiaohua:im'],
    updatedAt: now - 3 * 86_400_000,
    config: {
      tone: '温柔陪伴 · 偏口语',
      avoid: ['说教', '冷淡', '官方话术'],
      sampleReplies: ['宝贝今天也辛苦啦，先去喝口热水吧🌧️', '你说的我懂——咱们一步一步来'],
    },
  },
  {
    id: 'scene-card-score',
    projectId: 'ai-fans-bot',
    name: '比分卡 · 搜索页',
    kind: 'scene-card',
    hint: '用户在搜索框输入赛事时，召回最新比分作为富卡片',
    status: 'reviewing',
    triggers: [
      { id: 't1', kind: 'intent', match: '查询比分' },
      { id: 't2', kind: 'entity', match: '体育/电竞-赛事比分' },
      { id: 't3', kind: 'context', match: '搜索结果页' },
    ],
    render: {
      template: 'card',
      preview: '主队 vs 客队 · 实时比分 + 进球时间线 + 跳转直播',
    },
    targets: ['douyin-xiaohua:search'],
    updatedAt: now - 1 * 86_400_000,
    config: {
      layout: 'score-board',
      slots: ['home-team', 'away-team', 'score', 'timeline', 'cta-watch'],
    },
  },
  {
    id: 'scene-card-comment-hot',
    projectId: 'ai-fans-bot',
    name: '热评回应卡 · 评论区',
    kind: 'scene-card',
    hint: '当评论区有热评且情绪积极时，触发 AI 分身富回复',
    status: 'draft',
    triggers: [
      { id: 't1', kind: 'context', match: '抖音作品评论区' },
      { id: 't2', kind: 'intent', match: '回应热评 / 致谢' },
    ],
    render: {
      template: 'rich-message',
      preview: 'AI 分身头像 + 回复 + 表情包，可被楼主置顶',
    },
    targets: ['douyin:comment'],
    updatedAt: now - 6 * 3600_000,
    config: { layout: 'avatar-reply', emojiPack: 'cute-v2' },
  },
  {
    id: 'scene-card-im-rich',
    projectId: 'ai-fans-bot',
    name: 'IM 富卡 · 抖音小花',
    kind: 'scene-card',
    hint: '私聊场景：用户问"今天吃啥"时召回美食推荐富卡',
    status: 'draft',
    triggers: [
      { id: 't1', kind: 'context', match: '抖音小花 IM' },
      { id: 't2', kind: 'intent', match: '吃喝推荐' },
    ],
    render: {
      template: 'card',
      preview: '3 张餐厅卡片轮播 + 一键导航',
    },
    targets: ['douyin-xiaohua:im'],
    updatedAt: now - 2 * 86_400_000,
    config: { layout: 'restaurant-carousel' },
  },

  /* — 第五人格塔罗小程序 — */
  {
    id: 'mp-page-tarot',
    projectId: 'mp-tarot',
    name: '塔罗占卜页',
    kind: 'mp-page',
    hint: '小程序首页：选择塔罗牌阵 → 抽牌动效 → 解读',
    status: 'live',
    triggers: [],
    render: { template: 'card', preview: '页面路由：/tarot · 含 3 牌 / 凯尔特十字两种牌阵' },
    targets: [],
    updatedAt: now - 86_400_000,
  },
  {
    id: 'mp-page-profile',
    projectId: 'mp-tarot',
    name: '个人占卜历史',
    kind: 'mp-page',
    hint: '记录用户历史抽牌结果与解读',
    status: 'live',
    triggers: [],
    render: { template: 'list', preview: '页面路由：/profile' },
    targets: [],
    updatedAt: now - 86_400_000 * 2,
  },
  {
    id: 'mp-agent-tarot',
    projectId: 'mp-tarot',
    name: '塔罗解读 Agent',
    kind: 'mp-agent',
    hint: '小程序内置 Agent，根据牌阵生成个性化解读文案',
    status: 'live',
    triggers: [{ id: 't1', kind: 'intent', match: '解读牌阵' }],
    render: { template: 'text', preview: '调用模型：gpt-4o · 上下文：牌阵 + 用户问题' },
    targets: [],
    updatedAt: now - 86_400_000,
  },

  /* — 每日打卡小程序 — */
  {
    id: 'mp-page-checkin',
    projectId: 'mp-checkin',
    name: '打卡日历页',
    kind: 'mp-page',
    hint: '主页：日历视图 + 今日打卡按钮',
    status: 'live',
    triggers: [],
    render: { template: 'card', preview: '页面路由：/checkin' },
    targets: [],
    updatedAt: now - 86_400_000 * 3,
  },

  /* — 沪上火锅提案 — */
  {
    id: 'doc-goal',
    projectId: 'ops-shanghai',
    name: '商家目标卡',
    kind: 'proposal-doc',
    hint: '客户在五一档要新增 2000 单到店',
    status: 'live',
    triggers: [],
    render: { template: 'text', preview: '商家目标 · 受众 · 预算 · KPI 锚点' },
    targets: [],
    updatedAt: now - 86_400_000 * 7,
  },
  {
    id: 'doc-diagnosis',
    projectId: 'ops-shanghai',
    name: '人群诊断看板',
    kind: 'proposal-doc',
    hint: '过去 30 天到店人群结构 + 流量来源拆解',
    status: 'live',
    triggers: [],
    render: { template: 'rich-message', preview: '人群分布 + 漏斗 + 转化率' },
    targets: [],
    updatedAt: now - 86_400_000 * 6,
  },

  /* — 作品集网站 — */
  {
    id: 'mp-page-home',
    projectId: 'web-portfolio',
    name: '首页',
    kind: 'mp-page',
    hint: '作品集站点入口',
    status: 'live',
    triggers: [],
    render: { template: 'card', preview: '路径：/' },
    targets: [],
    updatedAt: now - 86_400_000 * 12,
  },
]

let nextArtifactSeq = 100

/* ─── Store ──────────────────────────────────────────────────────────── */

interface ArtifactState {
  projects: ProjectSummary[]
  artifacts: Artifact[]
  /** Currently focused project — drives the middle column. */
  activeProjectId: string
  /** Currently focused artifact within the active project. */
  activeArtifactId: string | null
  /** Layer-1 tab list per project. Seeded lazily from the kind's
   *  default node list on first read. */
  workspaceTabsByProject: Record<string, WorkspaceTabRef[]>
  /** Active Layer-1 tab id per project. */
  activeWorkspaceTabByProject: Record<string, string | null>
  /** Layer-2 sub-tab (ArtifactKind) per (projectId, nodeKind). Key =
   *  `${projectId}:${nodeKind}`. Falls back to the node's first
   *  supported kind when unset. */
  layer2SubKindByContext: Record<string, ArtifactKind>

  /** Whether the database overlay drawer is open. Triggered by the
   *  database icon in the top-right cluster — independent of the
   *  database workspace tab. */
  databaseOverlayOpen: boolean

  setActiveProject: (id: string) => void
  setActiveArtifact: (id: string | null) => void
  setActiveWorkspaceTab: (projectId: string, tabId: string) => void
  addWorkspaceTab: (projectId: string, kind: WorkspaceNodeKind) => void
  closeWorkspaceTab: (projectId: string, tabId: string) => void
  setLayer2SubKind: (
    projectId: string,
    nodeKind: WorkspaceNodeKind,
    artifactKind: ArtifactKind,
  ) => void
  setDatabaseOverlayOpen: (open: boolean) => void

  createArtifact: (
    input: Pick<Artifact, 'projectId' | 'name' | 'kind' | 'hint'> & Partial<Artifact>,
  ) => string
  updateArtifact: (id: string, patch: Partial<Artifact>) => void
  deleteArtifact: (id: string) => void
  /** Convenience — toggle a publish target on the artifact. */
  toggleArtifactTarget: (id: string, target: PublishTargetId) => void

  /** Look up (or auto-register) a project by its display title. Used by
   *  VibeCodingPage to bridge its `projectTitle` state into the artifact
   *  store. Auto-registered projects get a deterministic slug + start
   *  with no artifacts; the user can create some via the workspace UI. */
  ensureProjectByTitle: (title: string, kind: ProjectKindKey) => string
}

/* ─── Workspace tab (Layer 1) ───────────────────────────────────────────
 *
 * The right pane is a directory-driven workspace: each Layer-1 tab is
 * a "workspace node" (界面预览 / 数据库 / 代码文件 / …) sourced from the
 * left-side project directory. The catalog and per-project defaults
 * live in `workspace-nodes.ts`; this store tracks which nodes are
 * currently pinned per project and which one is active.
 *
 * A pinned tab list is kept per `projectId` so switching projects
 * restores its tab layout. New projects start from the kind's default
 * list; the user can `+` add additional nodes from the picker.
 */

export interface WorkspaceTabRef {
  /** The node kind — drives icon, label, content dispatcher. */
  kind: WorkspaceNodeKind
  /** Stable id so tabs are addressable (`kind` could repeat if the
   *  user opens multiple code-file tabs, but for now we cap at 1
   *  instance per kind so id === kind in practice). */
  id: string
}

export const KIND_LABELS: Record<ArtifactKind, string> = {
  'persona-card': '人设召回卡',
  'scene-card': '场景卡片',
  'mp-page': '页面',
  'mp-agent': '小程序 Agent',
  'proposal-doc': '提案文档',
}

export const STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: '草稿',
  reviewing: '审核中',
  live: '已上线',
  paused: '暂停',
}

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  projects: SEED_PROJECTS,
  artifacts: SEED_ARTIFACTS,
  activeProjectId: 'ai-fans-bot',
  activeArtifactId: 'persona-card-main',
  workspaceTabsByProject: {},
  activeWorkspaceTabByProject: {},
  layer2SubKindByContext: {},
  databaseOverlayOpen: false,

  setActiveProject: (id) => {
    const proj = get().projects.find((p) => p.id === id)
    if (!proj) return
    // Auto-select the project's first artifact. If a per-project
    // "last visited" hint exists and that artifact still lives, prefer
    // it; otherwise fall through to the first one we find.
    const projectArtifacts = get().artifacts.filter((a) => a.projectId === id)
    const lastValid = proj.lastArtifactId
      ? projectArtifacts.find((a) => a.id === proj.lastArtifactId)
      : null
    const nextArtifact = lastValid ?? projectArtifacts[0] ?? null
    set({
      activeProjectId: id,
      activeArtifactId: nextArtifact?.id ?? null,
    })
  },
  setActiveArtifact: (id) => {
    set({ activeArtifactId: id })
    if (id) {
      const projId = get().activeProjectId
      set({
        projects: get().projects.map((p) =>
          p.id === projId ? { ...p, lastArtifactId: id, updatedAt: Date.now() } : p,
        ),
      })
    }
  },
  setActiveWorkspaceTab: (projectId, tabId) =>
    set({
      activeWorkspaceTabByProject: {
        ...get().activeWorkspaceTabByProject,
        [projectId]: tabId,
      },
    }),
  addWorkspaceTab: (projectId, kind) => {
    const cur = get().workspaceTabsByProject[projectId] ?? []
    // Cap one instance per kind for now — clicking the same node from
    // the picker re-activates the existing tab instead of duplicating.
    const existing = cur.find((t) => t.kind === kind)
    if (existing) {
      get().setActiveWorkspaceTab(projectId, existing.id)
      return
    }
    const id = kind
    set({
      workspaceTabsByProject: {
        ...get().workspaceTabsByProject,
        [projectId]: [...cur, { kind, id }],
      },
      activeWorkspaceTabByProject: {
        ...get().activeWorkspaceTabByProject,
        [projectId]: id,
      },
    })
  },
  closeWorkspaceTab: (projectId, tabId) => {
    const cur = get().workspaceTabsByProject[projectId] ?? []
    const next = cur.filter((t) => t.id !== tabId)
    const wasActive = get().activeWorkspaceTabByProject[projectId] === tabId
    set({
      workspaceTabsByProject: {
        ...get().workspaceTabsByProject,
        [projectId]: next,
      },
      activeWorkspaceTabByProject: {
        ...get().activeWorkspaceTabByProject,
        [projectId]: wasActive ? next[0]?.id ?? null : get().activeWorkspaceTabByProject[projectId],
      },
    })
  },
  setLayer2SubKind: (projectId, nodeKind, artifactKind) =>
    set({
      layer2SubKindByContext: {
        ...get().layer2SubKindByContext,
        [`${projectId}:${nodeKind}`]: artifactKind,
      },
    }),
  setDatabaseOverlayOpen: (open) => set({ databaseOverlayOpen: open }),

  createArtifact: (input) => {
    const id = `art-${nextArtifactSeq++}`
    const artifact: Artifact = {
      id,
      projectId: input.projectId,
      name: input.name,
      kind: input.kind,
      hint: input.hint,
      status: 'draft',
      triggers: input.triggers ?? [],
      render: input.render ?? { template: 'card', preview: '（待配置）' },
      targets: input.targets ?? [],
      updatedAt: Date.now(),
      config: input.config,
    }
    set({ artifacts: [artifact, ...get().artifacts], activeArtifactId: id })
    return id
  },
  updateArtifact: (id, patch) => {
    set({
      artifacts: get().artifacts.map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
      ),
    })
  },
  deleteArtifact: (id) => {
    const next = get().artifacts.filter((a) => a.id !== id)
    set({
      artifacts: next,
      activeArtifactId:
        get().activeArtifactId === id
          ? next.find((a) => a.projectId === get().activeProjectId)?.id ?? null
          : get().activeArtifactId,
    })
  },
  toggleArtifactTarget: (id, target) => {
    const a = get().artifacts.find((x) => x.id === id)
    if (!a) return
    const has = a.targets.includes(target)
    get().updateArtifact(id, {
      targets: has ? a.targets.filter((t) => t !== target) : [...a.targets, target],
    })
  },
  ensureProjectByTitle: (title, kind) => {
    const known = PROJECT_TITLE_TO_ID[title]
    const id = known ?? slugFromTitle(title)
    const existing = get().projects.find((p) => p.id === id)
    if (existing) {
      // Keep the title in sync — the user can rename projects in
      // VibeCodingPage and we want that to flow through.
      if (existing.name !== title || existing.kind !== kind) {
        useArtifactStore.setState({
          projects: get().projects.map((p) =>
            p.id === id ? { ...p, name: title, kind } : p,
          ),
        })
      }
      return id
    }
    const newProject: ProjectSummary = {
      id,
      name: title,
      kind,
      updatedAt: Date.now(),
    }
    useArtifactStore.setState({ projects: [newProject, ...get().projects] })
    return id
  },
}))

export function artifactsOfProject(projectId: string, all: Artifact[]): Artifact[] {
  return all.filter((a) => a.projectId === projectId)
}

/** Resolve the workspace-tab list for a project. If the project has no
 *  saved layout yet, fall through to the kind's default node list.
 *  Pure read — does not mutate state. */
export function getWorkspaceTabs(
  state: Pick<ArtifactState, 'workspaceTabsByProject' | 'projects'>,
  projectId: string,
): WorkspaceTabRef[] {
  const saved = state.workspaceTabsByProject[projectId]
  if (saved && saved.length > 0) return saved
  const project = state.projects.find((p) => p.id === projectId)
  if (!project) return []
  const defaults = DEFAULT_NODES_BY_KIND[project.kind] ?? []
  return defaults.map((k) => ({ kind: k, id: k }))
}

/** Resolve the active workspace tab for a project — preferring the
 *  per-project state, falling through to the first tab in the
 *  resolved list. */
export function getActiveWorkspaceTabId(
  state: Pick<ArtifactState, 'workspaceTabsByProject' | 'activeWorkspaceTabByProject' | 'projects'>,
  projectId: string,
): string | null {
  const tabs = getWorkspaceTabs(state, projectId)
  const stored = state.activeWorkspaceTabByProject[projectId]
  if (stored && tabs.some((t) => t.id === stored)) return stored
  return tabs[0]?.id ?? null
}

/** Resolve the Layer-2 sub-kind for (projectId, nodeKind). Falls back
 *  to the node's first supported artifact kind. */
export function getLayer2SubKind(
  state: Pick<ArtifactState, 'layer2SubKindByContext'>,
  projectId: string,
  nodeKind: WorkspaceNodeKind,
): ArtifactKind | null {
  const key = `${projectId}:${nodeKind}`
  const stored = state.layer2SubKindByContext[key]
  if (stored) return stored
  return SUB_KINDS_BY_NODE[nodeKind]?.[0] ?? null
}
