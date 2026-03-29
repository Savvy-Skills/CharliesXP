import { SectionShell } from '../SectionShell';
import { SG_COLORS } from '../sg-tokens';

const swatches = [
  { name: 'Crimson', key: 'crimson', hex: SG_COLORS.crimson, usage: 'Brand, headings, CTAs', textColor: '#fff' },
  { name: 'Navy', key: 'navy', hex: SG_COLORS.navy, usage: 'Body text, navigation', textColor: '#fff' },
  { name: 'Thames Blue', key: 'thames', hex: SG_COLORS.thames, usage: 'Links, hover, support', textColor: '#fff' },
  { name: 'Off-white', key: 'offwhite', hex: SG_COLORS.offwhite, usage: 'Backgrounds, surfaces', textColor: SG_COLORS.navy },
  { name: 'Border', key: 'border', hex: SG_COLORS.border, usage: 'Dividers, card borders', textColor: SG_COLORS.navy },
] as const;

export function SGColourPalette() {
  return (
    <SectionShell id="colour" title="Colour Palette">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {swatches.map((s) => (
          <div
            key={s.key}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--sg-border)' }}
          >
            <div
              className="h-20 w-full"
              style={{ background: s.hex }}
            />
            <div className="p-3" style={{ background: '#fff' }}>
              <p className="font-semibold text-sm" style={{ fontFamily: 'var(--sg-font)', color: 'var(--sg-navy)' }}>
                {s.name}
              </p>
              <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--sg-thames)' }}>{s.hex}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--sg-navy)', opacity: 0.5 }}>{s.usage}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
