import { useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { SectionShell } from '../SectionShell';

const banners = [
  {
    type: 'info',
    Icon: Info,
    title: 'New places added',
    body: 'Westminster zone has been updated with 6 new personally-reviewed spots.',
    bg: 'rgba(102,118,168,0.08)',
    border: 'var(--sg-thames)',
    color: 'var(--sg-thames)',
  },
  {
    type: 'success',
    Icon: CheckCircle2,
    title: 'Zone unlocked',
    body: 'You now have full access to all 24 places in Southwark.',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgb(34,197,94)',
    color: 'rgb(22,163,74)',
  },
  {
    type: 'warning',
    Icon: AlertTriangle,
    title: 'Content being updated',
    body: 'Some places in Shoreditch are currently being reviewed and may be unavailable.',
    bg: 'rgba(234,179,8,0.08)',
    border: 'rgb(234,179,8)',
    color: 'rgb(161,98,7)',
  },
  {
    type: 'error',
    Icon: AlertCircle,
    title: 'Payment failed',
    body: 'We could not process your payment. Please check your card details and try again.',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgb(239,68,68)',
    color: 'rgb(220,38,38)',
  },
] as const;

export function SGBanners() {
  const [dismissed, setDismissed] = useState<string[]>([]);

  return (
    <SectionShell id="banners" title="Banners">
      <div className="space-y-4 max-w-2xl">
        {banners.map(({ type, Icon, title, body, bg, border, color }) => {
          if (dismissed.includes(type)) return null;
          return (
            <div
              key={type}
              className="flex gap-4 px-5 py-4 rounded-xl"
              style={{
                background: bg,
                borderLeft: `4px solid ${border}`,
                fontFamily: 'var(--sg-font)',
              }}
            >
              <Icon size={20} style={{ color, flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: 'var(--sg-navy)' }}>{title}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--sg-navy)', opacity: 0.65 }}>{body}</p>
              </div>
              <button
                onClick={() => setDismissed((prev) => [...prev, type])}
                className="shrink-0 transition-opacity hover:opacity-60"
                style={{ color: 'var(--sg-navy)', opacity: 0.4 }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
        {dismissed.length === banners.length && (
          <button
            onClick={() => setDismissed([])}
            className="text-sm"
            style={{ color: 'var(--sg-thames)', fontFamily: 'var(--sg-font)' }}
          >
            ↺ Restore all banners
          </button>
        )}
      </div>
    </SectionShell>
  );
}
