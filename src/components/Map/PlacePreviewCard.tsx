import { X } from 'lucide-react';
import type { Place } from '../../types';
import { PlaceDetailView } from './PlaceDetailView';

interface PlacePreviewCardProps {
  /** If null, the card doesn't render. */
  place: Place | null;
  /** Called when the user clicks the close button. */
  onClose: () => void;
}

/**
 * Desktop-only floating card at the bottom-center of the map. Hidden on mobile;
 * the ZoneSidePanel drawer owns the detail view there (Task 11).
 */
export function PlacePreviewCard({ place, onClose }: PlacePreviewCardProps) {
  if (!place) return null;
  return (
    <div className="hidden md:flex absolute bottom-5 left-1/2 -translate-x-1/2 z-40
      w-[min(520px,92vw)] max-h-[60vh] bg-white rounded-2xl shadow-2xl
      border border-[var(--sg-border)] overflow-hidden flex-col pointer-events-auto">
      <PlaceDetailView
        place={place}
        header={
          <div className="flex items-center justify-end p-2 border-b border-[var(--sg-border)]">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer"
              aria-label="Close place details"
            >
              <X size={18} className="text-[var(--sg-navy)]/70" />
            </button>
          </div>
        }
      />
    </div>
  );
}
