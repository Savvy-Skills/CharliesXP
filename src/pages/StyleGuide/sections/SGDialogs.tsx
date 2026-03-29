import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { SectionShell } from '../SectionShell';

function Modal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(53,60,79,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: '#fff', border: '1px solid var(--sg-border)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--sg-font)', color: 'var(--sg-crimson)' }}>
                Unlock Southwark Zone
              </h3>
              <button onClick={onClose} style={{ color: 'var(--sg-navy)', opacity: 0.4 }}>
                <X size={20} />
              </button>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--sg-navy)', opacity: 0.7, fontFamily: 'var(--sg-font)' }}>
              Get access to 24 hand-picked restaurants, bars, and hidden gems in Southwark — personally visited and reviewed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ color: 'var(--sg-navy)', background: 'transparent', fontFamily: 'var(--sg-font)' }}
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--sg-crimson)', fontFamily: 'var(--sg-font)' }}
              >
                Unlock — £4.99
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function BottomSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(53,60,79,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed z-50 bottom-0 left-0 right-0 rounded-t-2xl p-6 shadow-2xl"
            style={{ background: '#fff', border: '1px solid var(--sg-border)' }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--sg-border)' }} />
            <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--sg-font)', color: 'var(--sg-crimson)' }}>
              Share this place
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--sg-navy)', opacity: 0.65, fontFamily: 'var(--sg-font)' }}>
              Share Borough Market with friends or save to your collection.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors" style={{ borderColor: 'var(--sg-border)', color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>Copy link</button>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--sg-crimson)', fontFamily: 'var(--sg-font)' }}>Share</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SGDialogs() {
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);

  return (
    <SectionShell id="dialogs" title="Dialogs">
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setModal(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--sg-crimson)', fontFamily: 'var(--sg-font)' }}
        >
          Open Modal Dialog
        </button>
        <button
          onClick={() => setSheet(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
          style={{ borderColor: 'var(--sg-border)', color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}
        >
          Open Bottom Sheet
        </button>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} />
      <BottomSheet open={sheet} onClose={() => setSheet(false)} />
    </SectionShell>
  );
}
