import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Database, X } from 'lucide-react'
import DatabaseModule from './DatabaseModule'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
}

/** Right-side slide-in drawer hosting the project's database module.
 *  Primary database entry point in condensed scheme (where 数据库 was
 *  removed from the tab strip); quick-access shortcut in detailed.
 *
 *  Width auto-fits to a comfortable read width but caps at 88% of
 *  viewport on small screens. Close affordances: ESC key, X button,
 *  backdrop click. */
export default function DatabaseOverlay({ open, onClose, projectId }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[290] flex justify-end bg-black/45 backdrop-blur-[2px]"
        >
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="my-3 mr-3 flex w-[min(900px,88vw)] flex-col overflow-hidden rounded-2xl border border-[var(--divider)] bg-[var(--color-surface-1)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)]"
          >
            <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--divider-soft)] bg-[var(--color-surface-1)] px-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-ink)]">
                <Database size={14} strokeWidth={1.7} />
                数据库
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-ink)]/60 transition-colors hover:bg-[var(--fill-soft)] hover:text-[var(--color-ink)]"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </header>
            <div className="flex min-h-0 flex-1">
              <DatabaseModule projectId={projectId} />
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
