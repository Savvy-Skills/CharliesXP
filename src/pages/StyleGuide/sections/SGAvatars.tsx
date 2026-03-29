import { User, MapPin, Star } from 'lucide-react';
import { SectionShell } from '../SectionShell';

const letterAvatars = [
  { initials: 'JD', bg: 'var(--sg-crimson)' },
  { initials: 'AB', bg: 'var(--sg-navy)' },
  { initials: 'LM', bg: 'var(--sg-thames)' },
];

const iconAvatars = [
  { icon: User, bg: 'rgba(157,58,61,0.10)', color: 'var(--sg-crimson)' },
  { icon: MapPin, bg: 'rgba(53,60,79,0.10)', color: 'var(--sg-navy)' },
  { icon: Star, bg: 'rgba(102,118,168,0.10)', color: 'var(--sg-thames)' },
];

const sizes = [
  { size: 32, label: 'sm' },
  { size: 40, label: 'md' },
  { size: 56, label: 'lg' },
  { size: 72, label: 'xl' },
];

export function SGAvatars() {
  return (
    <SectionShell id="avatars" title="Avatars">
      <div className="space-y-10">
        {/* Letter */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Letter Avatars</p>
          <div className="flex items-center gap-4">
            {letterAvatars.map(({ initials, bg }) => (
              <div
                key={initials}
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: bg, fontFamily: 'var(--sg-font)' }}
              >
                {initials}
              </div>
            ))}
          </div>
        </div>

        {/* Icon */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Icon Avatars</p>
          <div className="flex items-center gap-4">
            {iconAvatars.map(({ icon: Icon, bg, color }) => (
              <div
                key={color}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: bg }}
              >
                <Icon size={18} style={{ color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Image */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Image Avatars</p>
          <div className="flex items-center gap-4">
            {[10, 20, 30].map((n) => (
              <img
                key={n}
                src={`https://i.pravatar.cc/80?img=${n}`}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover"
                style={{ border: '2px solid var(--sg-border)' }}
              />
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Sizes</p>
          <div className="flex items-end gap-4">
            {sizes.map(({ size, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div
                  className="rounded-full flex items-center justify-center font-bold text-white"
                  style={{
                    width: size,
                    height: size,
                    background: 'var(--sg-crimson)',
                    fontSize: size * 0.33,
                    fontFamily: 'var(--sg-font)',
                  }}
                >
                  JD
                </div>
                <span className="text-xs" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
