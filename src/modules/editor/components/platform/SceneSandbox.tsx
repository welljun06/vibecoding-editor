import { useState } from 'react'
import {
  ArrowLeft,
  Bookmark,
  Heart,
  Home,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Play,
  Plus,
  Search,
  Send,
  Share2,
  Sparkles,
  Tv,
  User,
} from 'lucide-react'
import type { Artifact } from '../../store/artifact-store'
import { getPlatform, getScene, parseTargetId } from '../../store/publish-flow-store'

interface Props {
  artifact: Artifact
}

/** Right-rail preview for `scene-card` artifacts. Picks a sandbox based on
 *  the artifact's first publish target (the canonical scene). Falls back
 *  to a generic card preview when no target is set yet. */
export default function SceneSandbox({ artifact }: Props) {
  const primaryTarget = artifact.targets[0]
  const scene = primaryTarget ? getScene(primaryTarget) : undefined
  const platform = scene ? getPlatform(scene.platformId) : undefined

  const [activeTargetId, setActiveTargetId] = useState<string | null>(primaryTarget ?? null)
  const activeScene = activeTargetId ? getScene(activeTargetId) : scene
  const activePlatform = activeScene ? getPlatform(activeScene.platformId) : platform

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--divider-soft)] bg-[var(--color-surface-1)] px-4 py-2">
        <div className="flex items-center gap-1.5">
          <Sparkles size={11} strokeWidth={1.6} className="text-[var(--color-ink)]/55" />
          <span className="text-[11px] text-[var(--color-ink)]/55">场景沙盒预览 · </span>
          <span className="text-[11.5px] font-medium text-[var(--color-ink)]">
            {activePlatform?.label ?? '—'} · {activeScene?.label ?? '请先选择投放目标'}
          </span>
        </div>
        {artifact.targets.length > 1 && (
          <select
            value={activeTargetId ?? ''}
            onChange={(e) => setActiveTargetId(e.target.value || null)}
            className="h-7 rounded-md border border-[var(--divider-soft)] bg-[var(--color-surface-0)] px-2 text-[11px] text-[var(--color-ink)]/85 outline-none"
          >
            {artifact.targets.map((t) => {
              const { platformId } = parseTargetId(t)
              const sc = getScene(t)
              const pl = getPlatform(platformId)
              return (
                <option key={t} value={t}>
                  {pl?.label} · {sc?.label}
                </option>
              )
            })}
          </select>
        )}
      </div>
      <div className="thin-scroll flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-[var(--color-surface-0)] p-4">
        {!activeScene ? (
          <NoTargetState />
        ) : activeScene.platformId === 'douyin-xiaohua' && activeScene.id === 'search' ? (
          <SearchSandbox artifact={artifact} />
        ) : activeScene.platformId === 'douyin-xiaohua' && activeScene.id === 'bottom-bar' ? (
          <BottomBarSandbox artifact={artifact} />
        ) : activeScene.platformId === 'douyin' && activeScene.id === 'comment' ? (
          <CommentSandbox artifact={artifact} />
        ) : activeScene.platformId === 'douyin-xiaohua' && activeScene.id === 'comment' ? (
          <CommentSandbox artifact={artifact} variant="xiaohua" />
        ) : activeScene.id === 'im' || activeScene.id === 'dm' || activeScene.id === 'group' ? (
          <ImSandbox artifact={artifact} />
        ) : activeScene.id === 'ai-chat' ? (
          <AiChatSandbox artifact={artifact} />
        ) : (
          <GenericCardPreview artifact={artifact} />
        )}
      </div>
    </div>
  )
}

/* ─── No target ──────────────────────────────────────────────────────── */

function NoTargetState() {
  return (
    <div className="flex max-w-[320px] flex-col items-center gap-2 text-center">
      <Sparkles size={20} strokeWidth={1.4} className="text-[var(--color-ink)]/40" />
      <span className="text-[12.5px] text-[var(--color-ink)]/55">
        在「投放目标」勾选一个 (平台 × 场景)，
        <br />
        这里就会渲染该场景的沙盒预览。
      </span>
    </div>
  )
}

/* ─── Common phone-frame chrome ──────────────────────────────────────── */

function PhoneFrame({
  children,
  hint,
}: {
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex h-[640px] w-[300px] flex-col overflow-hidden rounded-[34px] bg-black shadow-[0_20px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
        style={{ boxShadow: '0 22px 56px -12px rgba(0,0,0,0.55)' }}
      >
        <div className="flex h-7 shrink-0 items-center justify-between px-4 pt-2 text-[10.5px] text-white/85">
          <span>9:41</span>
          <span className="font-medium tracking-[0.04em]">• • •</span>
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
      {hint && <span className="text-[10.5px] text-[var(--color-ink)]/45">{hint}</span>}
    </div>
  )
}

/* ─── 抖音小花 · 搜索结果页 ─────────────────────────────────────────── */

function SearchSandbox({ artifact }: { artifact: Artifact }) {
  // Demo card content — for a 比分卡 we project canonical fields onto the
  // recall preview text. Real product would render the artifact's
  // declared layout slots.
  const isScoreCard = /比分|score/i.test(artifact.name)
  return (
    <PhoneFrame hint="抖音小花 · 搜索结果页">
      <div className="flex h-full flex-col bg-[#0f0f12] text-white">
        {/* Search bar */}
        <div className="flex items-center gap-2 px-3 pb-2 pt-1">
          <ArrowLeft size={15} strokeWidth={2} className="text-white/75" />
          <div className="flex flex-1 items-center gap-1 rounded-full bg-white/8 px-3 py-1.5 ring-1 ring-white/10">
            <Search size={11} strokeWidth={2} className="text-white/45" />
            <span className="text-[11.5px] text-white">湖人 vs 凯尔特人</span>
          </div>
          <span className="text-[11px] text-white/55">搜索</span>
        </div>
        {/* Filters */}
        <div className="flex gap-2 px-3 pb-2">
          {['综合', 'AI回答', '视频', '用户', '直播'].map((t, i) => (
            <span
              key={t}
              className={`rounded-full px-2 py-0.5 text-[10.5px] ${
                i === 1 ? 'bg-white text-black' : 'bg-white/8 text-white/70'
              }`}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {/* AI recall card */}
          <div className="mb-3 rounded-2xl bg-gradient-to-br from-[#1d1f2a] to-[#13131a] p-3 ring-1 ring-white/10">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-500">
                <Sparkles size={10} className="text-white" strokeWidth={2.2} />
              </span>
              <span className="text-[10.5px] text-white/65">AI 召回 · {artifact.name}</span>
              <span className="ml-auto text-[9.5px] text-white/35">由 端上 AI 渲染</span>
            </div>
            {isScoreCard ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Team name="湖人" abbr="LAL" color="#552583" score={112} />
                  <span className="px-2 text-[9.5px] text-white/45">第 4 节 终</span>
                  <Team name="凯尔特人" abbr="BOS" color="#007A33" score={108} />
                </div>
                <div className="border-t border-white/10 pt-2 text-[10.5px] text-white/65">
                  关键进球：詹姆斯 · 三分 · 04:12 · 反超
                </div>
                <button className="flex h-7 w-full items-center justify-center gap-1 rounded-full bg-white text-[11px] font-medium text-black">
                  <Play size={10} strokeWidth={2.5} />
                  看直播回放
                </button>
              </div>
            ) : (
              <div className="text-[11.5px] leading-[1.6] text-white/85">{artifact.render.preview}</div>
            )}
          </div>
          {/* Organic results */}
          {[
            { title: '湖人 112-108 凯尔特人 全场集锦', src: '篮球速报', stat: '12.4 万播放' },
            { title: '詹姆斯赛后采访：感谢队友', src: 'NBA官方', stat: '5.6 万播放' },
            { title: '凯尔特人输球关键三球分析', src: '战术解码', stat: '2.1 万播放' },
          ].map((r) => (
            <div
              key={r.title}
              className="mb-2 flex gap-2 rounded-lg bg-white/3 p-2"
            >
              <div className="h-14 w-20 shrink-0 rounded bg-white/8" />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <span className="line-clamp-2 text-[11.5px] text-white/95">{r.title}</span>
                <span className="text-[9.5px] text-white/50">{r.src} · {r.stat}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  )
}

function Team({ name, abbr, color, score }: { name: string; abbr: string; color: string; score: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {abbr}
      </span>
      <span className="text-[10px] text-white/65">{name}</span>
      <span className="text-[18px] font-semibold tabular-nums text-white">{score}</span>
    </div>
  )
}

/* ─── 抖音小花 · 底 bar ─────────────────────────────────────────────── */

function BottomBarSandbox({ artifact }: { artifact: Artifact }) {
  return (
    <PhoneFrame hint="抖音小花 · 底 bar 唤起">
      <div className="flex h-full flex-col bg-[#0f0f12] text-white">
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <span className="text-[12.5px] font-semibold">抖音小花</span>
          <MoreHorizontal size={15} className="text-white/65" />
        </div>
        {/* Fake content */}
        <div className="flex-1 px-3">
          <div className="mt-3 h-32 rounded-2xl bg-gradient-to-br from-pink-400/15 to-violet-500/15" />
          <div className="mt-3 h-20 rounded-xl bg-white/5" />
          <div className="mt-3 h-20 rounded-xl bg-white/5" />
        </div>
        {/* Bottom bar with AI affordance */}
        <div className="shrink-0 border-t border-white/10 bg-[#13131a] px-2 pb-3 pt-2">
          {/* AI suggestion popping out of the AI tab */}
          <div className="mb-2 rounded-2xl bg-gradient-to-br from-[#1c1d27] to-[#15151c] p-3 ring-1 ring-white/10">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-500">
                <Sparkles size={9} className="text-white" strokeWidth={2.4} />
              </span>
              <span className="text-[10px] text-white/65">AI 助手 · {artifact.name}</span>
            </div>
            <div className="text-[11.5px] leading-[1.55] text-white/85">{artifact.render.preview}</div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px] text-white/60">
            {[
              { i: <Home size={14} />, l: '首页' },
              { i: <Tv size={14} />, l: '直播' },
              {
                i: (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-500">
                    <Sparkles size={11} className="text-white" strokeWidth={2.4} />
                  </span>
                ),
                l: 'AI 助手',
                active: true,
              },
              { i: <User size={14} />, l: '我' },
            ].map((t) => (
              <div key={t.l} className={`flex flex-col items-center gap-0.5 ${t.active ? 'text-white' : ''}`}>
                {t.i}
                <span>{t.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

/* ─── 抖音 / 抖音小花 · 评论区 ────────────────────────────────────── */

function CommentSandbox({ artifact, variant = 'douyin' }: { artifact: Artifact; variant?: 'douyin' | 'xiaohua' }) {
  return (
    <PhoneFrame hint={`${variant === 'xiaohua' ? '抖音小花' : '抖音 APP'} · 评论区`}>
      <div className="flex h-full flex-col bg-black text-white">
        {/* Video preview */}
        <div className="relative h-40 shrink-0 bg-gradient-to-br from-fuchsia-700/40 via-violet-800/40 to-indigo-900/40">
          <div className="absolute bottom-2 left-3 right-3">
            <div className="text-[11px] text-white/90">@时尚博主小米</div>
            <div className="text-[10px] text-white/65">夏日穿搭｜清凉系套装合集 🌊</div>
          </div>
        </div>
        {/* Comments */}
        <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-3 py-2 text-[11px] text-white/75">
          <span>评论 1.2 万</span>
          <span className="text-white/45">按时间</span>
        </div>
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {/* User comment */}
          <CommentRow
            avatar="bg-amber-500/30"
            name="小可爱"
            time="2 分钟前"
            body="姐姐这身搭配在哪里买的呀～"
          />
          {/* AI recall comment */}
          <div className="my-2 rounded-2xl bg-gradient-to-br from-[#1c1d27] to-[#15151c] p-3 ring-1 ring-white/10">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-500">
                <Sparkles size={9} className="text-white" strokeWidth={2.4} />
              </span>
              <span className="text-[10px] text-white/65">AI 召回 · {artifact.name}</span>
              <span className="ml-auto text-[9px] text-white/35">由楼主置顶</span>
            </div>
            <div className="text-[11px] leading-[1.55] text-white/90">{artifact.render.preview}</div>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-white/55">
              <span className="inline-flex items-center gap-0.5"><Heart size={10} /> 286</span>
              <span className="inline-flex items-center gap-0.5"><MessageCircle size={10} /> 12</span>
              <span className="ml-auto text-white/35">回复</span>
            </div>
          </div>
          <CommentRow
            avatar="bg-emerald-500/30"
            name="蓝橙"
            time="5 分钟前"
            body="冲冲冲，太好看了😍"
          />
          <CommentRow
            avatar="bg-violet-500/30"
            name="阿白"
            time="8 分钟前"
            body="求链接！"
          />
        </div>
        {/* Composer */}
        <div className="flex shrink-0 items-center gap-2 border-t border-white/10 bg-[#13131a] px-3 py-2">
          <div className="flex-1 rounded-full bg-white/8 px-3 py-1.5 text-[10.5px] text-white/55">
            说点什么…
          </div>
          <Heart size={14} className="text-white/70" />
          <Share2 size={14} className="text-white/70" />
        </div>
      </div>
    </PhoneFrame>
  )
}

function CommentRow({ avatar, name, time, body }: { avatar: string; name: string; time: string; body: string }) {
  return (
    <div className="flex gap-2 py-2">
      <div className={`h-7 w-7 shrink-0 rounded-full ${avatar}`} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] text-white/85">{name}</span>
          <span className="text-[9.5px] text-white/40">{time}</span>
        </div>
        <span className="text-[11px] text-white/85">{body}</span>
      </div>
    </div>
  )
}

/* ─── IM (私信 / 群聊 / 抖音小花 IM) ─────────────────────────────── */

function ImSandbox({ artifact }: { artifact: Artifact }) {
  return (
    <PhoneFrame hint="私信 / 群聊 · 富卡片">
      <div className="flex h-full flex-col bg-[#0f0f12] text-white">
        <div className="flex shrink-0 items-center gap-2 px-3 py-2">
          <ArrowLeft size={14} className="text-white/75" />
          <div className="flex flex-col">
            <span className="text-[11.5px] font-semibold">小花助手</span>
            <span className="text-[9.5px] text-white/50">在线</span>
          </div>
          <MoreHorizontal size={14} className="ml-auto text-white/65" />
        </div>
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <Bubble side="them" body="今天吃啥？" />
          <Bubble side="me" body="不知道 来点推荐" />
          {/* AI recall card */}
          <div className="my-2 ml-auto max-w-[80%] rounded-2xl bg-gradient-to-br from-[#1c1d27] to-[#15151c] p-3 text-left ring-1 ring-white/10">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-500">
                <Sparkles size={9} className="text-white" strokeWidth={2.4} />
              </span>
              <span className="text-[10px] text-white/65">AI 召回 · {artifact.name}</span>
            </div>
            <div className="text-[11.5px] leading-[1.55] text-white/90">{artifact.render.preview}</div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {['麻辣烫', '湘菜小馆', '日料 omakase'].map((m) => (
                <div
                  key={m}
                  className="flex w-32 shrink-0 flex-col rounded-lg bg-white/5 p-2 ring-1 ring-white/10"
                >
                  <div className="h-16 rounded bg-white/5" />
                  <span className="mt-1 text-[10.5px] text-white/85">{m}</span>
                  <span className="text-[9.5px] text-white/50">距你 1.2 km · 4.6 ⭐</span>
                </div>
              ))}
            </div>
            <button className="mt-2 h-7 w-full rounded-full bg-white text-[11px] font-medium text-black">
              一键导航
            </button>
          </div>
        </div>
        {/* Composer */}
        <div className="flex shrink-0 items-center gap-2 border-t border-white/10 bg-[#13131a] px-3 py-2">
          <Plus size={14} className="text-white/65" />
          <div className="flex-1 rounded-full bg-white/8 px-3 py-1.5 text-[10.5px] text-white/55">
            说点什么…
          </div>
          <Send size={14} className="text-white/85" />
        </div>
      </div>
    </PhoneFrame>
  )
}

function Bubble({ side, body }: { side: 'me' | 'them'; body: string }) {
  const me = side === 'me'
  return (
    <div className={`my-1 flex ${me ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-1.5 text-[11.5px] leading-[1.55] ${
          me ? 'bg-white text-black' : 'bg-white/10 text-white/95'
        }`}
      >
        {body}
      </div>
    </div>
  )
}

/* ─── 抖音 APP · AI 聊天个人页入口 ─────────────────────────────── */

function AiChatSandbox({ artifact }: { artifact: Artifact }) {
  return (
    <PhoneFrame hint="抖音 APP · 个人页 AI 聊天入口">
      <div className="flex h-full flex-col bg-[#0f0f12] text-white">
        <div className="h-36 shrink-0 bg-gradient-to-br from-fuchsia-700/50 via-violet-800/40 to-indigo-900/40" />
        <div className="relative px-4 pt-3">
          <div className="absolute -top-10 left-4 h-16 w-16 rounded-full bg-gradient-to-br from-amber-300 to-rose-500 ring-2 ring-[#0f0f12]" />
          <div className="ml-20">
            <div className="text-[13px] font-semibold">@阿白的 AI 分身</div>
            <div className="text-[10.5px] text-white/55">粉丝 12.3 万 · 获赞 88 万</div>
          </div>
        </div>
        <div className="px-4 pt-3">
          <div className="rounded-2xl bg-gradient-to-br from-[#1c1d27] to-[#15151c] p-3 ring-1 ring-white/10">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-500">
                <Sparkles size={9} className="text-white" strokeWidth={2.4} />
              </span>
              <span className="text-[10px] text-white/65">{artifact.name} · 在线</span>
            </div>
            <div className="text-[11px] leading-[1.55] text-white/90">{artifact.render.preview}</div>
            <button className="mt-3 h-8 w-full rounded-full bg-white text-[11.5px] font-medium text-black">
              开始对话
            </button>
          </div>
        </div>
        <div className="mt-auto flex shrink-0 items-center justify-around border-t border-white/10 bg-[#13131a] py-2 text-[10px] text-white/55">
          <Music2 size={14} />
          <Search size={14} />
          <Bookmark size={14} />
          <Heart size={14} />
        </div>
      </div>
    </PhoneFrame>
  )
}

/* ─── Generic fallback ──────────────────────────────────────────────── */

function GenericCardPreview({ artifact }: { artifact: Artifact }) {
  return (
    <PhoneFrame hint="通用卡片预览">
      <div className="flex h-full flex-col items-center justify-center bg-[#0f0f12] p-4 text-white">
        <div className="rounded-2xl bg-gradient-to-br from-[#1c1d27] to-[#15151c] p-4 ring-1 ring-white/10">
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles size={10} className="text-pink-300" />
            <span className="text-[10px] text-white/65">{artifact.name}</span>
          </div>
          <div className="text-[11.5px] leading-[1.55] text-white/85">{artifact.render.preview}</div>
        </div>
      </div>
    </PhoneFrame>
  )
}
