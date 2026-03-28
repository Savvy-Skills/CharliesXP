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
            style={{ backgroundColor: `${zone.color ?? '#7c2d36'}12` }}
          >
            {isLocked ? (
              <Lock size={20} className="text-[#b8a08a]" />
            ) : (
              <MapPin size={20} style={{ color: zone.color ?? '#7c2d36' }} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-[#2d1f1a] group-hover:text-[#7c2d36] transition-colors text-base">
              {zone.id}
            </h3>
            <span className="text-xs text-[#b8a08a] font-medium">
              {isLocked ? 'Locked' : `${placeCount} place${placeCount !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="text-[#e8dfd5] group-hover:text-[#c9a96e]
          transition-colors shrink-0 mt-3" />
      </div>
      <p className="text-sm text-[#8b7355] mt-4 leading-relaxed line-clamp-2">{zone.description}</p>
    </Link>
  );
}
