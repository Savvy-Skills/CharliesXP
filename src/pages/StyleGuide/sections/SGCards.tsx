import { SectionShell } from '../SectionShell';
import { ArrowUpRight } from 'lucide-react';

const cards = [
  {
    type: 'Elevated',
    style: {
      background: '#fff',
      border: '1px solid var(--sg-border)',
      boxShadow: '0 2px 8px rgba(53,60,79,0.10), 0 8px 24px rgba(53,60,79,0.08)',
    },
  },
  {
    type: 'Outlined',
    style: {
      background: 'var(--sg-offwhite)',
      border: '1px solid var(--sg-border)',
      boxShadow: 'none',
    },
  },
  {
    type: 'Filled',
    style: {
      background: 'rgba(157,58,61,0.05)',
      border: '1px solid rgba(157,58,61,0.2)',
      boxShadow: 'none',
    },
  },
];

export function SGCards() {
  return (
    <SectionShell id="cards" title="Cards">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.type} className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1" style={c.style}>
            <div className="flex items-start justify-between mb-3">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2 py-1 rounded-full"
                style={{ background: 'rgba(157,58,61,0.08)', color: 'var(--sg-crimson)', fontFamily: 'var(--sg-font)' }}
              >
                {c.type}
              </span>
              <ArrowUpRight size={16} style={{ color: 'var(--sg-thames)' }} />
            </div>
            <h3
              className="text-lg font-bold mt-4 mb-2"
              style={{ fontFamily: 'var(--sg-font)', color: 'var(--sg-navy)' }}
            >
              Borough Market
            </h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--sg-navy)', opacity: 0.65, fontFamily: 'var(--sg-font)' }}>
              A world-famous food market under the arches of London Bridge, packed with artisan produce and hot food.
            </p>
            <a
              href="#cards"
              className="text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ color: 'var(--sg-thames)', fontFamily: 'var(--sg-font)' }}
            >
              Explore →
            </a>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
