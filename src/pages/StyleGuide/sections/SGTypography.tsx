import { SectionShell } from '../SectionShell';

const specimens = [
  { label: 'Display', tag: 'p', size: '3rem', weight: 700, italic: false, color: 'var(--sg-crimson)', sample: 'Discover London' },
  { label: 'Heading 1', tag: 'h1', size: '2.25rem', weight: 700, italic: false, color: 'var(--sg-crimson)', sample: 'Explore the City' },
  { label: 'Heading 2', tag: 'h2', size: '1.875rem', weight: 700, italic: false, color: 'var(--sg-crimson)', sample: 'Hidden Neighbourhoods' },
  { label: 'Heading 3', tag: 'h3', size: '1.5rem', weight: 600, italic: false, color: 'var(--sg-crimson)', sample: 'Riverside Walks' },
  { label: 'Heading 4', tag: 'h4', size: '1.25rem', weight: 600, italic: false, color: 'var(--sg-crimson)', sample: 'Borough Market' },
  { label: 'Heading 5', tag: 'h5', size: '1.125rem', weight: 600, italic: false, color: 'var(--sg-crimson)', sample: 'Chef\'s Table' },
  { label: 'Heading 6', tag: 'h6', size: '1rem', weight: 600, italic: false, color: 'var(--sg-crimson)', sample: 'Tasting Menu' },
  { label: 'Body Large', tag: 'p', size: '1.125rem', weight: 400, italic: false, color: 'var(--sg-navy)', sample: 'A curated selection of the finest places in central London, personally visited and reviewed.' },
  { label: 'Body Medium', tag: 'p', size: '1rem', weight: 400, italic: false, color: 'var(--sg-navy)', sample: 'Each location has been hand-picked and rated for its character, quality, and atmosphere.' },
  { label: 'Body Small', tag: 'p', size: '0.875rem', weight: 400, italic: false, color: 'var(--sg-navy)', sample: 'Ratings reflect personal visits. Last updated March 2026.' },
  { label: 'Italic Closing', tag: 'p', size: '1rem', weight: 400, italic: true, color: 'var(--sg-navy)', sample: 'Every corner of this city holds a story waiting to be found.' },
  { label: 'Label', tag: 'p', size: '0.75rem', weight: 600, italic: false, color: 'var(--sg-navy)', sample: 'ZONE — SOUTHWARK' },
  { label: 'Caption', tag: 'p', size: '0.6875rem', weight: 400, italic: false, color: 'var(--sg-navy)', sample: 'Visited 14 Feb 2026 · Rating 5/5' },
  { label: 'Overline', tag: 'p', size: '0.625rem', weight: 600, italic: false, color: 'var(--sg-thames)', sample: 'FEATURED SELECTION', letterSpacing: '0.15em' },
];

export function SGTypography() {
  return (
    <SectionShell id="typography" title="Typography">
      <div className="space-y-6">
        {specimens.map((s) => (
          <div
            key={s.label}
            className="flex items-baseline gap-6 pb-5"
            style={{ borderBottom: '1px solid var(--sg-border)' }}
          >
            <div className="w-28 shrink-0">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'monospace' }}
              >
                {s.label}
              </span>
              <div className="text-xs mt-0.5" style={{ color: 'var(--sg-navy)', opacity: 0.3, fontFamily: 'monospace' }}>
                {s.size} / {s.weight}
              </div>
            </div>
            <p
              style={{
                fontFamily: 'var(--sg-font)',
                fontSize: s.size,
                fontWeight: s.weight,
                fontStyle: s.italic ? 'italic' : 'normal',
                color: s.color,
                letterSpacing: (s as any).letterSpacing,
                lineHeight: 1.3,
              }}
            >
              {s.sample}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
