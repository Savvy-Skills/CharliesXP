import { SectionShell } from '../SectionShell';

export function SGDividers() {
  return (
    <SectionShell id="dividers" title="Dividers">
      <div className="space-y-8 max-w-lg">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Horizontal (thin)</p>
          <hr style={{ border: 'none', borderTop: '1px solid var(--sg-border)' }} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Horizontal (thick)</p>
          <div className="h-0.5 rounded-full" style={{ background: 'var(--sg-border)' }} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>With centred label</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'var(--sg-border)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--sg-navy)', opacity: 0.35, fontFamily: 'var(--sg-font)' }}>
              Or continue
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--sg-border)' }} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>With dot (decorative)</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--sg-border)' }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--sg-crimson)' }} />
            <div className="flex-1 h-px" style={{ background: 'var(--sg-border)' }} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Vertical dividers</p>
          <div className="flex items-center gap-4 h-8">
            <span className="text-sm" style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>All</span>
            <div className="w-px h-full" style={{ background: 'var(--sg-border)' }} />
            <span className="text-sm" style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>Restaurants</span>
            <div className="w-px h-full" style={{ background: 'var(--sg-border)' }} />
            <span className="text-sm" style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>Bars</span>
            <div className="w-px h-full" style={{ background: 'var(--sg-border)' }} />
            <span className="text-sm" style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>Parks</span>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
