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
            ? 'bg-white/95 border-[#c9a96e] group-hover:border-[#b89555] group-hover:shadow-lg'
            : 'bg-white/90 border-[#e8dfd5] group-hover:border-[#c9a96e] group-hover:shadow-lg'
          }`}
        >
          {unlocked ? (
            <MapPin size={16} className="text-[#c9a96e] group-hover:text-[#b89555] transition-colors" />
          ) : (
            <Lock size={16} className="text-[#8b7355] group-hover:text-[#c9a96e] transition-colors" />
          )}
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded shadow-sm
          ${unlocked
            ? 'bg-[#c9a96e] text-white'
            : 'bg-white/90 text-[#5c3a2e] border border-[#e8dfd5]'
          }`}
        >
          {zoneId}
        </span>
      </button>
    </Marker>
  );
}
