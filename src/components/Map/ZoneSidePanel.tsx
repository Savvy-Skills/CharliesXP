import { ArrowLeft, ChevronRight, Lock, Check } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Place } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';
import { PlaceDetailView } from './PlaceDetailView';

interface ZoneSidePanelProps {
  zoneId: string;
  zoneName?: string;
  places: Place[];
  onPlaceClick: (place: Place) => void;
  locked?: boolean;
  onUnlock?: () => void;
  teaserCounts?: Record<string, number>;
  hideHeader?: boolean;
  selectedPlaceSlug?: string | null;
  onClosePlace?: () => void;
}

export function ZoneSidePanel({ zoneId, zoneName, places, onPlaceClick, locked = false, onUnlock, teaserCounts, hideHeader = false, selectedPlaceSlug, onClosePlace }: ZoneSidePanelProps) {
  const displayName = zoneName || zoneId;
  const navigate = useNavigate();
  const lockedCount = teaserCounts ? Object.values(teaserCounts).reduce((a, b) => a + b, 0) : 0;
  const selectedPlace = selectedPlaceSlug
    ? (places.find((p) => p.slug === selectedPlaceSlug) ?? null)
    : null;

  return (
    <div className="h-full w-full md:w-[380px] shrink-0 bg-white border-r border-[var(--sg-border)]
      flex flex-col overflow-hidden">
      {/* Header */}
      {!hideHeader && (
        <div className="px-5 py-4 border-b border-[var(--sg-border)]">
          <h2 className="font-display text-xl font-bold text-[var(--sg-navy)]">
            {locked ? (
              <>
                <Lock size={16} className="inline -mt-0.5 mr-1.5 text-[var(--sg-crimson)]" />
                <span className="text-[var(--sg-crimson)]">{displayName}</span>
              </>
            ) : (
              <>Places in <span className="text-[var(--sg-crimson)]">{displayName}</span></>
            )}
          </h2>
          <p className="text-xs text-[var(--sg-navy)]/60 mt-1">
            {locked
              ? `${lockedCount} place${lockedCount !== 1 ? 's' : ''} waiting to be discovered`
              : `${places.length} pick${places.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      {/* Locked state — inline paywall CTA */}
      {locked ? (
        <div className="flex-1 flex flex-col">
          <div className="px-5 py-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--sg-crimson)]/10 flex items-center justify-center mb-4">
              <Lock size={20} className="text-[var(--sg-crimson)]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--sg-navy)] mb-2">
              Unlock {displayName}
            </h3>
            <p className="text-sm text-[var(--sg-navy)]/60 mb-5 leading-relaxed">
              Get full access to all recommendations, reviews, and insider tips in this zone.
            </p>

            <ul className="space-y-2 mb-5">
              {[
                '30 days of full access',
                'Insider tips & hidden gems',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-xs text-[var(--sg-navy)]">
                  <Check size={12} className="text-green-600 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={onUnlock}
              className="w-full py-3 rounded-xl bg-[var(--sg-crimson)] hover:bg-[var(--sg-crimson-hover)] text-white
                font-semibold transition-all cursor-pointer text-sm shadow-md"
            >
              Unlock {displayName}
            </button>
          </div>

          {/* Blurred preview hint */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 backdrop-blur-[2px] pointer-events-none" />
            <div className="divide-y divide-[var(--sg-border)] opacity-40 select-none">
              {places.slice(0, 3).map((place, index) => {
                const cat = CATEGORIES.find((c) => c.value === place.category);
                return (
                  <div key={place.id} className="px-5 py-4">
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-[var(--sg-navy)]/20 text-white text-xs
                        font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-3.5 w-32 bg-[var(--sg-navy)]/15 rounded mb-2" />
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}
                          >
                            {cat?.label}
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-[var(--sg-navy)]/10 rounded mt-2" />
                        <div className="h-2.5 w-3/4 bg-[var(--sg-navy)]/10 rounded mt-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* Mobile: place detail view replaces list when a place is selected */}
      {selectedPlace && (
        <div className="flex-1 md:hidden overflow-hidden">
          <PlaceDetailView
            place={selectedPlace}
            header={
              <button
                onClick={onClosePlace}
                className="flex items-center gap-2 px-4 py-3 border-b border-[var(--sg-border)]
                  text-sm font-semibold text-[var(--sg-navy)]
                  hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer w-full"
              >
                <ArrowLeft size={16} /> Back to zone
              </button>
            }
          />
        </div>
      )}

      {/* Place list — always visible on desktop; hidden on mobile when a place is selected */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${selectedPlace ? 'hidden md:block' : ''}`}>
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
                <div
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

                      {/* Category */}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}
                        >
                          {cat?.label}
                        </span>
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
                          navigate(place.zone ? `/map/${place.zone}/${place.slug}` : `/place/${place.slug}`);
                        }}
                        className="flex items-center gap-1 mt-2 text-[10px] font-semibold
                          text-[var(--sg-crimson)] hover:text-[var(--sg-crimson-hover)] transition-colors cursor-pointer"
                      >
                        View Details <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
