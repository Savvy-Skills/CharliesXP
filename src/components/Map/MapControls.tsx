import { Layers, Mountain, RotateCcw } from 'lucide-react';
import { MAP_STYLES, type MapStyleKey } from '../../utils/mapStyles';
import { useState } from 'react';

interface MapControlsProps {
  currentStyle: MapStyleKey;
  onStyleChange: (style: MapStyleKey) => void;
  terrainEnabled: boolean;
  onToggleTerrain: () => void;
  onResetView: () => void;
}

export function MapControls({
  currentStyle,
  onStyleChange,
  terrainEnabled,
  onToggleTerrain,
  onResetView,
}: MapControlsProps) {
  const [showStyles, setShowStyles] = useState(false);

  const styleNames: Record<MapStyleKey, string> = {
    standard: 'Standard',
    streets: 'Streets',
    light: 'Light',
    satellite: 'Satellite',
    outdoors: 'Outdoors',
  };

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
      <div className="relative">
        <button
          onClick={() => setShowStyles(!showStyles)}
          className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl
            hover:bg-white transition-colors shadow-md cursor-pointer border border-[var(--sg-border)]"
          title="Map style"
        >
          <Layers size={18} className="text-[var(--sg-navy)]/60" />
        </button>

        {showStyles && (
          <div className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-sm
            rounded-xl shadow-xl overflow-hidden min-w-[120px] border border-[var(--sg-border)]">
            {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  onStyleChange(key);
                  setShowStyles(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors cursor-pointer
                  ${currentStyle === key
                    ? 'bg-[var(--sg-crimson)]/10 text-[var(--sg-crimson)] font-medium'
                    : 'text-[var(--sg-navy)]/60 hover:bg-[var(--sg-offwhite)]'
                  }`}
              >
                {styleNames[key]}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onToggleTerrain}
        className={`p-2.5 rounded-xl transition-colors shadow-md cursor-pointer border
          ${terrainEnabled
            ? 'bg-[var(--sg-crimson)]/10 text-[var(--sg-crimson)] border-[var(--sg-crimson)]/30'
            : 'bg-white/90 text-[var(--sg-navy)]/60 hover:bg-white border-[var(--sg-border)]'
          } backdrop-blur-sm`}
        title="3D Terrain"
      >
        <Mountain size={18} />
      </button>

      <button
        onClick={onResetView}
        className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl
          hover:bg-white transition-colors shadow-md cursor-pointer border border-[var(--sg-border)]"
        title="Reset view"
      >
        <RotateCcw size={18} className="text-[var(--sg-navy)]/60" />
      </button>
    </div>
  );
}
