import { Link } from 'react-router';
import { MapPin, ChevronRight, Lock } from 'lucide-react';
import type { Zone } from '../../types';

interface ZoneCardProps {
  zone: Zone;
  placeCount: number;
  isLocked: boolean;
}

export function ZoneCard({ zone, placeCount, isLocked }: ZoneCardProps) {
  return (
    <Link
      to={`/zone/${zone.id}`}
      className="im-card block p-6 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${zone.color ?? 'var(--sg-crimson)'}12` }}
          >
            {isLocked ? (
              <Lock size={20} className="text-[var(--sg-navy)]/40" />
            ) : (
              <MapPin size={20} style={{ color: zone.color ?? 'var(--sg-crimson)' }} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-[var(--sg-navy)] group-hover:text-[var(--sg-crimson)] transition-colors text-base">
              {zone.name}
            </h3>
            <span className="text-xs text-[var(--sg-navy)]/40 font-medium">
              {isLocked ? 'Locked' : `${placeCount} place${placeCount !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="text-[var(--sg-border)] group-hover:text-[var(--sg-thames)]
          transition-colors shrink-0 mt-3" />
      </div>
      <p className="text-sm text-[var(--sg-navy)]/60 mt-4 leading-relaxed line-clamp-2">{zone.description}</p>
    </Link>
  );
}
