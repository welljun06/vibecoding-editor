import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PhoneStatusBar from '@/modules/editor/components/preview/PhoneStatusBar'
import { getWorld } from '@/modules/editor/data/worlds'

/**
 * 第五人格塔罗运势小程序 — 手机内预览 UI
 *
 * 初始：3 张牌背朝上叠在一起。点一张 → 三张牌散开到各自槽位 + 点中的
 * 那张翻面 + 轻微放大。后续点未翻面的牌继续翻，直到全部揭晓。
 *
 * Cards are pinned to Identity V world assets so the mini-program reads
 * as 第五人格-themed regardless of which AI 分身 the user has selected.
 */
const CARD_LABELS = ['PAST', 'NOW', 'NEXT'] as const
const SCENE_BG = '/场景/约瑟夫暗房.png'

const CARD_W = 88
const CARD_H = 128
const CARD_GAP = 5

const IDENTITY_V_WORLD = getWorld('identity-v')
const IDENTITY_V_DEFAULT_CARDS = [
  ...(IDENTITY_V_WORLD.defaults.gallery ?? []),
  IDENTITY_V_WORLD.defaults.portraitUrl,
]
const CARD_POOL: string[] = IDENTITY_V_DEFAULT_CARDS.length > 0
  ? IDENTITY_V_DEFAULT_CARDS
  : ['/bg/identity-v-portrait.png']

export default function MiniAppPreview() {
  const deck = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => CARD_POOL[i % CARD_POOL.length])
  }, [])

  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false])

  const cards = useMemo(
    () =>
      Array.from(
        { length: 3 },
        (_, i) => deck[(i + shuffleSeed) % deck.length]
      ),
    [deck, shuffleSeed]
  )
  const anyFlipped = flipped.some(Boolean)
  const allFlipped = flipped.every(Boolean)

  const flipCard = (i: number) => {
    setFlipped((prev) => prev.map((v, idx) => (idx === i ? true : v)))
  }
  const reshuffle = () => {
    setFlipped([false, false, false])
    setShuffleSeed((s) => s + 1)
  }

  return (
    <div className="theme-dark-scope relative flex h-full w-full flex-col overflow-hidden text-[var(--color-ink)]">
      {/* ── Background scene ── */}
      <img
        aria-hidden
        src={SCENE_BG}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
      />
      {/* Progressive blur — three duplicate scene images each with a
           different CSS blur radius and mask band, stacked so the
           perceived blur amount ramps up smoothly from mid-screen to
           the bottom edge. Placed BEFORE the dark gradient layer so the
           gradient presses down their brightness. */}
      <img
        aria-hidden
        src={SCENE_BG}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
        style={{
          filter: 'blur(4px)',
          maskImage: 'linear-gradient(to bottom, transparent 35%, black 55%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 35%, black 55%)',
        }}
      />
      <img
        aria-hidden
        src={SCENE_BG}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
        style={{
          filter: 'blur(10px)',
          maskImage: 'linear-gradient(to bottom, transparent 50%, black 72%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 50%, black 72%)',
        }}
      />
      <img
        aria-hidden
        src={SCENE_BG}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
        style={{
          filter: 'blur(22px)',
          maskImage: 'linear-gradient(to bottom, transparent 68%, black 92%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 68%, black 92%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/55"
      />

      {/* ── Status bar ── */}
      <PhoneStatusBar />

      {/* ── Nav bar ── */}
      <div className="relative z-10 flex shrink-0 items-center justify-center py-2">
        <span className="text-[11px] font-medium text-[var(--color-ink)]/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
          第五人格 · 今日运势
        </span>
      </div>

      {/* ── Center stack: 牌 + 标题在剩余空间里垂直居中 ── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-3">

      {/* ── Tarot deck area — 未翻时堆叠，翻过后散开 ── */}
      <div
        className="relative flex shrink-0 justify-center"
        style={{ width: '100%', height: CARD_H + 12 }}
      >
        {cards.map((url, i) => {
          const isFlipped = flipped[i]

          // Stacked pile: 3 张近乎重合在中心，各自微小位移 + 旋转营造厚度
          const stackRot = [-4, 0, 4][i]
          const stackX = (i - 1) * 5 // -5 / 0 / +5
          const stackY = i * -2 // 最上面的 Next 略高

          // Drawn spread: 等间距排开；中间卡略抬起
          const spreadX = (i - 1) * (CARD_W + CARD_GAP)
          const spreadY = i === 1 ? -4 : 0
          const spreadRot = 0

          const tx = anyFlipped ? spreadX : stackX
          const ty = anyFlipped ? spreadY : stackY
          const rot = anyFlipped ? spreadRot : stackRot
          const scale = isFlipped ? 1.04 : 1

          // z-index: 刚翻开的牌提到最前；未动时按原堆叠顺序
          const zIndex = isFlipped ? 20 : 10 - i

          return (
            <button
              key={`${shuffleSeed}-${i}`}
              type="button"
              onClick={() => !flipped[i] && flipCard(i)}
              disabled={flipped[i]}
              aria-label={`翻开第 ${i + 1} 张牌`}
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                width: CARD_W,
                height: CARD_H,
                zIndex,
                perspective: '720px',
                transform: `translate(calc(-50% + ${tx}px), ${ty}px) rotate(${rot}deg) scale(${scale})`,
                transition:
                  'transform 520ms cubic-bezier(.33,1,.68,1)',
                ['--edge-alpha' as string]: isFlipped ? 0.38 : 0.22,
              }}
              className="glass-edge rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[inset_0_0.5px_0_rgba(255,255,255,0.16),0_12px_28px_-10px_rgba(0,0,0,0.65)] backdrop-blur-xl active:scale-[0.97]"
            >
              <div
                className="relative h-full w-full"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'transform 620ms cubic-bezier(.33,1,.68,1)',
                }}
              >
                {/* Back */}
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  <div className="absolute inset-1.5 rounded-xl border border-[#e8c97a]/25" />
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-[22px] text-[#e8c97a]/75 drop-shadow-[0_0_8px_rgba(232,201,122,0.4)]">
                      ✦
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-1.5 text-center text-[6px] tracking-[0.22em] text-[#e8c97a]/45">
                    TAROT
                  </div>
                </div>
                {/* Front */}
                <div
                  className="absolute inset-0 overflow-hidden rounded-2xl"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: '50% 15%' }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"
                  />
                  <div className="absolute inset-x-0 bottom-1.5 text-center text-[7px] font-medium tracking-[0.22em] text-[#e8c97a]/90">
                    {CARD_LABELS[i]}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Title + hint (below the deck, still centered) ── */}
      <div className="flex shrink-0 flex-col items-center gap-1 text-center">
        <h3 className="text-[15px] font-semibold text-[var(--color-ink)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          今日塔罗
        </h3>
        <p className="max-w-[92%] text-[11px] leading-relaxed text-[var(--color-ink)]/70">
          {!anyFlipped ? (
            <span className="whitespace-nowrap">
              点击牌堆，抽出今日的第一张牌
            </span>
          ) : allFlipped ? (
            '三张牌已为你显影 —— 过去、当下、下一张等你按下快门。'
          ) : (
            '继续点未翻开的牌，让约瑟夫的快门替你显影。'
          )}
        </p>
      </div>

      </div>

      {/* ── Action buttons ── */}
      <div className="relative z-10 flex flex-shrink-0 items-center gap-2 px-4 pb-7">
        <button
          type="button"
          onClick={reshuffle}
          style={{ ['--edge-alpha' as string]: 0.2 }}
          className="glass-edge flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-b from-white/[0.09] to-white/[0.02] py-2 text-[11px] text-[var(--color-ink)]/75 shadow-[inset_0_0.5px_0_rgba(255,255,255,0.18)] backdrop-blur-xl transition-colors hover:text-[var(--color-ink)]"
        >
          <RefreshCw size={11} strokeWidth={2} />
          重新抽卡
        </button>
        <button
          type="button"
          disabled={!allFlipped}
          className="flex-1 whitespace-nowrap rounded-full bg-[#e8c97a] py-2 text-[11px] font-medium text-[#0a0b0f] shadow-[0_4px_14px_-4px_rgba(232,201,122,0.55)] transition-opacity disabled:opacity-35 disabled:shadow-none"
        >
          查看运势详解
        </button>
      </div>
    </div>
  )
}
