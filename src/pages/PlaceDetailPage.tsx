import { useParams, Link } from 'react-router';
import { ArrowLeft, MapIcon } from 'lucide-react';
import { PageShell } from '../components/Layout/PageShell';
import { SEOHead } from '../components/SEOHead';
import { PlaceContent } from '../components/Place/PlaceContent';
import { usePlaces } from '../hooks/usePlaces';
import { CATEGORY_EMOJI } from '../utils/mapStyles';

export function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getPlaceById, getPlacesByZone } = usePlaces();
  const place = id ? getPlaceById(id) : null;

  if (!place) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-[var(--sg-navy)]/60 text-lg mb-4">Place not found</p>
          <Link to="/" className="text-[var(--sg-crimson)] hover:text-[var(--sg-crimson-hover)] font-medium">
            Back to home
          </Link>
        </div>
      </PageShell>
    );
  }

  const siblingPlaces = place.zone
    ? getPlacesByZone(place.zone).filter((p) => p.id !== place.id)
    : [];

  return (
    <PageShell>
      <SEOHead
        title={place.name}
        description={`${place.name} — ${place.category} in ${place.zone ?? 'London'}. ${place.description.slice(0, 120)}…`}
        path={`/place/${place.id}`}
        type="article"
      />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/map"
            className="p-2 rounded-xl bg-[var(--sg-offwhite)] hover:bg-[var(--sg-border)] text-[var(--sg-navy)]/60 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <span className="text-sm text-[var(--sg-navy)]/60">Back to map</span>
        </div>

        <PlaceContent place={place} />

        <Link
          to="/map"
          className="flex items-center justify-center gap-2 w-full mt-4 py-3 rounded-xl
            bg-[var(--sg-offwhite)] hover:bg-[var(--sg-border)] text-[var(--sg-navy)] text-sm font-medium transition-colors"
        >
          <MapIcon size={15} />
          View on Map
        </Link>

        {siblingPlaces.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-lg font-bold text-[var(--sg-navy)] mb-4">
              More in {place.zone}
            </h2>
            <div className="space-y-3">
              {siblingPlaces.map((p) => (
                <Link
                  key={p.id}
                  to={`/place/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white
                    border border-[var(--sg-border)] hover:bg-[var(--sg-offwhite)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--sg-offwhite)] flex items-center justify-center text-sm">
                    {CATEGORY_EMOJI[p.category] ?? '📍'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--sg-navy)]">{p.name}</p>
                    <p className="text-xs text-[var(--sg-navy)]/60">{p.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
