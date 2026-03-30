import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Place } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface PlacePreviewCardProps {
  place: Place | null;
  onClose: () => void;
}

export function PlacePreviewCard({ place, onClose }: PlacePreviewCardProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {place && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-4 left-4 right-4 z-40 md:left-auto md:right-4 md:w-96
            bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[var(--sg-border)]
            overflow-hidden"
        >
          <div className="p-4">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full bg-[var(--sg-offwhite)]
                hover:bg-[var(--sg-border)] transition-colors cursor-pointer"
            >
              <X size={14} className="text-[var(--sg-navy)]/60" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{
                  backgroundColor:
                    CATEGORIES.find((c) => c.value === place.category)?.color ?? '#6b7280',
                }}
              >
                {CATEGORY_EMOJI[place.category] ?? '📍'}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[var(--sg-navy)] truncate">{place.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${CATEGORIES.find((c) => c.value === place.category)?.color}20`,
                      color: CATEGORIES.find((c) => c.value === place.category)?.color,
                    }}
                  >
                    {CATEGORIES.find((c) => c.value === place.category)?.label}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: place.rating }).map((_, i) => (
                      <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--sg-navy)]/60 mt-2 line-clamp-2">{place.description}</p>

            <button
              onClick={() => navigate(`/place/${place.id}`)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl
                bg-[var(--sg-crimson)] hover:bg-[#8a3033] text-white text-sm font-semibold
                transition-all cursor-pointer"
            >
              View Details
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
