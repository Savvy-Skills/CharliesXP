import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Star } from 'lucide-react';
import { useState } from 'react';
import type { Place } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface PlaceListProps {
  places: Place[];
  onPlaceClick: (place: Place) => void;
}

export function PlaceList({ places, onPlaceClick }: PlaceListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 md:left-auto md:top-4 md:bottom-4 md:right-auto md:left-4 md:w-80">
      <div className="bg-white/95 backdrop-blur-md md:rounded-2xl rounded-t-2xl shadow-xl border border-[#e8dfd5] overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer
            hover:bg-[#f5f0eb] transition-colors"
        >
          <span className="text-sm font-semibold text-[#2d1f1a]">
            Places ({places.length})
          </span>
          {isExpanded ? (
            <ChevronDown size={18} className="text-[#8b7355]" />
          ) : (
            <ChevronUp size={18} className="text-[#8b7355]" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-h-[50vh] md:max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar divide-y divide-[#e8dfd5]">
                {places.map((place) => {
                  const cat = CATEGORIES.find((c) => c.value === place.category);
                  return (
                    <button
                      key={place.id}
                      onClick={() => {
                        onPlaceClick(place);
                        setIsExpanded(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left
                        hover:bg-[#f5f0eb] transition-colors cursor-pointer"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: cat?.color ?? '#6b7280' }}
                      >
                        {CATEGORY_EMOJI[place.category]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2d1f1a] truncate">
                          {place.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: place.rating }).map((_, i) => (
                              <Star
                                key={i}
                                size={10}
                                className="text-amber-400 fill-amber-400"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-[#8b7355]">{cat?.label}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
