import { motion } from 'framer-motion';
import { SectionShell } from '../SectionShell';

function CircularProgress({ percent, indeterminate }: { percent?: number; indeterminate?: boolean }) {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const dash = indeterminate ? circumference * 0.3 : circumference * ((percent ?? 0) / 100);

  return (
    <div className="relative inline-flex items-center justify-center w-14 h-14">
      <svg width="56" height="56" viewBox="0 0 56 56" className={indeterminate ? 'animate-spin' : ''}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--sg-border)" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--sg-crimson)"
          strokeWidth="4"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      </svg>
      {!indeterminate && percent != null && (
        <span className="absolute text-xs font-bold" style={{ color: 'var(--sg-crimson)', fontFamily: 'var(--sg-font)' }}>
          {percent}%
        </span>
      )}
    </div>
  );
}

export function SGProgress() {
  return (
    <SectionShell id="progress" title="Progress">
      <div className="space-y-10">
        {/* Linear */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-6" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Linear</p>
          <div className="space-y-6 max-w-md">
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--sg-navy)', opacity: 0.5, fontFamily: 'var(--sg-font)' }}>Indeterminate</p>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sg-border)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--sg-crimson)', width: '30%' }}
                  animate={{ x: ['-100%', '400%'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--sg-navy)', opacity: 0.5, fontFamily: 'var(--sg-font)' }}>Determinate — 65%</p>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sg-border)' }}>
                <div className="h-full rounded-full" style={{ background: 'var(--sg-crimson)', width: '65%' }} />
              </div>
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--sg-navy)', opacity: 0.5, fontFamily: 'var(--sg-font)' }}>Thicker — 40%</p>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--sg-border)' }}>
                <div className="h-full rounded-full" style={{ background: 'var(--sg-thames)', width: '40%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Circular */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-6" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Circular</p>
          <div className="flex items-center gap-10 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <CircularProgress indeterminate />
              <span className="text-xs" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Indeterminate</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CircularProgress percent={75} />
              <span className="text-xs" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>75%</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CircularProgress percent={30} />
              <span className="text-xs" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>30%</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CircularProgress percent={100} />
              <span className="text-xs" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Complete</span>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
