import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  MessageSquarePlus,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Shuffle,
  Sparkles,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'

interface Props {
  initialSkill?: { id: string; name: string } | null
  onClose: () => void
}

type SkillView = 'code' | 'preview'

/** Skill create / edit page — mirrors VibeCoding's two-pane layout:
 *  chat aside on the left (with project header docked inside it), and
 *  a right card whose internal tab bar swaps between the code editor
 *  and the run-preview. No global top header strip. */
export default function SkillCreatePage({ initialSkill, onClose }: Props) {
  const [name, setName] = useState(initialSkill?.name ?? '未命名工具')
  const [view, setView] = useState<SkillView>('code')
  const [publishOpen, setPublishOpen] = useState(false)
  const publishBtnRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-[var(--color-surface-0)]">
      <ChatAside name={name} setName={setName} onClose={onClose} />
      <RightCard
        view={view}
        setView={setView}
        publishBtnRef={publishBtnRef}
        setPublishOpen={setPublishOpen}
      />
      <PublishPopover
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        anchorRef={publishBtnRef}
        skillName={name}
      />
    </div>
  )
}

/* ─── Left aside — project header + chat (mirrors VibeCoding's chat aside) */

function ChatAside({
  name,
  setName,
  onClose,
}: {
  name: string
  setName: (v: string) => void
  onClose: () => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const empty = messages.length === 0
  const SUGGESTIONS = [
    '帮我把抓取的 URL 改成支持批量并发',
    '加一个解析 markdown 内容的子函数',
    '把返回值改成 JSON Schema 校验过的',
  ]
  const send = (text: string) => {
    const t = text.trim()
    if (!t) return
    setMessages((prev) => [...prev, { role: 'user', text: t }])
    setDraft('')
  }
  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-[var(--divider-soft)] bg-[var(--color-surface-0)] lg:w-[300px] xl:w-[330px] 2xl:w-[360px]">
      {/* Project header — back / name / 重命名 / 草稿. No border-b: visually merges
       *  with the chat body below (mirrors VibeCoding's chat-aside header pattern). */}
      <div className="flex shrink-0 items-start gap-2 px-3 pt-3 pb-2">
        <button
          type="button"
          onClick={onClose}
          title="返回 Skills"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--color-ink)]/65 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft size={14} strokeWidth={1.8} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1.5">
            {renaming ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setRenaming(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') setRenaming(false)
                }}
                className="w-full min-w-0 border-b border-[var(--color-ink)]/40 bg-transparent text-[12.5px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-ink)]"
              />
            ) : (
              <span className="truncate text-[12.5px] font-medium text-[var(--color-ink)]/90">
                {name}
              </span>
            )}
            <button
              type="button"
              onClick={() => setRenaming((v) => !v)}
              title={renaming ? '完成' : '重命名'}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
            >
              <Pencil size={10} />
            </button>
            <span className="ml-0.5 inline-flex h-[18px] shrink-0 items-center rounded-full bg-[var(--fill-medium)] px-2 text-[10px] text-[var(--color-ink)]/70">
              草稿
            </span>
          </div>
          <span className="mt-0.5 text-[10.5px] text-[var(--color-ink)]/45">
            已自动保存 12:21:31
          </span>
        </div>
      </div>
      {/* Conversation sub-header — kept minimal under the project header */}
      <div className="flex h-7 shrink-0 items-center justify-between px-3">
        <span className="flex items-center gap-1 text-[10.5px] text-[var(--color-ink)]/45">
          新会话
          <ChevronDown size={10} className="text-[var(--color-ink)]/40" />
        </span>
        <button
          type="button"
          title="新会话"
          className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
        >
          <MessageSquarePlus size={11} strokeWidth={1.8} />
        </button>
      </div>
      {/* Messages */}
      <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4">
        {empty ? (
          <div className="m-auto flex max-w-[260px] flex-col items-center gap-3 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--fill-medium)] text-[var(--color-ink)]/55">
              <Sparkles size={15} strokeWidth={1.6} />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-[var(--color-ink)]">
                嗨，我帮你改这个 Skill
              </span>
              <span className="text-[11.5px] leading-[1.55] text-[var(--color-ink)]/55">
                你可以让我改代码、加变量、写文档，下面这些都可以直接试试
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full bg-[var(--fill-subtle)] px-2.5 py-1 text-[11px] text-[var(--color-ink)]/75 transition-colors hover:bg-[var(--fill-hover)] hover:text-[var(--color-ink)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[78%] rounded-2xl px-3 py-2 text-[12.5px] leading-[1.55] ${
                m.role === 'user'
                  ? 'ml-auto bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                  : 'mr-auto bg-[var(--fill-subtle)] text-[var(--color-ink)]/90'
              }`}
            >
              {m.text}
            </div>
          ))
        )}
      </div>
      {/* Composer */}
      <div className="shrink-0 px-3 pb-3">
        <div className="flex items-end gap-1.5 rounded-2xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)] p-2 transition-colors focus-within:border-[var(--color-ink)]/30">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(draft)
              }
            }}
            rows={2}
            placeholder="请输入，@ 引用资源"
            className="thin-scroll min-h-0 flex-1 resize-none bg-transparent px-1.5 py-1 text-[12.5px] leading-[1.55] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink)]/35"
          />
          <button
            type="button"
            onClick={() => send(draft)}
            disabled={!draft.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send size={12} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ─── Right card — tab header (代码 ↔ 预览) + tab content ─────────── */

function RightCard({
  view,
  setView,
  publishBtnRef,
  setPublishOpen,
}: {
  view: SkillView
  setView: (v: SkillView) => void
  publishBtnRef: React.RefObject<HTMLButtonElement | null>
  setPublishOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const TABS: { id: SkillView; label: string }[] = [
    { id: 'code', label: '代码' },
    { id: 'preview', label: '预览' },
  ]
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[var(--color-surface-0)]">
      {/* Tab header — view tabs on the left, action area on the right */}
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-[var(--divider-soft)] px-3">
        <div className="flex items-center">
          {TABS.map((t) => {
            const active = view === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setView(t.id)}
                className={`relative flex h-11 items-center px-3 text-[13px] transition-colors ${
                  active
                    ? 'font-medium text-[var(--color-ink)]'
                    : 'text-[var(--color-ink)]/55 hover:text-[var(--color-ink)]/85'
                }`}
              >
                {t.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-[var(--color-ink)]" />
                )}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-1">
          <span
            className="mr-2 hidden items-center gap-1.5 text-[11px] text-amber-400 xl:inline-flex"
            title="有尚未发布的更新"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            有尚未发布的更新
          </span>
          <span
            className="mr-1 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 xl:hidden"
            title="有尚未发布的更新"
          />
          <button
            ref={publishBtnRef}
            type="button"
            onClick={() => setPublishOpen((v) => !v)}
            className="flex h-7 items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-3 text-[12px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90 lg:px-4"
          >
            <Upload size={12} strokeWidth={2} />
            发布
          </button>
        </div>
      </div>
      {/* Tab content */}
      <div className="flex min-h-0 flex-1">
        {view === 'code' ? <CodeView /> : <PreviewView />}
      </div>
    </div>
  )
}

/* ─── Mock file tree (used by code view) ─────────────────────────── */

interface TreeNode {
  name: string
  kind: 'folder' | 'file'
  icon?: LucideIcon
  children?: TreeNode[]
}

const FILE_TREE: TreeNode[] = [
  {
    name: 'python_org_history',
    kind: 'folder',
    children: [
      { name: 'scripts', kind: 'folder', children: [
        { name: 'fetch_content.py', kind: 'file', icon: FileCode2 },
        { name: 'parse_pages.py', kind: 'file', icon: FileCode2 },
      ] },
      { name: 'references', kind: 'folder', children: [
        { name: 'api.md', kind: 'file', icon: FileText },
      ] },
      { name: 'README.md', kind: 'file', icon: FileText },
    ],
  },
  { name: 'manifest.yaml', kind: 'file', icon: FileText },
]

/* ─── Code view — file tabs + tree drawer + editor (lives inside the
 *  RightCard's 代码 tab). No outer border-r since the right card is now
 *  the rightmost surface. */

function CodeView() {
  const [openFiles] = useState<string[]>(['fetch_content.py'])
  const [active] = useState('fetch_content.py')
  const [treeOpen, setTreeOpen] = useState(true)
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* File tabs + inline tree toggle. Toggle sits right after the
       *  tabs (no ml-auto float) so the strip never has a lonely
       *  button on the right edge when the tree is closed. */}
      <div className="thin-scroll flex h-9 shrink-0 items-center overflow-x-auto border-b border-[var(--divider-soft)] bg-[var(--color-surface-1)]">
        {openFiles.map((f) => (
          <button
            key={f}
            type="button"
            className={`group flex h-9 shrink-0 items-center gap-1.5 border-r border-[var(--divider-soft)] px-3 text-[12px] ${
              f === active
                ? 'bg-[var(--color-surface-0)] text-[var(--color-ink)]'
                : 'text-[var(--color-ink)]/55 hover:bg-[var(--fill-soft)]'
            }`}
          >
            <Code2 size={11} className="text-[var(--color-ink)]/55" />
            <span>{f}</span>
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity hover:bg-[var(--color-ink)]/15 group-hover:opacity-100">
              <X size={9} strokeWidth={2} />
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTreeOpen((v) => !v)}
          title={treeOpen ? '收起项目文件' : '展开项目文件'}
          className={`flex h-9 shrink-0 items-center gap-1 border-r border-[var(--divider-soft)] px-2.5 text-[11.5px] transition-colors ${
            treeOpen
              ? 'bg-[var(--color-ink)]/[0.06] text-[var(--color-ink)]/75'
              : 'text-[var(--color-ink)]/55 hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]/80'
          }`}
        >
          <FolderOpen size={12} strokeWidth={1.7} />
          <span className="hidden md:inline">项目文件</span>
        </button>
      </div>
      {/* Body — code on left, file tree drawer on right when open */}
      <div className="flex min-h-0 flex-1">
        <div className="thin-scroll min-w-0 flex-1 overflow-auto bg-[var(--color-surface-0)] px-4 py-3">
          <pre className="select-text font-mono text-[12px] leading-[1.7] text-[var(--color-ink)]/85">{`# scripts/fetch_content.py
import requests
from typing import Iterable

def crawl(urls: Iterable[str]) -> list[dict]:
    """抓取一组 URL，返回结构化的页面记录。
    示例：
      crawl(["https://python.org/about/"])
    """
    results: list[dict] = []
    for url in urls:
        resp = requests.get(url, timeout=10)
        results.append({
            "url": url,
            "status": resp.status_code,
            "title": _extract_title(resp.text),
        })
    return results


def _extract_title(html: str) -> str:
    start = html.find("<title>")
    end = html.find("</title>", start)
    if start == -1 or end == -1:
        return ""
    return html[start + 7 : end].strip()
`}</pre>
        </div>
        {treeOpen && (
          <div className="flex w-[170px] shrink-0 flex-col border-l border-[var(--divider-soft)] bg-[var(--color-surface-0)]/50 xl:w-[200px] 2xl:w-[220px]">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--divider-soft)]/60 px-3">
              <span className="text-[10.5px] uppercase tracking-[0.06em] text-[var(--color-ink)]/45">
                项目文件
              </span>
              <button
                type="button"
                title="新建文件"
                className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
              >
                <Plus size={11} strokeWidth={2} />
              </button>
            </div>
            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
              <FileTreeList nodes={FILE_TREE} parent="" depth={0} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FileTreeList({ nodes, parent, depth }: { nodes: TreeNode[]; parent: string; depth: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(['python_org_history', 'python_org_history/scripts']),
  )
  return (
    <div className="flex flex-col">
      {nodes.map((n) => {
        const path = parent ? `${parent}/${n.name}` : n.name
        if (n.kind === 'folder') {
          const open = expanded.has(path)
          return (
            <div key={path}>
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev)
                    if (next.has(path)) next.delete(path)
                    else next.add(path)
                    return next
                  })
                }
                style={{ paddingLeft: 8 + depth * 12 }}
                className="flex w-full items-center gap-1.5 py-1 pr-2 text-left text-[12px] text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--fill-soft)]"
              >
                {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                {open ? <FolderOpen size={12} strokeWidth={1.7} /> : <Folder size={12} strokeWidth={1.7} />}
                <span className="truncate">{n.name}</span>
              </button>
              {open && n.children && (
                <FileTreeList nodes={n.children} parent={path} depth={depth + 1} />
              )}
            </div>
          )
        }
        const FIcon = n.icon ?? FileText
        const isActive = path === 'python_org_history/scripts/fetch_content.py'
        return (
          <button
            key={path}
            type="button"
            style={{ paddingLeft: 8 + depth * 12 + 14 }}
            className={`flex w-full items-center gap-1.5 py-1 pr-2 text-left text-[12px] transition-colors ${
              isActive
                ? 'bg-[var(--color-ink)]/[0.06] text-[var(--color-ink)]'
                : 'text-[var(--color-ink)]/75 hover:bg-[var(--fill-soft)]'
            }`}
          >
            <FIcon size={12} className="text-[var(--color-ink)]/55" strokeWidth={1.7} />
            <span className="truncate">{n.name}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Preview view — input / output / AI-recall snippet (lives inside
 *  the RightCard's 预览 tab; content centered in a comfortable column). */

function PreviewView() {
  const [urls, setUrls] = useState('https://python.org/about/\nhttps://python.org/community/')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<null | Array<{ url: string; status: number; title: string }>>(
    null,
  )
  const run = () => {
    setRunning(true)
    setOutput(null)
    setTimeout(() => {
      const lines = urls.split('\n').map((u) => u.trim()).filter(Boolean)
      setOutput(
        lines.map((u, i) => ({
          url: u,
          status: 200,
          title: i === 0 ? 'About Python.org' : 'Our Community | Python.org',
        })),
      )
      setRunning(false)
    }, 600)
  }
  const reset = () => {
    setUrls('')
    setOutput(null)
  }
  return (
    <div className="thin-scroll min-w-0 flex-1 overflow-y-auto bg-[var(--color-surface-0)]">
      <div className="mx-auto flex max-w-[640px] flex-col gap-3 p-4">
        {/* Mini toolbar — reset only (tab "预览" already labels this view) */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={reset}
            title="重置"
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[11.5px] text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
          >
            <RotateCcw size={11} strokeWidth={1.7} />
            重置
          </button>
        </div>
        {/* Input panel */}
        <div className="rounded-lg border border-[var(--divider-soft)] bg-[var(--color-surface-0)] p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11.5px] font-medium text-[var(--color-ink)]/80">
              输入参数
            </span>
            <span className="text-[10px] text-[var(--color-ink)]/45">urls: Iterable[str]</span>
          </div>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={4}
            placeholder="每行一个 URL"
            className="thin-scroll w-full resize-none rounded border border-[var(--divider-soft)] bg-[var(--color-surface-1)] p-2 font-mono text-[11.5px] leading-[1.6] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink)]/35 focus:border-[var(--color-ink)]/40"
          />
          <button
            type="button"
            onClick={run}
            disabled={running || !urls.trim()}
            className="mt-2 flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-[var(--color-ink)] text-[12px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Play size={11} strokeWidth={2} />
            {running ? '运行中…' : '运行'}
          </button>
        </div>
        {/* Output panel */}
        <div className="rounded-lg border border-[var(--divider-soft)] bg-[var(--color-surface-0)] p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11.5px] font-medium text-[var(--color-ink)]/80">
              返回结果
            </span>
            {output && (
              <span className="text-[10px] text-[var(--color-ink)]/45">
                {output.length} 行 · status 200
              </span>
            )}
          </div>
          {!output && !running && (
            <div className="grid h-32 place-items-center text-[11.5px] text-[var(--color-ink)]/35">
              点「运行」查看返回结果
            </div>
          )}
          {running && (
            <div className="grid h-32 place-items-center text-[11.5px] text-[var(--color-ink)]/55">
              正在抓取 …
            </div>
          )}
          {output && (
            <pre className="thin-scroll max-h-64 overflow-auto rounded bg-[var(--fill-subtle)] p-2 font-mono text-[11px] leading-[1.6] text-[var(--color-ink)]/85">
{JSON.stringify(output, null, 2)}
            </pre>
          )}
        </div>
        {/* Manifest snippet */}
        <div className="rounded-lg border border-[var(--divider-soft)] bg-[var(--color-surface-0)] p-3">
          <div className="mb-1.5 text-[11.5px] font-medium text-[var(--color-ink)]/80">
            被端上 AI 召回时的样子
          </div>
          <div className="rounded-md bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-3 ring-1 ring-violet-500/15">
            <div className="mb-1 flex items-center gap-1.5 text-[10.5px] text-violet-300/85">
              <Sparkles size={11} strokeWidth={1.8} />
              工具调用 · python_org 历史内容抓取
            </div>
            <div className="text-[11.5px] leading-[1.55] text-[var(--color-ink)]/85">
              「Python 3.12 主要更新有哪些？」→ AI 自动调用本 Skill 抓取 changelog 页面并总结。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Publish popover — flat form per latest Figma reference ─────── */

type PopoverTab = 'config' | 'history'
/** Config-tab inner phase — form for editing, progress for the live
 *  audit + 场景开通 timeline that opens after the user clicks 发布. */
type ConfigPhase = 'form' | 'progress'

function PublishPopover({
  open,
  onClose,
  anchorRef,
  skillName,
}: {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
  skillName: string
}) {
  const [tab, setTab] = useState<PopoverTab>('config')
  const [phase, setPhase] = useState<ConfigPhase>('form')

  useEffect(() => {
    if (!open) return
    setTab('config')
    // Preserve `phase` across open/close so a running submission still
    // shows progress when the user re-opens the popover.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  /* — popover positioning under the anchor — */
  const POPOVER_WIDTH = 680
  const GAP = 8
  let popoverStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: POPOVER_WIDTH,
    maxWidth: '94vw',
  }
  if (anchorRef.current) {
    const rect = anchorRef.current.getBoundingClientRect()
    const top = rect.bottom + GAP
    const right = Math.max(12, window.innerWidth - rect.right)
    popoverStyle = { position: 'fixed', top, right, width: POPOVER_WIDTH, maxWidth: '94vw' }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[290]"
          />
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{ ...popoverStyle, zIndex: 300 }}
            className="flex max-h-[86vh] flex-col overflow-hidden rounded-2xl border border-[var(--divider)] bg-[var(--color-surface-1)] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.55)]"
          >
            {/* Tabs */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--divider-soft)] px-4">
              <div className="flex items-center gap-4">
                {(
                  [
                    { id: 'config', label: '发布配置' },
                    { id: 'history', label: '发布历史' },
                  ] as const
                ).map((t) => {
                  const isActive = tab === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`relative h-12 text-[13px] transition-colors ${
                        isActive
                          ? 'font-semibold text-[var(--color-ink)]'
                          : 'text-[var(--color-ink)]/55 hover:text-[var(--color-ink)]/85'
                      }`}
                    >
                      {t.label}
                      {isActive && (
                        <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[var(--color-ink)]" />
                      )}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-ink)]/55 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
              >
                <X size={13} strokeWidth={2} />
              </button>
            </div>
            {/* Body */}
            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
              {tab === 'config' ? (
                phase === 'form' ? (
                  <PublishConfigForm skillName={skillName} />
                ) : (
                  <PublishProgressView />
                )
              ) : (
                <PublishHistoryList />
              )}
            </div>
            {/* Footer */}
            {tab === 'config' && phase === 'form' && (
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--divider-soft)] bg-[var(--color-surface-0)] px-4 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 rounded-md border border-[var(--divider)] bg-transparent px-4 text-[12px] text-[var(--color-ink)]/75 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('progress')}
                  className="h-8 rounded-md bg-[var(--color-ink)] px-4 text-[12px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90"
                >
                  发布
                </button>
              </div>
            )}
            {tab === 'config' && phase === 'progress' && (
              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[var(--divider-soft)] bg-[var(--color-surface-0)] px-4 py-3">
                <button
                  type="button"
                  onClick={() => setPhase('form')}
                  className="text-[12px] text-[var(--color-ink)]/55 transition-colors hover:text-[var(--color-ink)]"
                >
                  ← 返回配置
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 rounded-md bg-[var(--color-ink)] px-4 text-[12px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90"
                >
                  完成
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ─── Publish 配置 — flat form ─────────────────────────────────────── */

function PublishConfigForm({ skillName }: { skillName: string }) {
  const [name, setName] = useState(skillName.length > 0 ? skillName : '无资质医疗练习题生成器')
  const [desc, setDesc] = useState('文案文案')
  const [coverDesc, setCoverDesc] = useState('')
  // Icon picker is mock — dropdown not wired in v1, so the value is
  // const for now.
  const iconValue = '🔍'
  const NAME_MAX = 20
  const DESC_MAX = 140
  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Skill 名称 */}
      <CountedField label="Skill 名称" required>
        <CountedInput
          value={name}
          onChange={setName}
          max={NAME_MAX}
        />
      </CountedField>
      {/* Skill 描述 */}
      <CountedField label="Skill 描述">
        <CountedTextarea value={desc} onChange={setDesc} max={DESC_MAX} rows={3} />
      </CountedField>
      {/* Cover trio: left col (icon + 封面描述) | right col (大封面图) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          {/* 封面图标 */}
          <div>
            <FieldLabel>封面图标</FieldLabel>
            <button
              type="button"
              className="flex h-9 w-full items-center justify-between rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-0)] px-2.5 text-[12px] text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)]/30"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--fill-subtle)] text-[14px]">
                  {iconValue}
                </span>
              </span>
              <ChevronDown size={12} className="text-[var(--color-ink)]/45" />
            </button>
          </div>
          {/* 封面描述 + AI 帮写 */}
          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <FieldLabel>封面描述</FieldLabel>
              <button
                type="button"
                onClick={() => setCoverDesc('为不具备医疗资质的从业者快速生成练习题')}
                className="inline-flex h-5 items-center gap-1 rounded-full border border-violet-500/40 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 px-2 text-[10.5px] font-medium text-violet-300 transition-colors hover:from-violet-500/25 hover:to-fuchsia-500/25 theme-light:text-violet-700"
              >
                <Sparkles size={10} strokeWidth={2} />
                AI 帮写
              </button>
            </div>
            <input
              value={coverDesc}
              onChange={(e) => setCoverDesc(e.target.value)}
              placeholder="请输入"
              className="h-9 w-full rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-0)] px-2.5 text-[12px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink)]/35 focus:border-[var(--color-ink)]/40"
            />
          </div>
        </div>
        {/* Skill 封面 — 大渐变图 */}
        <div>
          <FieldLabel>Skill 封面</FieldLabel>
          <div className="relative h-[120px] w-full overflow-hidden rounded-md bg-gradient-to-br from-sky-300 via-sky-400 to-blue-500">
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/95 text-[var(--color-ink-contrast)] shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                <Search size={18} strokeWidth={2} className="text-[#0f1116]" />
              </span>
            </div>
            {/* Top-right action icons */}
            <div className="absolute right-2 top-2 flex items-center gap-1.5">
              <button
                type="button"
                title="随机切换"
                className="flex h-6 w-6 items-center justify-center rounded-md bg-white/80 text-[#0f1116] backdrop-blur transition-colors hover:bg-white"
              >
                <Shuffle size={11} strokeWidth={2} />
              </button>
              <button
                type="button"
                title="自定义封面"
                className="flex h-6 w-6 items-center justify-center rounded-md bg-white/80 text-[#0f1116] backdrop-blur transition-colors hover:bg-white"
              >
                <ImageIcon size={11} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* 发布场景 */}
      <div>
        <FieldLabel>发布场景</FieldLabel>
        <div className="rounded-lg border border-[var(--divider-soft)] bg-[var(--color-surface-0)] p-3">
          {/* 抖音 AI 工坊 */}
          <PlatformGroup label="抖音 AI 工坊">
            <ChannelCard
              label="空间 skill"
              desc="发布为空间 Skill，允许空间内所有用户使用"
              defaultOn
              fullWidth
            />
          </PlatformGroup>
          {/* 抖音小花 */}
          <PlatformGroup label="抖音小花" className="mt-3">
            <div className="grid grid-cols-2 gap-2">
              <ChannelCard
                label="抖音搜索"
                desc="允许抖音小花在抖音搜索内使用当前 Skill"
                defaultOn
              />
              <ChannelCard
                label="评论区（智能评论）"
                desc="允许抖音小花在评论区内使用当前 Skill"
              />
              <ChannelCard
                label="底 bar"
                desc="允许抖音小花在底 bar 场景内使用当前 Skill"
              />
              <ChannelCard
                label="抖音 IM"
                desc="允许抖音小花 IM 场景内使用当前 Skill"
              />
            </div>
          </PlatformGroup>
        </div>
      </div>
    </div>
  )
}

/* ─── Field primitives ──────────────────────────────────────────── */

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 flex items-baseline gap-1 text-[12px] font-medium text-[var(--color-ink)]/80">
      {children}
      {required && <span className="text-rose-400">*</span>}
    </label>
  )
}

function CountedField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
    </div>
  )
}

function CountedInput({
  value,
  onChange,
  max,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  max: number
  placeholder?: string
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-0)] px-2.5 pr-14 text-[12.5px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink)]/35 focus:border-[var(--color-ink)]/40"
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10.5px] text-[var(--color-ink)]/45">
        {value.length}/{max}
      </span>
    </div>
  )
}

function CountedTextarea({
  value,
  onChange,
  max,
  rows = 3,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  max: number
  rows?: number
  placeholder?: string
}) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder={placeholder}
        rows={rows}
        className="thin-scroll w-full resize-none rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-0)] p-2.5 pr-14 text-[12.5px] leading-[1.6] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink)]/35 focus:border-[var(--color-ink)]/40"
      />
      <span className="pointer-events-none absolute right-2.5 bottom-2 text-[10.5px] text-[var(--color-ink)]/45">
        {value.length}/{max}
      </span>
    </div>
  )
}

function Switch({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setOn((v) => !v)
      }}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        on ? 'bg-sky-500' : 'bg-[var(--fill-medium)]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function PlatformGroup({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 text-[11.5px] text-[var(--color-ink)]/55">{label}</div>
      {children}
    </div>
  )
}

function ChannelCard({
  label,
  desc,
  defaultOn = false,
  fullWidth = false,
}: {
  label: string
  desc: string
  defaultOn?: boolean
  fullWidth?: boolean
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-1)] p-3 ${
        fullWidth ? '' : ''
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[12.5px] font-medium text-[var(--color-ink)]">{label}</span>
        <span className="text-[10.5px] leading-[1.5] text-[var(--color-ink)]/55">{desc}</span>
      </div>
      <Switch defaultOn={defaultOn} />
    </div>
  )
}

/* ─── Publish 进度态 — step + timetree 样式 ──────────────────────────
 *  Two-level structure: numbered steps (① ② ③) as top-level "phases",
 *  with greyed sub-nodes hanging under each step. A single vertical
 *  rail runs through the step circle centers and connects everything. */

type NodeStatus = 'completed' | 'running' | 'pending' | 'failed'

interface SubStage {
  label: string
  status: NodeStatus
  time?: string  // 启动/完成时间 或 等待条件
}

interface ProgressSubNode {
  id: string
  label: string
  status: NodeStatus
  desc?: string               // 节点描述（审核范围等）— 场景节点已用 stages 表达，无需重复
  meta?: string               // 运行时信息（启动时间 / 完成时间）
  stages?: SubStage[]         // 内部子阶段（如场景：场景审核 → 场景开通）
  failReason?: string
}

interface ProgressStep {
  id: string
  label: string
  status: NodeStatus
  meta?: string  // e.g. 累计耗时：2min / 辅助说明文本
  children?: ProgressSubNode[]
}

const STATUS_LABEL: Record<NodeStatus, string> = {
  completed: '已完成',
  running: '进行中',
  pending: '待启动',
  failed: '审核失败',
}

/** Status pill — figma palette: emerald for 已完成, blue for 进行中,
 *  neutral grey for 待启动, rose for 审核失败. */
function progressPill(s: NodeStatus): string {
  const base = 'inline-flex h-[18px] items-center rounded px-1.5 text-[10.5px]'
  switch (s) {
    case 'completed':
      return `${base} bg-emerald-500/15 text-emerald-400 theme-light:bg-emerald-100 theme-light:text-emerald-700`
    case 'running':
      return `${base} bg-blue-500/15 text-blue-400 theme-light:bg-blue-100 theme-light:text-blue-700`
    case 'pending':
      return `${base} bg-[var(--fill-medium)] text-[var(--color-ink)]/55`
    case 'failed':
      return `${base} bg-rose-500/15 text-rose-400 theme-light:bg-rose-100 theme-light:text-rose-700`
  }
}

/** Sub-node dot — uniform soft grey across states (matches figma's
 *  consistent dot style on the child rail; status colour lives on
 *  the pill, not the dot). */
function subDotClass(_s: NodeStatus): string {
  return 'bg-[var(--fill-medium)] ring-1 ring-[var(--divider)]'
}

const MOCK_PROGRESS: ProgressStep[] = [
  {
    id: 'skill-audit',
    label: 'Skill 审核',
    status: 'completed',
    meta: '累计耗时：2min',
    children: [
      {
        id: 'safety',
        label: 'Skill 底线安全审核',
        status: 'completed',
        desc: '审核方：安全团队',
        meta: '开始时间：2026-05-25 14:33',
      },
      {
        id: 'basic',
        label: 'Skill 基础信息审核',
        status: 'completed',
        desc: '审核方：运营团队',
        meta: '开始时间：2026-05-25 14:35',
      },
    ],
  },
  {
    id: 'scene-open',
    label: '场景开通',
    status: 'running',
    children: [
      {
        id: 'search',
        label: '抖音小花–搜索场景',
        status: 'running',
        stages: [
          { label: '场景审核', status: 'running', time: '2026-05-25 14:35' },
          { label: '场景开通', status: 'running', time: '2026-05-25 14:35' },
        ],
      },
      {
        id: 'comment',
        label: '抖音小花–评论场景',
        status: 'running',
        stages: [
          { label: '场景审核', status: 'running', time: '2026-05-25 14:35' },
          { label: '场景开通', status: 'running', time: '2026-05-25 14:35' },
        ],
      },
      {
        id: 'bottombar',
        label: '抖音小花–底 bar 场景',
        status: 'running',
        stages: [
          { label: '场景审核', status: 'running', time: '2026-05-25 14:35' },
          { label: '场景开通', status: 'running', time: '2026-05-25 14:35' },
        ],
      },
      {
        id: 'im',
        label: '抖音小花–IM 场景',
        status: 'running',
        stages: [
          { label: '场景审核', status: 'running', time: '2026-05-25 14:35' },
          { label: '场景开通', status: 'running', time: '2026-05-25 14:35' },
        ],
      },
    ],
  },
  {
    id: 'release',
    label: '发布线上',
    status: 'pending',
    meta: '全部场景开通后，自动发布至线上正式环境',
  },
]

function PublishProgressView() {
  return (
    <div className="flex flex-col p-5">
      {/* Info banner — figma blue (informational, not warning) */}
      <div className="mb-5 flex items-center gap-2 rounded-md bg-blue-500/10 px-3 py-2 ring-1 ring-blue-500/20">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
          i
        </span>
        <span className="text-[11.5px] text-[var(--color-ink)]/75">
          发布流程进行中，可关闭弹窗稍后回来查看
        </span>
      </div>
      {/* Vertical rail runs through step circle centers (left:11px on a
       *  22px circle). Step circles sit at z-10 with solid bg so the
       *  rail naturally tucks behind them. */}
      <ol className="relative flex flex-col gap-6">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[11px] top-3 bottom-3 w-px bg-[var(--divider-soft)]"
        />
        {MOCK_PROGRESS.map((step, idx) => (
          <StepBlock key={step.id} step={step} index={idx + 1} />
        ))}
      </ol>
    </div>
  )
}

function StepBlock({ step, index }: { step: ProgressStep; index: number }) {
  const isPending = step.status === 'pending'
  return (
    <li className="relative">
      {/* Step status is conveyed entirely by the circle (color + glyph);
       *  no separate status pill next to the title. */}
      <div className="flex items-center gap-3">
        <StepCircle index={index} status={step.status} />
        <span
          className={`text-[14px] font-medium ${
            isPending ? 'text-[var(--color-ink)]/40' : 'text-[var(--color-ink)]'
          }`}
        >
          {step.label}
        </span>
      </div>
      {step.meta && (
        <div
          className={`mt-1 whitespace-pre-line pl-[34px] text-[11.5px] leading-[1.65] ${
            isPending ? 'text-[var(--color-ink)]/35' : 'text-[var(--color-ink)]/50'
          }`}
        >
          {step.meta}
        </div>
      )}
      {step.children && step.children.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3.5 pl-[34px]">
          {step.children.map((c) => (
            <SubNodeRow key={c.id} node={c} />
          ))}
        </ul>
      )}
    </li>
  )
}

function StepCircle({ index, status }: { index: number; status: NodeStatus }) {
  // Step circle itself encodes status — color + glyph replace the
  // separate status pill that used to sit next to the title.
  const base =
    'relative z-10 inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold'
  switch (status) {
    case 'completed':
      return (
        <span className={`${base} bg-emerald-500 text-white shadow-[0_0_0_2px_var(--color-surface-1)]`}>
          <Check size={12} strokeWidth={3} />
        </span>
      )
    case 'running':
      return (
        <span className={`${base} bg-[var(--color-ink)] text-[var(--color-bg)] theme-light:bg-[var(--color-ink)] theme-light:text-white`}>
          {index}
        </span>
      )
    case 'failed':
      return (
        <span className={`${base} bg-rose-500 text-white`}>
          <X size={12} strokeWidth={3} />
        </span>
      )
    case 'pending':
      return (
        <span className={`${base} bg-[var(--color-surface-1)] text-[var(--color-ink)]/40 ring-1 ring-[var(--divider)]`}>
          {index}
        </span>
      )
  }
}

function SubNodeRow({ node }: { node: ProgressSubNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${subDotClass(node.status)}`}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[var(--color-ink)]/85">{node.label}</span>
          {node.status !== 'pending' && (
            <span className={progressPill(node.status)}>{STATUS_LABEL[node.status]}</span>
          )}
        </div>
        {/* Audit / opening info — single line with ｜ separator
         *  between fields (matches figma's child-row format). */}
        {(node.desc || node.meta) && (
          <div className="mt-1 text-[11.5px] text-[var(--color-ink)]/45">
            {node.desc}
            {node.desc && node.meta && (
              <span className="mx-2 text-[var(--color-ink)]/25">｜</span>
            )}
            {node.meta}
          </div>
        )}
        {/* Stages — figma format: single line per stage,
         *  "{阶段}：{状态} ｜ 开始时间：{date}" in plain grey text. */}
        {node.stages && node.stages.length > 0 && (
          <div className="mt-1 flex flex-col">
            {node.stages.map((s) => (
              <div
                key={s.label}
                className="text-[11.5px] text-[var(--color-ink)]/45"
              >
                <span>{s.label}：{STATUS_LABEL[s.status]}</span>
                {s.time && (
                  <>
                    <span className="mx-2 text-[var(--color-ink)]/25">｜</span>
                    <span>开始时间：{s.time}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {node.failReason && (
          <div className="mt-1.5 rounded-md bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-300 ring-1 ring-rose-500/25 theme-light:text-rose-700">
            失败原因：{node.failReason}
          </div>
        )}
      </div>
    </li>
  )
}

/* ─── Publish 历史 — mock list ─────────────────────────────────────── */

interface MockJob {
  id: string
  title: string
  status: 'succeeded' | 'running' | 'failed'
  scenes: string[]
  ts: string
  by: string
}

const MOCK_JOBS: MockJob[] = [
  {
    id: 'PUB-12',
    title: 'v1.3 · 加入 NBA 别名识别',
    status: 'succeeded',
    scenes: ['抖音 AI 工坊 · 空间 skill', '抖音小花 · 抖音搜索'],
    ts: '2026-05-22 14:32',
    by: '你',
  },
  {
    id: 'PUB-11',
    title: 'v1.2 · 文案优化',
    status: 'succeeded',
    scenes: ['抖音 AI 工坊 · 空间 skill'],
    ts: '2026-05-18 10:11',
    by: '你',
  },
  {
    id: 'PUB-10',
    title: 'v1.1 · 接入抖音搜索灰度',
    status: 'failed',
    scenes: ['抖音小花 · 抖音搜索'],
    ts: '2026-05-12 16:45',
    by: '你',
  },
]

function PublishHistoryList() {
  return (
    <div className="flex flex-col p-3">
      {MOCK_JOBS.map((j) => (
        <div
          key={j.id}
          className="mb-2 flex items-start gap-3 rounded-lg border border-[var(--divider-soft)] bg-[var(--color-surface-0)] p-3"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[12.5px] font-medium text-[var(--color-ink)]">{j.title}</span>
              <span className="text-[10.5px] text-[var(--color-ink)]/45">{j.id}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {j.scenes.map((s) => (
                <span
                  key={s}
                  className="rounded bg-[var(--fill-subtle)] px-1.5 py-0.5 text-[10.5px] text-[var(--color-ink)]/70 ring-1 ring-[var(--divider-soft)]"
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="text-[10.5px] text-[var(--color-ink)]/45">
              {j.by} · {j.ts}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] ${
              j.status === 'succeeded'
                ? 'bg-emerald-500/15 text-emerald-300 theme-light:bg-emerald-500/15 theme-light:text-emerald-700'
                : j.status === 'failed'
                  ? 'bg-rose-500/15 text-rose-300 theme-light:bg-rose-500/15 theme-light:text-rose-700'
                  : 'bg-amber-500/15 text-amber-300 theme-light:bg-amber-500/15 theme-light:text-amber-700'
            }`}
          >
            {j.status === 'succeeded' ? '已发布' : j.status === 'failed' ? '失败' : '进行中'}
          </span>
        </div>
      ))}
    </div>
  )
}
