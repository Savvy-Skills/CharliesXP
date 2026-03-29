import { CATEGORIES, type PlaceCategory } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface CategoryFilterProps {
  activeCategories: PlaceCategory[];
  onToggle: (category: PlaceCategory) => void;
}

export function CategoryFilter({ activeCategories, onToggle }: CategoryFilterProps) {
  return (
    <div className="absolute top-4 left-4 z-30 flex flex-wrap gap-2 max-w-[calc(100%-120px)]">
      {CATEGORIES.map((cat) => {
        const isActive =
          activeCategories.length === 0 || activeCategories.includes(cat.value);
        return (
          <button
            key={cat.value}
            onClick={() => onToggle(cat.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              transition-all duration-200 backdrop-blur-sm shadow-sm cursor-pointer
              ${isActive
                ? 'bg-white/90 text-[var(--sg-navy)] border border-[var(--sg-border)]'
                : 'bg-white/50 text-[var(--sg-navy)]/50 border border-transparent hover:bg-white/70'
              }`}
          >
            <span>{CATEGORY_EMOJI[cat.value]}</span>
            <span className="hidden sm:inline">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
