import { ArrowLeft } from 'lucide-react';
import type { Place, PlaceCategory } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface ZoneFilterTabsProps {
  zoneId: string;
  places: Place[];
  activeCategory: PlaceCategory | null;
  onCategoryChange: (category: PlaceCategory | null) => void;
  onBack: () => void;
}

export function ZoneFilterTabs({
  zoneId,
  places,
  activeCategory,
  onCategoryChange,
  onBack,
}: ZoneFilterTabsProps) {
  const categoriesInZone = CATEGORIES.filter((cat) =>
    places.some((p) => p.category === cat.value),
  );

  return (
    <div className="bg-white border-b border-[#e8dfd5] px-4 py-2.5 flex items-center gap-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
          text-[#5c3a2e] hover:bg-[#f5f0eb] transition-colors cursor-pointer shrink-0"
      >
        <ArrowLeft size={15} />
        <span className="text-xs font-semibold hidden sm:inline">Back to London</span>
      </button>

      <div className="w-px h-6 bg-[#e8dfd5] shrink-0" />

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto">
        <button
          onClick={() => onCategoryChange(null)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer
            ${activeCategory === null
              ? 'bg-[#7c2d36] text-white'
              : 'bg-[#f5f0eb] text-[#8b7355] hover:bg-[#e8dfd5]'
            }`}
        >
          All Places
        </button>
        {categoriesInZone.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={`shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold
              transition-colors cursor-pointer
              ${activeCategory === cat.value
                ? 'bg-[#7c2d36] text-white'
                : 'bg-[#f5f0eb] text-[#8b7355] hover:bg-[#e8dfd5]'
              }`}
          >
            <span>{CATEGORY_EMOJI[cat.value]}</span>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
