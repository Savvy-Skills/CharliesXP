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
        <div className="w-full h-48 rounded-xl overflow-hidden mb-4 bg-white/5">
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
          <h2 className="text-xl font-bold text-white leading-tight">{place.name}</h2>
          <span
            className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
            style={{
              backgroundColor: `${category?.color}30`,
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
            className={i < place.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
          />
        ))}
      </div>

      <p className="text-slate-300 text-sm leading-relaxed mb-4">
        {place.description}
      </p>

      <div className="space-y-2 mb-4">
        {place.address && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin size={14} className="shrink-0" />
            <span>{place.address}</span>
          </div>
        )}
        {place.visitDate && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
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
              className="px-2 py-0.5 text-xs bg-white/10 text-slate-300 rounded-full"
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
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg
          bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors text-sm font-medium"
      >
        <ExternalLink size={14} />
        Open in Google Maps
      </a>
    </div>
  );
}
