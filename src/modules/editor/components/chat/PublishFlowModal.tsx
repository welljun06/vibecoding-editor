import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { usePersonaStore } from '../../store/persona-store'
import { usePublishFlowStore } from '../../store/publish-flow-store'
import PublishForm from './PublishForm'

/** Popover-style publish flow — anchored under the trigger button that
 *  opened it (its rect is recorded in `publishFlowStore.anchorRect`).
 *  Falls back to a centered modal position when no anchor is recorded
 *  (e.g. an older code path that still calls `start('modal')` without
 *  setting the rect). */
export default function PublishFlowModal() {
  const step = usePublishFlowStore((s) => s.step)
  const mode = usePublishFlowStore((s) => s.mode)
  const scenes = usePublishFlowStore((s) => s.scenes)
  const anchorRect = usePublishFlowStore((s) => s.anchorRect)
  const toggleScene = usePublishFlowStore((s) => s.toggleScene)
  const submit = usePublishFlowStore((s) => s.submit)
  const confirm = usePublishFlowStore((s) => s.confirm)
  const closeModal = usePublishFlowStore((s) => s.closeModal)
  const personaName = usePersonaStore((s) => s.name)
  const personaPortrait = usePersonaStore((s) => s.portraitUrl)

  const open = mode === 'modal' && step !== 'idle'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeModal])

  if (typeof document === 'undefined') return null

  /* — popover positioning —
   * Right-align the popover to the trigger button's right edge (so it
   * doesn't run off the right side of the viewport) and sit it
   * directly below the button with an 8px gap. If no anchor is
   * recorded we fall through to a centered position. */
  const POPOVER_WIDTH = 520
  const GAP = 8
  let popoverStyle: React.CSSProperties
  if (anchorRect) {
    const top = anchorRect.bottom + GAP
    const right = Math.max(12, window.innerWidth - anchorRect.right)
    popoverStyle = { position: 'fixed', top, right, width: POPOVER_WIDTH, maxWidth: '92vw' }
  } else {
    popoverStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: POPOVER_WIDTH,
      maxWidth: '92vw',
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Transparent click-catcher — closes on outside click without
               dimming the background (popover semantics, not modal). */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeModal}
            className="fixed inset-0 z-[290]"
          />
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{ ...popoverStyle, zIndex: 300 }}
            className="overflow-hidden rounded-2xl border border-[var(--divider)] bg-[var(--color-surface-1)] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--divider-soft)] px-5 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-[var(--color-ink)]">发布</span>
                <span className="text-[10.5px] text-[var(--color-ink)]/55">
                  选择场景，确认发布信息
                </span>
              </div>
            </div>
            <div className="px-5 pb-5 pt-3">
              <PublishForm
                step={step as 'select' | 'review' | 'confirmed'}
                scenes={scenes}
                personaName={personaName}
                personaPortrait={personaPortrait}
                onToggle={toggleScene}
                onSubmit={submit}
                onConfirm={confirm}
                variant="modal"
              />
              {step === 'confirmed' && (
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-4 w-full rounded-md bg-[var(--color-ink)] px-3 py-2 text-[12px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90"
                >
                  完成
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
