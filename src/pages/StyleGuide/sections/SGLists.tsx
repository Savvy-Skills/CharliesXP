import { MapPin, Star, Coffee, Landmark, TreePine } from 'lucide-react';
import { SectionShell } from '../SectionShell';

const items = [
  { title: 'Borough Market', subtitle: 'Southwark · Food Market', rating: '5.0', icon: '🛒' },
  { title: 'Tate Modern', subtitle: 'Southwark · Museum', rating: '4.8', icon: '🎨' },
  { title: 'The Anchor', subtitle: 'Southwark · Pub', rating: '4.5', icon: '🍺' },
  { title: 'Maltby Street', subtitle: 'Bermondsey · Street Food', rating: '4.7', icon: '🍜' },
  { title: 'Flat Iron Square', subtitle: 'Southwark · Bar', rating: '4.3', icon: '🍸' },
];

const icons = [MapPin, Star, Coffee, Landmark, TreePine];

function ItemRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 transition-colors rounded-xl hover:bg-white" style={{ borderBottom: '1px solid var(--sg-border)' }}>
      {children}
    </div>
  );
}

export function SGLists() {
  return (
    <SectionShell id="lists" title="Lists">
      <div className="space-y-10">
        {/* Single-line */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Single-line</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--sg-border)', background: 'var(--sg-offwhite)' }}>
            {items.map((item) => (
              <ItemRow key={item.title}>
                <span className="text-base flex-1" style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>{item.title}</span>
              </ItemRow>
            ))}
          </div>
        </div>

        {/* Two-line */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Two-line with subtitle</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--sg-border)', background: 'var(--sg-offwhite)' }}>
            {items.map((item) => (
              <ItemRow key={item.title}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>{item.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--sg-navy)', opacity: 0.5, fontFamily: 'var(--sg-font)' }}>{item.subtitle}</p>
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--sg-thames)', fontFamily: 'var(--sg-font)' }}>★ {item.rating}</span>
              </ItemRow>
            ))}
          </div>
        </div>

        {/* With leading avatar */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>With leading icon/avatar</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--sg-border)', background: 'var(--sg-offwhite)' }}>
            {items.map((item, i) => {
              const Icon = icons[i % icons.length];
              return (
                <ItemRow key={item.title}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(157,58,61,0.08)' }}>
                    <Icon size={18} style={{ color: 'var(--sg-crimson)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>{item.title}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--sg-navy)', opacity: 0.5, fontFamily: 'var(--sg-font)' }}>{item.subtitle}</p>
                  </div>
                  <span className="text-lg">{item.icon}</span>
                </ItemRow>
              );
            })}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
