import { Link } from 'react-router';
import { MapPin, Calendar, ExternalLink } from 'lucide-react';
import type { Place } from '../../types';
import { CATEGORIES } from '../../types';

interface PlaceContentProps {
  place: Place;
}

export function PlaceContent({ place }: PlaceContentProps) {
  const category = CATEGORIES.find((c) => c.value === place.category);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`;

  return (
    <>
      {place.images.length > 0 && (
        <div className="w-full h-56 rounded-xl overflow-hidden mb-6 bg-[var(--sg-offwhite)]">
          <img
            src={place.images[0]}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-full shrink-0"
          style={{ backgroundColor: category?.color ?? '#6b7280' }}
          aria-label={category?.label ?? 'Place'}
        />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold text-[var(--sg-navy)] leading-tight">{place.name}</h1>
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
                className="text-xs font-medium text-[var(--sg-crimson)] hover:text-[var(--sg-crimson-hover)] transition-colors"
              >
                {place.zone}
              </Link>
            )}
          </div>
        </div>
      </div>

      <p className="text-[var(--sg-navy)] leading-relaxed mb-6">{place.description}</p>

      <div className="space-y-3 mb-6">
        {place.address && (
          <div className="flex items-center gap-2.5 text-sm text-[var(--sg-navy)]/60">
            <MapPin size={15} className="shrink-0 text-[var(--sg-navy)]/40" />
            <span>{place.address}</span>
          </div>
        )}
        {place.visitDate && (
          <div className="flex items-center gap-2.5 text-sm text-[var(--sg-navy)]/60">
            <Calendar size={15} className="shrink-0 text-[var(--sg-navy)]/40" />
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
              key={tag.id}
              className="px-2.5 py-1 text-xs bg-[var(--sg-offwhite)] text-[var(--sg-navy)]/60 rounded-full"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
          bg-[var(--sg-crimson)] hover:bg-[var(--sg-crimson-hover)] text-white text-sm font-semibold transition-all"
      >
        <ExternalLink size={15} />
        Open in Google Maps
      </a>
    </>
  );
}
