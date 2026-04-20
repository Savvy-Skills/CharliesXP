import type { Place } from '../../types';

interface PlaceDetailViewProps {
  place: Place;
  /** Optional: rendered above the detail body, e.g. "← Back to zone" on mobile */
  header?: React.ReactNode;
  /** Optional: rendered below the detail body, e.g. close button on desktop */
  footer?: React.ReactNode;
}

export function PlaceDetailView({ place, header, footer }: PlaceDetailViewProps) {
  return (
    <div className="flex flex-col h-full">
      {header}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {place.images.length > 0 && (
          <div className="aspect-[16/9] w-full bg-[var(--sg-offwhite)] overflow-hidden">
            <img
              src={place.images[0]}
              alt={place.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-5 space-y-4">
          <header>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--sg-navy)]/60">
              <span>{place.category}</span>
              {place.visitDate && <span>· {place.visitDate}</span>}
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--sg-navy)] mt-1">
              {place.name}
            </h2>
          </header>

          {place.description && (
            <p className="text-[var(--sg-navy)]/75 leading-relaxed whitespace-pre-wrap">
              {place.description}
            </p>
          )}

          {place.address && (
            <div className="text-sm text-[var(--sg-navy)]/60">
              <span className="font-semibold text-[var(--sg-navy)]/80">Address: </span>
              {place.address}
            </div>
          )}

          {place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {place.tags.map((t) => (
                <span
                  key={t.id}
                  className="text-xs px-2 py-0.5 rounded-full bg-[var(--sg-offwhite)] text-[var(--sg-navy)]/70"
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}

          <div className="text-xs text-[var(--sg-navy)]/40 font-mono">
            {place.coordinates.lat.toFixed(5)}, {place.coordinates.lng.toFixed(5)}
          </div>
        </div>
      </div>
      {footer}
    </div>
  );
}
