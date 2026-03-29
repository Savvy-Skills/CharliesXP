import type { Place } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';
import { Star, MapPin, Calendar, ExternalLink } from 'lucide-react';

interface PlaceModalContentProps {
  place: Place;
}

export function PlaceModalContent({ place }: PlaceModalContentProps) {
  const category = CATEGORIES.find((c) => c.value === place.category);
  const emoji = CATEGORY_EMOJI[place.category] ?? '📍';
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`;

  return (
    <div className="p-5">
      {place.images.length > 0 && (
        <div className="w-full h-48 rounded-xl overflow-hidden mb-4 bg-[var(--sg-offwhite)]">
          <img
            src={place.images[0]}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: category?.color ?? '#6b7280' }}
        >
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[var(--sg-navy)] leading-tight">{place.name}</h2>
          <span
            className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
            style={{
              backgroundColor: `${category?.color}20`,
              color: category?.color,
            }}
          >
            {category?.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < place.rating ? 'text-amber-400 fill-amber-400' : 'text-[var(--sg-border)]'}
          />
        ))}
      </div>

      <p className="text-[var(--sg-navy)]/70 text-sm leading-relaxed mb-4">
        {place.description}
      </p>

      <div className="space-y-2 mb-4">
        {place.address && (
          <div className="flex items-center gap-2 text-sm text-[var(--sg-navy)]/50">
            <MapPin size={14} className="shrink-0" />
            <span>{place.address}</span>
          </div>
        )}
        {place.visitDate && (
          <div className="flex items-center gap-2 text-sm text-[var(--sg-navy)]/50">
            <Calendar size={14} className="shrink-0" />
            <span>Visited {new Date(place.visitDate).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}</span>
          </div>
        )}
      </div>

      {place.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-[var(--sg-offwhite)] text-[var(--sg-navy)]/60 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
          bg-[var(--sg-crimson)] hover:bg-[#8a3033] text-white transition-all text-sm font-semibold"
      >
        <ExternalLink size={14} />
        Open in Google Maps
      </a>
    </div>
  );
}
