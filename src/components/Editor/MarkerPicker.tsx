import { useState, useRef, useEffect } from 'react';
import { CATEGORIES, type PlaceCategory } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';
import { ChevronDown } from 'lucide-react';

// Top 4 quick-pick categories
const QUICK_PICKS: PlaceCategory[] = ['restaurant', 'cafe', 'bar', 'landmark'];
const MORE_CATEGORIES = CATEGORIES.filter(c => !QUICK_PICKS.includes(c.value) && c.value !== 'other');

export interface CustomMarker {
  name: string;
  image: string;
}

interface MarkerPickerProps {
  value: PlaceCategory;
  onChange: (category: PlaceCategory, custom?: CustomMarker) => void;
  customMarker?: CustomMarker;
}

export function MarkerPicker({ value, onChange, customMarker }: MarkerPickerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState(customMarker?.name ?? '');
  const [customImage, setCustomImage] = useState(customMarker?.image ?? '');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowCustom(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const isQuickPick = QUICK_PICKS.includes(value);
  const isMoreCategory = MORE_CATEGORIES.some(c => c.value === value);
  const isCustom = value === 'other' && customMarker?.name;
  const moreSelected = isMoreCategory || isCustom || (value === 'other');

  const selectedMoreCat = isMoreCategory
    ? CATEGORIES.find(c => c.value === value)
    : null;

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex gap-2">
        {/* Quick pick buttons */}
        {QUICK_PICKS.map((catValue) => {
          const cat = CATEGORIES.find(c => c.value === catValue)!;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                onChange(cat.value);
                setMenuOpen(false);
                setShowCustom(false);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-pointer flex-1
                ${value === cat.value
                  ? 'bg-[var(--sg-offwhite)] ring-2 ring-[var(--sg-crimson)]'
                  : 'hover:bg-[var(--sg-offwhite)]'
                }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: cat.color }}
              >
                {CATEGORY_EMOJI[cat.value]}
              </div>
              <span className="text-[10px] text-[var(--sg-navy)]/50">{cat.label}</span>
            </button>
          );
        })}

        {/* More button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-pointer flex-1
            ${moreSelected && !isQuickPick
              ? 'bg-[var(--sg-offwhite)] ring-2 ring-[var(--sg-crimson)]'
              : 'hover:bg-[var(--sg-offwhite)]'
            }`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-[#6b7280]"
          >
            {moreSelected && !isQuickPick && selectedMoreCat
              ? CATEGORY_EMOJI[selectedMoreCat.value]
              : isCustom
                ? '✦'
                : <ChevronDown size={14} className="text-white" />
            }
          </div>
          <span className="text-[10px] text-[var(--sg-navy)]/50">
            {moreSelected && !isQuickPick && selectedMoreCat
              ? selectedMoreCat.label
              : isCustom
                ? customMarker!.name
                : 'More'
            }
          </span>
        </button>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-[var(--sg-border)] z-50 overflow-hidden">
          {!showCustom ? (
            <>
              <div className="p-2 space-y-0.5">
                {MORE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      onChange(cat.value);
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left
                      ${value === cat.value
                        ? 'bg-[var(--sg-offwhite)]'
                        : 'hover:bg-[var(--sg-offwhite)]'
                      }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      {CATEGORY_EMOJI[cat.value]}
                    </div>
                    <span className="text-sm text-[var(--sg-navy)]">{cat.label}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-[var(--sg-border)] p-2">
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left
                    ${isCustom ? 'bg-[var(--sg-offwhite)]' : 'hover:bg-[var(--sg-offwhite)]'}`}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 bg-[var(--sg-navy)]/10">
                    ✦
                  </div>
                  <span className="text-sm text-[var(--sg-navy)]">Custom...</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-xs font-semibold text-[var(--sg-navy)]/50 uppercase tracking-wider">Custom Marker</p>
              <div>
                <label className="block text-xs text-[var(--sg-navy)]/60 mb-1">Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Rooftop"
                  className="w-full bg-white border border-[var(--sg-border)] rounded-lg px-3 py-2 text-sm
                    text-[var(--sg-navy)] placeholder-[var(--sg-navy)]/30
                    focus:outline-none focus:border-[var(--sg-thames)] focus:ring-2 focus:ring-[var(--sg-thames)]/15"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--sg-navy)]/60 mb-1">Image URL</label>
                <input
                  type="text"
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white border border-[var(--sg-border)] rounded-lg px-3 py-2 text-sm
                    text-[var(--sg-navy)] placeholder-[var(--sg-navy)]/30
                    focus:outline-none focus:border-[var(--sg-thames)] focus:ring-2 focus:ring-[var(--sg-thames)]/15"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (customName.trim()) {
                      onChange('other', { name: customName.trim(), image: customImage.trim() });
                      setMenuOpen(false);
                      setShowCustom(false);
                    }
                  }}
                  disabled={!customName.trim()}
                  className="flex-1 py-2 rounded-lg bg-[var(--sg-crimson)] hover:bg-[var(--sg-crimson-hover)]
                    text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[var(--sg-navy)]/60
                    hover:bg-[var(--sg-offwhite)] transition-all cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
