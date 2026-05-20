import { create } from 'zustand'

/* ─── Publish targets ─────────────────────────────────────────────────────
 *
 * A publish target is a (platform × scene) pair. Two host platforms,
 * each with its own scene catalog. One job can cover any combination of
 * targets across platforms; the workflow is uniform per target.
 *
 * Display order follows the catalog order — UI iterates these arrays
 * directly. Add new scenes here and the tree picker / job card pick
 * them up automatically.
 */

export type PublishPlatformId = 'douyin' | 'douyin-xiaohua'

export interface PublishPlatform {
  id: PublishPlatformId
  label: string
  hint: string
  scenes: PublishScene[]
}

export interface PublishScene {
  id: string
  platformId: PublishPlatformId
  label: string
  description: string
}

/** Flat target id = `${platformId}:${sceneId}`. Used as the canonical
 *  reference in jobs + selection state so we never confuse same-named
 *  scenes across platforms (`douyin:comment` vs `douyin-xiaohua:comment`). */
export type PublishTargetId = string

export const PUBLISH_PLATFORMS: PublishPlatform[] = [
  {
    id: 'douyin',
    label: '抖音 APP',
    hint: '原生客户端入口',
    scenes: [
      {
        id: 'comment',
        platformId: 'douyin',
        label: '评论区',
        description: 'AI 分身在作品评论区主动互动 / 召回卡片',
      },
      {
        id: 'ai-chat',
        platformId: 'douyin',
        label: 'AI 聊天',
        description: '个人页 AI 聊天入口，1 对 1 长会话',
      },
      {
        id: 'group',
        platformId: 'douyin',
        label: '群聊',
        description: 'AI 分身参与群聊，富卡片可被群成员引用',
      },
      {
        id: 'dm',
        platformId: 'douyin',
        label: '私信',
        description: 'AI 分身自动回复私信，提升用户粘性',
      },
    ],
  },
  {
    id: 'douyin-xiaohua',
    label: '抖音小花',
    hint: 'AI 助手客户端',
    scenes: [
      {
        id: 'search',
        platformId: 'douyin-xiaohua',
        label: '抖音搜索',
        description: '搜索结果页的 AI 召回卡片（如比分卡、知识卡）',
      },
      {
        id: 'bottom-bar',
        platformId: 'douyin-xiaohua',
        label: '底 bar',
        description: '底 bar 唤起 AI 入口的 召回素材',
      },
      {
        id: 'comment',
        platformId: 'douyin-xiaohua',
        label: '评论区',
        description: '抖音小花评论区悬浮卡片 / 引导回复',
      },
      {
        id: 'im',
        platformId: 'douyin-xiaohua',
        label: '抖音小花 IM',
        description: '抖音小花私聊 / 群聊里的富卡片素材',
      },
    ],
  },
]

export function targetId(platformId: PublishPlatformId, sceneId: string): PublishTargetId {
  return `${platformId}:${sceneId}`
}

export function parseTargetId(id: PublishTargetId): { platformId: PublishPlatformId; sceneId: string } {
  const [platformId, sceneId] = id.split(':') as [PublishPlatformId, string]
  return { platformId, sceneId }
}

export function getScene(id: PublishTargetId): PublishScene | undefined {
  const { platformId, sceneId } = parseTargetId(id)
  return PUBLISH_PLATFORMS.find((p) => p.id === platformId)
    ?.scenes.find((s) => s.id === sceneId)
}

export function getPlatform(id: PublishPlatformId): PublishPlatform | undefined {
  return PUBLISH_PLATFORMS.find((p) => p.id === id)
}

/** Legacy single-platform scene list — kept for the chat-embedded form
 *  while the new modal-driven publish center is the only entry point
 *  for the new platform layout. Drives PublishForm's pill grid. */
export const PUBLISH_SCENES = ['AI 聊天', '评论区', '群聊', '私信'] as const

export const PUBLISH_SCENE_DESCRIPTIONS: Record<string, string> = {
  'AI 聊天': '在个人页展示 AI 聊天入口，提供 1 对 1 互动',
  '评论区': 'AI 分身活跃评论区，助力粉丝互动',
  '群聊': 'AI 分身参与群聊互动，提升参与感',
  '私信': 'AI 分身自动回复私信，提升用户粘性',
}

/* ─── Publish flow nodes ───────────────────────────────────────────── */

export type PublishNodeId = 'code-check' | 'content-review' | 'gray' | 'full'

export interface PublishNodeDef {
  id: PublishNodeId
  label: string
  hint: string
  /** Default ETA for the demo timeline (seconds since job start). Real
   *  product would source these from the actual backend. */
  etaSec: number
}

export const PUBLISH_NODES: PublishNodeDef[] = [
  { id: 'code-check', label: '代码检查', hint: 'lint · type-check · 静态扫描', etaSec: 30 },
  { id: 'content-review', label: '内容审核', hint: '人工 + 模型双审，违规拦截', etaSec: 600 },
  { id: 'gray', label: '灰度', hint: '5% 流量灰度，监控异常自动回滚', etaSec: 3600 },
  { id: 'full', label: '全量', hint: '全量推流，发布完成', etaSec: 7200 },
]

export type PublishNodeStatus = 'pending' | 'running' | 'passed' | 'failed' | 'rolled-back'

export interface PublishNodeRun {
  id: PublishNodeId
  status: PublishNodeStatus
  startedAt?: number
  finishedAt?: number
  operator?: string
  note?: string
}

/* ─── Job + history ────────────────────────────────────────────────── */

export type PublishJobStatus =
  | 'draft'         // 工单刚创建，等待提交
  | 'running'       // 至少一个节点在跑
  | 'succeeded'     // 所有目标都跑到 full 并 passed
  | 'failed'        // 某个目标在某个节点 failed 且未恢复
  | 'paused'        // 灰度阶段人工暂停
  | 'rolled-back'   // 灰度阶段人工回滚

export interface PublishTargetRun {
  /** `${platformId}:${sceneId}` */
  targetId: PublishTargetId
  /** Per-node run state for this target. Order matches PUBLISH_NODES. */
  nodes: PublishNodeRun[]
}

export interface PublishJob {
  id: string
  /** Short title shown in the job-list cards — 自动从 artifact 名 + 版本生成。 */
  title: string
  /** Optional release notes / context the operator typed. */
  notes?: string
  /** Snapshot of artifact ids included in this job (refs into artifact-store). */
  artifactIds: string[]
  targets: PublishTargetRun[]
  status: PublishJobStatus
  createdAt: number
  /** Operator name — defaults to "你" in the demo. */
  createdBy: string
  /** Time-ordered audit log shown in the right-rail detail panel. */
  history: PublishHistoryEntry[]
}

export interface PublishHistoryEntry {
  ts: number
  /** Short verb describing what happened, e.g. "提交发布"、"代码检查通过"、"灰度回滚". */
  label: string
  /** Optional target this entry pertains to. Omitted = job-level event. */
  targetId?: PublishTargetId
  /** Optional node this entry pertains to. */
  nodeId?: PublishNodeId
  operator?: string
}

/* ─── Legacy chat-flow state (preserved) ──────────────────────────── */

export type PublishStep = 'idle' | 'select' | 'review' | 'confirmed'
export type PublishMode = 'chat' | 'modal'

/** Lightweight snapshot of the trigger button's DOMRect. Used to
 *  position the publish popover under the button instead of as a
 *  centered overlay. Stored as plain numbers so it's serialization /
 *  StrictMode safe. */
export interface PublishAnchorRect {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

interface PublishFlowState {
  /* — chat / modal flow (legacy) — */
  step: PublishStep
  mode: PublishMode
  scenes: string[]
  /** Anchor rect of the button that opened the popover (set right
   *  before `start('modal')`). null when the flow is closed or not
   *  popover-positioned. */
  anchorRect: PublishAnchorRect | null
  start: (mode: PublishMode) => void
  toggleScene: (s: string) => void
  submit: () => void
  confirm: () => void
  reset: () => void
  closeModal: () => void
  setAnchorRect: (rect: PublishAnchorRect | null) => void

  /* — new job-based publish center — */
  jobs: PublishJob[]
  /** Open the new-job composer dialog (true) or close it (false). */
  composerOpen: boolean
  /** Targets the user is currently selecting in the composer. */
  composerTargets: PublishTargetId[]
  /** Free-text notes the operator is typing in the composer. */
  composerNotes: string
  /** Currently inspected job id in the right rail. */
  selectedJobId: string | null

  openComposer: () => void
  closeComposer: () => void
  toggleComposerTarget: (id: PublishTargetId) => void
  setComposerNotes: (v: string) => void
  /** Submit the composer → creates a PublishJob (status: running), kicks
   *  off the simulated node timeline (code-check passes immediately, the
   *  rest stay pending so the UI can demo the flow). */
  submitComposer: (input: { title: string; artifactIds: string[] }) => string
  /** Open the right-rail detail for an existing job. */
  selectJob: (id: string | null) => void
  /** Demo helper — advance the next pending node on a job/target to
   *  passed, appending a history entry. */
  advanceTargetNode: (jobId: string, targetId: PublishTargetId, operator?: string) => void
  /** Demo helper — mark a node failed (used by the right-rail's "失败回滚"
   *  sample action). */
  failTargetNode: (jobId: string, targetId: PublishTargetId, note?: string) => void
}

function makeTargetRun(targetId: PublishTargetId): PublishTargetRun {
  return {
    targetId,
    nodes: PUBLISH_NODES.map((n) => ({ id: n.id, status: 'pending' as PublishNodeStatus })),
  }
}

/** Seed demo data so the publish center never starts empty — the user
 *  immediately sees what a historical job looks like. */
function seedJobs(): PublishJob[] {
  const now = Date.now()
  const targets1: PublishTargetRun[] = [
    {
      targetId: 'douyin-xiaohua:search',
      nodes: [
        { id: 'code-check', status: 'passed', startedAt: now - 7200_000, finishedAt: now - 7170_000, operator: '你' },
        { id: 'content-review', status: 'passed', startedAt: now - 7170_000, finishedAt: now - 6570_000, operator: '审核组' },
        { id: 'gray', status: 'passed', startedAt: now - 6570_000, finishedAt: now - 2970_000, operator: '系统' },
        { id: 'full', status: 'passed', startedAt: now - 2970_000, finishedAt: now, operator: '系统' },
      ],
    },
    {
      targetId: 'douyin:comment',
      nodes: [
        { id: 'code-check', status: 'passed', startedAt: now - 7200_000, finishedAt: now - 7170_000, operator: '你' },
        { id: 'content-review', status: 'passed', startedAt: now - 7170_000, finishedAt: now - 6570_000, operator: '审核组' },
        { id: 'gray', status: 'passed', startedAt: now - 6570_000, finishedAt: now - 2970_000, operator: '系统' },
        { id: 'full', status: 'passed', startedAt: now - 2970_000, finishedAt: now, operator: '系统' },
      ],
    },
  ]
  const targets2: PublishTargetRun[] = [
    {
      targetId: 'douyin-xiaohua:search',
      nodes: [
        { id: 'code-check', status: 'passed', startedAt: now - 1800_000, finishedAt: now - 1770_000, operator: '你' },
        { id: 'content-review', status: 'running', startedAt: now - 1770_000, operator: '审核组' },
        { id: 'gray', status: 'pending' },
        { id: 'full', status: 'pending' },
      ],
    },
    {
      targetId: 'douyin-xiaohua:bottom-bar',
      nodes: [
        { id: 'code-check', status: 'passed', startedAt: now - 1800_000, finishedAt: now - 1770_000, operator: '你' },
        { id: 'content-review', status: 'running', startedAt: now - 1770_000, operator: '审核组' },
        { id: 'gray', status: 'pending' },
        { id: 'full', status: 'pending' },
      ],
    },
  ]
  return [
    {
      id: 'PUB-23',
      title: '比分卡 v1.2 · 全量发布',
      notes: '修复 #1042 关键词命中误判，加 NBA 别名',
      artifactIds: ['scene-card-score'],
      targets: targets2,
      status: 'running',
      createdAt: now - 1800_000,
      createdBy: '你',
      history: [
        { ts: now - 1800_000, label: '提交发布', operator: '你' },
        { ts: now - 1770_000, label: '代码检查通过', nodeId: 'code-check', operator: '系统' },
        { ts: now - 1770_000, label: '送入内容审核', nodeId: 'content-review', operator: '系统' },
      ],
    },
    {
      id: 'PUB-22',
      title: '主分身人设召回卡 v3.0 · 多场景上线',
      notes: '语气更口语化，加入直播间互动模板',
      artifactIds: ['persona-card-main'],
      targets: targets1,
      status: 'succeeded',
      createdAt: now - 7200_000,
      createdBy: '你',
      history: [
        { ts: now - 7200_000, label: '提交发布', operator: '你' },
        { ts: now - 7170_000, label: '代码检查通过', nodeId: 'code-check', operator: '系统' },
        { ts: now - 6570_000, label: '内容审核通过', nodeId: 'content-review', operator: '审核组' },
        { ts: now - 2970_000, label: '灰度通过', nodeId: 'gray', operator: '系统' },
        { ts: now, label: '全量发布', nodeId: 'full', operator: '系统' },
      ],
    },
  ]
}

let nextJobSeq = 24

export const usePublishFlowStore = create<PublishFlowState>((set, get) => ({
  /* legacy chat / modal */
  step: 'idle',
  mode: 'chat',
  scenes: [],
  anchorRect: null,
  start: (mode) => set({ step: 'select', mode }),
  setAnchorRect: (rect) => set({ anchorRect: rect }),
  toggleScene: (s) => {
    const cur = get().scenes
    set({
      scenes: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    })
  },
  submit: () => {
    if (get().scenes.length === 0) return
    set({ step: 'review' })
  },
  confirm: () => set({ step: 'confirmed' }),
  reset: () => set({ step: 'idle', scenes: [], mode: 'chat' }),
  closeModal: () => set({ step: 'idle', scenes: [], mode: 'chat' }),

  /* new job-based publish center */
  jobs: seedJobs(),
  composerOpen: false,
  composerTargets: [],
  composerNotes: '',
  selectedJobId: 'PUB-23',
  openComposer: () => set({ composerOpen: true, composerTargets: [], composerNotes: '' }),
  closeComposer: () => set({ composerOpen: false }),
  toggleComposerTarget: (id) => {
    const cur = get().composerTargets
    set({
      composerTargets: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    })
  },
  setComposerNotes: (v) => set({ composerNotes: v }),
  submitComposer: ({ title, artifactIds }) => {
    const { composerTargets, composerNotes } = get()
    if (composerTargets.length === 0) return ''
    const id = `PUB-${nextJobSeq++}`
    const now = Date.now()
    const job: PublishJob = {
      id,
      title,
      notes: composerNotes || undefined,
      artifactIds,
      targets: composerTargets.map(makeTargetRun).map((t) => ({
        ...t,
        // code-check passes immediately so the user sees forward progress.
        nodes: t.nodes.map((n, i) =>
          i === 0
            ? { ...n, status: 'passed', startedAt: now, finishedAt: now + 1500, operator: '你' }
            : i === 1
              ? { ...n, status: 'running', startedAt: now + 1500, operator: '审核组' }
              : n,
        ),
      })),
      status: 'running',
      createdAt: now,
      createdBy: '你',
      history: [
        { ts: now, label: '提交发布', operator: '你' },
        { ts: now + 1500, label: '代码检查通过', nodeId: 'code-check', operator: '系统' },
        { ts: now + 1500, label: '送入内容审核', nodeId: 'content-review', operator: '系统' },
      ],
    }
    set({
      jobs: [job, ...get().jobs],
      composerOpen: false,
      composerTargets: [],
      composerNotes: '',
      selectedJobId: id,
    })
    return id
  },
  selectJob: (id) => set({ selectedJobId: id }),
  advanceTargetNode: (jobId, targetId, operator = '你') => {
    const jobs = get().jobs.map((j) => {
      if (j.id !== jobId) return j
      let bumped = false
      const targets = j.targets.map((t) => {
        if (t.targetId !== targetId) return t
        const nodes = [...t.nodes]
        const idx = nodes.findIndex((n) => n.status === 'pending' || n.status === 'running')
        if (idx === -1) return t
        const now = Date.now()
        nodes[idx] = {
          ...nodes[idx],
          status: 'passed',
          startedAt: nodes[idx].startedAt ?? now - 1000,
          finishedAt: now,
          operator,
        }
        if (idx + 1 < nodes.length) {
          nodes[idx + 1] = {
            ...nodes[idx + 1],
            status: 'running',
            startedAt: now,
            operator: idx + 1 === 1 ? '审核组' : '系统',
          }
        }
        bumped = true
        return { ...t, nodes }
      })
      if (!bumped) return j
      const allPassed = targets.every((t) => t.nodes.every((n) => n.status === 'passed'))
      const history: PublishHistoryEntry[] = [
        ...j.history,
        { ts: Date.now(), label: '节点推进', targetId, operator },
      ]
      return { ...j, targets, status: allPassed ? 'succeeded' : j.status, history }
    })
    set({ jobs })
  },
  failTargetNode: (jobId, targetId, note) => {
    const jobs: PublishJob[] = get().jobs.map((j) => {
      if (j.id !== jobId) return j
      const targets = j.targets.map((t) => {
        if (t.targetId !== targetId) return t
        const nodes = [...t.nodes]
        const idx = nodes.findIndex((n) => n.status === 'running' || n.status === 'pending')
        if (idx === -1) return t
        nodes[idx] = { ...nodes[idx], status: 'failed', finishedAt: Date.now(), note }
        return { ...t, nodes }
      })
      return {
        ...j,
        targets,
        status: 'failed' as const,
        history: [
          ...j.history,
          { ts: Date.now(), label: note ?? '节点失败', targetId, operator: '系统' },
        ],
      }
    })
    set({ jobs })
  },
}))
