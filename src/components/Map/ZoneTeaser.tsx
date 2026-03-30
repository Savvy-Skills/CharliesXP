import { useMemo } from 'react';
import type { Place, PlaceCategory } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface ZoneTeaserProps {
  zoneId?: string | null;
  places: Place[];
  activeCategory: PlaceCategory | null;
}

function getCategoryEmoji(category: PlaceCategory): string {
  return CATEGORY_EMOJI[category] ?? '📍';
}

export default function ZoneTeaser({ zoneId, places, activeCategory }: ZoneTeaserProps) {
  const categoryCounts = useMemo(() => {
    const filtered = activeCategory
      ? places.filter(p => p.category === activeCategory)
      : places;

    const counts: Partial<Record<PlaceCategory, number>> = {};
    for (const place of filtered) {
      counts[place.category] = (counts[place.category] ?? 0) + 1;
    }

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a) as [PlaceCategory, number][];
  }, [places, activeCategory]);

  if (categoryCounts.length === 0) return null;

  const totalPlaces = categoryCounts.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-[#e8dfd5] p-4 min-w-[200px]">
        {zoneId && (
          <div className="text-xs font-bold text-[#7c2d36] uppercase tracking-wider mb-2">{zoneId}</div>
        )}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#2d1f1a]">
            {activeCategory ? 'Filtered Places' : 'Places'}
          </h3>
          <span className="text-xs font-medium text-[#8b7355] bg-[#faf8f5] px-2 py-0.5 rounded-full">
            {totalPlaces}
          </span>
        </div>
        <div className="space-y-1.5">
          {categoryCounts.map(([category, count]) => (
            <div
              key={category}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 text-[#2d1f1a]">
                <span className="text-base">{getCategoryEmoji(category)}</span>
                <span className="capitalize">{category}s</span>
              </span>
              <span className="font-medium text-[#7c2d36]">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
