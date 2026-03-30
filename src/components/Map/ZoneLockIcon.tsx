import { Marker } from 'react-map-gl/mapbox';
import { Lock, MapPin } from 'lucide-react';

interface ZoneLockIconProps {
  longitude: number;
  latitude: number;
  zoneId: string;
  unlocked?: boolean;
  onClick: () => void;
}

export function ZoneLockIcon({ longitude, latitude, zoneId, unlocked = false, onClick }: ZoneLockIconProps) {
  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="flex flex-col items-center gap-1 cursor-pointer group"
      >
        <div className={`w-11 h-11 rounded-full shadow-md flex items-center justify-center
          border-2 transition-all duration-200
          ${unlocked
            ? 'bg-white/95 border-[var(--sg-thames)] group-hover:border-[#5565a0] group-hover:shadow-lg'
            : 'bg-white/90 border-[var(--sg-border)] group-hover:border-[var(--sg-thames)] group-hover:shadow-lg'
          }`}
        >
          {unlocked ? (
            <MapPin size={16} className="text-[var(--sg-thames)] group-hover:text-[#5565a0] transition-colors" />
          ) : (
            <Lock size={16} className="text-[var(--sg-navy)]/60 group-hover:text-[var(--sg-thames)] transition-colors" />
          )}
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded shadow-sm
          ${unlocked
            ? 'bg-[var(--sg-thames)] text-white'
            : 'bg-white/90 text-[var(--sg-navy)] border border-[var(--sg-border)]'
          }`}
        >
          {zoneId}
        </span>
      </button>
    </Marker>
  );
}
