import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Star, Info } from 'lucide-react';
import { SectionShell } from '../SectionShell';

type Placement = 'top' | 'bottom' | 'right';

interface TooltipProps {
  content: string;
  placement?: Placement;
  children: React.ReactNode;
}

function Tooltip({ content, placement = 'top', children }: TooltipProps) {
  const [show, setShow] = useState(false);

  const positions: Record<Placement, React.CSSProperties> = {
    top:    { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: 'calc(100% + 8px)',    left: '50%', transform: 'translateX(-50%)' },
    right:  { left: 'calc(100% + 8px)',   top: '50%',  transform: 'translateY(-50%)' },
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 px-3 py-1.5 rounded-lg text-xs font-medium pointer-events-none whitespace-nowrap"
            style={{
              ...positions[placement],
              background: 'var(--sg-navy)',
              color: 'var(--sg-offwhite)',
              fontFamily: 'var(--sg-font)',
              boxShadow: '0 4px 12px rgba(53,60,79,0.25)',
            }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SGTooltips() {
  return (
    <SectionShell id="tooltips" title="Tooltips">
      <div className="flex flex-wrap items-center gap-12 py-8">
        <div className="flex flex-col items-center gap-2">
          <Tooltip content="View on map" placement="top">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--sg-crimson)', fontFamily: 'var(--sg-font)' }}
            >
              <MapPin size={16} />
              Top
            </button>
          </Tooltip>
          <span className="text-xs" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Top placement</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Tooltip content="Rated 4.8 / 5.0" placement="bottom">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border"
              style={{ borderColor: 'var(--sg-border)', color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}
            >
              <Star size={16} style={{ color: 'var(--sg-thames)' }} />
              Bottom
            </button>
          </Tooltip>
          <span className="text-xs" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Bottom placement</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Tooltip content="Personally curated by the editor" placement="right">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(102,118,168,0.1)', color: 'var(--sg-thames)', fontFamily: 'var(--sg-font)' }}
            >
              <Info size={16} />
              Right
            </button>
          </Tooltip>
          <span className="text-xs" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Right placement</span>
        </div>
      </div>
    </SectionShell>
  );
}
