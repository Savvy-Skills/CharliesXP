import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[rgba(53,60,79,0.5)] backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-[90vw] max-w-lg max-h-[85vh] overflow-y-auto
              bg-white rounded-2xl shadow-2xl z-[201] custom-scrollbar"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full
                bg-[var(--sg-offwhite)] hover:bg-[var(--sg-border)] transition-colors z-10 cursor-pointer"
            >
              <X size={18} className="text-[var(--sg-navy)]/60" />
            </button>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
