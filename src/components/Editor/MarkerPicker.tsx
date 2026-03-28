import { CATEGORIES, type PlaceCategory } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface MarkerPickerProps {
  value: PlaceCategory;
  onChange: (category: PlaceCategory) => void;
}

export function MarkerPicker({ value, onChange }: MarkerPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          type="button"
          onClick={() => onChange(cat.value)}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-pointer
            ${value === cat.value
              ? 'bg-white/15 ring-2 ring-indigo-400'
              : 'bg-white/5 hover:bg-white/10'
            }`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ backgroundColor: cat.color }}
          >
            {CATEGORY_EMOJI[cat.value]}
          </div>
          <span className="text-[10px] text-slate-400">{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
