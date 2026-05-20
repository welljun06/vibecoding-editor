import {
  Bot,
  ChartLine,
  Code2,
  Database,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Library,
  ScrollText,
  Sparkles,
  SquareUser,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ArtifactKind } from './artifact-store'

/* ─── Workspace node kinds ─────────────────────────────────────────────
 *
 * A "workspace node" is a Layer-1 tab the user can open in the right
 * pane. The full catalog is shared across project kinds — only the
 * default-pinned subset and the per-node Layer-2 sub-tabs (artifact
 * kinds) differ per project. The user can add any node from this
 * catalog via the "+" picker.
 */

export type WorkspaceNodeKind =
  // — universal —
  | 'preview' // 界面预览
  | 'code' // 代码文件
  | 'database' // 数据库
  // — mini-program —
  | 'agent' // 智能体
  | 'mp-settings' // 小程序设置
  | 'assets' // 静态素材
  // — ai-avatar —
  | 'persona' // 人设
  | 'persona-prompt' // 人设指令
  | 'knowledge' // 知识库
  | 'skills' // 技能
  | 'triggers' // 触发器
  // — ops-proposal —
  | 'proposal-doc' // 提案文档
  | 'proposal-dashboard' // 数据看板

export const NODE_LABELS: Record<WorkspaceNodeKind, string> = {
  preview: '界面预览',
  code: '代码文件',
  database: '数据库',
  agent: '智能体',
  'mp-settings': '小程序设置',
  assets: '静态素材',
  persona: '人设',
  'persona-prompt': '人设指令',
  knowledge: '知识库',
  skills: '技能',
  triggers: '触发器',
  'proposal-doc': '提案文档',
  'proposal-dashboard': '数据看板',
}

export const NODE_ICONS: Record<WorkspaceNodeKind, LucideIcon> = {
  preview: LayoutGrid,
  code: Code2,
  database: Database,
  agent: Bot,
  'mp-settings': ScrollText,
  assets: ImageIcon,
  persona: SquareUser,
  'persona-prompt': ScrollText,
  knowledge: Library,
  skills: Sparkles,
  triggers: Zap,
  'proposal-doc': FileText,
  'proposal-dashboard': ChartLine,
}

/** Project-kind copy that the artifact store uses as its key. */
export type ProjectKind = 'mini-program' | 'ai-avatar' | 'ops-proposal' | 'web-app'

/** Default pinned-tab list per project kind — these auto-appear as
 *  Layer-1 tabs when the project is first opened (matches the "默认
 *  平铺" half of the mixed model). */
export const DEFAULT_NODES_BY_KIND: Record<ProjectKind, WorkspaceNodeKind[]> = {
  'mini-program': ['preview', 'database', 'code', 'agent'],
  'ai-avatar': ['preview', 'persona', 'knowledge', 'triggers', 'code'],
  'ops-proposal': ['proposal-doc', 'proposal-dashboard', 'code'],
  'web-app': ['preview', 'code', 'database'],
}

/** All node kinds the user can add via the "+" picker, per project
 *  kind. Defaults from `DEFAULT_NODES_BY_KIND` are filtered out at
 *  call time so only non-pinned nodes show up. */
export const ADDABLE_NODES_BY_KIND: Record<ProjectKind, WorkspaceNodeKind[]> = {
  'mini-program': [
    'preview',
    'code',
    'database',
    'agent',
    'mp-settings',
    'assets',
  ],
  'ai-avatar': [
    'preview',
    'code',
    'persona',
    'persona-prompt',
    'knowledge',
    'skills',
    'triggers',
  ],
  'ops-proposal': ['proposal-doc', 'proposal-dashboard', 'code'],
  'web-app': ['preview', 'code', 'database', 'assets'],
}

/** Per Layer-1 node, which artifact kinds (Layer 2 sub-tabs) are
 *  meaningful. Empty array → no Layer 2 strip is shown (the node has
 *  a single canonical content surface, e.g. 数据库). */
export const SUB_KINDS_BY_NODE: Record<WorkspaceNodeKind, ArtifactKind[]> = {
  preview: ['mp-page', 'scene-card', 'persona-card'],
  code: ['mp-page', 'mp-agent', 'scene-card', 'persona-card'],
  database: [],
  agent: ['mp-agent'],
  'mp-settings': [],
  assets: [],
  persona: ['persona-card'],
  'persona-prompt': ['persona-card'],
  knowledge: ['persona-card'],
  skills: ['persona-card'],
  triggers: ['persona-card'],
  'proposal-doc': ['proposal-doc'],
  'proposal-dashboard': [],
}

/** Labels for the Layer-2 sub-tab strip — keyed by artifact kind. */
export const SUB_TAB_LABELS: Record<ArtifactKind, string> = {
  'persona-card': 'AI 分身',
  'scene-card': 'Feed 卡',
  'mp-page': '小程序',
  'mp-agent': '小程序 Agent',
  'proposal-doc': '提案',
}
