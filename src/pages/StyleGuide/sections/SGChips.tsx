import { useState } from 'react';
import { X, MapPin, Star, Sparkles, Coffee, Utensils, TreePine } from 'lucide-react';
import { SectionShell } from '../SectionShell';

const filters = ['Restaurant', 'Café', 'Bar', 'Museum', 'Park', 'Landmark'];
const suggestions = [
  { label: 'Near you', icon: MapPin },
  { label: 'Top rated', icon: Star },
  { label: 'Hidden gems', icon: Sparkles },
  { label: 'Coffee spots', icon: Coffee },
  { label: 'Fine dining', icon: Utensils },
  { label: 'Green spaces', icon: TreePine },
];

export function SGChips() {
  const [activeFilters, setActiveFilters] = useState<string[]>(['Restaurant']);
  const [inputChips, setInputChips] = useState(['Southwark', 'Westminster', 'Shoreditch']);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  return (
    <SectionShell id="chips" title="Chips">
      <div className="space-y-8">
        {/* Filter chips */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Filter Chips</p>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = activeFilters.includes(f);
              return (
                <button
                  key={f}
                  onClick={() => toggleFilter(f)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border"
                  style={{
                    background: active ? 'var(--sg-crimson)' : '#fff',
                    borderColor: active ? 'var(--sg-crimson)' : 'var(--sg-border)',
                    color: active ? '#fff' : 'var(--sg-navy)',
                    fontFamily: 'var(--sg-font)',
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input chips */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Input Chips</p>
          <div className="flex flex-wrap gap-2">
            {inputChips.map((chip) => (
              <div
                key={chip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm"
                style={{ borderColor: 'var(--sg-border)', background: 'var(--sg-offwhite)', color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}
              >
                <span>{chip}</span>
                <button
                  onClick={() => setInputChips((prev) => prev.filter((c) => c !== chip))}
                  className="transition-opacity hover:opacity-60"
                  style={{ color: 'var(--sg-navy)' }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {inputChips.length === 0 && (
              <button
                onClick={() => setInputChips(['Southwark', 'Westminster', 'Shoreditch'])}
                className="text-sm px-3 py-1.5"
                style={{ color: 'var(--sg-thames)', fontFamily: 'var(--sg-font)' }}
              >
                + Restore chips
              </button>
            )}
          </div>
        </div>

        {/* Suggestion chips */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Suggestion Chips</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium transition-colors duration-200 hover:border-[#6676A8]"
                style={{ borderColor: 'var(--sg-border)', background: '#fff', color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}
              >
                <Icon size={14} style={{ color: 'var(--sg-thames)' }} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
