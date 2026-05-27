import { useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  FileText,
  Image as ImageIcon,
  Library,
  Package,
  Pencil,
  Plus,
  Share2,
  Type,
  Video,
  type LucideIcon,
} from 'lucide-react'

/**
 * KnowledgeCreatePage — 新建知识库工坊 demo。
 *
 * 三列结构（与 NotebookLM 类似但贴合 vibecoding 的双盘语义）：
 *   原始材料   |    工坊（chat + 处理计划）    |    加工产物（待确认 / 已入库）
 *
 * 中列以 chat-like 流呈现 AI 拟定的「资源识别 + 处理计划」卡片；
 * 右列按类型 chip 切换查看每条加工产物，可逐个确认入库或一键确认全部。
 *
 * 当前为静态 demo —— 所有数据来自下方常量，交互只在本地状态里翻转，
 * 不写回任何 store。
 */

interface Props {
  onClose: () => void
}

/* ─── Mock data ─────────────────────────────────────────────────── */

type MaterialKind = 'doc' | 'image' | 'video' | 'pack'

interface Material {
  id: string
  name: string
  kind: MaterialKind
  status: '就绪' | '处理中' | '失败'
}

const MATERIAL_ICONS: Record<MaterialKind, LucideIcon> = {
  doc: FileText,
  image: ImageIcon,
  video: Video,
  pack: Package,
}

const MATERIAL_TILE: Record<MaterialKind, string> = {
  doc: 'bg-[#eff8ff] text-[#3370ff] dark:bg-sky-500/15 dark:text-sky-300',
  image: 'bg-[#e9f8ee] text-[#007d47] dark:bg-emerald-500/15 dark:text-emerald-300',
  video: 'bg-[#fdeee3] text-[#b9510a] dark:bg-amber-500/15 dark:text-amber-300',
  pack: 'bg-[#f1eef9] text-[#5720b7] dark:bg-violet-500/15 dark:text-violet-300',
}

const MATERIAL_LABEL: Record<MaterialKind, string> = {
  doc: '文档',
  image: '图片',
  video: '视频',
  pack: '资源包',
}

const MATERIALS: Material[] = [
  { id: 'm-1', name: '三代存储范式调研与对比.md', kind: 'doc', status: '就绪' },
  { id: 'm-2', name: '生成可爱头像.png', kind: 'image', status: '就绪' },
  { id: 'm-3', name: '测试视频.mp4', kind: 'video', status: '就绪' },
  { id: 'm-4', name: 'llmwiki_knowledge_pack.zip', kind: 'pack', status: '就绪' },
]

interface PlanRow {
  kind: MaterialKind
  count: number
  asset: string
  state: '完成' | '处理中' | '待开始'
}

const PLAN_ROWS: PlanRow[] = [
  { kind: 'doc', count: 1, asset: '分段索引 + 实体', state: '完成' },
  { kind: 'image', count: 1, asset: 'VLM 描述 + 标签', state: '完成' },
  { kind: 'video', count: 1, asset: '关键帧 + 字幕', state: '完成' },
  { kind: 'pack', count: 1, asset: 'AST + 调用图', state: '完成' },
]

/* Output filter pills + per-output detail data. The right column shows
 * exactly one output detail at a time; switching chips selects which
 * output is in focus. */

type OutputKind = 'all' | 'doc' | 'image' | 'video' | 'code'

interface OutputDetail {
  id: string
  kind: Exclude<OutputKind, 'all'>
  title: string
  source: string
  assetTitle: string
  assetSubtitle: string
  status: '已完成' | '处理中' | '失败'
}

const OUTPUTS: OutputDetail[] = [
  {
    id: 'o-1',
    kind: 'doc',
    title: '分段索引 + 实体',
    source: '三代存储范式调研与对比.md',
    assetTitle: '调研文档 · 分段索引',
    assetSubtitle: '段落切分 + 实体抽取 + 摘要',
    status: '已完成',
  },
  {
    id: 'o-2',
    kind: 'image',
    title: 'VLM 描述 + OCR + 标签',
    source: '生成可爱头像.png',
    assetTitle: '生成可爱头像 · 视觉描述 + 标签',
    assetSubtitle: 'VLM 描述 + OCR + 自动标签',
    status: '已完成',
  },
  {
    id: 'o-3',
    kind: 'video',
    title: '关键帧 + 字幕',
    source: '测试视频.mp4',
    assetTitle: '测试视频 · 时序摘要',
    assetSubtitle: '关键帧抽取 + ASR 字幕 + 章节',
    status: '已完成',
  },
  {
    id: 'o-4',
    kind: 'code',
    title: 'AST + 调用图',
    source: 'llmwiki_knowledge_pack.zip',
    assetTitle: '资源包 · 代码结构图',
    assetSubtitle: 'AST 解析 + 函数调用图 + 模块依赖',
    status: '已完成',
  },
]

/* ─── Root ──────────────────────────────────────────────────────── */

export default function KnowledgeCreatePage({ onClose }: Props) {
  const [name, setName] = useState('未命名知识库')
  const [renaming, setRenaming] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(MATERIALS.map((m) => m.id)),
  )
  const [activeOutput, setActiveOutput] = useState<OutputDetail['id']>('o-2')
  const [outputFilter, setOutputFilter] = useState<OutputKind>('image')
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-[var(--color-surface-0)]">
      <MaterialsAside
        materials={MATERIALS}
        selected={selected}
        onToggle={toggleSelected}
      />
      <WorkshopColumn
        name={name}
        setName={setName}
        renaming={renaming}
        setRenaming={setRenaming}
        onClose={onClose}
        selectedCount={selected.size}
      />
      <OutputsColumn
        outputs={OUTPUTS}
        activeId={activeOutput}
        onSelect={setActiveOutput}
        filter={outputFilter}
        setFilter={setOutputFilter}
        confirmed={confirmed}
        setConfirmed={setConfirmed}
      />
    </div>
  )
}

/* ─── Left aside — 原始材料 ──────────────────────────────────────── */

function MaterialsAside({
  materials,
  selected,
  onToggle,
}: {
  materials: Material[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-[var(--divider-soft)] bg-[var(--color-surface-0)] lg:w-[260px] xl:w-[280px]">
      {/* Title row — page label + count + 上传 pill */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4 pb-2">
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold leading-[20px] text-[var(--color-ink)]">
            原始材料
          </span>
          <span className="mt-0.5 text-[11px] text-[var(--color-ink)]/45">
            已选 {selected.size} / {materials.length} 份
          </span>
        </div>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1 rounded-full bg-[var(--color-ink)] px-3 text-[12px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90"
        >
          <Plus size={11} strokeWidth={2} />
          上传
        </button>
      </div>

      {/* List */}
      <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-3 pt-1">
        {materials.map((m) => {
          const Icon = MATERIAL_ICONS[m.kind]
          const checked = selected.has(m.id)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggle(m.id)}
              className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                checked
                  ? 'bg-[var(--fill-subtle)]'
                  : 'hover:bg-[var(--fill-soft)]'
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                  checked
                    ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                    : 'border-[var(--color-ink)]/30'
                }`}
              >
                {checked && <Check size={10} strokeWidth={3} />}
              </span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${MATERIAL_TILE[m.kind]}`}
              >
                <Icon size={13} strokeWidth={1.7} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[12.5px] font-medium leading-[16px] text-[var(--color-ink)]">
                  {m.name}
                </span>
                <span className="mt-0.5 text-[11px] leading-[14px] text-[var(--color-ink)]/45">
                  {MATERIAL_LABEL[m.kind]} · {m.status}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

/* ─── Middle column — 工坊 chat + 处理计划 ──────────────────────── */

function WorkshopColumn({
  name,
  setName,
  renaming,
  setRenaming,
  onClose,
  selectedCount,
}: {
  name: string
  setName: (v: string) => void
  renaming: boolean
  setRenaming: (v: boolean) => void
  onClose: () => void
  selectedCount: number
}) {
  const [draft, setDraft] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[var(--color-surface-0)]">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--divider-soft)] px-4">
        <button
          type="button"
          onClick={onClose}
          title="返回知识库"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--color-ink)]/65 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft size={14} strokeWidth={1.8} />
        </button>
        <div className="flex min-w-0 items-center gap-1.5">
          {renaming ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setRenaming(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') setRenaming(false)
              }}
              className="min-w-0 max-w-[260px] border-b border-[var(--color-ink)]/40 bg-transparent text-[14px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-ink)]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="truncate text-[14px] font-medium text-[var(--color-ink)] hover:text-[var(--color-ink)]/85"
            >
              {name}
            </button>
          )}
          <button
            type="button"
            onClick={() => setRenaming(true)}
            title="重命名"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
          >
            <Pencil size={10} />
          </button>
          <span className="ml-1 inline-flex h-[18px] shrink-0 items-center rounded-full bg-[var(--fill-medium)] px-2 text-[10px] text-[var(--color-ink)]/70">
            工坊
          </span>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[var(--fill-medium)] px-3 text-[12px] font-medium text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
            title="发布当前版本"
          >
            <Share2 size={12} strokeWidth={1.8} />
            发布 v1.0
          </button>
        </div>
      </div>

      {/* Conversation stream */}
      <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
        {/* AI welcome bubble */}
        <div className="max-w-[560px] rounded-2xl bg-[var(--fill-subtle)] px-4 py-3 text-[13px] leading-[1.65] text-[var(--color-ink)]/85">
          欢迎来到知识工坊。上传资料后，我会自动识别类型并推荐处理方式。你也可以直接告诉我要做什么。
        </div>

        {/* Plan card */}
        <PlanCard />
      </div>

      {/* Composer — 完整复用 VibeCoding 主对话框的两段式结构：
       *  顶部输入行 + 底部动作行（资源 / 附件 / Figma · Auto / 发送）。
       *  外壳采用 rounded-[24px] 浮起卡片 + 顶部彩虹晕染。 */}
      <div className="shrink-0 px-6 pb-4 pt-3">
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

          {/* Input area */}
          <div className="relative flex min-h-[32px] items-center pl-2">
            <textarea
              ref={taRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  // demo only — no send wiring
                }
              }}
              placeholder="告诉我你想怎么处理这些资料"
              className="thin-scroll block max-h-[160px] min-h-[28px] w-full resize-none bg-transparent text-[14px] leading-[20px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink)]/40"
            />
          </div>

          {/* Action row */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="flex h-8 items-center gap-1 rounded-full border border-[var(--divider)] px-3 text-[13px] font-medium text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
              >
                <Library size={14} strokeWidth={1.8} />
                资源
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
                disabled={!draft.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-ink-contrast)] transition-all hover:-translate-y-[1px] hover:opacity-90 disabled:translate-y-0 disabled:bg-[var(--fill-medium)] disabled:text-[var(--color-ink)]/55 disabled:hover:opacity-100"
              >
                <ArrowUp size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-2 px-1 text-[11.5px] text-[var(--color-ink)]/45">
          已选 {selectedCount} 份资料作为本次处理输入
        </div>
      </div>
    </div>
  )
}

/* ─── Plan card — 资源识别 + 处理计划 ─────────────────────────── */

function PlanCard() {
  return (
    <div className="max-w-[640px] rounded-2xl border border-[var(--divider-soft)] bg-[var(--color-surface-0)]">
      {/* Status pill */}
      <div className="px-4 pt-4">
        <span className="inline-flex items-center gap-1 rounded-md bg-[#e9f8ee] px-2 py-0.5 text-[12px] font-medium leading-[18px] text-[#007d47] dark:bg-emerald-500/15 dark:text-emerald-200">
          <Check size={11} strokeWidth={2.5} />4 组全部完成
        </span>
      </div>

      {/* 资源识别 section */}
      <div className="border-t border-[var(--divider-soft)] mx-4 mt-3" />
      <div className="px-4 pt-3 pb-2">
        <div className="text-[11.5px] uppercase tracking-[0.05em] text-[var(--color-ink)]/45">
          资源识别
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[13px] text-[var(--color-ink)]/85">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#eff8ff] text-[#3370ff] dark:bg-sky-500/15 dark:text-sky-300">
            <FileText size={11} strokeWidth={1.8} />
          </span>
          <span className="font-medium text-[var(--color-ink)]">素材</span>
          <span className="text-[var(--color-ink)]/55">
            4 份 · 1 文档 / 1 图片 / 1 视频 / 1 资源包
          </span>
        </div>
      </div>

      {/* 处理计划 section */}
      <div className="border-t border-[var(--divider-soft)] mx-4 mt-2" />
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <span className="text-[11.5px] uppercase tracking-[0.05em] text-[var(--color-ink)]/45">
          处理计划
        </span>
        <span className="text-[11.5px] text-[var(--color-ink)]/45">
          将生成以下 AI 资产
        </span>
      </div>
      <div className="flex flex-col gap-1.5 px-4 pb-4">
        {PLAN_ROWS.map((row, i) => {
          const Icon = MATERIAL_ICONS[row.kind]
          return (
            <div key={i} className="flex items-center gap-3">
              <Check
                size={13}
                strokeWidth={2.5}
                className="text-[#007d47] dark:text-emerald-300"
              />
              <div className="flex w-[88px] items-center gap-1.5 text-[13px] text-[var(--color-ink)]/85">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded ${MATERIAL_TILE[row.kind]}`}
                >
                  <Icon size={9} strokeWidth={1.8} />
                </span>
                {MATERIAL_LABEL[row.kind]} × {row.count}
              </div>
              <button
                type="button"
                className="flex flex-1 items-center justify-between gap-2 rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-1)] px-3 py-1.5 text-[12.5px] text-[var(--color-ink)]/85 transition-colors hover:border-[var(--color-ink)]/30"
              >
                <span className="inline-flex items-center gap-1.5">
                  <PlanAssetIcon kind={row.kind} />
                  {row.asset}
                </span>
                <ChevronDown size={12} className="text-[var(--color-ink)]/40" />
              </button>
              <span className="inline-flex items-center gap-1 text-[12px] text-[#007d47] dark:text-emerald-300">
                <Check size={11} strokeWidth={2.5} />
                {row.state}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className="border-t border-[var(--divider-soft)] mx-4" />
      <div className="px-4 py-2.5 text-[12px] text-[var(--color-ink)]/55">
        产物已就绪，可在右侧确认入库
      </div>
    </div>
  )
}

function PlanAssetIcon({ kind }: { kind: MaterialKind }) {
  const cls = MATERIAL_TILE[kind]
  const Icon = MATERIAL_ICONS[kind]
  return (
    <span className={`flex h-4 w-4 items-center justify-center rounded ${cls}`}>
      <Icon size={9} strokeWidth={1.8} />
    </span>
  )
}

/* ─── Right column — 加工产物 ──────────────────────────────────── */

function OutputsColumn({
  outputs,
  activeId,
  onSelect,
  filter,
  setFilter,
  confirmed,
  setConfirmed,
}: {
  outputs: OutputDetail[]
  activeId: OutputDetail['id']
  onSelect: (id: OutputDetail['id']) => void
  filter: OutputKind
  setFilter: (k: OutputKind) => void
  confirmed: Set<string>
  setConfirmed: (next: Set<string>) => void
}) {
  const counts: Record<OutputKind, number> = {
    all: outputs.length,
    doc: outputs.filter((o) => o.kind === 'doc').length,
    image: outputs.filter((o) => o.kind === 'image').length,
    video: outputs.filter((o) => o.kind === 'video').length,
    code: outputs.filter((o) => o.kind === 'code').length,
  }
  const visibleOutputs =
    filter === 'all' ? outputs : outputs.filter((o) => o.kind === filter)
  const active = outputs.find((o) => o.id === activeId) ?? visibleOutputs[0] ?? outputs[0]

  const pendingCount = outputs.length - confirmed.size
  const confirmAll = () => setConfirmed(new Set(outputs.map((o) => o.id)))
  const confirmOne = () =>
    setConfirmed(new Set([...confirmed, active.id]))

  const PILLS: { id: OutputKind; label: string; count: number; icon?: LucideIcon }[] = [
    { id: 'all', label: '全部', count: counts.all, icon: Package },
    { id: 'doc', label: '文档', count: counts.doc, icon: FileText },
    { id: 'image', label: '图片', count: counts.image, icon: ImageIcon },
    { id: 'video', label: '视频', count: counts.video, icon: Video },
    { id: 'code', label: '代码', count: counts.code, icon: Type },
  ]

  return (
    <div className="flex w-[380px] shrink-0 flex-col border-l border-[var(--divider-soft)] bg-[var(--color-surface-0)] lg:w-[400px] xl:w-[440px]">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-1.5 border-b border-[var(--divider-soft)] px-4 pt-4 pb-3">
        <span className="text-[15px] font-semibold leading-[20px] text-[var(--color-ink)]">
          加工产物
        </span>
        <span className="text-[11.5px] text-[var(--color-ink)]/45">
          {confirmed.size} 已入库 · {pendingCount} 待确认 · {outputs.length} 次加工
        </span>
        {/* Filter pills */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {PILLS.map((p) => {
            const active = filter === p.id
            const Icon = p.icon ?? Package
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setFilter(p.id)
                  // Snap detail to first match of the new filter
                  const firstMatch =
                    p.id === 'all'
                      ? outputs[0]
                      : outputs.find((o) => o.kind === p.id)
                  if (firstMatch) onSelect(firstMatch.id)
                }}
                className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] transition-colors ${
                  active
                    ? 'bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                    : 'bg-[var(--fill-subtle)] text-[var(--color-ink)]/75 hover:bg-[var(--fill-hover)]'
                }`}
              >
                <Icon size={11} strokeWidth={1.8} />
                <span>{p.label}</span>
                <span
                  className={`text-[11px] ${active ? 'text-[var(--color-ink-contrast)]/70' : 'text-[var(--color-ink)]/45'}`}
                >
                  {p.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active output detail */}
      <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {active && (
          <>
            {/* Title row */}
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--fill-subtle)] text-[var(--color-ink)]/70">
                {iconForOutputKind(active.kind)}
              </span>
              <span className="text-[14px] font-semibold text-[var(--color-ink)]">
                {active.title}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-px text-[11px] font-medium ${
                  confirmed.has(active.id)
                    ? 'bg-[var(--fill-subtle)] text-[var(--color-ink)]/55'
                    : 'bg-[#e9f8ee] text-[#007d47] dark:bg-emerald-500/15 dark:text-emerald-200'
                }`}
              >
                {confirmed.has(active.id) ? '已入库' : active.status}
              </span>
              <button
                type="button"
                className="ml-auto inline-flex h-7 items-center gap-1 rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-1)] px-2 text-[11.5px] text-[var(--color-ink)]/75 transition-colors hover:border-[var(--color-ink)]/30 hover:text-[var(--color-ink)]"
              >
                <Copy size={11} strokeWidth={1.8} />
                复制{active.kind === 'image' ? '图片' : '内容'}
              </button>
            </div>
            <div className="-mt-2 text-[11.5px] text-[var(--color-ink)]/55">
              {active.source} ·
            </div>

            {/* Detail card */}
            <OutputDetailCard
              detail={active}
              onConfirm={confirmOne}
              confirmed={confirmed.has(active.id)}
            />
          </>
        )}
      </div>

      {/* Footer — counts + 确认全部 */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[var(--divider-soft)] px-4 py-3">
        <span className="text-[12px] text-[var(--color-ink)]/55">
          {confirmed.size} / {outputs.length} 已入库
        </span>
        <button
          type="button"
          onClick={confirmAll}
          disabled={confirmed.size === outputs.length}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 text-[12.5px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Check size={12} strokeWidth={2} />
          确认全部
        </button>
      </div>
    </div>
  )
}

function iconForOutputKind(k: OutputDetail['kind']) {
  switch (k) {
    case 'doc':
      return <FileText size={12} strokeWidth={1.7} />
    case 'image':
      return <Eye size={12} strokeWidth={1.7} />
    case 'video':
      return <Video size={12} strokeWidth={1.7} />
    case 'code':
      return <Type size={12} strokeWidth={1.7} />
  }
}

/* ─── Detail card — body content for the focused output ───────── */

function OutputDetailCard({
  detail,
  onConfirm,
  confirmed,
}: {
  detail: OutputDetail
  onConfirm: () => void
  confirmed: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="rounded-2xl border border-[var(--divider-soft)] bg-[var(--color-surface-0)]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--divider-soft)] px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--fill-subtle)] text-[var(--color-ink)]/70">
          {iconForOutputKind(detail.kind)}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-semibold text-[var(--color-ink)]">
            {detail.assetTitle}
          </span>
          <span className="truncate text-[11.5px] text-[var(--color-ink)]/55">
            {detail.assetSubtitle}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11.5px] text-[var(--color-ink)]/65 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
          >
            {collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
            {collapsed ? '展开' : '收起'}
          </button>
          <button
            type="button"
            className="inline-flex h-7 items-center rounded-md border border-[var(--divider-soft)] px-2 text-[11.5px] text-[var(--color-ink)]/75 transition-colors hover:border-[var(--color-ink)]/30 hover:text-[var(--color-ink)]"
          >
            修改
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmed}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-[var(--color-ink)] px-2.5 text-[11.5px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Check size={11} strokeWidth={2} />
            {confirmed ? '已确认' : '确认'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-3 p-4">
          {detail.kind === 'image' && (
            <>
              <SubCard
                title="视觉描述"
                icon={<Eye size={11} strokeWidth={1.7} />}
              >
                <p className="text-[12.5px] leading-[1.7] text-[var(--color-ink)]/80">
                  主体居中，白底无干扰元素。红发短发，正面微笑表情，身着校服样式上衣。构图采用黄金分割，主体占画面 60%，适合作为卡牌正面立绘或头像。
                </p>
              </SubCard>
              <SubCard
                title="自动标签"
                icon={<Package size={11} strokeWidth={1.7} />}
              >
                <div className="flex flex-wrap gap-1.5">
                  {['一人', '正面', '微笑', '校服', '红发', '室内', '浅色背景', '二次元', '高饱和'].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="inline-flex h-5 items-center rounded bg-[#eff8ff] px-1.5 text-[11.5px] text-[#3370ff] dark:bg-sky-500/15 dark:text-sky-300"
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </SubCard>
              <SubCard
                title="OCR 文字"
                icon={<Type size={11} strokeWidth={1.7} />}
              >
                <p className="font-mono text-[12.5px] leading-[1.7] text-[var(--color-ink)]/80">
                  "@xxx  设计稿  v2"（右下水印）
                </p>
              </SubCard>
            </>
          )}

          {detail.kind === 'doc' && (
            <>
              <SubCard
                title="分段摘要"
                icon={<FileText size={11} strokeWidth={1.7} />}
              >
                <p className="text-[12.5px] leading-[1.7] text-[var(--color-ink)]/80">
                  全文 7 段，覆盖三代存储范式（块 / 文件 / 对象）的核心差异、典型场景、性能对比与迁移路径。已抽取 12 个实体（产品名 / 协议 / 指标）。
                </p>
              </SubCard>
              <SubCard
                title="实体抽取"
                icon={<Package size={11} strokeWidth={1.7} />}
              >
                <div className="flex flex-wrap gap-1.5">
                  {['S3', 'NFS', 'Ceph', 'POSIX', 'HDD', 'NVMe', 'IOPS', '吞吐'].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex h-5 items-center rounded bg-[#f1eef9] px-1.5 text-[11.5px] text-[#5720b7] dark:bg-violet-500/15 dark:text-violet-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </SubCard>
            </>
          )}

          {detail.kind === 'video' && (
            <>
              <SubCard
                title="关键帧"
                icon={<Video size={11} strokeWidth={1.7} />}
              >
                <p className="text-[12.5px] leading-[1.7] text-[var(--color-ink)]/80">
                  抽取 8 个关键帧（00:00 / 00:12 / 00:34 / 00:58 / 01:21 / 01:46 / 02:08 / 02:30），覆盖开场介绍、产品演示、对照测试与结尾总结。
                </p>
              </SubCard>
              <SubCard
                title="ASR 字幕"
                icon={<Type size={11} strokeWidth={1.7} />}
              >
                <p className="text-[12.5px] leading-[1.7] text-[var(--color-ink)]/80">
                  自动转写中文字幕共 138 行，含时间戳，识别置信度均值 0.92。
                </p>
              </SubCard>
            </>
          )}

          {detail.kind === 'code' && (
            <>
              <SubCard
                title="AST 解析"
                icon={<Type size={11} strokeWidth={1.7} />}
              >
                <p className="text-[12.5px] leading-[1.7] text-[var(--color-ink)]/80">
                  共 24 个模块，导出 86 个函数 / 12 个类。识别出 4 个入口点（CLI 命令）和 7 条公开 API。
                </p>
              </SubCard>
              <SubCard
                title="调用图"
                icon={<Package size={11} strokeWidth={1.7} />}
              >
                <p className="text-[12.5px] leading-[1.7] text-[var(--color-ink)]/80">
                  生成函数调用图（节点 86 / 边 213）。最热路径：cli.run → workflow.execute → storage.fetch。
                </p>
              </SubCard>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SubCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-[var(--fill-subtle)] p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--color-ink)]/70">
        <span className="text-[var(--color-ink)]/55">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  )
}

