import { Link } from 'react-router';
import { Star, MapPin, Calendar, ExternalLink } from 'lucide-react';
import type { Place } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface PlaceContentProps {
  place: Place;
}

export function PlaceContent({ place }: PlaceContentProps) {
  const category = CATEGORIES.find((c) => c.value === place.category);
  const emoji = CATEGORY_EMOJI[place.category] ?? '📍';
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`;

  return (
    <>
      {place.images.length > 0 && (
        <div className="w-full h-56 rounded-xl overflow-hidden mb-6 bg-[#f5f0eb]">
          <img
            src={place.images[0]}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: category?.color ?? '#6b7280' }}
        >
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl font-bold text-[#2d1f1a] leading-tight">{place.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${category?.color}20`,
                color: category?.color,
              }}
            >
              {category?.label}
            </span>
            {place.zone && (
              <Link
                to={`/zone/${place.zone}`}
                className="text-xs font-medium text-[#7c2d36] hover:text-[#9b4550] transition-colors"
              >
                {place.zone}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={18}
            className={i < place.rating ? 'text-amber-400 fill-amber-400' : 'text-[#e8dfd5]'}
          />
        ))}
      </div>

      <p className="text-[#5c3a2e] leading-relaxed mb-6">{place.description}</p>

      <div className="space-y-3 mb-6">
        {place.address && (
          <div className="flex items-center gap-2.5 text-sm text-[#8b7355]">
            <MapPin size={15} className="shrink-0 text-[#b8a08a]" />
            <span>{place.address}</span>
          </div>
        )}
        {place.visitDate && (
          <div className="flex items-center gap-2.5 text-sm text-[#8b7355]">
            <Calendar size={15} className="shrink-0 text-[#b8a08a]" />
            <span>
              Visited{' '}
              {new Date(place.visitDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {place.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs bg-[#f5f0eb] text-[#8b7355] rounded-full"
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
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
          bg-[#7c2d36] hover:bg-[#9b4550] text-white text-sm font-medium transition-colors"
      >
        <ExternalLink size={15} />
        Open in Google Maps
      </a>
    </>
  );
}
