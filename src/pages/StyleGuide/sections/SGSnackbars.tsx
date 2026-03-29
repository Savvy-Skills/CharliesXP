import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { SectionShell } from '../SectionShell';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const config: Record<ToastType, { bg: string; color: string; Icon: typeof CheckCircle2; label: string }> = {
  success: { bg: '#F0FDF4', color: 'rgb(22,163,74)', Icon: CheckCircle2, label: 'Success' },
  error:   { bg: '#FEF2F2', color: 'rgb(220,38,38)', Icon: AlertCircle, label: 'Error' },
  warning: { bg: '#FFFBEB', color: 'rgb(161,98,7)', Icon: AlertTriangle, label: 'Warning' },
  info:    { bg: '#EFF6FF', color: 'var(--sg-thames)', Icon: Info, label: 'Info' },
};

const messages: Record<ToastType, string> = {
  success: 'Place saved to your collection.',
  error:   'Something went wrong. Please try again.',
  warning: 'This zone will be removed soon.',
  info:    'New places added to Westminster.',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const { bg, color, Icon } = config[toast.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(toast.id), 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm max-w-sm w-full"
      style={{ background: bg, border: `1px solid ${color}30`, fontFamily: 'var(--sg-font)' }}
    >
      <Icon size={18} style={{ color, flexShrink: 0 }} />
      <p className="flex-1" style={{ color: 'var(--sg-navy)' }}>{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} style={{ color: 'var(--sg-navy)', opacity: 0.4 }}>
        <X size={14} />
      </button>
    </motion.div>
  );
}

let nextId = 1;

export function SGSnackbars() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = (type: ToastType) =>
    setToasts((prev) => [...prev, { id: nextId++, type, message: messages[type] }]);

  const remove = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <SectionShell id="snackbars" title="Snackbars / Toasts">
      <div className="flex flex-wrap gap-3 mb-8">
        {(['success', 'error', 'warning', 'info'] as ToastType[]).map((type) => {
          const { color, label } = config[type];
          return (
            <button
              key={type}
              onClick={() => add(type)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border transition-opacity hover:opacity-80"
              style={{ borderColor: `${color}40`, color, background: `${color}10`, fontFamily: 'var(--sg-font)' }}
            >
              Show {label}
            </button>
          );
        })}
      </div>

      {/* Inline preview */}
      <div className="space-y-2 max-w-sm">
        {(['success', 'error', 'warning', 'info'] as ToastType[]).map((type) => {
          const { bg, color, Icon } = config[type];
          return (
            <div
              key={type}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
              style={{ background: bg, border: `1px solid ${color}30`, fontFamily: 'var(--sg-font)' }}
            >
              <Icon size={16} style={{ color, flexShrink: 0 }} />
              <p style={{ color: 'var(--sg-navy)' }}>{messages[type]}</p>
            </div>
          );
        })}
      </div>

      {/* Live toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={remove} />
          ))}
        </AnimatePresence>
      </div>
    </SectionShell>
  );
}
