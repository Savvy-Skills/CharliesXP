import { Bell } from 'lucide-react';
import { SectionShell } from '../SectionShell';

const statusBadges = [
  { label: 'Success', bg: 'rgba(34,197,94,0.12)', color: 'rgb(22,163,74)' },
  { label: 'Warning', bg: 'rgba(234,179,8,0.12)', color: 'rgb(161,98,7)' },
  { label: 'Error', bg: 'rgba(239,68,68,0.12)', color: 'rgb(220,38,38)' },
  { label: 'Info', bg: 'rgba(102,118,168,0.12)', color: 'var(--sg-thames)' },
  { label: 'Neutral', bg: 'rgba(53,60,79,0.08)', color: 'var(--sg-navy)' },
];

export function SGBadges() {
  return (
    <SectionShell id="badges" title="Badges">
      <div className="space-y-8">
        {/* Notification dot */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Notification Dot</p>
          <div className="flex items-center gap-8">
            <div className="relative inline-flex">
              <Bell size={24} style={{ color: 'var(--sg-navy)' }} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: 'var(--sg-crimson)', border: '2px solid white' }} />
            </div>
            <span className="text-sm" style={{ color: 'var(--sg-navy)', opacity: 0.5, fontFamily: 'var(--sg-font)' }}>Dot indicator</span>
          </div>
        </div>

        {/* Count badges */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Count Badges</p>
          <div className="flex items-center gap-4">
            {[1, 5, 12, 99, '99+'].map((n) => (
              <span
                key={n}
                className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full px-2 text-xs font-bold text-white"
                style={{ background: 'var(--sg-crimson)', fontFamily: 'var(--sg-font)' }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* Status badges */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Status Badges</p>
          <div className="flex flex-wrap gap-3">
            {statusBadges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: b.bg, color: b.color, fontFamily: 'var(--sg-font)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
