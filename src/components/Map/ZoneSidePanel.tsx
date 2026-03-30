import { Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Place } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface ZoneSidePanelProps {
  zoneId: string;
  places: Place[];
  onPlaceClick: (place: Place) => void;
}

export function ZoneSidePanel({ zoneId, places, onPlaceClick }: ZoneSidePanelProps) {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full md:w-[380px] shrink-0 bg-white border-r border-[var(--sg-border)]
      flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--sg-border)]">
        <h2 className="font-display text-xl font-bold text-[var(--sg-navy)]">
          Places in <span className="text-[var(--sg-crimson)]">{zoneId}</span>
        </h2>
        <p className="text-xs text-[var(--sg-navy)]/60 mt-1">
          {places.length} pick{places.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Place list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {places.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[var(--sg-navy)]/60">No places in this zone yet.</p>
            <p className="text-xs text-[var(--sg-navy)]/40 mt-1">Coming soon!</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--sg-border)]">
            {places.map((place, index) => {
              const cat = CATEGORIES.find((c) => c.value === place.category);
              return (
                <button
                  key={place.id}
                  onClick={() => onPlaceClick(place)}
                  className="w-full text-left px-5 py-4 hover:bg-[var(--sg-offwhite)] transition-colors
                    cursor-pointer group"
                >
                  <div className="flex gap-3">
                    {/* Number badge */}
                    <div className="w-7 h-7 rounded-full bg-[var(--sg-crimson)] text-white text-xs
                      font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + category */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-[var(--sg-navy)] group-hover:text-[var(--sg-crimson)]
                          transition-colors leading-snug">
                          {place.name}
                        </h3>
                        <span className="text-lg shrink-0">{CATEGORY_EMOJI[place.category]}</span>
                      </div>

                      {/* Category + rating */}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}
                        >
                          {cat?.label}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: place.rating }).map((_, i) => (
                            <Star key={i} size={9} className="text-[var(--sg-thames)] fill-[var(--sg-thames)]" />
                          ))}
                        </div>
                      </div>

                      {/* Description snippet */}
                      <p className="text-xs text-[var(--sg-navy)]/60 mt-1.5 line-clamp-2 leading-relaxed">
                        {place.description}
                      </p>

                      {/* Tags */}
                      {place.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {place.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] text-[var(--sg-navy)]/40 bg-[var(--sg-offwhite)] px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* View details link */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/place/${place.id}`);
                        }}
                        className="flex items-center gap-1 mt-2 text-[10px] font-semibold
                          text-[var(--sg-crimson)] hover:text-[var(--sg-crimson-hover)] transition-colors cursor-pointer"
                      >
                        View Details <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
