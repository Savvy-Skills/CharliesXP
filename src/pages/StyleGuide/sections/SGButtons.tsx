import { useState } from 'react';
import { MapPin, Plus, Loader2 } from 'lucide-react';
import { SectionShell } from '../SectionShell';

const sizes = ['sm', 'md', 'lg'] as const;
type Size = typeof sizes[number];

const sizeCls: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

interface BtnProps {
  variant: 'filled' | 'outlined' | 'ghost' | 'danger';
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: boolean;
  fab?: boolean;
  children?: React.ReactNode;
}

function Btn({ variant, size = 'md', disabled, loading, icon, fab, children }: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    filled: 'text-white focus:ring-[#9D3A3D]',
    outlined: 'border-2 bg-transparent focus:ring-[#9D3A3D]',
    ghost: 'bg-transparent focus:ring-[#9D3A3D]',
    danger: 'focus:ring-red-500',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    filled: { background: 'var(--sg-crimson)' },
    outlined: { borderColor: 'var(--sg-crimson)', color: 'var(--sg-crimson)' },
    ghost: { color: 'var(--sg-crimson)' },
    danger: { background: 'rgba(220,38,38,0.1)', color: 'rgb(220,38,38)' },
  };

  if (fab) {
    return (
      <button
        className="inline-flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#9D3A3D] focus:ring-offset-2"
        style={{ background: 'var(--sg-crimson)' }}
        disabled={disabled}
      >
        <Plus size={24} />
      </button>
    );
  }

  if (icon) {
    return (
      <button
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#9D3A3D] focus:ring-offset-2 disabled:opacity-50"
        style={{ color: 'var(--sg-crimson)', background: 'transparent' }}
        disabled={disabled}
      >
        <MapPin size={20} />
      </button>
    );
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizeCls[size]}`}
      style={variantStyles[variant]}
      disabled={disabled || loading}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function SGButtons() {
  const [loading, setLoading] = useState(false);

  const handleLoad = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <SectionShell id="buttons" title="Buttons">
      <div className="space-y-10">
        {/* Variants × Sizes */}
        <div>
          <p className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Variants × Sizes</p>
          <div className="space-y-4">
            {(['filled', 'outlined', 'ghost', 'danger'] as const).map((variant) => (
              <div key={variant} className="flex flex-wrap items-center gap-4">
                <span className="w-20 text-xs font-mono" style={{ color: 'var(--sg-navy)', opacity: 0.5 }}>{variant}</span>
                {sizes.map((size) => (
                  <Btn key={size} variant={variant} size={size}>{size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}</Btn>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Special types */}
        <div>
          <p className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Special Types</p>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Btn variant="filled" icon>Icon</Btn>
              <span className="text-xs" style={{ color: 'var(--sg-navy)', opacity: 0.4 }}>Icon</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Btn variant="filled" fab>FAB</Btn>
              <span className="text-xs" style={{ color: 'var(--sg-navy)', opacity: 0.4 }}>FAB</span>
            </div>
          </div>
        </div>

        {/* States */}
        <div>
          <p className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>States</p>
          <div className="flex flex-wrap items-center gap-4">
            <Btn variant="filled">Default</Btn>
            <Btn variant="filled" disabled>Disabled</Btn>
            <Btn variant="filled" loading={loading} onClick={handleLoad}>
              {loading ? 'Loading…' : 'Click to Load'}
            </Btn>
            <Btn variant="outlined">Outlined</Btn>
            <Btn variant="outlined" disabled>Disabled</Btn>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
