import { Fragment, useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatPreview from '@/modules/editor/components/preview/ChatPreview'
import GlassIconButton from '@/modules/editor/components/layout/GlassIconButton'
import { useDominantColors, rgbString } from '@/modules/editor/hooks/useDominantColors'
import { getWorld } from '@/modules/editor/data/worlds'
import LogoIconSpinOnce from '@/shared/components/LogoIconSpinOnce'
import { useScrollEdges, fadeClassFromEdges } from '@/shared/hooks/useScrollEdges'
import {
  usePublishFlowStore,
  PUBLISH_SCENES,
  PUBLISH_SCENE_DESCRIPTIONS,
} from '@/modules/editor/store/publish-flow-store'
import PublishFlowModal from '@/modules/editor/components/chat/PublishFlowModal'
import { useThemeStore } from '@/shared/storage/theme'
import MiniAppPreview from './MiniAppPreview'
import { ChatFormCard, ChatFormStep, ChatFormSubmit } from './ChatFormCard'
import {
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  Code2,
  Columns2,
  LayoutGrid,
  MoreHorizontal,
  Moon,
  Sun,
  Copy,
  Database,
  File,
  FileCode2,
  FileCog,
  FileJson,
  FileText,
  FolderClosed,
  FolderCode,
  FolderOpen,
  Headphones,
  Home,
  Inbox,
  LayoutDashboard,
  PanelLeft,
  PanelRight,
  ListCollapse,
  Search,
  Sparkles,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Undo2,
  Smartphone,
  Terminal,
  ThumbsDown,
  ThumbsUp,
  Upload,
  X,
  UserRound,
  CheckSquare,
  Telescope,
  UsersRound,
  BadgeDollarSign,
  Archive,
  Type,
  MessageSquareText,
  MessageSquarePlus,
  MessageCircleHeart,
  Gamepad2,
  FileSearch,
  Flashlight,
  Video,
  Clapperboard,
  Camera,
  SquareUser,
  Brush,
  Palette,
  MonitorPlay,
  MessageSquare,
  Image as ImageIcon,
  ShieldCheck,
  AlertTriangle,
  MessageSquareWarning,
  Blocks,
  Gift,
  PencilLine,
  Flag,
  WandSparkles,
  AppWindow,
  BriefcaseBusiness,
} from 'lucide-react'

/* ─── Types ─── */
interface RadioOption {
  label: string
  value: string
}

/* ─── Diff data (mock) for the "变更详情" tab ─── */
type DiffLineKind = 'add' | 'remove' | 'context' | 'hunk'
interface DiffLine {
  kind: DiffLineKind
  oldNum?: number
  newNum?: number
  text: string
}
interface FileDiff {
  path: string
  added: number
  removed: number
  lines: DiffLine[]
}

const FILE_DIFFS: FileDiff[] = [
  {
    path: 'src/pages/tarot/index.tsx',
    added: 28,
    removed: 18,
    lines: [
      { kind: 'hunk', text: '@@ -1,6 +1,8 @@' },
      { kind: 'context', oldNum: 1, newNum: 1, text: "import { View, Text } from '@tarojs/components'" },
      { kind: 'remove', oldNum: 2, text: "import { useLoad } from '@tarojs/taro'" },
      { kind: 'add', newNum: 2, text: "import { useLoad, useRouter } from '@tarojs/taro'" },
      { kind: 'add', newNum: 3, text: "import { useState, useEffect } from 'react'" },
      { kind: 'context', oldNum: 3, newNum: 4, text: "import NavBar from '../../components/NavBar'" },
      { kind: 'context', oldNum: 4, newNum: 5, text: "import TarotCard from '../../components/TarotCard'" },
      { kind: 'hunk', text: '@@ -12,10 +14,20 @@' },
      { kind: 'context', oldNum: 12, newNum: 14, text: 'export default function Tarot() {' },
      { kind: 'remove', oldNum: 13, text: '  const [card, setCard] = useState(null)' },
      { kind: 'add', newNum: 15, text: '  const [cards, setCards] = useState<CardResult[]>([])' },
      { kind: 'add', newNum: 16, text: '  const [loading, setLoading] = useState(false)' },
      { kind: 'add', newNum: 17, text: '  const [mood, setMood] = useState<Mood>("neutral")' },
      { kind: 'context', oldNum: 14, newNum: 18, text: '' },
      { kind: 'remove', oldNum: 15, text: '  const fetch = () => Taro.request({ url: "/api/tarot" })' },
      { kind: 'add', newNum: 19, text: '  const drawCards = async () => {' },
      { kind: 'add', newNum: 20, text: '    setLoading(true)' },
      { kind: 'add', newNum: 21, text: '    const res = await fetchTarotResult(mood)' },
      { kind: 'add', newNum: 22, text: '    setCards(res.cards)' },
      { kind: 'add', newNum: 23, text: '    setLoading(false)' },
      { kind: 'add', newNum: 24, text: '  }' },
    ],
  },
  {
    path: 'src/pages/tarot/result.tsx',
    added: 25,
    removed: 15,
    lines: [
      { kind: 'hunk', text: '@@ -1,5 +1,7 @@' },
      { kind: 'context', oldNum: 1, newNum: 1, text: "import { View, Text } from '@tarojs/components'" },
      { kind: 'add', newNum: 2, text: "import { useState } from 'react'" },
      { kind: 'add', newNum: 3, text: "import { fetchDramas } from '../../services/api'" },
      { kind: 'context', oldNum: 2, newNum: 4, text: "import DramaCard from '../../components/DramaCard'" },
      { kind: 'hunk', text: '@@ -10,6 +12,14 @@' },
      { kind: 'remove', oldNum: 10, text: '  const dramas = MOCK_DRAMAS' },
      { kind: 'add', newNum: 12, text: '  const [dramas, setDramas] = useState<Drama[]>([])' },
      { kind: 'add', newNum: 13, text: '' },
      { kind: 'add', newNum: 14, text: '  useEffect(() => {' },
      { kind: 'add', newNum: 15, text: '    fetchDramas(mood).then(setDramas)' },
      { kind: 'add', newNum: 16, text: '  }, [mood])' },
    ],
  },
  {
    path: 'src/components/TarotCard.tsx',
    added: 18,
    removed: 10,
    lines: [
      { kind: 'hunk', text: '@@ -3,5 +3,8 @@' },
      { kind: 'remove', oldNum: 3, text: 'export default function TarotCard({ label }) {' },
      { kind: 'add', newNum: 3, text: 'interface Props { label: string; onFlip?: () => void }' },
      { kind: 'add', newNum: 4, text: '' },
      { kind: 'add', newNum: 5, text: 'export default function TarotCard({ label, onFlip }: Props) {' },
      { kind: 'context', oldNum: 4, newNum: 6, text: '  const [flipped, setFlipped] = useState(false)' },
      { kind: 'hunk', text: '@@ -10,3 +13,5 @@' },
      { kind: 'remove', oldNum: 10, text: '    <View onClick={() => setFlipped(true)}>' },
      { kind: 'add', newNum: 13, text: '    <View onClick={() => {' },
      { kind: 'add', newNum: 14, text: '      setFlipped(true)' },
      { kind: 'add', newNum: 15, text: '      onFlip?.()' },
      { kind: 'add', newNum: 16, text: '    }}>' },
    ],
  },
  {
    path: 'src/components/DramaCard.tsx',
    added: 20,
    removed: 20,
    lines: [
      { kind: 'hunk', text: '@@ -1,8 +1,10 @@' },
      { kind: 'remove', oldNum: 1, text: "import { View, Text } from '@tarojs/components'" },
      { kind: 'add', newNum: 1, text: "import { View, Text, Image } from '@tarojs/components'" },
      { kind: 'context', oldNum: 2, newNum: 2, text: '' },
      { kind: 'remove', oldNum: 3, text: 'interface Props { title: string; rating: number }' },
      { kind: 'add', newNum: 3, text: 'interface Props {' },
      { kind: 'add', newNum: 4, text: '  title: string' },
      { kind: 'add', newNum: 5, text: '  cover: string' },
      { kind: 'add', newNum: 6, text: '  rating: number' },
      { kind: 'add', newNum: 7, text: '}' },
    ],
  },
  {
    path: 'src/services/api.ts',
    added: 18,
    removed: 14,
    lines: [
      { kind: 'hunk', text: '@@ -4,6 +4,10 @@' },
      { kind: 'remove', oldNum: 4, text: 'export const fetchTarotResult = () =>' },
      { kind: 'remove', oldNum: 5, text: '  Taro.request({ url: `${BASE_URL}/api/tarot/read` })' },
      { kind: 'add', newNum: 4, text: 'export const fetchTarotResult = async (mood: Mood) => {' },
      { kind: 'add', newNum: 5, text: '  const res = await Taro.request({' },
      { kind: 'add', newNum: 6, text: '    url: `${BASE_URL}/api/tarot/read`,' },
      { kind: 'add', newNum: 7, text: "    method: 'POST'," },
      { kind: 'add', newNum: 8, text: '    data: { mood, limit: 3 },' },
      { kind: 'add', newNum: 9, text: '  })' },
      { kind: 'add', newNum: 10, text: '  return res.data' },
      { kind: 'add', newNum: 11, text: '}' },
    ],
  },
]

/* ─── Requirement-form data: capabilities + personalization tags ─── */
interface CapabilityOption {
  id: string
  kind: 'skill' | 'knowledge'
  label: string
  title: string
  description: string
  folderName: string
}

const CAPABILITY_OPTIONS: CapabilityOption[] = [
  {
    id: 'live-script',
    kind: 'skill',
    label: '直播',
    title: '直播带货话术',
    description: '节奏拆解 + 逼单句式，覆盖开播 / 留人 / 转化 / 下播四段。',
    folderName: 'live-script',
  },
  {
    id: 'douyin-kb',
    kind: 'knowledge',
    label: '知识库',
    title: '我的抖音知识库',
    description: '基于账号历史内容构建的私有知识库，可在回复中引用。',
    folderName: 'my-douyin-kb',
  },
]

interface TagDimension {
  id: string
  label: string
  hint: string
}

const TAG_OPTIONS: TagDimension[] = [
  { id: 'gender', label: '性别', hint: '男 / 女 / 未知' },
  { id: 'age', label: '年龄段', hint: '18- / 18-24 / 25-34 / 35-44 / 45+' },
  { id: 'region', label: '地域', hint: '省级 / 一二三线' },
  { id: 'interest', label: '兴趣标签', hint: '抖音兴趣分类（最多匹配 3 类）' },
  { id: 'spending', label: '消费力', hint: 'L1–L5（基于历史下单 / 浏览）' },
  { id: 'active-time', label: '活跃时段', hint: '清晨 / 午间 / 晚高峰 / 深夜' },
  { id: 'fan-level', label: '粉丝等级', hint: '路人 / 关注 / 铁粉 / 真爱粉' },
  { id: 'history', label: '历史互动', hint: '近 30 天评论 / 私信 / 点赞行为' },
]

/** AI-recommended defaults pre-selected for steps 3 / 4 based on the
 *  chosen 应用形态 + 场景. Every surfaced card/pill is something the
 *  system recommends, so they all start toggled on — the user then
 *  opts out of anything they don't want rather than opting in. */
const RECOMMENDED_CAPABILITIES: ReadonlySet<string> = new Set(
  CAPABILITY_OPTIONS.map((c) => c.id),
)
const RECOMMENDED_TAGS: ReadonlySet<string> = new Set(['gender', 'age', 'interest'])

/* ─── Helpers ─── */
function RadioGroup({
  options,
  selected,
  onChange,
  locked = false,
}: {
  options: RadioOption[]
  selected: string
  onChange: (v: string) => void
  /** When true, the group shows the current selection but blocks further
   *  changes. Unselected options collapse visually so the confirmed pick
   *  reads as the step's frozen answer. Use the form's "重新选择"
   *  escape hatch to re-open it. */
  locked?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === selected
        if (locked && !active) return null
        return (
          <button
            key={o.value}
            type="button"
            disabled={locked}
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
              active
                ? 'bg-[var(--chat-form-option-bg)] font-medium text-[var(--color-ink)] shadow-[0_1px_2px_rgba(16,18,24,0.04)]'
                : 'bg-[var(--chat-form-option-bg)] text-[var(--color-ink)]/55 hover:text-[var(--color-ink)]'
            } ${locked ? 'cursor-default' : ''}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════ */
/*  VibeCodingPage                                        */
/* ═══════════════════════════════════════════════════════ */
/* ─── File Tree ─── */
type FileNode = { name: string; type: 'file' | 'dir'; children?: FileNode[] }

/** Pick a lucide icon per file extension so root-level files (e.g.
 *  app.tsx vs app.less vs app.json) are visually distinguishable without
 *  reading the name. Tint stays unified — only the glyph changes. */
function getFileIcon(name: string): typeof File {
  const lower = name.toLowerCase()
  if (/\.(tsx|ts|jsx|js|mjs|cjs)$/.test(lower)) return FileCode2
  if (/\.json$/.test(lower)) return FileJson
  if (/\.(css|less|scss|sass|styl)$/.test(lower)) return Palette
  if (/\.(yaml|yml|toml|ini|env)$/.test(lower)) return FileCog
  if (/\.(md|mdx|txt)$/.test(lower)) return FileText
  if (/\.(png|jpe?g|gif|webp|svg|avif)$/.test(lower)) return ImageIcon
  return File
}

function FileTreeView({
  nodes,
  expanded,
  onToggleDir,
  onOpenFile,
  depth,
  parentPath,
  railStartDepth = 0,
}: {
  nodes: FileNode[]
  expanded: Set<string>
  onToggleDir: (path: string) => void
  onOpenFile: (name: string) => void
  depth: number
  parentPath: string
  /** Lowest depth at which to draw an indent rail. Platform sidebar
   *  passes 1 so the outermost rail connecting files to the project
   *  header is suppressed. */
  railStartDepth?: number
}) {
  // Each row carries `depth` absolutely-positioned rails — one per
  // ancestor level — so the user can trace a child back to its parent
  // folder. Rails only render for rows at depth ≥ 1 (root rows have no
  // parent to connect to), and since rows stack contiguously the rails
  // visually fuse into continuous vertical guides for each open branch.
  const renderRails = () =>
    depth === 0
      ? null
      : Array.from({ length: depth })
          .map((_, i) => i)
          .filter((i) => i >= railStartDepth)
          .map((i) => (
            <span
              key={i}
              aria-hidden
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-[var(--color-ink)]/[0.06]"
              style={{ left: 12 + i * 14 + 6 }}
            />
          ))

  return (
    <>
      {nodes.map((node) => {
        const path = parentPath ? `${parentPath}/${node.name}` : node.name
        const isExpanded = expanded.has(path)
        const pl = 12 + depth * 14
        if (node.type === 'dir') {
          return (
            <div key={path}>
              <div className="relative">
                {renderRails()}
                <button
                  onClick={() => onToggleDir(path)}
                  className="flex w-full items-center gap-1.5 py-1 text-[12px] text-[var(--color-ink)]/75 transition-colors hover:bg-[var(--color-ink)]/[0.04] hover:text-[var(--color-ink)]/95"
                  style={{ paddingLeft: pl }}
                >
                  {isExpanded ? <FolderOpen size={13} className="shrink-0 text-[var(--color-ink)]/60" /> : <FolderClosed size={13} className="shrink-0 text-[var(--color-ink)]/60" />}
                  {node.name}
                </button>
              </div>
              {isExpanded && node.children && (
                <FileTreeView
                  nodes={node.children}
                  expanded={expanded}
                  onToggleDir={onToggleDir}
                  onOpenFile={onOpenFile}
                  depth={depth + 1}
                  parentPath={path}
                  railStartDepth={railStartDepth}
                />
              )}
            </div>
          )
        }
        const Icon = getFileIcon(node.name)
        return (
          <div key={path} className="relative">
            {renderRails()}
            <button
              onClick={() => onOpenFile(node.name)}
              className="flex w-full items-center gap-1.5 py-1 text-[12px] text-[var(--color-ink)]/75 transition-colors hover:bg-[var(--color-ink)]/[0.04] hover:text-[var(--color-ink)]/95"
              style={{ paddingLeft: pl }}
            >
              <Icon size={12} className="shrink-0 text-[var(--color-ink)]/55" />
              {node.name}
            </button>
          </div>
        )
      })}
    </>
  )
}

/* ─── Phone mockup that scales to fit container ─── */
const PHONE_W = 286
const PHONE_H = 620

function PhoneMockup({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  // The glass-edge pseudo paints a 1px white gradient rim — intended as
  // subtle glass polish on dark surfaces, but shows up as visible side
  // glows on the black bezel in light mode. Zero out the alpha there.
  const isLight = useThemeStore((s) => s.mode) === 'light'

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const sx = (width - 32) / PHONE_W // 32px horizontal padding
    const sy = (height - 32) / PHONE_H // 32px vertical padding
    setScale(Math.min(sx, sy, 1))
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [measure])

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 items-center justify-center">
      <div
        style={{
          width: PHONE_W,
          height: PHONE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          ['--edge-alpha' as string]: isLight ? 0 : 0.3,
        }}
        className="glass-edge relative shrink-0 rounded-[36px]"
      >
        <div className="absolute inset-0 rounded-[36px] bg-[var(--phone-bezel)] p-[3px] shadow-[var(--phone-shadow)] ring-1 ring-[var(--divider-soft)]">
          <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[var(--color-surface-0)] ring-1 ring-black/60">
            <div className="relative h-full w-full overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Platform — 个人空间 dropdown data ─── */

type SpaceTile = { icon: typeof UserRound; label: string }
const SPACE_SECTIONS: { title: string; color: string; tiles: SpaceTile[] }[] = [
  {
    title: '我的',
    color: '#8b5cf6',
    tiles: [{ icon: UserRound, label: '个人空间' }],
  },
  {
    title: '平台',
    color: '#e72e75',
    tiles: [
      { icon: CheckSquare, label: '解决方案' },
      { icon: Telescope, label: '前沿实验室' },
    ],
  },
  {
    title: '运营',
    color: '#fa8b14',
    tiles: [
      { icon: UsersRound, label: '作者运营' },
      { icon: BadgeDollarSign, label: '资金结算' },
      { icon: Archive, label: '版权运营' },
      { icon: Type, label: '敏感词运营' },
      { icon: MessageSquareText, label: '群聊' },
      { icon: Search, label: '抖音搜索' },
      { icon: MessageCircleHeart, label: '垂类运营' },
      { icon: Gamepad2, label: '抖音游戏' },
      { icon: FileSearch, label: '调研中台' },
      { icon: Flashlight, label: '热点资讯运营' },
      { icon: Video, label: '抖音直播运营' },
      { icon: Clapperboard, label: '抖音UGC' },
      { icon: Camera, label: '社交互动' },
      { icon: SquareUser, label: '直播用户平台' },
      { icon: Brush, label: '效果与创作' },
    ],
  },
  {
    title: '治理',
    color: '#3b82f6',
    tiles: [
      { icon: MonitorPlay, label: '视频治理' },
      { icon: Video, label: '直播治理' },
      { icon: SquareUser, label: '账号治理' },
      { icon: MessageSquare, label: 'IM治理' },
      { icon: Smartphone, label: '小程序治理' },
      { icon: ImageIcon, label: 'AIGC治理' },
      { icon: ShieldCheck, label: '版权治理' },
      { icon: Clapperboard, label: '短剧治理' },
      { icon: Gamepad2, label: '游戏治理' },
      { icon: BadgeDollarSign, label: '资金安全' },
      { icon: AlertTriangle, label: 'ZL治理' },
      { icon: MessageSquareWarning, label: '评论治理' },
      { icon: Blocks, label: '生态治理' },
      { icon: MessageSquareText, label: '舆情' },
      { icon: Gift, label: '投稿道具' },
    ],
  },
  {
    title: '职能',
    color: '#8b5cf6',
    tiles: [
      { icon: Sparkles, label: '开放平台' },
      { icon: PencilLine, label: '智能标注' },
      { icon: Flag, label: '数据BP' },
      { icon: WandSparkles, label: 'MagicX' },
      { icon: MessageSquare, label: '体验' },
      { icon: AppWindow, label: '产品研发' },
      { icon: BriefcaseBusiness, label: '劳动力管理' },
    ],
  },
]

/** Popover shown when the 个人空间 label is clicked — a dense tile grid
 *  grouped by platform/ops/governance sections. Positioned fixed so it
 *  escapes the 230px sidebar width. Selecting a tile routes the label
 *  back to the sidebar button via `onSelect`. */
function SpaceMenuPopover({
  pos,
  active,
  onSelect,
  onClose,
}: {
  pos: { top: number; left: number }
  active: string
  onSelect: (label: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [onClose])
  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 70,
        maxHeight: `calc(100vh - ${pos.top}px - 12px)`,
      }}
      className="thin-scroll inline-flex flex-col overflow-y-auto rounded-2xl bg-[var(--color-surface-0)] p-3 shadow-[0_12px_32px_-8px_rgba(16,18,24,0.14),0_0_1px_rgba(16,18,24,0.3)]"
    >
      {SPACE_SECTIONS.map((section) => (
        <div key={section.title} className="flex w-full flex-col rounded-xl p-3">
          <p className="mb-2 text-[12px] leading-4 text-[var(--color-ink)]/55">
            {section.title}
          </p>
          <div className="flex w-[576px] flex-wrap items-center gap-2.5">
            {section.tiles.map(({ icon: Icon, label }) => {
              const isActive = label === active
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    onSelect(label)
                    onClose()
                  }}
                  className={`flex w-[136px] items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                    isActive
                      ? 'border-[var(--color-ink)]/60 bg-[var(--fill-subtle)]'
                      : 'border-[var(--divider)] bg-[var(--color-surface-0)] hover:bg-[var(--fill-subtle)]'
                  }`}
                >
                  <Icon size={14} style={{ color: section.color }} />
                  <span className="truncate text-[14px] leading-5 text-[var(--color-ink)]">
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Inline Figma brand icon — matches the Figma design's `figma` glyph. */
function FigmaIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.6665 3.33325C2.6665 1.6764 4.00965 0.333252 5.6665 0.333252H10.3332C11.99 0.333252 13.3332 1.6764 13.3332 3.33325C13.3332 4.27567 12.8986 5.1166 12.2189 5.66659C12.8986 6.21657 13.3332 7.0575 13.3332 7.99992C13.3332 9.65677 11.99 10.9999 10.3332 10.9999C9.71646 10.9999 9.1432 10.8138 8.6665 10.4947V12.6666C8.6665 14.3234 7.32336 15.6666 5.6665 15.6666C4.00965 15.6666 2.6665 14.3234 2.6665 12.6666C2.6665 11.7242 3.10106 10.8832 3.78073 10.3333C3.10106 9.78327 2.6665 8.94234 2.6665 7.99992C2.6665 7.0575 3.10106 6.21657 3.78073 5.66658C3.10106 5.1166 2.6665 4.27567 2.6665 3.33325ZM5.6665 6.33325C4.74603 6.33325 3.99984 7.07944 3.99984 7.99992C3.99984 8.92039 4.74603 9.66658 5.6665 9.66658H7.33317V6.33325H5.6665ZM7.33317 4.99992H5.6665C4.74603 4.99992 3.99984 4.25373 3.99984 3.33325C3.99984 2.41278 4.74603 1.66659 5.6665 1.66659H7.33317V4.99992ZM10.3332 4.99992C11.2536 4.99992 11.9998 4.25373 11.9998 3.33325C11.9998 2.41278 11.2536 1.66659 10.3332 1.66659H8.6665V4.99992H10.3332ZM10.3332 6.33325C9.4127 6.33325 8.6665 7.07944 8.6665 7.99992C8.6665 8.92039 9.4127 9.66658 10.3332 9.66658C11.2536 9.66658 11.9998 8.92039 11.9998 7.99992C11.9998 7.07944 11.2536 6.33325 10.3332 6.33325ZM7.33317 10.9999H5.6665C4.74603 10.9999 3.99984 11.7461 3.99984 12.6666C3.99984 13.5871 4.74603 14.3333 5.6665 14.3333C6.58698 14.3333 7.33317 13.5871 7.33317 12.6666V10.9999Z"
        fill="currentColor"
      />
    </svg>
  )
}

/* ─── Platform home (new-project landing) ─── */

const HOME_SUGGESTIONS = [
  '生成运营活动社群的AI分身',
  '生成推广《剑来》动画的异形卡',
  '生成评论区回复用户问题的AI分身',
  '视频漏放归因',
  '治理标准条款查询',
  '视频误伤分析',
  '产出调研报告',
  '生成业务介绍图',
]

type AiMode = 'coding' | 'business' | 'orchestration'
const AI_MODES: { id: AiMode; label: string; desc: string; icon: typeof Code2 }[] = [
  {
    id: 'coding',
    label: 'AI Coding',
    desc: '生成代码、组件、页面，适合开发型需求',
    icon: Code2,
  },
  {
    id: 'business',
    label: 'AI 业务助手',
    desc: '对话式完成业务流程，适合数据查询与问答',
    icon: MessageSquare,
  },
  {
    id: 'orchestration',
    label: '智能编排',
    desc: '串联多步任务与工具，适合复杂工作流',
    icon: Blocks,
  },
]

function PlatformHome({
  draft,
  setDraft,
  onSubmit,
}: {
  draft: string
  setDraft: (s: string) => void
  onSubmit: (text: string) => void
}) {
  const isLight = useThemeStore((s) => s.mode) === 'light'
  const [aiMode, setAiMode] = useState<AiMode>('coding')
  const [aiMenuPos, setAiMenuPos] = useState<{ top: number; left: number } | null>(null)
  const aiBtnRef = useRef<HTMLButtonElement>(null)
  const aiMenuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aiMenuPos) return
    const handler = (e: PointerEvent) => {
      const target = e.target as Node
      if (
        aiMenuRef.current &&
        !aiMenuRef.current.contains(target) &&
        aiBtnRef.current &&
        !aiBtnRef.current.contains(target)
      ) {
        setAiMenuPos(null)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [aiMenuPos])
  const currentMode = AI_MODES.find((m) => m.id === aiMode) ?? AI_MODES[0]
  const CurrentIcon = currentMode.icon
  return (
    <div
      className={`relative my-3 mr-3 flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-[16px] px-6 pb-24 pt-6 ${
        isLight ? 'bg-white' : 'bg-[var(--color-surface-0)]'
      }`}
    >
      {/* Ambient illustration — grainy pastel glow pinned to the top-right.
           Only shown in light mode; dark mode keeps the flat surface. */}
      {isLight && (
        <img
          aria-hidden
          src="/bg/platform-home-glow.png"
          alt=""
          className="pointer-events-none absolute right-0 top-0 h-auto w-[720px] max-w-[70%] select-none object-contain object-right-top"
        />
      )}

      {/* Hero */}
      <div className="relative flex flex-col items-center gap-2">
        <div className="text-center font-semibold tracking-[0.64px] text-[var(--color-ink)]">
          <span className="text-[32px]">抖音</span>
          <span className="text-[16px]"> </span>
          <span className="text-[32px]">AI</span>
          <span className="text-[16px]"> </span>
          <span className="text-[32px]">打开无限可能</span>
        </div>
        <p className="text-[16px] leading-[22px] text-[var(--color-ink)]/60">
          所见即所得，一站式满足需求
        </p>
      </div>

      {/* Prompt composer — h-[140px] fixed card, content justified to the
           bottom (textarea grows upward from the action row). */}
      <div className="relative mt-6 w-full max-w-[810px]">
        <div className="relative flex h-[140px] flex-col justify-end gap-2 overflow-hidden rounded-[16px] bg-[var(--color-surface-0)] p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_10px_15px_-5px_rgba(0,0,0,0.05)]">
          {/* rainbow tint */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-4 blur-[20px]"
            style={{
              backgroundImage:
                'linear-gradient(0deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%), linear-gradient(98deg, rgba(255,186,51,0.15) 7.59%, rgba(78,217,44,0.15) 23.2%, rgba(69,146,242,0.15) 44.7%, rgba(110,124,253,0.15) 66.3%, rgba(225,53,248,0.15) 92.3%)',
            }}
          />

          <div className="relative flex min-h-0 flex-1 flex-col pl-3 pt-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSubmit(draft)
                }
              }}
              placeholder="请描述你遇到的具体业务痛点或需求..."
              rows={1}
              className="block w-full resize-none bg-transparent text-[14px] leading-[22px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink)]/60"
            />
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                ref={aiBtnRef}
                type="button"
                onClick={() => {
                  if (aiMenuPos) {
                    setAiMenuPos(null)
                    return
                  }
                  const rect = aiBtnRef.current?.getBoundingClientRect()
                  if (rect) setAiMenuPos({ top: rect.bottom + 8, left: rect.left })
                }}
                className="flex h-9 items-center gap-1.5 rounded-full border border-[var(--divider)] px-4 text-[14px] font-semibold text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
              >
                <CurrentIcon size={16} strokeWidth={1.8} />
                {currentMode.label}
              </button>
              <button
                type="button"
                className="flex h-9 items-center gap-1 rounded-full border border-[var(--divider)] px-4 text-[14px] font-semibold text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
              >
                <FolderCode size={16} strokeWidth={1.8} />
                资源
              </button>
              <button
                type="button"
                aria-label="附件"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--divider)] text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
              >
                <Paperclip size={16} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                aria-label="Figma"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--divider)] text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
              >
                <FigmaIcon size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-9 items-center gap-1 rounded-full px-4 text-[14px] font-semibold text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
              >
                Auto
                <ChevronDown size={16} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                aria-label="发送"
                onClick={() => onSubmit(draft)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-ink-contrast)] transition-all hover:-translate-y-[1px] hover:opacity-90"
              >
                <ArrowUp size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions header */}
      <div className="relative mt-6 flex items-center gap-2 text-[var(--color-ink)]/60">
        <Sparkles size={12} />
        <p className="text-[14px] leading-[22px]">没有灵感？试试点击以下需求</p>
      </div>

      {/* Suggestions */}
      <div className="relative mt-4 flex w-full max-w-[810px] flex-wrap items-center justify-center gap-3">
        {HOME_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSubmit(s)}
            className="flex h-[42px] items-center gap-2 rounded-[12px] bg-[var(--fill-subtle)] px-4 text-[14px] leading-5 text-[var(--color-ink)] transition-colors hover:bg-[var(--fill-hover)]"
          >
            <span>{s}</span>
            <ArrowUpRight size={12} className="text-[var(--color-ink)]/60" />
          </button>
        ))}
      </div>

      {/* AI mode dropdown — position: fixed so it escapes the composer's
           overflow-hidden rounded-rect clipping. */}
      {aiMenuPos && (
        <div
          ref={aiMenuRef}
          style={{ position: 'fixed', top: aiMenuPos.top, left: aiMenuPos.left, zIndex: 70 }}
          className="w-[312px] overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--color-surface-0)] shadow-[0_12px_28px_-8px_rgba(16,18,24,0.18)]"
        >
          {AI_MODES.map((m) => {
            const Icon = m.icon
            const isActive = m.id === aiMode
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setAiMode(m.id)
                  setAiMenuPos(null)
                }}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-[var(--fill-subtle)]' : 'hover:bg-[var(--fill-subtle)]'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    isActive
                      ? 'bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                      : 'bg-[var(--fill-hover)] text-[var(--color-ink)]/80'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.8} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-ink)]">
                    {m.label}
                    {isActive && <Check size={12} className="text-[var(--color-ink)]/70" />}
                  </span>
                  <span className="text-[11.5px] leading-[1.5] text-[var(--color-ink)]/55">
                    {m.desc}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Platform layout sidebar ─── */

/** Left-side project sidebar shown in the Platform layout. Contains brand
 *  chrome, the + 新建项目 button, platform nav (Skills / 资源库 / 创意广场),
 *  and a multi-project tree where the expanded project reuses the shared
 *  `FileTreeView` with the workspace's real `fileTree` state. Other projects
 *  are static collapsed stubs. */
function PlatformSidebar({
  fileTree,
  expandedDirs,
  toggleDir,
  openFileInTab,
  onCollapse,
  onNewProject,
  openProjects,
  setOpenProjects,
  onSwitchProject,
  onCollapseAll,
}: {
  fileTree: FileNode[]
  expandedDirs: Set<string>
  toggleDir: (path: string) => void
  openFileInTab: (filename: string) => void
  onCollapse: () => void
  onNewProject: () => void
  openProjects: Set<string>
  setOpenProjects: React.Dispatch<React.SetStateAction<Set<string>>>
  /** Clicking a project row activates it on the right-side workspace
   *  (project title + a fresh session). Called alongside toggleProject
   *  so the row still expands/collapses. */
  onSwitchProject: (name: string) => void
  /** Collapse every open folder + project down to the root level. */
  onCollapseAll: () => void
}) {
  const [spaceMenuPos, setSpaceMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [activeSpace, setActiveSpace] = useState('个人空间')
  const [activeNav, setActiveNav] = useState<'Skills' | '资源库' | '创意广场' | null>(null)
  const spaceBtnRef = useRef<HTMLButtonElement>(null)
  const toggleProject = (name: string) =>
    setOpenProjects((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  /* Sidebar project list. The 2nd entry shares a stable name with the
   * active right-side project so its file tree can hang off the sidebar;
   * the others are empty-state stubs to suggest a populated workspace. */
  const ACTIVE_PROJECT_NAME = '第五人格塔罗小程序'
  const ALL_PROJECTS = [
    '每日打卡小程序',
    ACTIVE_PROJECT_NAME,
    '探店视频创作助手',
    '粉丝互动机器人',
  ] as const

  return (
    <aside className="flex h-full w-full flex-col pt-6">
      {/* Brand header */}
      <div className="flex h-8 shrink-0 items-center justify-between gap-2 px-5">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <svg
            width="108"
            height="20"
            viewBox="0 0 108 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="抖音AI工坊"
            className="h-5 shrink-0 text-[var(--color-ink)]"
          >
            <path d="M38.2988 10.9897L40.0596 10.7847V12.4634L38.2988 12.6665V16.8335H36.3779V12.8882L30.3809 13.5874L30.3613 13.4634L30.1465 12.0415L30.126 11.9077L30.2607 11.8921L36.3779 11.1929V1.64209H38.2988V10.9897ZM28.7246 4.55615H30.4844V6.18408H28.7275V8.77783L30.4531 8.48877V10.1499L30.3467 10.1694L28.7275 10.4741V14.7935L28.7256 14.9019C28.7078 15.4348 28.5558 15.8628 28.25 16.1714C27.9454 16.4787 27.505 16.6505 26.9443 16.7056L26.8311 16.7153C26.3383 16.7484 25.8186 16.7164 25.3203 16.6226L25.2393 16.6069L25.2188 16.5288L24.7998 15.0112L25 15.0425C25.4484 15.113 25.8902 15.1331 26.3213 15.104H26.3223L26.3779 15.0991C26.5072 15.0801 26.6311 15.0235 26.7256 14.9302C26.8318 14.8251 26.9092 14.6651 26.9092 14.436V10.8052L24.9121 11.1646L24.8896 11.0347L24.624 9.45068L26.9072 9.07764V6.18408H25.0371L24.8789 4.55615H26.9072V1.64209H28.7246V4.55615ZM53.8545 9.17334C54.2638 9.17335 54.5961 9.2745 54.8252 9.49756C55.055 9.72132 55.1591 10.047 55.1592 10.4478V15.1675L55.1543 15.3159C55.1318 15.6526 55.0295 15.9263 54.8291 16.1216C54.6007 16.3441 54.2682 16.4419 53.8545 16.4419H43.7979C43.3804 16.4419 43.0471 16.3473 42.8193 16.1255C42.6194 15.9308 42.5189 15.6562 42.4971 15.3169L42.4922 15.1675V10.4478C42.4922 10.0429 42.5933 9.71674 42.8223 9.49365C43.0507 9.27119 43.3841 9.17334 43.7979 9.17334H53.8545ZM69.1914 16.0386L69.25 16.2114H66.9404L66.9111 16.1206L65.8965 12.9067H60.4844L59.4893 16.1196L59.4609 16.2114H57.1523L61.916 2.54932H64.582L69.1914 16.0386ZM73.334 16.2114H71.2588V2.54932H73.334V16.2114ZM44.4121 14.5542L44.4141 14.5894C44.4297 14.7624 44.5599 14.8823 44.7461 14.8823H52.9053L52.9414 14.8804C53.1198 14.8648 53.2382 14.7343 53.2383 14.5542V13.4771H44.4121V14.5542ZM44.7461 10.7329C44.5563 10.7329 44.4122 10.8768 44.4121 11.0601V12.0698H53.2383V11.0601L53.2373 11.0259C53.2217 10.8703 53.1008 10.7494 52.9404 10.7339L52.9053 10.7329H44.7461ZM61.0273 11.0854H65.373L63.2109 4.17822L61.0273 11.0854ZM31.5537 6.65967C32.545 6.8998 33.9001 7.25577 35.1914 7.69092L35.2803 7.72119V9.61084L35.1064 9.55127C33.8189 9.10842 32.4689 8.73964 31.4912 8.4917L31.3926 8.46729V6.62061L31.5537 6.65967ZM46.502 6.39697H51.2012L51.666 4.96436H53.667L53.2002 6.39697H56.4531V7.95654H41.3125L41.1533 6.39697H44.5371L44.0703 4.96436H46.0537L46.502 6.39697ZM31.5557 2.79639C32.7638 3.11029 33.9859 3.48432 35.1924 3.90771L35.2803 3.93799V5.77783L35.1064 5.71729C33.9066 5.29997 32.6919 4.93182 31.4912 4.62354L31.3926 4.59912V2.75342L31.5557 2.79639ZM49.7773 2.88623H55.5391V4.4458H42.209L42.0498 2.88623H47.8223V1.64209H49.7773V2.88623Z" fill="currentColor"/>
            <path d="M103.727 3.5804H107.524V5.35142H101.513V7.29273H105.464C105.816 7.29273 106.1 7.40058 106.315 7.61628C106.531 7.83198 106.645 8.12147 106.656 8.48476C106.747 10.7666 106.747 12.9407 106.656 15.0069C106.633 15.4496 106.463 15.8186 106.145 16.1137C105.839 16.3976 105.453 16.5565 104.987 16.5906C103.931 16.6814 102.864 16.6246 101.786 16.4203L101.411 14.6152C102.319 14.8082 103.199 14.8763 104.051 14.8195C104.425 14.7855 104.63 14.5982 104.664 14.2576C104.777 12.7477 104.777 11.1413 104.664 9.43838C104.641 9.18862 104.516 9.06374 104.289 9.06374H101.479C101.4 10.8461 101.07 12.3844 100.491 13.6786C99.8444 15.1317 98.8454 16.3465 97.4944 17.3228L97.0516 15.1942C98.7205 13.6502 99.5265 11.2264 99.4697 7.9228V5.35142H97.7158L97.5455 3.5804H101.684V1.62207H103.727V3.5804ZM95.9107 12.4185L97.6306 12.0438V13.7467L92.3687 15.0409L91.96 13.304L93.9013 12.8782V7.30976H92.2665L92.0962 5.53874H93.9013V1.62207H95.9107V5.53874H97.5114V7.30976H95.9107V12.4185Z" fill="currentColor"/>
            <path d="M84.3308 14.3255H90.6656V16.0965H76.1058L75.9355 14.3255H82.2192V4.84035H76.9402L76.77 3.06934H89.8993V4.84035H84.3308V14.3255Z" fill="currentColor"/>
            <path d="M4.64629 7.23566C4.64629 8.51889 3.6058 9.55933 2.32369 9.55933C1.04046 9.55933 0 8.51889 0 7.23566C0 5.95243 1.04046 4.91309 2.32369 4.91309C3.6058 4.91309 4.64629 5.95243 4.64629 7.23566Z" fill="currentColor"/>
            <path d="M4.64629 11.8569C4.64629 13.1401 3.6058 14.1795 2.32369 14.1795C1.04046 14.1795 0 13.1401 0 11.8569C0 10.5737 1.04046 9.5332 2.32369 9.5332C3.6058 9.5332 4.64629 10.5737 4.64629 11.8569Z" fill="currentColor"/>
            <path d="M6.52691 4.9923C5.61958 5.89963 4.21325 5.96452 3.38648 5.13775C2.55859 4.30986 2.62348 2.90355 3.5308 1.99623C4.43813 1.0889 5.84446 1.02401 6.67123 1.8519C7.49912 2.67867 7.43423 4.08498 6.52691 4.9923Z" fill="currentColor"/>
            <path d="M6.52691 17.0939C5.61958 18.0012 4.21325 18.0661 3.38648 17.2382C2.55859 16.4114 2.62348 15.0051 3.5308 14.0978C4.43813 13.1905 5.84446 13.1256 6.67123 13.9535C7.49912 14.7802 7.43423 16.1865 6.52691 17.0939Z" fill="currentColor"/>
            <path d="M16.2489 6.88788C17.1562 5.98055 18.0344 5.38761 18.2112 5.56438C18.388 5.74114 17.795 6.61938 16.8877 7.52671C15.9804 8.43403 15.1021 9.02586 14.9253 8.85021C14.7497 8.67344 15.3415 7.7952 16.2489 6.88788Z" fill="currentColor"/>
            <path d="M16.3845 11.6724C17.2918 10.7651 18.1096 10.1118 18.2114 10.2136C18.3132 10.3165 17.661 11.1343 16.7536 12.0416C15.8463 12.949 15.0285 13.6012 14.9256 13.4994C14.8238 13.3976 15.4771 12.5798 16.3845 11.6724Z" fill="currentColor"/>
            <path d="M13.0553 2.66021C13.9626 1.75288 15.0602 1.3792 15.5065 1.82447C15.9518 2.27086 15.5782 3.36838 14.6709 4.27571C13.7635 5.18303 12.6671 5.55671 12.2207 5.11032C11.7743 4.66393 12.148 3.56753 13.0553 2.66021Z" fill="currentColor"/>
            <path d="M13.1782 14.8979C14.0855 13.9906 15.1271 13.5621 15.5064 13.9402C15.8845 14.3184 15.456 15.3611 14.5487 16.2684C13.6414 17.1757 12.5987 17.6042 12.2205 17.2261C11.8424 16.8468 12.2709 15.8052 13.1782 14.8979Z" fill="currentColor"/>
            <path d="M8.33898 15.9313C9.2463 15.0239 10.4714 14.7789 11.0755 15.3831C11.6807 15.9872 11.4358 17.2134 10.5285 18.1207C9.62113 19.028 8.39493 19.273 7.79079 18.6689C7.18554 18.0636 7.43166 16.8386 8.33898 15.9313Z" fill="currentColor"/>
            <path d="M8.25097 0.831134C9.15829 -0.0761893 10.4348 -0.270856 11.1027 0.39705C11.7707 1.06496 11.576 2.34147 10.6687 3.2488C9.76135 4.15612 8.48481 4.34967 7.8169 3.68288C7.14899 3.01498 7.34365 1.73846 8.25097 0.831134Z" fill="currentColor"/>
          </svg>
          <div className="h-4 w-px bg-[var(--divider)]" />
          <button
            ref={spaceBtnRef}
            type="button"
            onClick={() => {
              if (spaceMenuPos) {
                setSpaceMenuPos(null)
                return
              }
              const rect = spaceBtnRef.current?.getBoundingClientRect()
              if (rect) setSpaceMenuPos({ top: rect.bottom + 6, left: rect.left })
            }}
            className="flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded text-[12px] text-[var(--color-ink)]/55 transition-colors hover:text-[var(--color-ink)]/85"
          >
            {activeSpace}
            <ChevronDown size={12} className={`transition-transform ${spaceMenuPos ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <button
          onClick={onCollapse}
          title="收起侧栏"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]/85"
        >
          <PanelLeft size={13} strokeWidth={1.8} />
        </button>
      </div>

      {/* + 新建项目 */}
      <div className="px-3 pt-4">
        <button
          onClick={onNewProject}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-[var(--color-ink)] text-[13px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90"
        >
          <Plus size={14} strokeWidth={2} />
          新建项目
        </button>
      </div>

      {/* Platform nav — pill-shaped rows with cool-gray tint when selected.
           Styling aligned with the Figma design: 13px semibold, 16px icons
           inheriting text color, 6px gap, rounded-full container. */}
      <nav className="mt-3 flex flex-col gap-2 px-3">
        {(
          [
            { label: 'Skills', icon: FolderCode },
            { label: '资源库', icon: Inbox },
            { label: '创意广场', icon: Home },
          ] as const
        ).map(({ label, icon: Icon }) => {
          const active = activeNav === label
          return (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[13px] font-semibold leading-5 text-[var(--color-ink)] transition-colors ${
                active
                  ? 'bg-[rgba(83,96,143,0.12)]'
                  : 'hover:bg-[rgba(83,96,143,0.08)]'
              }`}
            >
              <Icon size={16} strokeWidth={1.8} className="shrink-0" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* 项目列表 header */}
      <div className="mt-4 flex shrink-0 items-center justify-between px-5 py-1.5">
        <span className="text-[12px] text-[var(--color-ink)]/55">项目列表</span>
        <div className="flex items-center gap-1 text-[var(--color-ink)]/40">
          <button
            title="搜索全部项目文件"
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]/70"
          >
            <Search size={12} strokeWidth={1.8} />
          </button>
          <button
            title="收起全部"
            onClick={onCollapseAll}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]/70"
          >
            <ListCollapse size={12} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Project tree — the real FileTreeView hangs off ACTIVE_PROJECT_NAME;
           the other projects are empty-state stubs (they expand to a muted
           "暂无文件" placeholder, not a tree). */}
      <div className="thin-scroll flex-1 overflow-y-auto pb-2">
        {ALL_PROJECTS.map((name) => {
          const open = openProjects.has(name)
          const hasRealTree = name === ACTIVE_PROJECT_NAME
          return (
            <div key={name}>
              <button
                onClick={() => {
                  toggleProject(name)
                  onSwitchProject(name)
                }}
                className="flex w-full items-center gap-1.5 py-1 pl-5 pr-3 text-[12px] font-medium text-[var(--color-ink)]/85 transition-colors hover:bg-[var(--color-ink)]/[0.04]"
              >
                {open ? (
                  <ChevronDown size={12} className="shrink-0 text-[var(--color-ink)]/55" />
                ) : (
                  <ChevronRight size={12} className="shrink-0 text-[var(--color-ink)]/55" />
                )}
                <span className="truncate">{name}</span>
              </button>
              {open && hasRealTree && (
                <FileTreeView
                  nodes={fileTree}
                  expanded={expandedDirs}
                  onToggleDir={toggleDir}
                  onOpenFile={openFileInTab}
                  depth={1}
                  parentPath=""
                  railStartDepth={1}
                />
              )}
              {open && !hasRealTree && (
                <div className="px-5 py-1.5 pl-[38px] text-[12px] text-[var(--color-ink)]/40">
                  暂无文件
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* User footer */}
      <div className="flex h-12 shrink-0 items-center gap-2 px-5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-[10px] font-semibold text-white">
          张
        </div>
        <span className="text-[12px] text-[var(--color-ink)]/80">张俊</span>
      </div>

      {spaceMenuPos && (
        <SpaceMenuPopover
          pos={spaceMenuPos}
          active={activeSpace}
          onSelect={setActiveSpace}
          onClose={() => setSpaceMenuPos(null)}
        />
      )}
    </aside>
  )
}

export default function VibeCodingPage() {
  // Standalone build — no router; the top-left back button is a no-op.
  const handleBack = useCallback(() => {
    /* intentionally empty in standalone */
  }, [])

  /* Ambient glow palette — always picked from the persona actually shown
   * in the phone preview (Identity V · 约瑟夫 for this sample project),
   * not whatever the user currently has in the store. */
  const portraitUrl = getWorld('identity-v').defaults.portraitUrl
  const [c1, c2] = useDominantColors(portraitUrl, 2)

  /* chat panel — always visible; flag kept for future collapse toggle */
  const [chatCollapsed] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const chatScrollEdges = useScrollEdges(chatScrollRef)

  /* form state — cascading: step 2 unlocks after scene, step 3 after
   *  appType. step 3 picks capabilities, step 4 picks personalization tags.
   *  Steps 3 & 4 are now a two-phase reveal: when the upstream step
   *  completes we first show a brief "系统在分析推荐工具/标签…" loading
   *  state before the pills appear. Each step has its own 确认 button —
   *  confirming step 3 kicks off step 4's loading phase, and confirming
   *  step 4 surfaces the final 确认创建 button. */
  const [scene, setScene] = useState('')
  const [appType, setAppType] = useState('')
  const [enabledCapabilities, setEnabledCapabilities] = useState<Set<string>>(() => new Set())
  const [personalizationTags, setPersonalizationTags] = useState<Set<string>>(() => new Set())
  type RecStep = 'idle' | 'loading' | 'ready' | 'confirmed'
  const [capabilitiesStep, setCapabilitiesStep] = useState<RecStep>('idle')
  const [tagsStep, setTagsStep] = useState<RecStep>('idle')
  const [tagsAddOpen, setTagsAddOpen] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [chatCleared, setChatCleared] = useState(false)
  const [chatDraft, setChatDraft] = useState('')
  /* Composer auto-grow — resize textarea to fit content (capped so very
   * long drafts still leave room for the message history above). */
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = chatInputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [chatDraft])
  /* User-sent messages — appended to the bottom of the scroll area. The
   * static mock conversation stays above. Three trigger kinds:
   *   • 'publish' — message matched 发布/更新, publish flow kicked off
   *   • 'needs'   — matched 需求/新建/重新收集, needs-gathering form reset
   *   • 'none'    — plain message, just rendered as a user bubble
   */
  type SentMessage = { text: string; trigger: 'none' | 'publish' | 'needs' }
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([])
  /* Chat session list — the header's conversation-name button opens a
   * dropdown of these, and the + button creates a fresh empty session. */
  type ChatSession = { id: string; name: string }
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: 's-current', name: '新会话' },
    { id: 's-tarot', name: '第五人格塔罗运势' },
    { id: 's-daily', name: '每日打卡小程序' },
    { id: 's-feed', name: '异形卡 Feed 推广' },
  ])
  const [activeSessionId, setActiveSessionId] = useState('s-current')
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false)
  const sessionMenuRef = useRef<HTMLDivElement>(null)
  /* Platform "home" / new-project landing view — shown by clicking the
   * + 新建项目 button in the sidebar. Contains a hero title + a large
   * prompt composer + suggestion pills. Submitting returns to the normal
   * workspace with the prompt routed through sendChat. */
  const [platformHomeOpen, setPlatformHomeOpen] = useState(false)
  const [homeDraft, setHomeDraft] = useState('')
  /* 第五人格 needs-collection mock — only surfaces when the user sends a
   * message containing 第五人格/小程序. Default off so the chat starts in
   * its empty state rather than immediately showing a scripted dialog. */
  const [needsFlowActive, setNeedsFlowActive] = useState(false)
  /* Once the thinking indicator has faded out we unmount it so it stops
   * claiming a `space-y` slot between the user bubble and the form. */
  const [needsThinkingVisible, setNeedsThinkingVisible] = useState(true)
  useEffect(() => {
    if (!needsFlowActive) {
      setNeedsThinkingVisible(true)
      return
    }
    const t = setTimeout(() => setNeedsThinkingVisible(false), 900)
    return () => clearTimeout(t)
  }, [needsFlowActive])
  /** Step 3 cascade — whenever appType is set (or changes) we re-seed
   *  the recommended capabilities and drop step 3 into 'loading'. The
   *  dedicated loading→ready timers (below) each own their own effect
   *  so that re-running a multi-dep effect doesn't cancel the timer. */
  useEffect(() => {
    if (!appType) {
      setCapabilitiesStep('idle')
      setTagsStep('idle')
      setTagsAddOpen(false)
      return
    }
    setEnabledCapabilities(new Set(RECOMMENDED_CAPABILITIES))
    setCapabilitiesStep('loading')
    setTagsStep('idle')
    setTagsAddOpen(false)
  }, [appType])
  /** Step 4 kicks off the moment step 3 is confirmed. */
  useEffect(() => {
    if (capabilitiesStep !== 'confirmed') return
    setPersonalizationTags(new Set(RECOMMENDED_TAGS))
    setTagsStep('loading')
  }, [capabilitiesStep])
  /** Shared loading→ready delays. Each watches a single step so setting
   *  the target state inside doesn't re-trigger-and-cancel the timer. */
  useEffect(() => {
    if (capabilitiesStep !== 'loading') return
    const t = setTimeout(() => setCapabilitiesStep('ready'), 1100)
    return () => clearTimeout(t)
  }, [capabilitiesStep])
  useEffect(() => {
    if (tagsStep !== 'loading') return
    const t = setTimeout(() => setTagsStep('ready'), 1100)
    return () => clearTimeout(t)
  }, [tagsStep])
  /* Publish flow now lives in `usePublishFlowStore` so the top-right CTA
   *  can choose between modal vs chat-embedded rendering. */
  const publishStep = usePublishFlowStore((s) => s.step)
  const publishMode = usePublishFlowStore((s) => s.mode)
  const publishScenes = usePublishFlowStore((s) => s.scenes)
  const startPublish = usePublishFlowStore((s) => s.start)
  const resetPublish = usePublishFlowStore((s) => s.reset)
  const togglePublishScene = usePublishFlowStore((s) => s.toggleScene)
  const submitPublish = usePublishFlowStore((s) => s.submit)
  const confirmPublish = usePublishFlowStore((s) => s.confirm)
  const showChatPublish = publishStep !== 'idle' && publishMode === 'chat'
  /* bump to remount the mini-app preview — clicking the phone-bar "重新加载"
   * fully resets its local interactive state. */
  const [miniAppKey, setMiniAppKey] = useState(0)

  /* Layout plan — 'workspace' is the default (tabs 合一, 产物可钉左右);
   * 'editor' mirrors IP-编辑器: 左侧常驻手机 + 中间独立文件编辑;
   * 'code' 把 chat 移到最左，中间文件编辑器，右侧常驻手机预览。 */
  const [layout, setLayout] = useState<'workspace' | 'editor' | 'code' | 'platform'>('platform')
  const isPlatform = layout === 'platform'
  const chatOnLeft = layout === 'code' || isPlatform
  /* Platform-only: sidebar + chat widths are both user-draggable; the
   * sidebar can also be collapsed via the PanelLeft button in the brand
   * header. When collapsed, the card extends to 20px from viewport-left
   * and the brand chrome (logo + 抖音AI工坊 + expand icon) relocates to
   * the card's top-left header. */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [platformSidebarWidth, setPlatformSidebarWidth] = useState(280)
  const effectiveSidebarWidth = sidebarCollapsed ? 12 : platformSidebarWidth
  const sidebarDragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const onSidebarDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    sidebarDragRef.current = { startX: e.clientX, startWidth: platformSidebarWidth }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onSidebarDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = sidebarDragRef.current
    if (!s) return
    const next = Math.min(360, Math.max(200, s.startWidth + (e.clientX - s.startX)))
    setPlatformSidebarWidth(next)
  }
  const onSidebarDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    sidebarDragRef.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }
  const [platformChatWidth, setPlatformChatWidth] = useState(420)
  const chatDragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const onChatDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    chatDragRef.current = { startX: e.clientX, startWidth: platformChatWidth }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onChatDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = chatDragRef.current
    if (!s) return
    const next = Math.min(680, Math.max(320, s.startWidth + (e.clientX - s.startX)))
    setPlatformChatWidth(next)
  }
  const onChatDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    chatDragRef.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }
  const chatWidthPx = isPlatform ? platformChatWidth : chatOnLeft ? 347 : 420
  // Header is full-width in code layout (no mr/ml — chat sits below header).
  // Body keeps a margin so content doesn't slide under the fixed chat column.
  // In code layout the whole below-header area has 20px gutter on L/R/B — the
  // chat sits at left:20, and there's a 16px gap between chat and the right
  // panel, so body starts at 20 + 347 + 16 = 383px.
  // Platform adds a 230px project sidebar on the far left; chat sits flush
  // against it, so body offset is 230 + 420 = 650px.
  const headerMarginClass = isPlatform
    ? 'ml-[230px]'
    : chatOnLeft
      ? ''
      : 'mr-[420px]'
  // Platform: sidebar(230) + chat(platformChatWidth) = marginLeft for the
  // preview panel. The chat sits flush against the preview inside the
  // shared card; their boundary is marked by the chat aside's `border-r`.
  // Actual value is applied inline since it tracks the draggable chat width.
  const bodyMarginClass = isPlatform
    ? ''
    : chatOnLeft
      ? 'ml-[383px]'
      : 'mr-[420px]'
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false)
  const layoutMenuRef = useRef<HTMLDivElement>(null)
  const themeMode = useThemeStore((s) => s.mode)
  const setThemeMode = useThemeStore((s) => s.setMode)

  /* Editor-layout left preview column — user-draggable width. */
  const [previewColumnWidth, setPreviewColumnWidth] = useState(400)
  const previewDragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const onPreviewColDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    previewDragRef.current = { startX: e.clientX, startWidth: previewColumnWidth }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPreviewColDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = previewDragRef.current
    if (!s) return
    // Editor layout has the phone on the left (drag right → wider).
    // Code layout has the phone on the right (drag right → narrower).
    const delta = e.clientX - s.startX
    const signedDelta = layout === 'code' ? -delta : delta
    const next = Math.min(680, Math.max(320, s.startWidth + signedDelta))
    setPreviewColumnWidth(next)
  }
  const onPreviewColDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    previewDragRef.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }

  useEffect(() => {
    if (!layoutMenuOpen) return
    const handler = (e: PointerEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setLayoutMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [layoutMenuOpen])

  /** Clear every piece of chat-scoped UI so the next session starts in
   *  a truly empty state. Covers:
   *   - Sent messages + new-empty flag
   *   - Needs-collection form (scene/appType/capabilities/tags/step state)
   *   - Publish flow store (the "发布更新" card embedded in chat)
   *   - Inline thinking indicator
   *  Any case that can render inside the chat column should be reset
   *  here — if it's tied to a conversation, it shouldn't leak across. */
  const resetChatState = () => {
    setChatCleared(true)
    setSentMessages([])
    setChatDraft('')
    setScene('')
    setAppType('')
    setEnabledCapabilities(new Set())
    setPersonalizationTags(new Set())
    setCapabilitiesStep('idle')
    setTagsStep('idle')
    setTagsAddOpen(false)
    setFormSubmitted(false)
    setNeedsFlowActive(false)
    setNeedsThinkingVisible(true)
    resetPublish()
  }

  const handleNewSession = () => {
    const id = `s-${Date.now()}`
    setSessions((prev) => [{ id, name: '新会话' }, ...prev])
    setActiveSessionId(id)
    resetChatState()
  }

  /** New-project button click: reset session state + navigate to the
   *  platform home / landing screen. */
  const handleNewProject = () => {
    handleNewSession()
    setPlatformHomeOpen(true)
  }

  /** Called when the user submits a prompt from the home screen (either
   *  by typing + send or by clicking a suggestion pill). Exits home
   *  view and pipes the text through sendChat. */
  const submitFromHome = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setHomeDraft('')
    setPlatformHomeOpen(false)
    sendChat(trimmed)
  }

  useEffect(() => {
    if (!sessionMenuOpen) return
    const handler = (e: PointerEvent) => {
      if (sessionMenuRef.current && !sessionMenuRef.current.contains(e.target as Node)) {
        setSessionMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [sessionMenuOpen])

  /** Send a chat message. Three triggers:
   *  - 发布/更新 → publish flow
   *  - 第五人格/小程序 → activate the needs-gathering mock dialog
   *  - otherwise → just append the message bubble
   *  Accepts an optional `override` text (used by empty-state suggestion
   *  chips to send immediately on click, bypassing the draft state). */
  const sendChat = (override?: string) => {
    const text = (override ?? chatDraft).trim()
    if (!text) return
    let trigger: 'none' | 'publish' | 'needs' = 'none'
    if (/发布|更新/.test(text)) {
      trigger = 'publish'
      resetPublish()
      startPublish('chat')
    } else if (/第五人格|小程序/.test(text)) {
      trigger = 'needs'
      setNeedsFlowActive(true)
      setScene('')
      setAppType('')
      setEnabledCapabilities(new Set())
      setPersonalizationTags(new Set())
      setCapabilitiesStep('idle')
      setTagsStep('idle')
      setFormSubmitted(false)
    }
    if (chatCleared) setChatCleared(false)
    // If this is the first message in a still-default-named session,
    // borrow the user's prompt as the session title (capped at ~20 chars).
    if (sentMessages.length === 0) {
      const nextName = text.length > 20 ? `${text.slice(0, 20)}…` : text
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId && s.name === '新会话'
            ? { ...s, name: nextName }
            : s,
        ),
      )
    }
    setSentMessages((prev) => [...prev, { text, trigger }])
    setChatDraft('')
    // Scroll to bottom after React commits the new message.
    requestAnimationFrame(() => {
      const el = chatScrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  /* collapse toggles */
  const [task1Open, setTask1Open] = useState(false)
  const [task2Open, setTask2Open] = useState(false)

  /* product pin — when on, the phone mockup stays pinned on one side and
   * the active code tab renders on the other side. Platform view (the
   * default layout) starts unpinned so the preview tab behaves like any
   * other tab until the user explicitly pins it. */
  const [productPinned, setProductPinned] = useState(false)
  const [productSide, setProductSide] = useState<'left' | 'right'>('left')
  /* Left-column ratio when split. 0.5 = equal halves. Range clamped in drag. */
  const [splitRatio, setSplitRatio] = useState(0.5)
  const splitContainerRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<{ startX: number; startRatio: number; width: number } | null>(null)

  const onDividerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = splitContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    dragStateRef.current = {
      startX: e.clientX,
      startRatio: splitRatio,
      width: rect.width,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onDividerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current
    if (!state) return
    const delta = (e.clientX - state.startX) / state.width
    const next = Math.min(0.8, Math.max(0.2, state.startRatio + delta))
    setSplitRatio(next)
  }
  const onDividerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }
  const [pinMenuOpen, setPinMenuOpen] = useState(false)
  const [pinMenuPos, setPinMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const pinTriggerRef = useRef<HTMLSpanElement>(null)
  const pinMenuRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!pinMenuOpen) return
    const handler = (e: PointerEvent) => {
      const target = e.target as Node
      const insideTrigger = pinTriggerRef.current?.contains(target)
      const insideMenu = pinMenuRef.current?.contains(target)
      if (!insideTrigger && !insideMenu) setPinMenuOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [pinMenuOpen])

  /* file tree */
  const [fileTreeOpen, setFileTreeOpen] = useState(false)
  const [fileTreeWidth, setFileTreeWidth] = useState(220)
  const fileTreeDragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  /* File-tree panel is split into two accordion sections that can be
   * collapsed independently: conversation context (referenced skills /
   * knowledge) on top, project codebase (the actual file tree) below. */
  const [contextSectionOpen, setContextSectionOpen] = useState(true)
  const [projectSectionOpen, setProjectSectionOpen] = useState(true)

  const onFileTreeDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    fileTreeDragRef.current = { startX: e.clientX, startWidth: fileTreeWidth }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onFileTreeDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = fileTreeDragRef.current
    if (!state) return
    const next = Math.min(480, Math.max(160, state.startWidth + (e.clientX - state.startX)))
    setFileTreeWidth(next)
  }
  const onFileTreeDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    fileTreeDragRef.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['src', 'src/pages', 'src/components']))
  /* Lifted from PlatformSidebar so opening a file anywhere can guarantee
   * the sidebar's owning project is expanded + visible. */
  const [platformOpenProjects, setPlatformOpenProjects] = useState<Set<string>>(
    new Set(['项目名称_02']),
  )

  const fileTree: FileNode[] = [
    { name: 'project.config.json', type: 'file' },
    { name: 'app.json', type: 'file' },
    { name: 'app.tsx', type: 'file' },
    { name: 'app.less', type: 'file' },
    {
      name: 'src',
      type: 'dir',
      children: [
        {
          name: 'pages',
          type: 'dir',
          children: [
            { name: 'index', type: 'dir', children: [
              { name: 'index.tsx', type: 'file' },
              { name: 'index.less', type: 'file' },
              { name: 'index.config.ts', type: 'file' },
            ]},
            { name: 'chat', type: 'dir', children: [
              { name: 'index.tsx', type: 'file' },
              { name: 'index.less', type: 'file' },
            ]},
            { name: 'profile', type: 'dir', children: [
              { name: 'index.tsx', type: 'file' },
              { name: 'index.less', type: 'file' },
            ]},
            { name: 'tarot', type: 'dir', children: [
              { name: 'index.tsx', type: 'file' },
              { name: 'result.tsx', type: 'file' },
              { name: 'index.less', type: 'file' },
            ]},
          ],
        },
        {
          name: 'components',
          type: 'dir',
          children: [
            { name: 'NavBar.tsx', type: 'file' },
            { name: 'TabBar.tsx', type: 'file' },
            { name: 'ChatBubble.tsx', type: 'file' },
            { name: 'TarotCard.tsx', type: 'file' },
            { name: 'DramaCard.tsx', type: 'file' },
          ],
        },
        { name: 'services', type: 'dir', children: [
          { name: 'api.ts', type: 'file' },
          { name: 'request.ts', type: 'file' },
          { name: 'chat.ts', type: 'file' },
        ]},
        { name: 'store', type: 'dir', children: [
          { name: 'index.ts', type: 'file' },
          { name: 'user.ts', type: 'file' },
          { name: 'chat.ts', type: 'file' },
        ]},
        { name: 'utils', type: 'dir', children: [
          { name: 'format.ts', type: 'file' },
          { name: 'auth.ts', type: 'file' },
        ]},
        { name: 'assets', type: 'dir', children: [
          { name: 'logo.png', type: 'file' },
          { name: 'tarot-bg.png', type: 'file' },
        ]},
      ],
    },
    // Agent capabilities injected after the user confirms the form — each
    // enabled capability becomes a subfolder under `.agent/skills/` with its
    // own SKILL.md + manifest.yaml. Mirrors the project tree in the design.
    ...(formSubmitted && enabledCapabilities.size > 0
      ? [
          {
            name: '.agent',
            type: 'dir' as const,
            children: [
              { name: 'manifest.json', type: 'file' as const },
              { name: 'business-config.json', type: 'file' as const },
              {
                name: 'skills',
                type: 'dir' as const,
                children: CAPABILITY_OPTIONS.filter((c) => enabledCapabilities.has(c.id)).map(
                  (c) => ({
                    name: c.folderName,
                    type: 'dir' as const,
                    children: [
                      { name: 'SKILL.md', type: 'file' as const },
                      { name: 'manifest.yaml', type: 'file' as const },
                    ],
                  }),
                ),
              },
            ],
          },
        ]
      : []),
  ]

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  /* preview tab */
  const [openTabs, setOpenTabs] = useState([
    { label: '产物预览', closable: false },
    { label: 'soul.md', closable: true },
    { label: 'app.tsx', closable: true },
  ])
  // Default: 打开 soul.md（AI 分身定义）作为第一眼看到的文件，其次 app.tsx
  // 可关。工作区布局下，产物预览 tab 也通过 productPinned 保持高亮。
  const [activePreviewTab, setActivePreviewTab] = useState(1)

  const openFileInTab = (filename: string) => {
    const existing = openTabs.findIndex((t) => t.label === filename)
    if (existing >= 0) {
      setActivePreviewTab(existing)
    } else {
      const next = [...openTabs, { label: filename, closable: true }]
      setOpenTabs(next)
      setActivePreviewTab(next.length - 1)
    }
    // Ensure the file's owning project is expanded in the platform sidebar
    // so the user can see it located there too.
    setPlatformOpenProjects((prev) => {
      if (prev.has('项目名称_02')) return prev
      const next = new Set(prev)
      next.add('项目名称_02')
      return next
    })
  }

  const DIFF_TAB_LABEL = '变更详情'
  const openChangesDetail = () => {
    const existing = openTabs.findIndex((t) => t.label === DIFF_TAB_LABEL)
    if (existing >= 0) {
      setActivePreviewTab(existing)
    } else {
      const next = [...openTabs, { label: DIFF_TAB_LABEL, closable: true }]
      setOpenTabs(next)
      setActivePreviewTab(next.length - 1)
    }
  }

  const closeTab = (index: number) => {
    if (!openTabs[index]?.closable) return
    const next = openTabs.filter((_, i) => i !== index)
    setOpenTabs(next)
    if (activePreviewTab >= next.length) setActivePreviewTab(next.length - 1)
    else if (activePreviewTab === index) setActivePreviewTab(Math.max(0, index - 1))
  }

  /* helper to build a code line */
  const L = (num: number, ...tokens: [string, string][]) => ({
    num,
    tokens: tokens.map(([text, color]) => ({ text, color })),
  })
  const k = 'text-[var(--syntax-keyword)]' // keyword
  const s = 'text-[var(--syntax-string)]'  // string
  const f = 'text-[var(--syntax-func)]'    // function/tag
  const c = 'text-[var(--syntax-comment)]' // comment
  const n = 'text-[var(--syntax-jsx)]'     // number/const (share warm tone)
  const t = 'text-[var(--color-ink)]/80'   // text
  const p = 'text-[var(--syntax-operator)]' // operator
  const x = 'text-[var(--syntax-jsx)]'     // JSX tag

  const codeFiles: Record<string, { lang: string; lines: { num: number; tokens: { text: string; color: string }[] }[] }> = {
    'app.tsx': { lang: 'TypeScript JSX', lines: [
      L(1, ['import', k], [' Taro ', t], ['from', k], [" '@tarojs/taro'", s]),
      L(2, ['import', k], [' { Component } ', t], ['from', k], [" 'react'", s]),
      L(3, ['import', k], [" './app.less'", s]),
      L(4),
      L(5, ['class', k], [' App ', f], ['extends', k], [' Component {', t]),
      L(6),
      L(7, ['  componentDidMount', f], ['() {', t]),
      L(8, ['    console.log(', t], ["'第五人格小程序已启动'", s], [')', t]),
      L(9, ['  }', t]),
      L(10),
      L(11, ['  componentDidShow', f], ['() {}', t]),
      L(12, ['  componentDidHide', f], ['() {}', t]),
      L(13),
      L(14, ['  render() {', t]),
      L(15, ['    ', ''], ['// this.props.children 是将要会渲染的页面', c]),
      L(16, ['    ', ''], ['return', k], [' this', n], ['.props.children', t]),
      L(17, ['  }', t]),
      L(18, ['}', t]),
      L(19),
      L(20, ['export', k], [' default', k], [' App', f]),
    ]},
    'index.tsx': { lang: 'TypeScript JSX', lines: [
      L(1, ['import', k], [' { View, Text, Image } ', t], ['from', k], [" '@tarojs/components'", s]),
      L(2, ['import', k], [' { useLoad } ', t], ['from', k], [" '@tarojs/taro'", s]),
      L(3, ['import', k], [' NavBar ', t], ['from', k], [" '../../components/NavBar'", s]),
      L(4, ['import', k], [' TabBar ', t], ['from', k], [" '../../components/TabBar'", s]),
      L(5, ['import', k], [' TarotCard ', t], ['from', k], [" '../../components/TarotCard'", s]),
      L(6, ['import', k], [" './index.less'", s]),
      L(7),
      L(8, ['export default', k], [' function', k], [' Index', f], ['() {', t]),
      L(9, ['  useLoad(() ', p], ['=> {', t]),
      L(10, ['    console.log(', t], ["'Page loaded.'", s], [')', t]),
      L(11, ['  })', t]),
      L(12),
      L(13, ['  ', ''], ['return', k], [' (', t]),
      L(14, ['    ', ''], ['<View', x], [' className=', t], ['"index"', s], ['>', x]),
      L(15, ['      ', ''], ['<NavBar', x], [' title=', t], ['"第五人格"', s], [' />', x]),
      L(16),
      L(17, ['      ', ''], ['<View', x], [' className=', t], ['"hero-section"', s], ['>', x]),
      L(18, ['        ', ''], ['<Image', x], [' src=', t], ['"../../assets/tarot-bg.png"', s], [' />', x]),
      L(19, ['        ', ''], ['<Text', x], [' className=', t], ['"title"', s], ['>', x]),
      L(20, ['          今日塔罗运势指南', t]),
      L(21, ['        ', ''], ['</Text>', x]),
      L(22, ['      ', ''], ['</View>', x]),
      L(23),
      L(24, ['      ', ''], ['<View', x], [' className=', t], ['"card-grid"', s], ['>', x]),
      L(25, ['        {[', t], ["'爱情'", s], [', ', t], ["'缘分'", s], [', ', t], ["'选择'", s], [', ', t], ["'直觉'", s], ['].map(', t], ['label', n], [' =>', p]),
      L(26, ['          ', ''], ['<TarotCard', x], [' key={label} label={label} />', t]),
      L(27, ['        )}', t]),
      L(28, ['      ', ''], ['</View>', x]),
      L(29),
      L(30, ['      ', ''], ['<TabBar', x], [' current=', t], ['{0}', n], [' />', x]),
      L(31, ['    ', ''], ['</View>', x]),
      L(32, ['  )', t]),
      L(33, ['}', t]),
    ]},
    'NavBar.tsx': { lang: 'TypeScript JSX', lines: [
      L(1, ['import', k], [' { View, Text } ', t], ['from', k], [" '@tarojs/components'", s]),
      L(2),
      L(3, ['interface', k], [' Props { title: ', t], ['string', f], [' }', t]),
      L(4),
      L(5, ['export default', k], [' function', k], [' NavBar', f], ['({ title }: Props) {', t]),
      L(6, ['  ', ''], ['return', k], [' (', t]),
      L(7, ['    ', ''], ['<View', x], [' className=', t], ['"navbar"', s], ['>', x]),
      L(8, ['      ', ''], ['<Text', x], [' className=', t], ['"navbar-title"', s], ['>', x], ['{title}', n], ['</Text>', x]),
      L(9, ['    ', ''], ['</View>', x]),
      L(10, ['  )', t]),
      L(11, ['}', t]),
    ]},
    'api.ts': { lang: 'TypeScript', lines: [
      L(1, ['import', k], [' Taro ', t], ['from', k], [" '@tarojs/taro'", s]),
      L(2, ['import', k], [' { BASE_URL } ', t], ['from', k], [" './request'", s]),
      L(3),
      L(4, ['export const', k], [' fetchTarotResult ', f], ['= ', p], ['async', k], [' (cardName: ', t], ['string', f], [') => {', t]),
      L(5, ['  ', ''], ['const', k], [' res ', t], ['=', p], [' await', k], [' Taro.request({', t]),
      L(6, ['    url: ', t], ['`${BASE_URL}/api/tarot/read`', s], [',', t]),
      L(7, ['    method: ', t], ["'POST'", s], [',', t]),
      L(8, ['    data: { card: cardName },', t]),
      L(9, ['  })', t]),
      L(10, ['  ', ''], ['return', k], [' res.data', t]),
      L(11, ['}', t]),
      L(12),
      L(13, ['export const', k], [' fetchDramas ', f], ['= ', p], ['async', k], [' (mood: ', t], ['string', f], [') => {', t]),
      L(14, ['  ', ''], ['const', k], [' res ', t], ['=', p], [' await', k], [' Taro.request({', t]),
      L(15, ['    url: ', t], ['`${BASE_URL}/api/recommend`', s], [',', t]),
      L(16, ['    method: ', t], ["'POST'", s], [',', t]),
      L(17, ['    data: { mood, limit: ', t], ['5', n], [' },', t]),
      L(18, ['  })', t]),
      L(19, ['  ', ''], ['return', k], [' res.data.dramas', t]),
      L(20, ['}', t]),
    ]},
    'project.config.json': { lang: 'JSON', lines: [
      L(1, ['{', t]),
      L(2, ['  ', ''], ['"appid"', f], [': ', t], ['"wx1234567890abcdef"', s], [',', t]),
      L(3, ['  ', ''], ['"projectname"', f], [': ', t], ['"identity-v-miniapp"', s], [',', t]),
      L(4, ['  ', ''], ['"setting"', f], [': {', t]),
      L(5, ['    ', ''], ['"urlCheck"', f], [': ', t], ['true', n], [',', t]),
      L(6, ['    ', ''], ['"es6"', f], [': ', t], ['true', n], [',', t]),
      L(7, ['    ', ''], ['"enhance"', f], [': ', t], ['true', n], [',', t]),
      L(8, ['    ', ''], ['"compileHotReLoad"', f], [': ', t], ['true', n]),
      L(9, ['  }', t]),
      L(10, ['}', t]),
    ]},
    'app.json': { lang: 'JSON', lines: [
      L(1, ['{', t]),
      L(2, ['  ', ''], ['"pages"', f], [': [', t]),
      L(3, ['    ', ''], ['"pages/index/index"', s], [',', t]),
      L(4, ['    ', ''], ['"pages/chat/index"', s], [',', t]),
      L(5, ['    ', ''], ['"pages/profile/index"', s], [',', t]),
      L(6, ['    ', ''], ['"pages/tarot/index"', s]),
      L(7, ['  ],', t]),
      L(8, ['  ', ''], ['"window"', f], [': {', t]),
      L(9, ['    ', ''], ['"navigationBarTitleText"', f], [': ', t], ['"第五人格"', s], [',', t]),
      L(10, ['    ', ''], ['"navigationBarBackgroundColor"', f], [': ', t], ['"#0a0b0f"', s], [',', t]),
      L(11, ['    ', ''], ['"navigationBarTextStyle"', f], [': ', t], ['"white"', s]),
      L(12, ['  },', t]),
      L(13, ['  ', ''], ['"tabBar"', f], [': {', t]),
      L(14, ['    ', ''], ['"list"', f], [': [', t]),
      L(15, ['      { ', t], ['"pagePath"', f], [': ', t], ['"pages/index/index"', s], [', ', t], ['"text"', f], [': ', t], ['"首页"', s], [' },', t]),
      L(16, ['      { ', t], ['"pagePath"', f], [': ', t], ['"pages/chat/index"', s], [', ', t], ['"text"', f], [': ', t], ['"对话"', s], [' },', t]),
      L(17, ['      { ', t], ['"pagePath"', f], [': ', t], ['"pages/profile/index"', s], [', ', t], ['"text"', f], [': ', t], ['"我的"', s], [' }', t]),
      L(18, ['    ]', t]),
      L(19, ['  }', t]),
      L(20, ['}', t]),
    ]},
    'app.less': { lang: 'Less', lines: [
      L(1, ['// 全局样式', c]),
      L(2, ['@primary', f], [': ', t], ['#0a0b0f', s], [';', t]),
      L(3, ['@accent', f], [': ', t], ['#e8c97a', s], [';', t]),
      L(4),
      L(5, ['page', f], [' {', t]),
      L(6, ['  background', k], [': @primary;', t]),
      L(7, ['  color', k], [': ', t], ['#f0f0f0', s], [';', t]),
      L(8, ['  font-family', k], [': ', t], ['"PingFang SC"', s], [', sans-serif;', t]),
      L(9, ['}', t]),
    ]},
    'index.config.ts': { lang: 'TypeScript', lines: [
      L(1, ['export default', k], [' definePageConfig({', t]),
      L(2, ['  navigationBarTitleText: ', t], ["'第五人格 · 今日运势'", s], [',', t]),
      L(3, ['  enableShareAppMessage: ', t], ['true', n], [',', t]),
      L(4, ['  enableShareTimeline: ', t], ['true', n]),
      L(5, ['})', t]),
    ]},
    'index.less': { lang: 'Less', lines: [
      L(1, ['.index', f], [' {', t]),
      L(2, ['  min-height', k], [': ', t], ['100vh', n], [';', t]),
      L(3, ['  padding', k], [': ', t], ['0 24rpx', n], [';', t]),
      L(4, ['}', t]),
      L(5),
      L(6, ['.hero-section', f], [' {', t]),
      L(7, ['  position', k], [': relative;', t]),
      L(8, ['  height', k], [': ', t], ['400rpx', n], [';', t]),
      L(9, ['  overflow', k], [': hidden;', t]),
      L(10, ['  border-radius', k], [': ', t], ['24rpx', n], [';', t]),
      L(11, ['}', t]),
      L(12),
      L(13, ['.card-grid', f], [' {', t]),
      L(14, ['  display', k], [': grid;', t]),
      L(15, ['  grid-template-columns', k], [': repeat(2, 1fr);', t]),
      L(16, ['  gap', k], [': ', t], ['16rpx', n], [';', t]),
      L(17, ['  margin-top', k], [': ', t], ['32rpx', n], [';', t]),
      L(18, ['}', t]),
    ]},
    'TabBar.tsx': { lang: 'TypeScript JSX', lines: [
      L(1, ['import', k], [' { View, Text } ', t], ['from', k], [" '@tarojs/components'", s]),
      L(2),
      L(3, ['const', k], [' TABS ', t], ['=', p], [" ['首页', '对话', '消息', '我']", t]),
      L(4),
      L(5, ['export default', k], [' function', k], [' TabBar', f], ['({ current }: { current: number }) {', t]),
      L(6, ['  ', ''], ['return', k], [' (', t]),
      L(7, ['    ', ''], ['<View', x], [' className=', t], ['"tabbar"', s], ['>', x]),
      L(8, ['      {TABS.map((label, i) ', p], ['=> (', t]),
      L(9, ['        ', ''], ['<View', x], [' key={label} className={i === current ? ', t], ['"active"', s], [' : ', t], ['"tab"', s], ['}>', x]),
      L(10, ['          ', ''], ['<Text>', x], ['{label}', n], ['</Text>', x]),
      L(11, ['        ', ''], ['</View>', x]),
      L(12, ['      ))}', t]),
      L(13, ['    ', ''], ['</View>', x]),
      L(14, ['  )', t]),
      L(15, ['}', t]),
    ]},
    'ChatBubble.tsx': { lang: 'TypeScript JSX', lines: [
      L(1, ['import', k], [' { View, Text, Image } ', t], ['from', k], [" '@tarojs/components'", s]),
      L(2),
      L(3, ['interface', k], [' Props {', t]),
      L(4, ['  avatar: ', t], ['string', f], [';', t]),
      L(5, ['  content: ', t], ['string', f], [';', t]),
      L(6, ['  isMe?: ', t], ['boolean', f]),
      L(7, ['}', t]),
      L(8),
      L(9, ['export default', k], [' function', k], [' ChatBubble', f], ['({ avatar, content, isMe }: Props) {', t]),
      L(10, ['  ', ''], ['return', k], [' (', t]),
      L(11, ['    ', ''], ['<View', x], [' className={isMe ? ', t], ['"bubble-me"', s], [' : ', t], ['"bubble-ai"', s], ['}>', x]),
      L(12, ['      ', ''], ['<Image', x], [' src={avatar} className=', t], ['"avatar"', s], [' />', x]),
      L(13, ['      ', ''], ['<Text', x], [' className=', t], ['"content"', s], ['>', x], ['{content}', n], ['</Text>', x]),
      L(14, ['    ', ''], ['</View>', x]),
      L(15, ['  )', t]),
      L(16, ['}', t]),
    ]},
    'TarotCard.tsx': { lang: 'TypeScript JSX', lines: [
      L(1, ['import', k], [' { View, Text } ', t], ['from', k], [" '@tarojs/components'", s]),
      L(2, ['import', k], [' { useState } ', t], ['from', k], [" 'react'", s]),
      L(3),
      L(4, ['export default', k], [' function', k], [' TarotCard', f], ['({ label }: { label: string }) {', t]),
      L(5, ['  ', ''], ['const', k], [' [flipped, setFlipped] ', t], ['=', p], [' useState(', f], ['false', n], [')', t]),
      L(6),
      L(7, ['  ', ''], ['return', k], [' (', t]),
      L(8, ['    ', ''], ['<View', x], [' className={flipped ? ', t], ['"card flipped"', s], [' : ', t], ['"card"', s], ['}', x]),
      L(9, ['      onClick={() ', p], ['=> setFlipped(', f], ['true', n], [')}>', x]),
      L(10, ['      ', ''], ['<Text', x], [' className=', t], ['"label"', s], ['>', x], ['{label}', n], ['</Text>', x]),
      L(11, ['    ', ''], ['</View>', x]),
      L(12, ['  )', t]),
      L(13, ['}', t]),
    ]},
    'DramaCard.tsx': { lang: 'TypeScript JSX', lines: [
      L(1, ['import', k], [' { View, Text, Image } ', t], ['from', k], [" '@tarojs/components'", s]),
      L(2),
      L(3, ['interface', k], [' Props {', t]),
      L(4, ['  title: ', t], ['string', f], [';', t]),
      L(5, ['  cover: ', t], ['string', f], [';', t]),
      L(6, ['  rating: ', t], ['number', f]),
      L(7, ['}', t]),
      L(8),
      L(9, ['export default', k], [' function', k], [' DramaCard', f], ['({ title, cover, rating }: Props) {', t]),
      L(10, ['  ', ''], ['return', k], [' (', t]),
      L(11, ['    ', ''], ['<View', x], [' className=', t], ['"drama-card"', s], ['>', x]),
      L(12, ['      ', ''], ['<Image', x], [' src={cover} mode=', t], ['"aspectFill"', s], [' />', x]),
      L(13, ['      ', ''], ['<Text', x], [' className=', t], ['"title"', s], ['>', x], ['{title}', n], ['</Text>', x]),
      L(14, ['      ', ''], ['<Text', x], [' className=', t], ['"rating"', s], ['>', x], ['{rating}分', n], ['</Text>', x]),
      L(15, ['    ', ''], ['</View>', x]),
      L(16, ['  )', t]),
      L(17, ['}', t]),
    ]},
    'request.ts': { lang: 'TypeScript', lines: [
      L(1, ['export const', k], [' BASE_URL ', t], ['=', p], [" 'https://api.identity-v.example.com'", s]),
      L(2),
      L(3, ['export function', k], [' getToken', f], ['(): ', t], ['string', f], [' | ', t], ['null', n], [' {', t]),
      L(4, ['  ', ''], ['return', k], [' Taro.getStorageSync(', t], ["'token'", s], [')', t]),
      L(5, ['}', t]),
    ]},
    'chat.ts': { lang: 'TypeScript', lines: [
      L(1, ['import', k], [' Taro ', t], ['from', k], [" '@tarojs/taro'", s]),
      L(2, ['import', k], [' { BASE_URL } ', t], ['from', k], [" './request'", s]),
      L(3),
      L(4, ['export const', k], [' sendMessage ', f], ['= ', p], ['async', k], [' (msg: ', t], ['string', f], [', sessionId: ', t], ['string', f], [') => {', t]),
      L(5, ['  ', ''], ['const', k], [' res ', t], ['=', p], [' await', k], [' Taro.request({', t]),
      L(6, ['    url: ', t], ['`${BASE_URL}/api/chat`', s], [',', t]),
      L(7, ['    method: ', t], ["'POST'", s], [',', t]),
      L(8, ['    data: { message: msg, session_id: sessionId },', t]),
      L(9, ['  })', t]),
      L(10, ['  ', ''], ['return', k], [' res.data', t]),
      L(11, ['}', t]),
    ]},
    'index.ts': { lang: 'TypeScript', lines: [
      L(1, ['// Store 入口', c]),
      L(2, ['export', k], [' { ', t], ['default', k], [' as useUserStore }', t], [' from', k], [" './user'", s]),
      L(3, ['export', k], [' { ', t], ['default', k], [' as useChatStore }', t], [' from', k], [" './chat'", s]),
    ]},
    'user.ts': { lang: 'TypeScript', lines: [
      L(1, ['import', k], [' { create } ', t], ['from', k], [" 'zustand'", s]),
      L(2),
      L(3, ['interface', k], [' UserState {', t]),
      L(4, ['  nickname: ', t], ['string', f]),
      L(5, ['  avatar: ', t], ['string', f]),
      L(6, ['  setUser: (n: ', t], ['string', f], [', a: ', t], ['string', f], [') => ', t], ['void', f]),
      L(7, ['}', t]),
      L(8),
      L(9, ['export default', k], [' create<UserState>((set) ', p], ['=> ({', t]),
      L(10, ['  nickname: ', t], ["'求生者'", s], [',', t]),
      L(11, ['  avatar: ', t], ["''", s], [',', t]),
      L(12, ['  setUser: (n, a) ', p], ['=> set({ nickname: n, avatar: a }),', t]),
      L(13, ['}))', t]),
    ]},
    'format.ts': { lang: 'TypeScript', lines: [
      L(1, ['export function', k], [' formatTime', f], ['(date: ', t], ['Date', f], ['): ', t], ['string', f], [' {', t]),
      L(2, ['  ', ''], ['const', k], [' h ', t], ['=', p], [' date.getHours().toString().padStart(', t], ['2', n], [", '0')", t]),
      L(3, ['  ', ''], ['const', k], [' m ', t], ['=', p], [' date.getMinutes().toString().padStart(', t], ['2', n], [", '0')", t]),
      L(4, ['  ', ''], ['return', k], [' `${h}:${m}`', s]),
      L(5, ['}', t]),
    ]},
    'auth.ts': { lang: 'TypeScript', lines: [
      L(1, ['import', k], [' Taro ', t], ['from', k], [" '@tarojs/taro'", s]),
      L(2),
      L(3, ['export function', k], [' isLoggedIn', f], ['(): ', t], ['boolean', f], [' {', t]),
      L(4, ['  ', ''], ['return', k], [' !!Taro.getStorageSync(', t], ["'token'", s], [')', t]),
      L(5, ['}', t]),
      L(6),
      L(7, ['export function', k], [' login', f], ['(code: ', t], ['string', f], [') {', t]),
      L(8, ['  ', ''], ['return', k], [' Taro.request({', t]),
      L(9, ['    url: ', t], ["'https://api.identity-v.example.com/auth/login'", s], [',', t]),
      L(10, ['    method: ', t], ["'POST'", s], [',', t]),
      L(11, ['    data: { code },', t]),
      L(12, ['  })', t]),
      L(13, ['}', t]),
    ]},
    'result.tsx': { lang: 'TypeScript JSX', lines: [
      L(1, ['import', k], [' { View, Text } ', t], ['from', k], [" '@tarojs/components'", s]),
      L(2, ['import', k], [' DramaCard ', t], ['from', k], [" '../../components/DramaCard'", s]),
      L(3),
      L(4, ['export default', k], [' function', k], [' TarotResult', f], ['() {', t]),
      L(5, ['  ', ''], ['const', k], [' dramas ', t], ['=', p], [' [', t]),
      L(6, ['    { title: ', t], ["'倾心之恋'", s], [', cover: ', t], ["'/img/d1.jpg'", s], [', rating: ', t], ['9.2', n], [' },', t]),
      L(7, ['    { title: ', t], ["'月下追逐'", s], [', cover: ', t], ["'/img/d2.jpg'", s], [', rating: ', t], ['8.8', n], [' },', t]),
      L(8, ['  ]', t]),
      L(9),
      L(10, ['  ', ''], ['return', k], [' (', t]),
      L(11, ['    ', ''], ['<View', x], ['>', x]),
      L(12, ['      ', ''], ['<Text', x], [' className=', t], ['"heading"', s], ['>', x], ['为你推荐', t], ['</Text>', x]),
      L(13, ['      {dramas.map(d ', p], ['=> ', t], ['<DramaCard', x], [' key={d.title} {...d} />', t], [')}', t]),
      L(14, ['    ', ''], ['</View>', x]),
      L(15, ['  )', t]),
      L(16, ['}', t]),
    ]},
    'style.css': { lang: 'CSS', lines: [
      L(1, ['/* 全局样式覆盖 */', c]),
      L(2, [':root', f], [' {', t]),
      L(3, ['  ', ''], ['--bg', k], [': ', t], ['#0a0b0f', s], [';', t]),
      L(4, ['  ', ''], ['--accent', k], [': ', t], ['#e8c97a', s], [';', t]),
      L(5, ['  ', ''], ['--text', k], [': ', t], ['#f0f0f0', s], [';', t]),
      L(6, ['}', t]),
    ]},
    'main.js': { lang: 'JavaScript', lines: [
      L(1, ['// 小程序 webview 桥接', c]),
      L(2, ['document', t], ['.addEventListener(', f], ["'DOMContentLoaded'", s], [', () ', p], ['=> {', t]),
      L(3, ['  console.log(', t], ["'WebView bridge ready'", s], [')', t]),
      L(4, ['})', t]),
    ]},
    'index.html': { lang: 'HTML', lines: [
      L(1, ['<!DOCTYPE html>', k]),
      L(2, ['<html', x], [' lang=', t], ['"zh-CN"', s], ['>', x]),
      L(3, ['<head>', x]),
      L(4, ['  ', ''], ['<meta', x], [' charset=', t], ['"UTF-8"', s], [' />', x]),
      L(5, ['  ', ''], ['<title>', x], ['第五人格小程序', t], ['</title>', x]),
      L(6, ['  ', ''], ['<link', x], [' rel=', t], ['"stylesheet"', s], [' href=', t], ['"./style.css"', s], [' />', x]),
      L(7, ['</head>', x]),
      L(8, ['<body>', x]),
      L(9, ['  ', ''], ['<div', x], [' id=', t], ['"app"', s], ['>', x], ['</div>', x]),
      L(10, ['  ', ''], ['<script', x], [' src=', t], ['"./main.js"', s], ['>', x], ['</script>', x]),
      L(11, ['</body>', x]),
      L(12, ['</html>', x]),
    ]},
    'chat.html': { lang: 'HTML', lines: [
      L(1, ['<!DOCTYPE html>', k]),
      L(2, ['<html', x], [' lang=', t], ['"zh-CN"', s], ['>', x]),
      L(3, ['<head>', x]),
      L(4, ['  ', ''], ['<meta', x], [' charset=', t], ['"UTF-8"', s], [' />', x]),
      L(5, ['  ', ''], ['<title>', x], ['对话', t], ['</title>', x]),
      L(6, ['</head>', x]),
      L(7, ['<body>', x]),
      L(8, ['  ', ''], ['<div', x], [' id=', t], ['"chat-root"', s], ['>', x], ['</div>', x]),
      L(9, ['</body>', x]),
      L(10, ['</html>', x]),
    ]},
    'logo.png': { lang: 'Image', lines: [
      L(1, ['// [二进制图片文件 — 128×128 PNG]', c]),
    ]},
    'tarot-bg.png': { lang: 'Image', lines: [
      L(1, ['// [二进制图片文件 — 750×400 背景图]', c]),
    ]},
    '.env': { lang: 'Environment', lines: [
      L(1, ['SECRET_KEY', f], ['=', p], ['my-super-secret-key-2024', t]),
      L(2, ['API_BASE_URL', f], ['=', p], ['https://api.identity-v.example.com', t]),
      L(3, ['MONGO_URI', f], ['=', p], ['mongodb+srv://admin:****@cluster0.mongodb.net/identity-v', t]),
    ]},
    'requirements.txt': { lang: 'Text', lines: [
      L(1, ['@tarojs/cli@4.0.0', t]),
      L(2, ['@tarojs/components@4.0.0', t]),
      L(3, ['@tarojs/taro@4.0.0', t]),
      L(4, ['react@18.3.1', t]),
      L(5, ['zustand@5.0.0', t]),
    ]},
    'soul.md': { lang: 'Markdown', lines: [
      L(1, ['# soul.md', f]),
      L(2),
      L(3, ['## AI 分身 · 约瑟夫', f]),
      L(4),
      L(5, ['- ', p], ['world_id: ', t], ['identity-v', s]),
      L(6, ['- ', p], ['role: ', t], ['庄园宫廷摄影师', s]),
      L(7, ['- ', p], ['tone: ', t], ['慢 · 稳 · 旧时代礼节', s]),
      L(8),
      L(9, ['他习惯先把人与事放进取景框里端详，再开口。', t]),
      L(10, ['相信"快门按下的那一瞬间，一个人就被定住了"。', t]),
      L(11, ['对同伴保持彬彬有礼的距离，对庄园怀有艺术家式的执拗。', t]),
      L(12),
      L(13, ['## 主玩法 · 今日塔罗', f]),
      L(14),
      L(15, ['塔罗以照片作牌面，围绕 ', t], ['Past / Now / Next', k], [' 三张显影：', t]),
      L(16),
      L(17, ['- ', p], ['Past ', k], ['— 被雾气封存的过往', t]),
      L(18, ['- ', p], ['Now ', k], ['— 当下你站着的那格光圈', t]),
      L(19, ['- ', p], ['Next ', k], ['— 下一帧里等你按下快门的人', t]),
      L(20),
      L(21, ['### 抽卡流程', f]),
      L(22),
      L(23, ['1. ', p], ['进入主页 → 三张牌背朝上叠在一起', t]),
      L(24, ['2. ', p], ['点击任一张 → 三张散开，被点中那张翻面', t]),
      L(25, ['3. ', p], ['继续点未翻开的 → 全部显影后解锁运势详解', t]),
      L(26, ['4. ', p], ['重新抽卡 → 牌序打乱，回到背面堆叠态', t]),
      L(27),
      L(28, ['## 资产绑定', f]),
      L(29),
      L(30, ['- ', p], ['牌面 ← ', t], ['AI 分身 gallery（设定集）', s]),
      L(31, ['- ', p], ['场景 ← ', t], ['/场景/约瑟夫暗房.png', s]),
      L(32, ['- ', p], ['重置动效 ← ', t], ['手机左上"重新加载"按钮', s]),
    ]},
  }

  /* preview filter */
  const [activeFilter, setActiveFilter] = useState('mini-program')
  /* Project/session rename — pencil icons flip these flags, the paired
   * span is replaced with an input, save on Enter/blur. */
  const [projectTitle, setProjectTitle] = useState('第五人格塔罗小程序')
  const [editingProjectTitle, setEditingProjectTitle] = useState(false)
  /* Which session row (if any) is in inline-edit mode inside the dropdown. */
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const renameSession = (id: string, name: string) =>
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
  const filters = [
    { label: '小程序', value: 'mini-program' },
    { label: 'AI分身', value: 'ai-avatar' },
    { label: '小花技能', value: 'xiaohua' },
  ]

  /* console */
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [consoleHeight, setConsoleHeight] = useState(220)
  const consoleDragRef = useRef<{ startY: number; startHeight: number } | null>(null)

  const onConsoleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    consoleDragRef.current = { startY: e.clientY, startHeight: consoleHeight }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onConsoleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = consoleDragRef.current
    if (!s) return
    const next = Math.min(
      Math.max(80, s.startHeight - (e.clientY - s.startY)),
      600
    )
    setConsoleHeight(next)
  }
  const onConsoleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    consoleDragRef.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }

  const consoleLines = [
    { kind: 'cmd', text: '$ npm run dev' },
    { kind: 'log', text: '' },
    { kind: 'info', text: '> identity-v-miniapp@1.0.0 dev' },
    { kind: 'info', text: '> taro build --type weapp --watch' },
    { kind: 'log', text: '' },
    { kind: 'log', text: '👽 Taro v4.0.0' },
    { kind: 'log', text: '' },
    { kind: 'info', text: 'ℹ Compiling for platform weapp...' },
    { kind: 'log', text: 'Compiled successfully in 2847ms' },
    { kind: 'log', text: '' },
    { kind: 'success', text: '✔ Built pages/index/index' },
    { kind: 'success', text: '✔ Built pages/chat/index' },
    { kind: 'success', text: '✔ Built pages/profile/index' },
    { kind: 'success', text: '✔ Built pages/tarot/index' },
    { kind: 'success', text: '✔ Built pages/tarot/result' },
    { kind: 'log', text: '' },
    { kind: 'info', text: 'ℹ Watching for file changes...' },
    { kind: 'log', text: '' },
    { kind: 'warn', text: '⚠ [WARN] pages/index/index.tsx: Image component missing alt prop (line 18)' },
    { kind: 'log', text: '' },
    { kind: 'info', text: '[HMR] src/pages/index/index.tsx changed, rebuilding...' },
    { kind: 'success', text: '✔ Rebuild completed in 340ms' },
    { kind: 'log', text: '' },
    { kind: 'cmd', text: '  Local:   http://localhost:10086/' },
    { kind: 'info', text: '  Network: http://192.168.1.42:10086/' },
  ]

  /* ─── Render ─── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 flex min-h-0 flex-col overflow-hidden bg-[var(--color-surface-1)] font-[var(--font-sans)] text-[var(--color-ink)]"
    >
      {/* ── Platform layout: project sidebar on the far left. Width is
           user-draggable via the right-edge handle; collapse is toggled
           via the PanelLeft button in the brand header. ── */}
      {isPlatform && !sidebarCollapsed && (
        <div
          className="fixed inset-y-0 left-0 z-40"
          style={{ width: platformSidebarWidth }}
        >
          <PlatformSidebar
            fileTree={fileTree}
            expandedDirs={expandedDirs}
            toggleDir={toggleDir}
            openFileInTab={openFileInTab}
            onCollapse={() => setSidebarCollapsed(true)}
            onNewProject={handleNewProject}
            openProjects={platformOpenProjects}
            setOpenProjects={setPlatformOpenProjects}
            onSwitchProject={(name) => {
              // Switch the right-side workspace to the clicked project.
              // Drops the existing chat and lands the user in a fresh
              // session scoped to the new project.
              setProjectTitle(name)
              handleNewSession()
              setPlatformHomeOpen(false)
            }}
            onCollapseAll={() => {
              // Fold every open folder + project down to the root level.
              setExpandedDirs(new Set())
              setPlatformOpenProjects(new Set())
            }}
          />
          {/* Right-edge drag handle */}
          <div
            role="separator"
            aria-orientation="vertical"
            onPointerDown={onSidebarDragStart}
            onPointerMove={onSidebarDragMove}
            onPointerUp={onSidebarDragEnd}
            onPointerCancel={onSidebarDragEnd}
            className="group absolute right-0 top-0 bottom-0 z-10 w-1 translate-x-1/2 cursor-col-resize touch-none select-none"
          >
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-[var(--color-ink)]/20 group-active:bg-[var(--color-ink)]/30" />
          </div>
        </div>
      )}

      {/* ── Platform layout: shared white card frame behind chat + preview.
           Lives below body content (z) so chat aside (z-30) and preview
           (inside body z-10) paint on top. Provides rounded/ring/bg so the
           two columns read as a single card split by chat's border-r. ── */}
      {isPlatform && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[5] top-3 bottom-3 right-3 rounded-[16px] bg-[var(--color-surface-0)]"
          style={{ left: effectiveSidebarWidth }}
        />
      )}

      {/* ── Ambient glow derived from the preview product (persona portrait) —
           hidden in code/platform layouts so the page reads flat. ── */}
      {layout !== 'code' && !isPlatform && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[55%]"
            style={{
              background: `
                radial-gradient(120% 90% at 20% 0%, ${rgbString(c1, 0.28)} 0%, ${rgbString(c1, 0)} 65%),
                radial-gradient(95% 85% at 85% 0%, ${rgbString(c2, 0.3)} 0%, ${rgbString(c2, 0)} 60%),
                radial-gradient(60% 60% at 55% 0%, ${rgbString(c1, 0.16)} 0%, ${rgbString(c1, 0)} 70%)
              `,
              filter: 'blur(32px)',
              opacity: 0.75,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 top-[30%] z-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,21,23,0) 0%, rgba(20,21,23,0.85) 45%, rgba(20,21,23,1) 100%)',
            }}
          />
        </>
      )}

      {/* ══════ Header ══════ Platform: fixed as the card's top strip (no
          back / publish). Others: normal in-flow top bar. Hidden on the
          platform home screen since a new project has no title yet. */}
      {!(isPlatform && platformHomeOpen) && (
      <header
        className={`z-20 flex items-center justify-between px-4 transition-[margin] duration-300 ${
          isPlatform
            ? 'fixed top-3 right-3 h-[44px] rounded-t-[16px] border-b border-[var(--divider-soft)]'
            : `relative h-14 shrink-0 ${
                chatOnLeft ? '' : 'border-b border-[var(--divider-soft)]'
              } ${chatCollapsed ? '' : headerMarginClass}`
        }`}
        style={isPlatform ? { left: effectiveSidebarWidth } : undefined}
      >
        <div className="flex items-center gap-3">
          {!isPlatform && (
            <GlassIconButton onClick={handleBack} aria-label="返回" tone={80}>
              <ArrowLeft size={15} strokeWidth={1.8} />
            </GlassIconButton>
          )}
          {/* Platform + sidebar collapsed: relocate the brand SVG and an
               expand button into the card's top-left header. */}
          {isPlatform && sidebarCollapsed && (
            <>
              <svg
                width="108"
                height="20"
                viewBox="0 0 108 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="抖音AI工坊"
                className="h-5 shrink-0 text-[var(--color-ink)]"
              >
                <path d="M38.2988 10.9897L40.0596 10.7847V12.4634L38.2988 12.6665V16.8335H36.3779V12.8882L30.3809 13.5874L30.3613 13.4634L30.1465 12.0415L30.126 11.9077L30.2607 11.8921L36.3779 11.1929V1.64209H38.2988V10.9897ZM28.7246 4.55615H30.4844V6.18408H28.7275V8.77783L30.4531 8.48877V10.1499L30.3467 10.1694L28.7275 10.4741V14.7935L28.7256 14.9019C28.7078 15.4348 28.5558 15.8628 28.25 16.1714C27.9454 16.4787 27.505 16.6505 26.9443 16.7056L26.8311 16.7153C26.3383 16.7484 25.8186 16.7164 25.3203 16.6226L25.2393 16.6069L25.2188 16.5288L24.7998 15.0112L25 15.0425C25.4484 15.113 25.8902 15.1331 26.3213 15.104H26.3223L26.3779 15.0991C26.5072 15.0801 26.6311 15.0235 26.7256 14.9302C26.8318 14.8251 26.9092 14.6651 26.9092 14.436V10.8052L24.9121 11.1646L24.8896 11.0347L24.624 9.45068L26.9072 9.07764V6.18408H25.0371L24.8789 4.55615H26.9072V1.64209H28.7246V4.55615ZM53.8545 9.17334C54.2638 9.17335 54.5961 9.2745 54.8252 9.49756C55.055 9.72132 55.1591 10.047 55.1592 10.4478V15.1675L55.1543 15.3159C55.1318 15.6526 55.0295 15.9263 54.8291 16.1216C54.6007 16.3441 54.2682 16.4419 53.8545 16.4419H43.7979C43.3804 16.4419 43.0471 16.3473 42.8193 16.1255C42.6194 15.9308 42.5189 15.6562 42.4971 15.3169L42.4922 15.1675V10.4478C42.4922 10.0429 42.5933 9.71674 42.8223 9.49365C43.0507 9.27119 43.3841 9.17334 43.7979 9.17334H53.8545ZM69.1914 16.0386L69.25 16.2114H66.9404L66.9111 16.1206L65.8965 12.9067H60.4844L59.4893 16.1196L59.4609 16.2114H57.1523L61.916 2.54932H64.582L69.1914 16.0386ZM73.334 16.2114H71.2588V2.54932H73.334V16.2114ZM44.4121 14.5542L44.4141 14.5894C44.4297 14.7624 44.5599 14.8823 44.7461 14.8823H52.9053L52.9414 14.8804C53.1198 14.8648 53.2382 14.7343 53.2383 14.5542V13.4771H44.4121V14.5542ZM44.7461 10.7329C44.5563 10.7329 44.4122 10.8768 44.4121 11.0601V12.0698H53.2383V11.0601L53.2373 11.0259C53.2217 10.8703 53.1008 10.7494 52.9404 10.7339L52.9053 10.7329H44.7461ZM61.0273 11.0854H65.373L63.2109 4.17822L61.0273 11.0854ZM31.5537 6.65967C32.545 6.8998 33.9001 7.25577 35.1914 7.69092L35.2803 7.72119V9.61084L35.1064 9.55127C33.8189 9.10842 32.4689 8.73964 31.4912 8.4917L31.3926 8.46729V6.62061L31.5537 6.65967ZM46.502 6.39697H51.2012L51.666 4.96436H53.667L53.2002 6.39697H56.4531V7.95654H41.3125L41.1533 6.39697H44.5371L44.0703 4.96436H46.0537L46.502 6.39697ZM31.5557 2.79639C32.7638 3.11029 33.9859 3.48432 35.1924 3.90771L35.2803 3.93799V5.77783L35.1064 5.71729C33.9066 5.29997 32.6919 4.93182 31.4912 4.62354L31.3926 4.59912V2.75342L31.5557 2.79639ZM49.7773 2.88623H55.5391V4.4458H42.209L42.0498 2.88623H47.8223V1.64209H49.7773V2.88623Z" fill="currentColor"/>
                <path d="M103.727 3.5804H107.524V5.35142H101.513V7.29273H105.464C105.816 7.29273 106.1 7.40058 106.315 7.61628C106.531 7.83198 106.645 8.12147 106.656 8.48476C106.747 10.7666 106.747 12.9407 106.656 15.0069C106.633 15.4496 106.463 15.8186 106.145 16.1137C105.839 16.3976 105.453 16.5565 104.987 16.5906C103.931 16.6814 102.864 16.6246 101.786 16.4203L101.411 14.6152C102.319 14.8082 103.199 14.8763 104.051 14.8195C104.425 14.7855 104.63 14.5982 104.664 14.2576C104.777 12.7477 104.777 11.1413 104.664 9.43838C104.641 9.18862 104.516 9.06374 104.289 9.06374H101.479C101.4 10.8461 101.07 12.3844 100.491 13.6786C99.8444 15.1317 98.8454 16.3465 97.4944 17.3228L97.0516 15.1942C98.7205 13.6502 99.5265 11.2264 99.4697 7.9228V5.35142H97.7158L97.5455 3.5804H101.684V1.62207H103.727V3.5804ZM95.9107 12.4185L97.6306 12.0438V13.7467L92.3687 15.0409L91.96 13.304L93.9013 12.8782V7.30976H92.2665L92.0962 5.53874H93.9013V1.62207H95.9107V5.53874H97.5114V7.30976H95.9107V12.4185Z" fill="currentColor"/>
                <path d="M84.3308 14.3255H90.6656V16.0965H76.1058L75.9355 14.3255H82.2192V4.84035H76.9402L76.77 3.06934H89.8993V4.84035H84.3308V14.3255Z" fill="currentColor"/>
                <path d="M4.64629 7.23566C4.64629 8.51889 3.6058 9.55933 2.32369 9.55933C1.04046 9.55933 0 8.51889 0 7.23566C0 5.95243 1.04046 4.91309 2.32369 4.91309C3.6058 4.91309 4.64629 5.95243 4.64629 7.23566Z" fill="currentColor"/>
                <path d="M4.64629 11.8569C4.64629 13.1401 3.6058 14.1795 2.32369 14.1795C1.04046 14.1795 0 13.1401 0 11.8569C0 10.5737 1.04046 9.5332 2.32369 9.5332C3.6058 9.5332 4.64629 10.5737 4.64629 11.8569Z" fill="currentColor"/>
                <path d="M6.52691 4.9923C5.61958 5.89963 4.21325 5.96452 3.38648 5.13775C2.55859 4.30986 2.62348 2.90355 3.5308 1.99623C4.43813 1.0889 5.84446 1.02401 6.67123 1.8519C7.49912 2.67867 7.43423 4.08498 6.52691 4.9923Z" fill="currentColor"/>
                <path d="M6.52691 17.0939C5.61958 18.0012 4.21325 18.0661 3.38648 17.2382C2.55859 16.4114 2.62348 15.0051 3.5308 14.0978C4.43813 13.1905 5.84446 13.1256 6.67123 13.9535C7.49912 14.7802 7.43423 16.1865 6.52691 17.0939Z" fill="currentColor"/>
                <path d="M16.2489 6.88788C17.1562 5.98055 18.0344 5.38761 18.2112 5.56438C18.388 5.74114 17.795 6.61938 16.8877 7.52671C15.9804 8.43403 15.1021 9.02586 14.9253 8.85021C14.7497 8.67344 15.3415 7.7952 16.2489 6.88788Z" fill="currentColor"/>
                <path d="M16.3845 11.6724C17.2918 10.7651 18.1096 10.1118 18.2114 10.2136C18.3132 10.3165 17.661 11.1343 16.7536 12.0416C15.8463 12.949 15.0285 13.6012 14.9256 13.4994C14.8238 13.3976 15.4771 12.5798 16.3845 11.6724Z" fill="currentColor"/>
                <path d="M13.0553 2.66021C13.9626 1.75288 15.0602 1.3792 15.5065 1.82447C15.9518 2.27086 15.5782 3.36838 14.6709 4.27571C13.7635 5.18303 12.6671 5.55671 12.2207 5.11032C11.7743 4.66393 12.148 3.56753 13.0553 2.66021Z" fill="currentColor"/>
                <path d="M13.1782 14.8979C14.0855 13.9906 15.1271 13.5621 15.5064 13.9402C15.8845 14.3184 15.456 15.3611 14.5487 16.2684C13.6414 17.1757 12.5987 17.6042 12.2205 17.2261C11.8424 16.8468 12.2709 15.8052 13.1782 14.8979Z" fill="currentColor"/>
                <path d="M8.33898 15.9313C9.2463 15.0239 10.4714 14.7789 11.0755 15.3831C11.6807 15.9872 11.4358 17.2134 10.5285 18.1207C9.62113 19.028 8.39493 19.273 7.79079 18.6689C7.18554 18.0636 7.43166 16.8386 8.33898 15.9313Z" fill="currentColor"/>
                <path d="M8.25097 0.831134C9.15829 -0.0761893 10.4348 -0.270856 11.1027 0.39705C11.7707 1.06496 11.576 2.34147 10.6687 3.2488C9.76135 4.15612 8.48481 4.34967 7.8169 3.68288C7.14899 3.01498 7.34365 1.73846 8.25097 0.831134Z" fill="currentColor"/>
              </svg>
              <button
                onClick={() => setSidebarCollapsed(false)}
                title="展开侧栏"
                className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]/85"
              >
                <PanelLeft size={13} strokeWidth={1.8} />
              </button>
              <div className="mx-1 h-4 w-px bg-[var(--divider)]" />
            </>
          )}
          {editingProjectTitle ? (
            <input
              autoFocus
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => setEditingProjectTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') setEditingProjectTitle(false)
              }}
              className="w-[220px] border-b border-[var(--color-ink)]/40 bg-transparent text-[12px] text-[var(--color-ink)] outline-none focus:border-[var(--color-ink)]"
            />
          ) : (
            <span className="text-[12px] text-[var(--color-ink)]/70">
              {projectTitle}
            </span>
          )}
          <button
            onClick={() => setEditingProjectTitle((v) => !v)}
            title={editingProjectTitle ? '完成' : '重命名项目'}
            className="text-[var(--color-ink)]/65 transition-colors hover:text-[var(--color-ink)]"
          >
            {editingProjectTitle ? <Check size={11} /> : <Pencil size={11} />}
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* ── Layout switcher ── */}
          <div ref={layoutMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setLayoutMenuOpen((v) => !v)}
              title="更多"
              className="flex items-center justify-center rounded-md p-1.5 text-[var(--color-ink)]/90 transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
            >
              <MoreHorizontal size={16} />
            </button>
            {layoutMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-[200px] overflow-hidden rounded-lg border border-[var(--divider)] bg-[var(--color-surface-2)] shadow-[0_20px_50px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--color-ink)]/40">
                  布局
                </div>
                {(
                  [
                    {
                      value: 'workspace' as const,
                      label: '工作区视图',
                      hint: '单视图 / 分屏 tabs',
                      icon: Columns2,
                    },
                    {
                      value: 'code' as const,
                      label: '编辑视图 · 左 chat',
                      hint: '左侧对话 · 文件 · 右侧预览',
                      icon: Code2,
                    },
                    {
                      value: 'editor' as const,
                      label: '编辑视图 · chat 在右',
                      hint: '常驻手机 · 独立文件区',
                      icon: LayoutGrid,
                    },
                    {
                      value: 'platform' as const,
                      label: '平台视图',
                      hint: '多项目目录 · 对话 · 预览 + 控制台',
                      icon: LayoutDashboard,
                    },
                  ]
                ).map((opt) => {
                  const Icon = opt.icon
                  const active = layout === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setLayout(opt.value)
                        setLayoutMenuOpen(false)
                      }}
                      className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                        active
                          ? 'bg-[var(--color-ink)]/[0.06]'
                          : 'hover:bg-[var(--fill-subtle)]'
                      }`}
                    >
                      <Icon size={14} className={`mt-0.5 shrink-0 ${active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink)]/55'}`} />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className={`text-[12px] ${active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink)]/80'}`}>
                          {opt.label}
                          {active && (
                            <span className="ml-1.5 text-[10px] text-[var(--color-ink)]/45">当前</span>
                          )}
                        </span>
                        <span className="text-[10px] text-[var(--color-ink)]/40">
                          {opt.hint}
                        </span>
                      </span>
                    </button>
                  )
                })}
                <div className="mt-1 border-t border-[var(--divider-soft)] px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--color-ink)]/40">
                  外观
                </div>
                {(
                  [
                    { value: 'light' as const, label: '亮色模式', icon: Sun },
                    { value: 'dark' as const, label: '暗色模式', icon: Moon },
                  ]
                ).map((opt) => {
                  const Icon = opt.icon
                  const active = themeMode === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setThemeMode(opt.value)
                        setLayoutMenuOpen(false)
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        active
                          ? 'bg-[var(--color-ink)]/[0.06]'
                          : 'hover:bg-[var(--fill-subtle)]'
                      }`}
                    >
                      <Icon size={14} className={`shrink-0 ${active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink)]/55'}`} />
                      <span className={`text-[12px] ${active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink)]/80'}`}>
                        {opt.label}
                        {active && (
                          <span className="ml-1.5 text-[10px] text-[var(--color-ink)]/45">当前</span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          {[Database, Headphones, Clock].map((Icon, i) => (
            <button
              key={i}
              className="flex items-center justify-center rounded-md p-1.5 text-[var(--color-ink)]/90 transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
            >
              <Icon size={16} />
            </button>
          ))}


          {/* ── 发布（右上角主 CTA） — platform hides it inside the card-top strip ── */}
          {!isPlatform && (
            <button
              type="button"
              onClick={() => {
                resetPublish()
                startPublish('modal')
              }}
              style={{ ['--edge-alpha' as string]: 0.3 }}
              className="glass-edge ml-2 flex items-center gap-2 rounded-full bg-[rgba(28,28,32,0.35)] px-5 py-2 text-[14px] font-medium tracking-[0.55px] uppercase text-[var(--color-ink)]/90 shadow-[0_8px_22px_-8px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all hover:-translate-y-[1px] hover:bg-[rgba(40,40,44,0.45)] hover:text-[var(--color-ink)]"
            >
              <Upload size={14} strokeWidth={2} />
              <span>发布</span>
            </button>
          )}
        </div>
      </header>
      )}

      {/* ══════ Body ══════ Platform pushes content below the fixed
           card-top header strip: 12px card-top + 44px header = 56px (pt-14).
           Left margin for platform tracks the draggable chat width and is
           applied via inline style since Tailwind arbitrary values are
           compile-time. */}
      <div
        className={`relative z-10 flex min-h-0 flex-1 overflow-hidden transition-[margin] duration-300 ${
          chatCollapsed || isPlatform ? '' : bodyMarginClass
        } ${isPlatform && !platformHomeOpen ? 'pt-14' : ''}`}
        style={
          isPlatform
            ? {
                marginLeft:
                  effectiveSidebarWidth + (platformHomeOpen ? 0 : platformChatWidth),
              }
            : undefined
        }
      >
        {/* ────── Chat aside — fixed to viewport. Code: below header, flush left with 20px gutter. Platform: flush against the preview inside the shared card (card frame is painted separately just below). Otherwise: pins top-0 on the right with a rounded glass panel. Hidden when platform home screen is active. ────── */}
        {!(isPlatform && platformHomeOpen) && (
        <aside
          className={`fixed z-30 flex flex-shrink-0 items-center transition-[width] duration-300 ${
            isPlatform
              ? 'top-14 bottom-3 border-r border-[var(--divider-soft)]'
              : chatOnLeft
                ? 'left-5 top-14 bottom-5'
                : 'right-0 top-0 bottom-0'
          } ${
            chatCollapsed
              ? 'w-0 overflow-hidden'
              : isPlatform
                ? ''
                : chatOnLeft
                  ? ''
                  : 'py-3 pr-3'
          }`}
          style={
            chatCollapsed
              ? isPlatform
                ? { left: effectiveSidebarWidth }
                : undefined
              : isPlatform
                ? { width: chatWidthPx, left: effectiveSidebarWidth }
                : { width: chatWidthPx }
          }
        >
          <div
            style={
              chatOnLeft
                ? undefined
                : {
                    ['--edge-alpha' as string]: 0.1,
                    ['--edge-angle' as string]: '135deg',
                  }
            }
            className={`flex h-full w-full min-w-px flex-col overflow-hidden ${
              chatOnLeft
                ? ''
                : 'glass-edge-down rounded-[24px] bg-[rgba(65,65,65,0.2)] shadow-[-16px_0_40px_-20px_rgba(0,0,0,0.3)] backdrop-blur-[32px]'
            }`}
          >
          <div className={`flex h-full min-h-0 flex-col ${isPlatform ? 'px-2 pt-3 pb-2' : chatOnLeft ? '' : 'px-1.5 pt-3 pb-1.5'}`}>
          {/* Chat header — session name dropdown + new session */}
          <div className="flex flex-shrink-0 items-center justify-between px-2.5">
            <div ref={sessionMenuRef} className="relative flex items-center">
              <button
                type="button"
                onClick={() => setSessionMenuOpen((v) => !v)}
                className="flex items-center gap-1 rounded text-[12px] leading-5 text-[var(--color-ink)]/70 transition-colors hover:text-[var(--color-ink)]"
              >
                <span className="max-w-[180px] truncate">
                  {sessions.find((s) => s.id === activeSessionId)?.name ?? '新会话'}
                </span>
                <ChevronDown
                  size={12}
                  className={`shrink-0 transition-transform ${sessionMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {sessionMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] overflow-hidden rounded-lg border border-[var(--divider)] bg-[var(--color-surface-0)] shadow-[0_12px_28px_-8px_rgba(16,18,24,0.2)]">
                  <div className="thin-scroll max-h-[320px] overflow-y-auto py-1">
                    {sessions.map((s) => {
                      const isActive = s.id === activeSessionId
                      const isEditing = editingSessionId === s.id
                      return (
                        <div
                          key={s.id}
                          role="button"
                          onClick={() => {
                            if (isEditing) return
                            if (s.id !== activeSessionId) {
                              setActiveSessionId(s.id)
                              resetChatState()
                            }
                            setSessionMenuOpen(false)
                          }}
                          className={`group flex cursor-pointer items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors ${
                            isActive
                              ? 'bg-[var(--color-ink)]/[0.06] text-[var(--color-ink)]/85'
                              : 'text-[var(--color-ink)]/70 hover:bg-[var(--fill-subtle)]'
                          }`}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              value={s.name}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => renameSession(s.id, e.target.value)}
                              onBlur={() => setEditingSessionId(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') setEditingSessionId(null)
                              }}
                              className="min-w-0 flex-1 border-b border-[var(--color-ink)]/40 bg-transparent text-[12px] text-[var(--color-ink)] outline-none focus:border-[var(--color-ink)]"
                            />
                          ) : (
                            <span className="min-w-0 flex-1 truncate">{s.name}</span>
                          )}
                          {!isEditing && (
                            <span
                              role="button"
                              tabIndex={0}
                              title="重命名"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingSessionId(s.id)
                              }}
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--color-ink)]/40 opacity-0 transition-opacity hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]/80 group-hover:opacity-100"
                            >
                              <Pencil size={11} />
                            </span>
                          )}
                          {isActive && !isEditing && (
                            <Check size={12} className="shrink-0 text-[var(--color-ink)]/60" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              title="新会话"
              onClick={handleNewSession}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-ink)]/65 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
            >
              <MessageSquarePlus size={14} strokeWidth={1.8} />
            </button>
          </div>
          {/* Scrollable messages */}
          <div ref={chatScrollRef} className={`thin-scroll flex-1 overflow-y-auto px-2.5 pt-8 pb-8 ${chatCleared ? '' : 'space-y-6'} ${fadeClassFromEdges(chatScrollEdges)}`}>
            {chatCleared || (!needsFlowActive && !showChatPublish && sentMessages.length === 0) ? (
              <ChatEmptyState onPick={(t) => sendChat(t)} />
            ) : (<>

            {/* ── User-sent messages — always rendered first. Plain
                 messages get a generic AI ack below; trigger-matched
                 messages let needsFlowActive / showChatPublish render
                 their specific response further down. ── */}
            {sentMessages.map((m, i) => (
              <Fragment key={`sent-${i}`}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="flex justify-end"
                >
                  <div className="max-w-[85%] rounded-[8px] rounded-br-none bg-[var(--bubble-me-bg)] px-3 py-2.5 text-[14px] leading-[20px] text-[var(--color-ink)]">
                    {m.text}
                  </div>
                </motion.div>
                {m.trigger === 'none' && (
                  <GenericAiReply text={GENERIC_AI_REPLIES[i % GENERIC_AI_REPLIES.length]} />
                )}
              </Fragment>
            ))}

            {needsFlowActive && (<>

            {/* ── Thinking indicator — shows briefly before AI response
                 1 fades in, so the response feels like it's being typed
                 live rather than popping in whole. Unmounts once faded
                 so it stops eating a `space-y` slot. ── */}
            {needsThinkingVisible && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.25 }}
                className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink)]/45"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -3, 0], opacity: [0.35, 0.85, 0.35] }}
                    transition={{ duration: 0.9, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                    className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]"
                  />
                ))}
                <span className="ml-1">AI 正在思考</span>
              </motion.div>
            )}

            {/* ── AI response 1 ── */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2.5"
            >
              {/* status */}
              <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.25 }}
                onClick={() => setTask1Open(!task1Open)}
                className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink)]/50"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>已梳理需求，耗时 2.8s</span>
                {task1Open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </motion.button>

              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.25 }}
                className="text-[14px] leading-[20px] text-[var(--color-ink)]"
              >
                好，先对齐几个关键信息，我一步步帮你搭出来
              </motion.p>

              {/* form card — cascading: step 2 & 3 unlock based on previous answers */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl bg-[var(--chat-form-bg)] p-3 space-y-5"
              >
                {/* step 1 — 发布场景. Locks once step 2 has been answered
                     (appType is set) — at that point the pick is baked in,
                     and the user must hit "重新选择" to change it. */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-ink)]/75">
                    <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-0)] px-1 text-[10px] font-medium text-[var(--color-ink)]/70">1</span>
                    发布到哪个抖音场景？
                    {Boolean(appType) && <CheckCircle2 size={12} className="text-emerald-400" />}
                  </div>
                  <RadioGroup
                    options={[
                      { label: 'Feed 主信息流', value: 'feed' },
                      { label: '评论区 / 直播间', value: 'comment-live' },
                      { label: '私信群聊', value: 'private' },
                      { label: '先不定', value: 'later' },
                    ]}
                    selected={scene}
                    locked={Boolean(appType)}
                    onChange={(v) => {
                      setScene(v)
                      // Reset later steps when upstream changes.
                      setAppType('')
                      setFormSubmitted(false)
                    }}
                  />
                </div>

                {/* step 2 — 应用形态 (unlocks after step 1). Locks once
                     step 3 has started loading / been reached. */}
                {scene && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-ink)]/75">
                      <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-0)] px-1 text-[10px] font-medium text-[var(--color-ink)]/70">2</span>
                      这次想做成什么形态？
                      {capabilitiesStep !== 'idle' && <CheckCircle2 size={12} className="text-emerald-400" />}
                    </div>
                    <RadioGroup
                      options={[
                        { label: '抖音小程序', value: 'mini-program' },
                        { label: 'AI 分身', value: 'ai-avatar' },
                        { label: '小花技能', value: 'xiaohua' },
                      ]}
                      selected={appType}
                      locked={capabilitiesStep !== 'idle'}
                      onChange={(v) => {
                        setAppType(v)
                        setFormSubmitted(false)
                      }}
                    />
                  </div>
                )}

                {/* step 3 — 推荐能力. Driven by `capabilitiesStep`:
                     • 'loading' → thinking dots "系统在分析可推荐的能力…"
                     • 'ready'   → pills + 确认能力 button
                     • 'confirmed' → pills (still editable) + ✓ indicator,
                                     step 4 loading kicks off automatically. */}
                {appType && capabilitiesStep !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-ink)]/75">
                      <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-0)] px-1 text-[10px] font-medium text-[var(--color-ink)]/70">3</span>
                      <span>引入能力</span>
                      {capabilitiesStep === 'confirmed' && (
                        <CheckCircle2 size={12} className="text-emerald-400" />
                      )}
                    </div>
                    {capabilitiesStep === 'loading' ? (
                      <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink)]/45">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ y: [0, -3, 0], opacity: [0.35, 0.85, 0.35] }}
                            transition={{ duration: 0.9, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                            className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]"
                          />
                        ))}
                        <span className="ml-1">正在分析可推荐的能力…</span>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-2"
                      >
                        <p className="text-[11.5px] leading-[1.6] text-[var(--color-ink)]/55">
                          根据需求推荐引入，后续可在项目目录里维护
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {CAPABILITY_OPTIONS.map((cap) => {
                            const on = enabledCapabilities.has(cap.id)
                            const locked = capabilitiesStep === 'confirmed'
                            if (locked && !on) return null
                            const toggle = () => {
                              setEnabledCapabilities((prev) => {
                                const next = new Set(prev)
                                if (next.has(cap.id)) next.delete(cap.id)
                                else next.add(cap.id)
                                return next
                              })
                              setFormSubmitted(false)
                            }
                            return (
                              <button
                                key={cap.id}
                                type="button"
                                disabled={locked}
                                onClick={toggle}
                                className={`flex items-start gap-2.5 rounded-lg bg-[var(--color-surface-0)] p-2.5 text-left ring-1 transition-all ${
                                  on
                                    ? 'ring-[var(--color-ink)]/15 shadow-[0_1px_2px_rgba(16,18,24,0.04)]'
                                    : 'opacity-65 ring-[var(--color-ink)]/8'
                                } ${locked ? 'cursor-default' : 'hover:ring-[var(--color-ink)]/25'}`}
                              >
                                <div
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-opacity ${
                                    cap.kind === 'knowledge'
                                      ? 'bg-sky-500/10 text-sky-500'
                                      : 'bg-violet-500/10 text-violet-500'
                                  }`}
                                >
                                  {cap.kind === 'knowledge' ? (
                                    <Database size={12} strokeWidth={1.8} />
                                  ) : (
                                    <WandSparkles size={12} strokeWidth={1.8} />
                                  )}
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className={`truncate text-[12.5px] ${
                                        on
                                          ? 'font-semibold text-[var(--color-ink)]'
                                          : 'font-medium text-[var(--color-ink)]/70'
                                      }`}
                                    >
                                      {cap.title}
                                    </span>
                                    <span
                                      aria-hidden
                                      className={`flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full transition-colors ${
                                        on
                                          ? 'bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                                          : 'ring-1 ring-[var(--color-ink)]/25'
                                      }`}
                                    >
                                      {on && <Check size={9} strokeWidth={3} />}
                                    </span>
                                  </div>
                                  <p className="truncate text-[11px] leading-[1.5] text-[var(--color-ink)]/55">
                                    {cap.description}
                                  </p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        {capabilitiesStep === 'ready' && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCapabilitiesStep('confirmed')}
                              className="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-ink-contrast)] shadow-[0_4px_12px_-4px_rgba(16,18,24,0.25)] transition-opacity hover:opacity-90"
                            >
                              确认引入
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // Back to step 2 — wipe appType so the
                                // effect re-runs when it's picked again.
                                setAppType('')
                              }}
                              className="ml-1 rounded-lg px-2 py-1.5 text-[12px] text-[var(--color-ink)]/50 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]/85"
                            >
                              上一步
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* step 4 — 用户标签. Same state machine as step 3,
                     only revealed once step 3 is confirmed. */}
                {appType && tagsStep !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-ink)]/75">
                      <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-0)] px-1 text-[10px] font-medium text-[var(--color-ink)]/70">4</span>
                      <span>选择用户标签</span>
                      {tagsStep === 'confirmed' && (
                        <CheckCircle2 size={12} className="text-emerald-400" />
                      )}
                    </div>
                    {tagsStep === 'loading' ? (
                      <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink)]/45">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ y: [0, -3, 0], opacity: [0.35, 0.85, 0.35] }}
                            transition={{ duration: 0.9, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                            className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]"
                          />
                        ))}
                        <span className="ml-1">正在分析可推荐的用户标签…</span>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-2"
                      >
                        <p className="text-[11.5px] leading-[1.6] text-[var(--color-ink)]/55">
                          根据需求推荐以下标签（建议 3–5 个）
                        </p>
                        {(() => {
                          const locked = tagsStep === 'confirmed'
                          // Selected tags kept in recommended-first order,
                          // frozen on first render and never reshuffled.
                          const ordered = [...TAG_OPTIONS].sort((a, b) => {
                            const aRec = RECOMMENDED_TAGS.has(a.id) ? 0 : 1
                            const bRec = RECOMMENDED_TAGS.has(b.id) ? 0 : 1
                            return aRec - bRec
                          })
                          const selected = ordered.filter((t) => personalizationTags.has(t.id))
                          const remaining = ordered.filter((t) => !personalizationTags.has(t.id))
                          const removeTag = (id: string) => {
                            setPersonalizationTags((prev) => {
                              const next = new Set(prev)
                              next.delete(id)
                              return next
                            })
                            setFormSubmitted(false)
                          }
                          const addTag = (id: string) => {
                            setPersonalizationTags((prev) => {
                              const next = new Set(prev)
                              next.add(id)
                              return next
                            })
                            setFormSubmitted(false)
                          }
                          return (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                {selected.map((t) => (
                                  <div key={t.id} className="group relative">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full bg-[var(--chat-form-option-bg)] py-1.5 pl-3 text-[13px] font-medium text-[var(--color-ink)] shadow-[0_1px_2px_rgba(16,18,24,0.04)] ${
                                        locked ? 'pr-3' : 'pr-1.5'
                                      }`}
                                    >
                                      {t.label}
                                      {!locked && (
                                        <button
                                          type="button"
                                          onClick={() => removeTag(t.id)}
                                          aria-label={`删除 ${t.label}`}
                                          className="flex h-4 w-4 items-center justify-center rounded-full text-[var(--color-ink)]/40 transition-colors hover:bg-[var(--color-ink)]/[0.08] hover:text-[var(--color-ink)]/85"
                                        >
                                          <X size={10} strokeWidth={2.2} />
                                        </button>
                                      )}
                                    </span>
                                    <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 w-[200px] translate-y-1 rounded-lg border border-[var(--divider)] bg-[var(--color-surface-2)] px-2.5 py-2 text-left text-[11.5px] leading-[1.5] text-[var(--color-ink)]/75 opacity-0 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.55)] transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
                                      {t.hint}
                                    </div>
                                  </div>
                                ))}
                                {!locked && remaining.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setTagsAddOpen((v) => !v)}
                                    className={`inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1.5 text-[12px] transition-colors ${
                                      tagsAddOpen
                                        ? 'border-[var(--color-ink)]/35 bg-[var(--color-surface-0)] text-[var(--color-ink)]/85'
                                        : 'border-[var(--color-ink)]/20 bg-transparent text-[var(--color-ink)]/55 hover:border-[var(--color-ink)]/35 hover:text-[var(--color-ink)]/80'
                                    }`}
                                  >
                                    <Plus size={11} strokeWidth={2.2} />
                                    手动添加
                                  </button>
                                )}
                                {selected.length === 0 && locked && (
                                  <span className="text-[12px] text-[var(--color-ink)]/45">
                                    未选择标签
                                  </span>
                                )}
                              </div>
                              {!locked && tagsAddOpen && remaining.length > 0 && (
                                <div className="rounded-lg bg-[var(--color-surface-0)]/60 p-2.5 ring-1 ring-[var(--color-ink)]/10">
                                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-[var(--color-ink)]/55">
                                    <span>点击添加</span>
                                    <button
                                      type="button"
                                      onClick={() => setTagsAddOpen(false)}
                                      className="rounded p-0.5 text-[var(--color-ink)]/40 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]/75"
                                    >
                                      <X size={11} />
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {remaining.map((t) => (
                                      <div key={t.id} className="group relative">
                                        <button
                                          type="button"
                                          onClick={() => addTag(t.id)}
                                          className="inline-flex items-center gap-1 rounded-full bg-[var(--chat-form-option-bg)] px-3 py-1.5 text-[13px] text-[var(--color-ink)]/60 transition-colors hover:text-[var(--color-ink)]"
                                        >
                                          <Plus size={10} strokeWidth={2.2} className="text-[var(--color-ink)]/45" />
                                          {t.label}
                                        </button>
                                        <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 w-[200px] translate-y-1 rounded-lg border border-[var(--divider)] bg-[var(--color-surface-2)] px-2.5 py-2 text-left text-[11.5px] leading-[1.5] text-[var(--color-ink)]/75 opacity-0 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.55)] transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
                                          {t.hint}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )
                        })()}
                        {tagsStep === 'ready' && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setTagsStep('confirmed')}
                              className="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-ink-contrast)] shadow-[0_4px_12px_-4px_rgba(16,18,24,0.25)] transition-opacity hover:opacity-90"
                            >
                              确认用户标签
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // Back to step 3 — reopen the capability
                                // cards and collapse this step's state.
                                setCapabilitiesStep('ready')
                                setTagsStep('idle')
                                setTagsAddOpen(false)
                              }}
                              className="ml-1 rounded-lg px-2 py-1.5 text-[12px] text-[var(--color-ink)]/50 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]/85"
                            >
                              上一步
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}

                {tagsStep === 'confirmed' && !formSubmitted && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFormSubmitted(true)
                        // Reveal the newly-scaffolded .agent/skills tree so the
                        // user can see the capabilities were wired up.
                        setExpandedDirs((prev) => {
                          const next = new Set(prev)
                          next.add('.agent')
                          next.add('.agent/skills')
                          for (const c of CAPABILITY_OPTIONS) {
                            if (enabledCapabilities.has(c.id)) {
                              next.add(`.agent/skills/${c.folderName}`)
                            }
                          }
                          return next
                        })
                        setFileTreeOpen(true)
                        // Scroll the chat to the bottom once the new messages
                        // (confirm bubble + AI response 2) render + finish
                        // their staggered entrance animation (~650ms delay).
                        requestAnimationFrame(() => {
                          const el = chatScrollRef.current
                          if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
                        })
                        setTimeout(() => {
                          const el = chatScrollRef.current
                          if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
                        }, 700)
                      }}
                      className="flex-1 rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-ink-contrast)] shadow-[0_4px_12px_-4px_rgba(16,18,24,0.25)] transition-opacity hover:opacity-90"
                    >
                      确认创建
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Reset the whole form back to step 1 so the user can
                        // redo scene / appType / capabilities / tags from scratch.
                        setScene('')
                        setAppType('')
                        setEnabledCapabilities(new Set())
                        setPersonalizationTags(new Set())
                        setCapabilitiesStep('idle')
                        setTagsStep('idle')
                        setTagsAddOpen(false)
                        setFormSubmitted(false)
                      }}
                      className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]/85"
                    >
                      重选
                    </button>
                  </div>
                )}
              </motion.div>

              {/* action icons */}
              <div className="flex items-center gap-2 pt-0.5">
                {[Copy, RefreshCw].map((Icon, i) => (
                  <button
                    key={i}
                    className="rounded-md p-1 text-[var(--color-ink)]/30 transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]/60"
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ── User message 2 (only appears after the form is submitted) ── */}
            {formSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-end"
            >
              <div className="max-w-[85%] rounded-[8px] rounded-br-none bg-[var(--bubble-me-bg)] px-3 py-2.5 text-[14px] leading-[20px] text-[var(--color-ink)]">
                确认创建
                {enabledCapabilities.size > 0 && ` · ${enabledCapabilities.size} 项能力`}
                {personalizationTags.size > 0 && ` · ${personalizationTags.size} 个用户标签`}
              </div>
            </motion.div>
            )}

            {/* ── AI response 2 ── */}
            {formSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2.5"
            >
              {/* status */}
              <button
                onClick={() => setTask2Open(!task2Open)}
                className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink)]/50"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>已完成思考和工具调用</span>
                {task2Open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              <p className="text-[14px] leading-[20px] text-[var(--color-ink)]">
                已生成「第五人格 · 今日塔罗」小程序骨架，左侧预览先过一眼 👈
              </p>

              {/* Summary of what was wired up — matches the image's 已选择 /
                  已引入能力 / 用户标签 block. */}
              <div className="flex flex-col gap-1.5 rounded-xl bg-[var(--fill-subtle)] ring-1 ring-[var(--divider-soft)] px-3.5 py-3 text-[12px] leading-relaxed">
                <div className="flex items-start gap-2">
                  <Check size={13} strokeWidth={2.5} className="mt-[3px] shrink-0 text-emerald-400" />
                  <span className="text-[var(--color-ink)]/85">
                    <span className="text-[var(--color-ink)]/50">已选择：</span>
                    {appType === 'ai-avatar' ? 'AI 分身' : appType === 'xiaohua' ? '小花技能' : '抖音小程序'}
                    {scene && (
                      <>
                        <span className="mx-1 text-[var(--color-ink)]/30">·</span>
                        {scene === 'feed'
                          ? 'Feed 主信息流'
                          : scene === 'comment-live'
                            ? '评论区'
                            : scene === 'private'
                              ? '私信群聊'
                              : '未定'}
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-[3px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#74d4ff]" />
                  <span className="text-[var(--color-ink)]/85">
                    <span className="text-[var(--color-ink)]/50">已引入能力：</span>
                    {enabledCapabilities.size > 0
                      ? CAPABILITY_OPTIONS.filter((c) => enabledCapabilities.has(c.id))
                          .map((c) => c.title)
                          .join('、')
                      : '—'}
                  </span>
                </div>
                {personalizationTags.size > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="mt-[3px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#4c7cff]" />
                    <span className="text-[var(--color-ink)]/85">
                      <span className="text-[var(--color-ink)]/50">用户标签：</span>
                      {TAG_OPTIONS.filter((t) => personalizationTags.has(t.id))
                        .map((t) => t.label)
                        .join('、')}
                    </span>
                  </div>
                )}
              </div>

              {/* update summary — clicking opens the "变更详情" diff tab */}
              <button
                onClick={openChangesDetail}
                className="flex w-full items-center justify-between rounded-xl bg-[var(--fill-subtle)] ring-1 ring-[var(--divider-soft)] px-4 py-3 text-[13px] transition-colors hover:bg-[var(--fill-hover)]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-ink)]/50">本次更新</span>
                  <span className="mx-1 h-3 w-px bg-[var(--color-ink)]/10" />
                  <span className="text-[var(--color-ink)]/70">修改 5 文件</span>
                  <span className="text-emerald-400">+109</span>
                  <span className="text-red-400">-77</span>
                </div>
                <ChevronRight size={14} className="text-[var(--color-ink)]/30" />
              </button>

              {/* action icons */}
              <div className="flex items-center gap-2 pt-0.5">
                {[Copy, RotateCcw, ThumbsUp, ThumbsDown].map((Icon, i) => (
                  <button
                    key={i}
                    className="rounded-md p-1 text-[var(--color-ink)]/30 transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]/60"
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </motion.div>
            )}
            </>)}
            </>)}

            {/* ── 发布 flow turn — mirrors the needs-flow animation:
                 thinking indicator fades out, then scene selection fades
                 up with a small stagger. User's trigger message is
                 already shown via sentMessages above, so we don't
                 duplicate it here. ── */}
            {showChatPublish && (
              <div className="mt-4 space-y-4">
                {/* Thinking indicator */}
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ delay: 0.6, duration: 0.25 }}
                  className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink)]/45"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -3, 0], opacity: [0.35, 0.85, 0.35] }}
                      transition={{ duration: 0.9, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                      className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]"
                    />
                  ))}
                  <span className="ml-1">AI 正在起草发布流程</span>
                </motion.div>

                {/* Step 1 — choose scenes */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-2.5"
                >
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75, duration: 0.25 }}
                    className="text-[14px] leading-[20px] text-[var(--color-ink)]"
                  >
                    请告诉我你要发布到哪些场景
                  </motion.p>
                  <ChatFormCard delay={0.9}>
                    <ChatFormStep number={1} title="选择抖音场景">
                      <div className="flex flex-wrap gap-2">
                        {PUBLISH_SCENES.map((s) => {
                          const checked = publishScenes.includes(s)
                          const locked = publishStep !== 'select'
                          return (
                            <button
                              key={s}
                              type="button"
                              disabled={locked}
                              onClick={() => togglePublishScene(s)}
                              className={`rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                                checked
                                  ? 'bg-[var(--chat-form-option-bg)] font-medium text-[var(--color-ink)] shadow-[0_1px_2px_rgba(16,18,24,0.04)]'
                                  : 'bg-[var(--chat-form-option-bg)] text-[var(--color-ink)]/55 hover:text-[var(--color-ink)]'
                              } ${locked ? 'cursor-default opacity-70' : ''}`}
                            >
                              {s}
                            </button>
                          )
                        })}
                      </div>
                    </ChatFormStep>
                    {publishStep === 'select' && (
                      <ChatFormSubmit
                        onClick={submitPublish}
                        disabled={publishScenes.length === 0}
                      >
                        提交
                      </ChatFormSubmit>
                    )}
                  </ChatFormCard>
                </motion.div>

                {/* Step 2 — review summary */}
                {(publishStep === 'review' || publishStep === 'confirmed') && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-2.5"
                  >
                    <button className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink)]/50">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>任务已完成</span>
                    </button>
                    <p className="text-[14px] leading-[20px] text-[var(--color-ink)]">
                      收到。请确认你的发布信息：
                    </p>
                    <ChatFormCard delay={0.3}>
                      <ChatFormStep number={1} title="应用账号">
                        <div className="flex items-center gap-2.5 rounded-lg bg-[var(--color-surface-0)] px-3 py-2 ring-1 ring-[var(--color-ink)]/10">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--fill-hover)] text-[var(--color-ink)]/80">
                            <Code2 size={14} />
                          </div>
                          <span className="truncate text-[12px] font-medium text-[var(--color-ink)]">
                            第五人格 · 今日塔罗
                          </span>
                        </div>
                      </ChatFormStep>
                      <ChatFormStep number={2} title="本次发布场景">
                        <div className="flex flex-col gap-1.5">
                          {publishScenes.map((s) => (
                            <div
                              key={s}
                              className="flex flex-col gap-0.5 rounded-lg bg-[var(--color-surface-0)] px-3 py-2 ring-1 ring-[var(--color-ink)]/10"
                            >
                              <span className="text-[12px] font-medium text-[var(--color-ink)]">{s}</span>
                              <span className="text-[10.5px] leading-[1.5] text-[var(--color-ink)]/55">
                                {PUBLISH_SCENE_DESCRIPTIONS[s] ?? '即将上线'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ChatFormStep>
                      {publishStep === 'review' && (
                        <ChatFormSubmit onClick={confirmPublish}>
                          确认发布
                        </ChatFormSubmit>
                      )}
                    </ChatFormCard>
                  </motion.div>
                )}

                {/* Step 3 — final ack */}
                {publishStep === 'confirmed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-2.5"
                  >
                    <button className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink)]/50">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>任务已完成</span>
                    </button>
                    <p className="text-[14px] leading-[20px] text-[var(--color-ink)]">
                      好的，已提交发布。发布记录可点击右上角查看。
                    </p>
                  </motion.div>
                )}
              </div>
            )}

          </div>

          {/* ── Composer — matches Figma Prompt Input: white card with
                subtle rainbow glow on top, p-3 rounded-[24px], compact
                32px input default, action row of pill buttons. Outer
                wrapper has mx-2.5 so the composer aligns with the
                message area (8px chat inner px + 10px composer mx matches
                the messages' px-2.5). ── */}
          <div className="mx-2.5 flex-shrink-0">
            <div className="relative flex flex-col gap-4 overflow-hidden rounded-[24px] bg-[var(--color-surface-0)] p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_10px_15px_-5px_rgba(0,0,0,0.05)]">
              {/* Top rainbow-tint blur decoration */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-4 blur-[20px]"
                style={{
                  backgroundImage:
                    'linear-gradient(0deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%), linear-gradient(95deg, rgba(255,186,51,0.1) 7.59%, rgba(78,217,44,0.1) 23.2%, rgba(69,146,242,0.1) 44.7%, rgba(110,124,253,0.1) 66.3%, rgba(225,53,248,0.1) 92.3%)',
                }}
              />

              {/* Input area — default 32px tall, grows with content up
                  to ~160px (8 lines) then scrolls internally. */}
              <div className="relative flex min-h-[32px] items-center pl-2">
                <textarea
                  ref={chatInputRef}
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChat()
                    }
                  }}
                  placeholder="请输入"
                  rows={1}
                  className="thin-scroll block max-h-[160px] min-h-0 w-full resize-none overflow-y-auto bg-transparent text-[14px] leading-[20px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink)]/35"
                />
              </div>

              {/* Action row */}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="flex h-8 items-center gap-1 rounded-full border border-[var(--divider)] px-3 text-[13px] font-medium text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
                  >
                    <FolderCode size={14} strokeWidth={1.8} />
                    资源
                  </button>
                  <button
                    type="button"
                    aria-label="附件"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--divider)] text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
                  >
                    <Paperclip size={14} strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    aria-label="Figma"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--divider)] text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
                  >
                    <FigmaIcon size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
                  >
                    Auto
                    <ChevronDown size={14} strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    aria-label="发送"
                    onClick={() => sendChat()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-ink-contrast)] transition-all hover:-translate-y-[1px] hover:opacity-90"
                  >
                    <ArrowUp size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
          </div>
          {/* Right-edge drag handle — only in platform layout for now. Sits
               straddling the chat/preview boundary with a 4px touch area. */}
          {isPlatform && (
            <div
              role="separator"
              aria-orientation="vertical"
              onPointerDown={onChatDragStart}
              onPointerMove={onChatDragMove}
              onPointerUp={onChatDragEnd}
              onPointerCancel={onChatDragEnd}
              className="group absolute right-0 top-0 bottom-0 z-10 w-1 translate-x-1/2 cursor-col-resize touch-none select-none"
            >
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-[var(--color-ink)]/20 group-active:bg-[var(--color-ink)]/30" />
            </div>
          )}
        </aside>
        )}

        {layout === 'editor' && (
          <>
            {/* ────── Editor layout: 左侧常驻手机 + 中间文件编辑 ────── */}
            <div
              className="relative flex shrink-0 flex-col items-center px-6 pt-6 pb-8"
              style={{ width: previewColumnWidth }}
            >
              {/* Segment control above phone (IP editor 样式) */}
              <div className="flex shrink-0 items-center gap-6 pb-10">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setActiveFilter(f.value)}
                    className={`relative text-[13px] font-medium tracking-wide transition-colors ${
                      f.value === activeFilter
                        ? 'text-[var(--color-ink)]'
                        : 'text-[var(--color-ink)]/35 hover:text-[var(--color-ink)]/65'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {/* Phone + ambient glow */}
              <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-0"
                  style={{
                    background: `
                      radial-gradient(260px 340px at 50% 50%, ${rgbString(c1, 1)} 0%, ${rgbString(c1, 0)} 75%),
                      radial-gradient(200px 260px at 36% 60%, ${rgbString(c2, 0.55)} 0%, ${rgbString(c2, 0)} 78%),
                      radial-gradient(180px 220px at 64% 40%, ${rgbString(c2, 0.55)} 0%, ${rgbString(c2, 0)} 78%),
                      radial-gradient(140px 160px at 52% 46%, ${rgbString(c1, 0.35)} 0%, ${rgbString(c1, 0)} 82%)
                    `,
                    filter: 'blur(48px) saturate(1.2)',
                  }}
                />
                <div className="relative z-10 flex min-h-0 w-full flex-1">
                  <PhoneMockup>
                    {activeFilter === 'ai-avatar' ? (
                      <ChatPreview worldOverride="identity-v" />
                    ) : (
                      <MiniAppPreview key={miniAppKey} />
                    )}
                  </PhoneMockup>
                </div>
              </div>
              {/* Actions below the phone */}
              <div className="@container mt-8 flex w-full shrink-0 items-center justify-center gap-1">
                {[
                  {
                    label: '重新加载',
                    icon: RefreshCw,
                    onClick: () => setMiniAppKey((k) => k + 1),
                  },
                  { label: '真机预览', icon: Smartphone },
                  { label: '发布', icon: Upload },
                ].map(({ label, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    title={label}
                    onClick={onClick}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]/85"
                  >
                    <Icon size={11} strokeWidth={1.8} />
                    <span className="hidden @[280px]:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drag handle to resize the preview column */}
            <div
              role="separator"
              aria-orientation="vertical"
              onPointerDown={onPreviewColDragStart}
              onPointerMove={onPreviewColDragMove}
              onPointerUp={onPreviewColDragEnd}
              className="group/divider relative flex w-[6px] shrink-0 cursor-col-resize items-center justify-center border-r border-[var(--divider-soft)] transition-colors hover:border-[var(--divider)]"
            >
              <span className="pointer-events-none absolute top-1/2 h-10 w-[3px] -translate-y-1/2 rounded-full bg-white/0 transition-colors group-hover/divider:bg-[var(--fill-strong)]" />
            </div>

            {/* Middle: file editor */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {/* Tab bar — only code file tabs + filetree toggle */}
              <div className="flex h-10 shrink-0 items-center gap-0 overflow-x-auto border-b border-[var(--divider-soft)]">
                <button
                  onClick={() => setFileTreeOpen((v) => !v)}
                  className={`flex h-full w-10 shrink-0 items-center justify-center transition-colors ${
                    fileTreeOpen
                      ? 'bg-[var(--color-ink)]/[0.08] text-[var(--color-ink)]/70'
                      : 'text-[var(--color-ink)]/30 hover:text-[var(--color-ink)]/60'
                  }`}
                  title="项目文件"
                >
                  <FolderOpen size={15} />
                </button>
                {openTabs
                  .map((t, origIdx) => ({ tab: t, origIdx }))
                  .filter(({ tab }) => tab.closable)
                  .map(({ tab, origIdx }) => {
                    const isActive = origIdx === activePreviewTab
                    return (
                      <button
                        key={`${tab.label}-${origIdx}`}
                        onClick={() => setActivePreviewTab(origIdx)}
                        className={`flex h-full shrink-0 items-center gap-1.5 border-r border-[var(--divider-soft)] pl-4 pr-3 text-[13px] whitespace-nowrap transition-colors ${
                          isActive
                            ? 'bg-[var(--color-ink)]/[0.06] text-[var(--color-ink)]/90'
                            : 'text-[var(--color-ink)]/35 hover:bg-[var(--color-ink)]/[0.03] hover:text-[var(--color-ink)]/55'
                        }`}
                      >
                        {tab.label}
                        <span
                          onClick={(e) => { e.stopPropagation(); closeTab(origIdx) }}
                          className="ml-1 rounded p-0.5 text-[11px] text-[var(--color-ink)]/25 hover:bg-[var(--color-ink)]/10 hover:text-[var(--color-ink)]/50"
                        >
                          <X size={11} />
                        </span>
                      </button>
                    )
                  })}
              </div>

              {/* filetree + code content */}
              <div className="flex min-h-0 flex-1 overflow-hidden">
                {fileTreeOpen && (
                  <div className="relative shrink-0" style={{ width: fileTreeWidth }}>
                    <div className="thin-scroll flex h-full flex-col overflow-y-auto border-r border-[var(--divider-soft)] bg-[var(--color-surface-0)]/50 py-2">
                      <FileTreeView
                        nodes={fileTree}
                        expanded={expandedDirs}
                        onToggleDir={toggleDir}
                        onOpenFile={openFileInTab}
                        depth={0}
                        parentPath=""
                      />
                    </div>
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      onPointerDown={onFileTreeDragStart}
                      onPointerMove={onFileTreeDragMove}
                      onPointerUp={onFileTreeDragEnd}
                      onPointerCancel={onFileTreeDragEnd}
                      className="group absolute right-0 top-0 bottom-0 z-10 w-1 translate-x-1/2 cursor-col-resize touch-none select-none"
                    >
                      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-[var(--color-ink)]/20 group-active:bg-[var(--color-ink)]/30" />
                    </div>
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                  {(() => {
                    const activeTab = openTabs[activePreviewTab]
                    if (!activeTab || !activeTab.closable) {
                      return (
                        <div className="flex flex-1 items-center justify-center text-[12px] text-[var(--color-ink)]/30">
                          从左侧文件目录打开一个文件
                        </div>
                      )
                    }
                    const label = activeTab.label
                    if (label === DIFF_TAB_LABEL) {
                      return (
                        <div className="flex flex-1 items-center justify-center px-6 text-center text-[12px] text-[var(--color-ink)]/35">
                          切回"工作区"布局查看变更详情
                        </div>
                      )
                    }
                    return (
                      <>
                        <div className="flex shrink-0 items-center bg-[var(--color-surface-0)]/50 px-4 py-1.5">
                          <span className="font-mono text-[11px] text-[var(--color-ink)]/40">
                            {label}
                          </span>
                        </div>
                        <div className="thin-scroll flex-1 overflow-y-auto bg-[var(--color-surface-0)]/50 p-0">
                          <table className="w-full border-collapse font-mono text-[13px] leading-6">
                            <tbody>
                              {(codeFiles[label]?.lines ?? []).map((line) => (
                                <tr key={line.num} className="group hover:bg-[var(--color-ink)]/[0.03]">
                                  <td className="w-12 shrink-0 select-none pr-4 text-right text-[var(--color-ink)]/35 group-hover:text-[var(--color-ink)]/55">
                                    {line.num}
                                  </td>
                                  <td className="whitespace-pre">
                                    {line.tokens.length === 0 ? (
                                      <span>&nbsp;</span>
                                    ) : (
                                      line.tokens.map((t, j) => (
                                        <span key={j} className={t.color}>{t.text}</span>
                                      ))
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </>
        )}

        {layout === 'code' && (
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden pb-5 pr-5">
            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-[16px] bg-[var(--color-surface-0)]">
            {/* ────── Code layout: 左侧对话(透明) · 中间文件编辑 · 右侧常驻手机 ────── */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {/* Tab bar — file tabs + file tree toggle */}
              <div className="flex h-10 shrink-0 items-center gap-0 overflow-x-auto border-b border-[var(--code-divider)]">
                <button
                  onClick={() => setFileTreeOpen((v) => !v)}
                  className={`flex h-full w-10 shrink-0 items-center justify-center transition-colors ${
                    fileTreeOpen
                      ? 'text-[var(--color-ink)]/80'
                      : 'text-[var(--color-ink)]/30 hover:text-[var(--color-ink)]/60'
                  }`}
                  title="项目文件"
                >
                  <FolderOpen size={15} />
                </button>
                {openTabs
                  .map((t, origIdx) => ({ tab: t, origIdx }))
                  .filter(({ tab }) => tab.closable)
                  .map(({ tab, origIdx }) => {
                    const isActive = origIdx === activePreviewTab
                    return (
                      <button
                        key={`${tab.label}-${origIdx}`}
                        onClick={() => setActivePreviewTab(origIdx)}
                        className={`flex h-full shrink-0 items-center gap-1.5 border-r border-[var(--code-divider)] pl-4 pr-3 text-[13px] whitespace-nowrap transition-colors ${
                          isActive
                            ? 'bg-[var(--color-ink)]/[0.06] text-[var(--color-ink)]/90'
                            : 'text-[var(--color-ink)]/35 hover:bg-[var(--color-ink)]/[0.03] hover:text-[var(--color-ink)]/55'
                        }`}
                      >
                        {tab.label}
                        <span
                          onClick={(e) => { e.stopPropagation(); closeTab(origIdx) }}
                          className="ml-1 rounded p-0.5 text-[11px] text-[var(--color-ink)]/25 hover:bg-[var(--color-ink)]/10 hover:text-[var(--color-ink)]/50"
                        >
                          <X size={11} />
                        </span>
                      </button>
                    )
                  })}
              </div>

              {/* File tree + code content */}
              <div className="flex min-h-0 flex-1 overflow-hidden">
                {fileTreeOpen && (
                  <div className="relative shrink-0" style={{ width: fileTreeWidth }}>
                    <div className="thin-scroll flex h-full flex-col overflow-y-auto border-r border-[var(--code-divider)] py-2">
                      <FileTreeView
                        nodes={fileTree}
                        expanded={expandedDirs}
                        onToggleDir={toggleDir}
                        onOpenFile={openFileInTab}
                        depth={0}
                        parentPath=""
                      />
                    </div>
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      onPointerDown={onFileTreeDragStart}
                      onPointerMove={onFileTreeDragMove}
                      onPointerUp={onFileTreeDragEnd}
                      onPointerCancel={onFileTreeDragEnd}
                      className="group absolute right-0 top-0 bottom-0 z-10 w-1 translate-x-1/2 cursor-col-resize touch-none select-none"
                    >
                      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-[var(--color-ink)]/20 group-active:bg-[var(--color-ink)]/30" />
                    </div>
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                  {(() => {
                    const activeTab = openTabs[activePreviewTab]
                    if (!activeTab || !activeTab.closable) {
                      return (
                        <div className="flex flex-1 items-center justify-center text-[12px] text-[var(--color-ink)]/30">
                          从左侧文件目录打开一个文件
                        </div>
                      )
                    }
                    const label = activeTab.label
                    if (label === DIFF_TAB_LABEL) {
                      return (
                        <div className="flex flex-1 items-center justify-center px-6 text-center text-[12px] text-[var(--color-ink)]/35">
                          切回"工作区"布局查看变更详情
                        </div>
                      )
                    }
                    return (
                      <>
                        <div className="flex shrink-0 items-center px-4 py-1.5">
                          <span className="font-mono text-[11px] text-[var(--color-ink)]/40">
                            {label}
                          </span>
                        </div>
                        <div className="thin-scroll flex-1 overflow-y-auto p-0">
                          <table className="w-full border-collapse font-mono text-[13px] leading-6">
                            <tbody>
                              {(codeFiles[label]?.lines ?? []).map((line) => (
                                <tr key={line.num} className="group hover:bg-[var(--color-ink)]/[0.03]">
                                  <td className="w-12 shrink-0 select-none pr-4 text-right text-[var(--color-ink)]/35 group-hover:text-[var(--color-ink)]/55">
                                    {line.num}
                                  </td>
                                  <td className="whitespace-pre">
                                    {line.tokens.length === 0 ? (
                                      <span>&nbsp;</span>
                                    ) : (
                                      line.tokens.map((t, j) => (
                                        <span key={j} className={t.color}>{t.text}</span>
                                      ))
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Divider between middle editor and right preview — 1px line on a 6px grab target */}
            <div
              role="separator"
              aria-orientation="vertical"
              onPointerDown={onPreviewColDragStart}
              onPointerMove={onPreviewColDragMove}
              onPointerUp={onPreviewColDragEnd}
              className="group/divider relative w-[6px] shrink-0 cursor-col-resize"
            >
              <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--divider)] transition-colors group-hover/divider:bg-[var(--color-ink)]/20" />
            </div>

            {/* Right: 常驻手机预览 */}
            <div
              className="relative flex shrink-0 flex-col items-center px-6 pt-4 pb-6"
              style={{ width: previewColumnWidth }}
            >
              {/* Segment pill: 小程序 / 技能 */}
              <div className="flex shrink-0 items-center rounded-full bg-[var(--fill-subtle)] p-1">
                {filters.map((f) => {
                  const active = f.value === activeFilter
                  return (
                    <button
                      key={f.value}
                      onClick={() => setActiveFilter(f.value)}
                      className={`rounded-full px-4 py-1 text-[12px] font-medium tracking-wide transition-colors ${
                        active
                          ? 'bg-[var(--fill-strong)] text-[var(--color-ink)] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]'
                          : 'text-[var(--color-ink)]/45 hover:text-[var(--color-ink)]/80'
                      }`}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>

              {/* Phone mockup — no ambient glow in code layout */}
              <div className="relative mt-5 flex min-h-0 w-full flex-1 items-center justify-center">
                <div className="relative z-10 flex min-h-0 w-full flex-1">
                  <PhoneMockup>
                    {activeFilter === 'ai-avatar' ? (
                      <ChatPreview worldOverride="identity-v" />
                    ) : (
                      <MiniAppPreview key={miniAppKey} />
                    )}
                  </PhoneMockup>
                </div>
              </div>

              {/* Bottom actions */}
              <div className="mt-5 flex w-full shrink-0 items-center justify-center gap-2">
                {[
                  {
                    label: '重新加载',
                    icon: RefreshCw,
                    onClick: () => setMiniAppKey((k) => k + 1),
                  },
                  { label: '真机预览', icon: Smartphone },
                ].map(({ label, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]/85"
                  >
                    <Icon size={11} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            </div>
          </div>
        )}

        {isPlatform && platformHomeOpen && (
          <PlatformHome
            draft={homeDraft}
            setDraft={setHomeDraft}
            onSubmit={submitFromHome}
          />
        )}

        {(layout === 'workspace' || (isPlatform && !platformHomeOpen)) && (<>

        {/* ────── Right: Preview Panel. Platform lives inside a shared
             card (painted by the fixed card frame). The preview occupies
             the right half of that card, so it just needs right/bottom
             margin to align with the card's interior; the rounded/ring
             come from the card frame. ────── */}
        <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${isPlatform ? 'mb-3 mr-3 overflow-hidden rounded-br-[16px]' : ''}`}>
          {/* tab bar — tabs scroll in the middle; the 项目文件 toggle is
               pinned to the far right so it stays reachable even when tabs
               overflow horizontally. Use default align-items: stretch so
               h-full children (tab buttons, folder toggle) span the bar. */}
          <div className="flex h-10 shrink-0 border-b border-[var(--divider-soft)]">
          <div className="tab-scroll flex h-full min-w-0 flex-1 overflow-x-auto">
            {openTabs.map((tab, i) => {
              const isActive = i === activePreviewTab || (!tab.closable && productPinned)
              return (
              <button
                key={`${tab.label}-${i}`}
                onClick={() => setActivePreviewTab(i)}
                className={`flex h-full shrink-0 items-center gap-1.5 border-r border-[var(--divider-soft)] pl-4 pr-3 text-[13px] whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[var(--color-ink)]/[0.06] text-[var(--color-ink)]/90'
                    : 'text-[var(--color-ink)]/35 hover:bg-[var(--color-ink)]/[0.03] hover:text-[var(--color-ink)]/55 [&:hover:has(.pin-trigger:hover)]:bg-transparent'
                }`}
              >
                {tab.label}
                {!tab.closable && (
                  <span
                    ref={pinTriggerRef}
                    role="button"
                    title="分屏 / 固定产物预览"
                    onClick={(e) => {
                      e.stopPropagation()
                      const rect = pinTriggerRef.current?.getBoundingClientRect()
                      if (rect) setPinMenuPos({ top: rect.bottom + 4, left: rect.left })
                      setPinMenuOpen((v) => !v)
                    }}
                    className={`pin-trigger ml-2 flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[var(--color-ink)]/10 ${
                      productPinned
                        ? 'text-[var(--color-ink)]'
                        : 'text-[var(--color-ink)]/30 hover:text-[var(--color-ink)]/70'
                    }`}
                  >
                    {productSide === 'right' ? <PanelRight size={12} /> : <PanelLeft size={12} />}
                  </span>
                )}
                {tab.closable && (
                  <span
                    onClick={(e) => { e.stopPropagation(); closeTab(i) }}
                    className="ml-1 rounded p-0.5 text-[11px] text-[var(--color-ink)]/25 hover:bg-[var(--color-ink)]/10 hover:text-[var(--color-ink)]/50"
                  >
                    <X size={11} />
                  </span>
                )}
              </button>
              )
            })}
          </div>
          {/* folder toggle — pinned to the right */}
          <button
            onClick={() => setFileTreeOpen((v) => !v)}
            className={`flex h-full w-10 shrink-0 items-center justify-center border-l border-[var(--divider-soft)] transition-colors ${
              fileTreeOpen
                ? 'bg-[var(--color-ink)]/[0.08] text-[var(--color-ink)]/70'
                : 'text-[var(--color-ink)]/30 hover:text-[var(--color-ink)]/60'
            }`}
            title="项目文件"
          >
            <FolderOpen size={15} />
          </button>
          </div>

          {/* ── Content area: tab content (left) + optional file tree (right) ── */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {(() => {
            const phoneView = (
              <>
                {/* filter chips + action buttons */}
                <div className="@container flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-2">
                  <div className="flex items-center gap-6">
                    {filters.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setActiveFilter(f.value)}
                        className={`relative text-[13px] font-medium tracking-wide transition-colors ${
                          f.value === activeFilter
                            ? 'text-[var(--color-ink)]'
                            : 'text-[var(--color-ink)]/35 hover:text-[var(--color-ink)]/65'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {[
                      {
                        label: '重新加载',
                        icon: RefreshCw,
                        onClick: () => setMiniAppKey((k) => k + 1),
                      },
                      { label: '真机预览', icon: Smartphone },
                      { label: '发布', icon: Upload },
                    ].map(({ label, icon: Icon, onClick }) => (
                      <button
                        key={label}
                        title={label}
                        onClick={onClick}
                        className="flex items-center gap-0 rounded-lg border border-[var(--color-ink)]/8 px-2 py-1.5 text-[12px] text-[var(--color-ink)]/60 transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] @[520px]:gap-1.5 @[520px]:px-3"
                      >
                        <Icon size={13} />
                        <span className="hidden @[520px]:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* phone mockup area — product-color ambient glow is dark-
                     mode-only (in light mode it bloomed into pastel halos
                     that washed out the dot grid on either side of the
                     phone). Light mode keeps just the dot grid + phone. */}
                <div className="relative flex min-h-0 flex-1 overflow-hidden pt-6 pb-12">
                  {themeMode === 'dark' && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 z-0"
                      style={{
                        background: `
                          radial-gradient(260px 340px at 50% 50%, ${rgbString(c1, 1)} 0%, ${rgbString(c1, 0)} 75%),
                          radial-gradient(200px 260px at 36% 60%, ${rgbString(c2, 0.55)} 0%, ${rgbString(c2, 0)} 78%),
                          radial-gradient(180px 220px at 64% 40%, ${rgbString(c2, 0.55)} 0%, ${rgbString(c2, 0)} 78%),
                          radial-gradient(140px 160px at 52% 46%, ${rgbString(c1, 0.35)} 0%, ${rgbString(c1, 0)} 82%)
                        `,
                        filter: 'blur(48px) saturate(1.2)',
                      }}
                    />
                  )}
                  {/* Dot grid — theme-aware via --color-ink-10 */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-[1]"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 1px 1px, var(--color-ink-10) 1px, transparent 1.5px)',
                      backgroundSize: '16px 16px',
                    }}
                  />
                  <div className="relative z-10 flex min-h-0 flex-1">
                    <PhoneMockup>
                      {activeFilter === 'ai-avatar' ? (
                        <ChatPreview worldOverride="identity-v" />
                      ) : (
                        <MiniAppPreview key={miniAppKey} />
                      )}
                    </PhoneMockup>
                  </div>
                </div>
              </>
            )

            const diffAddText = themeMode === 'light' ? 'text-emerald-700' : 'text-emerald-200'
            const diffRemoveText = themeMode === 'light' ? 'text-red-700' : 'text-red-200'
            const diffAddAccent = themeMode === 'light' ? 'text-emerald-600' : 'text-emerald-400'
            const diffRemoveAccent = themeMode === 'light' ? 'text-red-600' : 'text-red-400'
            const diffAddBg = themeMode === 'light' ? 'bg-emerald-500/[0.12]' : 'bg-emerald-500/[0.08]'
            const diffRemoveBg = themeMode === 'light' ? 'bg-red-500/[0.12]' : 'bg-red-500/[0.08]'
            const diffView = (
              <div className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--color-surface-0)]/50">
                {/* summary */}
                <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--divider-soft)] bg-[var(--color-surface-1)]/85 px-4 py-2 backdrop-blur-sm">
                  <span className="text-[12px] text-[var(--color-ink)]/60">
                    变更 {FILE_DIFFS.length} 个文件
                  </span>
                  <span className={`font-mono text-[11px] ${diffAddAccent}`}>
                    +{FILE_DIFFS.reduce((s, f) => s + f.added, 0)}
                  </span>
                  <span className={`font-mono text-[11px] ${diffRemoveAccent}`}>
                    -{FILE_DIFFS.reduce((s, f) => s + f.removed, 0)}
                  </span>
                </div>
                {FILE_DIFFS.map((file, fi) => (
                  <div key={fi} className="border-b border-[var(--divider-soft)] last:border-none">
                    <div className="sticky top-[37px] z-10 flex items-center justify-between border-b border-[var(--divider-soft)] bg-[var(--color-surface-1)]/80 px-4 py-1.5 backdrop-blur-sm">
                      <span className="font-mono text-[12px] text-[var(--color-ink)]/80">
                        {file.path}
                      </span>
                      <span className="flex items-center gap-2 font-mono text-[11px]">
                        <span className={diffAddAccent}>+{file.added}</span>
                        <span className={diffRemoveAccent}>-{file.removed}</span>
                      </span>
                    </div>
                    <table className="w-full border-collapse font-mono text-[12px] leading-5">
                      <tbody>
                        {file.lines.map((line, li) => {
                          const bg =
                            line.kind === 'add'
                              ? diffAddBg
                              : line.kind === 'remove'
                                ? diffRemoveBg
                                : line.kind === 'hunk'
                                  ? 'bg-[var(--fill-subtle)]'
                                  : ''
                          const sign =
                            line.kind === 'add'
                              ? '+'
                              : line.kind === 'remove'
                                ? '-'
                                : line.kind === 'hunk'
                                  ? '@'
                                  : ' '
                          const textColor =
                            line.kind === 'add'
                              ? diffAddText
                              : line.kind === 'remove'
                                ? diffRemoveText
                                : line.kind === 'hunk'
                                  ? 'text-[var(--color-ink)]/45'
                                  : 'text-[var(--color-ink)]/70'
                          return (
                            <tr key={li} className={bg}>
                              <td className="w-10 shrink-0 select-none pl-3 pr-1 text-right text-[var(--color-ink)]/20">
                                {line.oldNum ?? ''}
                              </td>
                              <td className="w-10 shrink-0 select-none pr-2 text-right text-[var(--color-ink)]/20">
                                {line.newNum ?? ''}
                              </td>
                              <td
                                className={`w-5 shrink-0 select-none text-center ${
                                  line.kind === 'add'
                                    ? diffAddAccent
                                    : line.kind === 'remove'
                                      ? diffRemoveAccent
                                      : 'text-[var(--color-ink)]/30'
                                }`}
                              >
                                {sign}
                              </td>
                              <td className={`whitespace-pre pr-4 ${textColor}`}>
                                {line.text}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )

            const codeView = (label: string) => (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex shrink-0 items-center bg-[var(--color-surface-0)]/50 px-4 py-1.5">
                  <span className="font-mono text-[11px] text-[var(--color-ink)]/40">
                    {label}
                  </span>
                </div>
                <div className="thin-scroll flex-1 overflow-y-auto bg-[var(--color-surface-0)]/50 p-0">
                  <table className="w-full border-collapse font-mono text-[13px] leading-6">
                    <tbody>
                      {(codeFiles[label]?.lines ?? []).map((line) => (
                        <tr key={line.num} className="group hover:bg-[var(--color-ink)]/[0.03]">
                          <td className="w-12 shrink-0 select-none pr-4 text-right text-[var(--color-ink)]/35 group-hover:text-[var(--color-ink)]/55">
                            {line.num}
                          </td>
                          <td className="whitespace-pre">
                            {line.tokens.length === 0 ? (
                              <span>&nbsp;</span>
                            ) : (
                              line.tokens.map((t, j) => (
                                <span key={j} className={t.color}>{t.text}</span>
                              ))
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )

            const renderTab = (label: string) =>
              label === DIFF_TAB_LABEL ? diffView : codeView(label)

            if (productPinned) {
              const codeLabel =
                activePreviewTab > 0
                  ? openTabs[activePreviewTab].label
                  : openTabs[1]?.label
              const leftIsProduct = productSide === 'left'
              /* splitRatio is the LEFT column's width ratio — dragging the
               * divider right always widens the left column regardless of
               * which side the product is on. */
              const leftPercent = splitRatio * 100
              const productCol = (
                <div className="flex min-w-0 flex-col overflow-hidden" style={{ width: `${leftIsProduct ? leftPercent : 100 - leftPercent}%` }}>
                  {phoneView}
                </div>
              )
              const codeCol = (
                <div className="flex min-w-0 flex-col overflow-hidden" style={{ width: `${leftIsProduct ? 100 - leftPercent : leftPercent}%` }}>
                  {codeLabel ? (
                    renderTab(codeLabel)
                  ) : (
                    <div className="grid flex-1 place-items-center text-[12px] text-[var(--color-ink)]/30">
                      从上方打开一个文件以查看代码
                    </div>
                  )}
                </div>
              )
              return (
                <div ref={splitContainerRef} className="flex min-h-0 flex-1 overflow-hidden">
                  {leftIsProduct ? productCol : codeCol}
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    onPointerDown={onDividerPointerDown}
                    onPointerMove={onDividerPointerMove}
                    onPointerUp={onDividerPointerUp}
                    onPointerCancel={onDividerPointerUp}
                    className="group relative w-1 shrink-0 cursor-col-resize touch-none select-none"
                  >
                    <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--fill-hover)] transition-colors group-hover:bg-[var(--color-ink)]/20 group-active:bg-[var(--color-ink)]/30" />
                  </div>
                  {leftIsProduct ? codeCol : productCol}
                </div>
              )
            }

            return activePreviewTab === 0
              ? phoneView
              : renderTab(openTabs[activePreviewTab].label)
          })()}

          {/* ── Console panel ── */}
          <AnimatePresence>
            {consoleOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: consoleHeight }}
                exit={{ height: 0 }}
                transition={{ duration: consoleDragRef.current ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="relative shrink-0 overflow-hidden border-t border-[var(--divider-soft)]"
              >
                {/* drag handle — top edge */}
                <div
                  role="separator"
                  aria-orientation="horizontal"
                  onPointerDown={onConsoleDragStart}
                  onPointerMove={onConsoleDragMove}
                  onPointerUp={onConsoleDragEnd}
                  onPointerCancel={onConsoleDragEnd}
                  className="group absolute inset-x-0 top-0 z-20 h-1 cursor-row-resize touch-none select-none"
                >
                  <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-transparent transition-colors group-hover:bg-[var(--color-ink)]/20 group-active:bg-[var(--color-ink)]/30" />
                </div>
                <div className="flex h-full flex-col bg-[var(--color-surface-0)]/50">
                  {/* console header */}
                  <button
                    onClick={() => setConsoleOpen(!consoleOpen)}
                    className="flex h-8 shrink-0 items-center gap-1.5 border-b border-[var(--divider-soft)] px-4 text-[12px] text-[var(--color-ink)]/50 hover:text-[var(--color-ink)]/70"
                  >
                    控制台
                    <ChevronDown size={12} />
                  </button>

                  {/* console output */}
                  <div className="thin-scroll flex-1 overflow-y-auto p-3 font-[var(--font-mono)] text-[12px] leading-5">
                    {consoleLines.map((line, i) => (
                      <div key={i}>
                        {line.kind === 'cmd' && (
                          <span className="text-[var(--color-ink)]/50">{line.text}</span>
                        )}
                        {line.kind === 'info' && (
                          <span className="text-sky-400">{line.text}</span>
                        )}
                        {line.kind === 'success' && (
                          <span className="text-emerald-400">{line.text}</span>
                        )}
                        {line.kind === 'log' && (
                          <span className="text-[var(--color-ink)]/70">{line.text}</span>
                        )}
                        {line.kind === 'warn' && (
                          <span className="text-amber-400">{line.text}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* console toggle when closed — float button */}
          {!consoleOpen && (
            <button
              onClick={() => setConsoleOpen(true)}
              title="展开控制台"
              className="absolute bottom-3 left-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-2)]/85 text-[var(--color-ink)]/60 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.5)] backdrop-blur-md transition-colors hover:text-[var(--color-ink)]"
            >
              <Terminal size={13} strokeWidth={1.8} />
            </button>
          )}
          </div>

          {fileTreeOpen && (
            <div className="relative shrink-0" style={{ width: fileTreeWidth }}>
              <div className="thin-scroll flex h-full flex-col overflow-y-auto border-l border-[var(--divider-soft)] bg-[var(--color-surface-0)]/50">
                {/* ── Section 1 — 对话上下文 (referenced skills / knowledge) ── */}
                <div className="shrink-0">
                  <button
                    onClick={() => setContextSectionOpen((v) => !v)}
                    className="flex w-full items-center gap-1.5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-ink)]/55 transition-colors hover:text-[var(--color-ink)]/85"
                  >
                    {contextSectionOpen ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                    <span>对话上下文</span>
                    <span className="ml-auto text-[10px] text-[var(--color-ink)]/35">
                      {CAPABILITY_OPTIONS.filter((c) => enabledCapabilities.has(c.id)).length}
                    </span>
                  </button>
                  {contextSectionOpen && (
                    <div className="space-y-0.5 px-2 pb-2">
                      {CAPABILITY_OPTIONS.filter((c) => enabledCapabilities.has(c.id)).map((cap) => (
                        <div
                          key={cap.id}
                          className="flex items-start gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-[var(--color-ink)]/[0.04]"
                        >
                          <span className="mt-px shrink-0 rounded bg-[var(--fill-hover)] px-1.5 py-[1px] font-mono text-[9.5px] text-[var(--color-ink)]/65">
                            {cap.kind === 'skill' ? 'Skill' : 'KB'}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[var(--color-ink)]/85">
                            {cap.title}
                          </span>
                        </div>
                      ))}
                      {CAPABILITY_OPTIONS.filter((c) => enabledCapabilities.has(c.id)).length === 0 && (
                        <div className="px-2 py-1.5 text-[11px] text-[var(--color-ink)]/35">
                          暂无引用
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="mx-3 border-t border-[var(--divider-soft)]" />

                {/* ── Section 2 — 项目代码库 (file tree) ── */}
                <div className="flex min-h-0 flex-1 flex-col">
                  <button
                    onClick={() => setProjectSectionOpen((v) => !v)}
                    className="flex shrink-0 w-full items-center gap-1.5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-ink)]/55 transition-colors hover:text-[var(--color-ink)]/85"
                  >
                    {projectSectionOpen ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                    <span>项目代码库</span>
                  </button>
                  {projectSectionOpen && (
                    <div className="min-h-0 flex-1 py-1">
                      <FileTreeView
                        nodes={fileTree}
                        expanded={expandedDirs}
                        onToggleDir={toggleDir}
                        onOpenFile={openFileInTab}
                        depth={0}
                        parentPath=""
                      />
                    </div>
                  )}
                </div>
              </div>
              {/* drag handle — left edge (tree sits on the right now, so
                   pulling the handle left widens it). */}
              <div
                role="separator"
                aria-orientation="vertical"
                onPointerDown={onFileTreeDragStart}
                onPointerMove={(e) => {
                  const state = fileTreeDragRef.current
                  if (!state) return
                  const next = Math.min(480, Math.max(160, state.startWidth - (e.clientX - state.startX)))
                  setFileTreeWidth(next)
                }}
                onPointerUp={onFileTreeDragEnd}
                onPointerCancel={onFileTreeDragEnd}
                className="group absolute left-0 top-0 bottom-0 z-10 w-1 -translate-x-1/2 cursor-col-resize touch-none select-none"
              >
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-[var(--color-ink)]/20 group-active:bg-[var(--color-ink)]/30" />
              </div>
            </div>
          )}
          </div>
        </div>
        </>)}
      </div>

      {/* ── Pin menu popover (fixed, so it escapes the tab bar overflow clip) ── */}
      {pinMenuOpen && (
        <span
          ref={pinMenuRef}
          style={{ position: 'fixed', top: pinMenuPos.top, left: pinMenuPos.left, zIndex: 60 }}
          className="flex min-w-[140px] flex-col overflow-hidden rounded-lg border border-[var(--divider)] bg-[var(--color-surface-2)] shadow-[0_20px_50px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        >
          <span
            role="button"
            onClick={() => {
              setProductPinned(true)
              setProductSide('left')
              setPinMenuOpen(false)
            }}
            className={`flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-[var(--fill-soft)] ${
              productPinned && productSide === 'left'
                ? 'text-[var(--color-ink)]'
                : 'text-[var(--color-ink)]/70'
            }`}
          >
            <PanelLeft size={12} />
            钉在左侧
            {productPinned && productSide === 'left' && (
              <span className="ml-auto text-[10px] text-[var(--color-ink)]/45">当前</span>
            )}
          </span>
          <span
            role="button"
            onClick={() => {
              setProductPinned(true)
              setProductSide('right')
              setPinMenuOpen(false)
            }}
            className={`flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-[var(--fill-soft)] ${
              productPinned && productSide === 'right'
                ? 'text-[var(--color-ink)]'
                : 'text-[var(--color-ink)]/70'
            }`}
          >
            <PanelRight size={12} />
            钉在右侧
            {productPinned && productSide === 'right' && (
              <span className="ml-auto text-[10px] text-[var(--color-ink)]/45">当前</span>
            )}
          </span>
          {productPinned && (
            <>
              <span className="mx-2 my-0.5 h-px bg-[var(--fill-hover)]" />
              <span
                role="button"
                onClick={() => {
                  setProductPinned(false)
                  setPinMenuOpen(false)
                }}
                className="flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--color-ink)]/65 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
              >
                <X size={12} />
                取消固定
              </span>
            </>
          )}
        </span>
      )}
    </motion.div>
  )
}

/** Generic AI reply block — shows a brief thinking indicator (which
 *  unmounts once faded so it doesn't claim a space-y slot), then the
 *  reply text. Kept as its own component so each message can own its
 *  own "thinking" lifecycle without a parent-level Set of timers. */
function GenericAiReply({ text }: { text: string }) {
  const [thinking, setThinking] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setThinking(false), 900)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="space-y-2.5">
      {thinking && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 0.5, duration: 0.25 }}
          className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink)]/45"
        >
          {[0, 1, 2].map((k) => (
            <motion.span
              key={k}
              animate={{ y: [0, -3, 0], opacity: [0.35, 0.85, 0.35] }}
              transition={{ duration: 0.9, delay: k * 0.15, repeat: Infinity, ease: 'easeInOut' }}
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]"
            />
          ))}
          <span className="ml-1">AI 正在回复</span>
        </motion.div>
      )}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="text-[14px] leading-[20px] text-[var(--color-ink)]"
      >
        {text}
      </motion.p>
    </div>
  )
}

/** Rotating reply bank for plain (non-trigger) chat messages. Picked by
 *  index so repeated sends still feel varied without needing a real
 *  language model. */
const GENERIC_AI_REPLIES = [
  '好的，我记下了这个需求。可以再告诉我具体的使用场景或期望结果，这样我可以帮你精准地搭建。',
  '收到。为了给出更贴合的方案，你能补充一下目标用户、触发时机和数据来源吗？',
  '好，我先整理下你的想法。建议把它拆成更小的步骤说给我听，我会按步骤接着往下做。',
  '明白了。如果方便，可以直接描述一下理想中的最终产出形态，比如一个页面、一段接口或一份内容。',
]

const CHAT_EMPTY_SUGGESTIONS = [
  '我想做一个第五人格主题的塔罗运势小程序',
  '做个每日打卡小程序',
  '换套更神秘的配色',
  '给卡片加上翻面动效',
  '再写两个塔罗牌面',
]

function ChatEmptyState({ onPick }: { onPick: (text: string) => void }) {
  const themeMode = useThemeStore((s) => s.mode)
  const isLight = themeMode === 'light'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex h-full flex-col items-center justify-center gap-8 px-3 text-center"
    >
      <div className="relative z-0 flex h-14 w-14 items-center justify-center">
        {/* Halo glow PNG behind the logo. Rendered only in dark mode —
             the light panel doesn't need it and the PNG's dark backdrop
             reads like an ink blot there. */}
        {!isLight && (
          <motion.img
            src="/bg/chat-empty-halo.png"
            alt=""
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
          />
        )}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative"
        >
          <LogoIconSpinOnce className="h-14 w-14 text-[var(--color-ink)]" />
        </motion.div>
      </div>
      <div className="relative z-10 flex flex-col items-center gap-3">
        <h2 className="text-[20px] font-medium leading-[24px] text-[var(--color-ink)]">
          嗨，我是你的 AI 助理
        </h2>
        <p className="text-[14px] leading-[24px] text-[var(--color-ink)]/60">
          你可以让我改改小程序，下面这些都可以直接试试
        </p>
      </div>
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
        {CHAT_EMPTY_SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
            whileHover={{ y: -1 }}
            className="rounded-full bg-[var(--fill-subtle)] px-[13px] py-[7px] text-[11px] leading-[16.5px] text-[var(--color-ink)]/75 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
          >
            {s}
          </motion.button>
        ))}
      </div>
      <PublishFlowModal />
    </motion.div>
  )
}
