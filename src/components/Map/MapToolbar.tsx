import { useState, useRef, useEffect } from 'react';
import { Search, ArrowLeft, X } from 'lucide-react';
import { ZONES } from '../../utils/zoneMapping';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';
import type { Place, PlaceCategory, MapZoomState } from '../../types';

interface MapToolbarProps {
  mapState: MapZoomState;
  activeZone: string | null;
  sidebarOpen: boolean;
  onZoneSelect: (zoneId: string) => void;
  places: Place[];
  activeCategory: PlaceCategory | null;
  onCategoryChange: (category: PlaceCategory | null) => void;
  onBack: () => void;
  onCollapse: () => void;
  isEditorMode?: boolean;
}

export function MapToolbar({
  mapState,
  activeZone,
  sidebarOpen,
  onZoneSelect,
  places,
  activeCategory,
  onCategoryChange,
  onBack,
  onCollapse,
  isEditorMode,
}: MapToolbarProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isZoneDetail = mapState === 'zoneDetail' && activeZone;

  // Filter zones by search query
  const results = query.trim()
    ? ZONES.filter((z) =>
        z.id.toLowerCase().includes(query.toLowerCase()) ||
        z.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (zoneId: string) => {
    setQuery('');
    setShowDropdown(false);
    onZoneSelect(zoneId);
  };

  // Categories present in current zone's places
  const categoriesInZone = CATEGORIES.filter((cat) =>
    places.some((p) => p.category === cat.value),
  );

  return (
    <div
      className={`bg-white border-b border-[var(--sg-border)] transition-[padding] duration-300 ease-in-out ${
        sidebarOpen ? 'md:pl-[396px]' : ''
      }`}
    >
      {/* Row 1: Navigation + Search + Close */}
      <div className="px-3 py-2 flex items-center gap-2">
        {/* Back button (zoneDetail only) */}
        {isZoneDetail && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[var(--sg-navy)] hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={15} />
            <span className="text-xs font-semibold hidden sm:inline">Back</span>
          </button>
        )}

        {/* Search bar */}
        <div className="flex-1 relative" ref={dropdownRef}>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sg-navy)]/30" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (query.trim()) setShowDropdown(true);
              }}
              placeholder="Search by postcode..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--sg-offwhite)] border border-transparent
                focus:border-[var(--sg-thames)]/30 focus:bg-white
                text-sm text-[var(--sg-navy)] placeholder:text-[var(--sg-navy)]/30
                outline-none transition-all"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setShowDropdown(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--sg-navy)]/30 hover:text-[var(--sg-navy)] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[var(--sg-border)] shadow-lg overflow-hidden z-50 max-h-[300px] overflow-y-auto">
              {results.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => handleSelect(zone.id)}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer flex items-center gap-3"
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: zone.color }}
                  >
                    {zone.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[var(--sg-navy)] block">{zone.id}</span>
                    <span className="text-xs text-[var(--sg-navy)]/40 truncate block">
                      {zone.description.split('—')[0]?.trim() || zone.description.slice(0, 60)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showDropdown && query.trim() && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[var(--sg-border)] shadow-lg z-50 px-4 py-3">
              <p className="text-sm text-[var(--sg-navy)]/40">No zones matching "{query}"</p>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onCollapse}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[var(--sg-navy)] hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer shrink-0"
        >
          <X size={15} />
          <span className="text-xs font-semibold hidden sm:inline">Close</span>
        </button>
      </div>

      {/* Row 2: Filter pills (zoneDetail only) */}
      {isZoneDetail && !isEditorMode && (
        <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => onCategoryChange(null)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer
              ${activeCategory === null
                ? 'bg-[var(--sg-crimson)] text-white'
                : 'bg-[var(--sg-offwhite)] text-[var(--sg-navy)]/60 hover:bg-[var(--sg-border)]'
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
                  ? 'bg-[var(--sg-crimson)] text-white'
                  : 'bg-[var(--sg-offwhite)] text-[var(--sg-navy)]/60 hover:bg-[var(--sg-border)]'
                }`}
            >
              <span>{CATEGORY_EMOJI[cat.value]}</span>
              {cat.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
