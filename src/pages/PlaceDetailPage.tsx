import { useParams, Link } from 'react-router';
import { ArrowLeft, MapIcon } from 'lucide-react';
import { PageShell } from '../components/Layout/PageShell';
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
          <p className="text-[#8b7355] text-lg mb-4">Place not found</p>
          <Link to="/" className="text-[#7c2d36] hover:text-[#9b4550] font-medium">
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="p-2 rounded-lg bg-[#f5f0eb] hover:bg-[#e8dfd5] text-[#8b7355] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <span className="text-sm text-[#8b7355]">Back to home</span>
        </div>

        <PlaceContent place={place} />

        <Link
          to="/"
          className="flex items-center justify-center gap-2 w-full mt-4 py-3 rounded-xl
            bg-[#f5f0eb] hover:bg-[#e8dfd5] text-[#5c3a2e] text-sm font-medium transition-colors"
        >
          <MapIcon size={15} />
          View on Map
        </Link>

        {siblingPlaces.length > 0 && (
          <div className="mt-10">
            <h2 className="font-serif text-lg font-bold text-[#2d1f1a] mb-4">
              More in {place.zone}
            </h2>
            <div className="space-y-3">
              {siblingPlaces.map((p) => (
                <Link
                  key={p.id}
                  to={`/place/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white
                    border border-[#e8dfd5] hover:bg-[#f5f0eb] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#f5f0eb] flex items-center justify-center text-sm">
                    {CATEGORY_EMOJI[p.category] ?? '📍'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2d1f1a]">{p.name}</p>
                    <p className="text-xs text-[#8b7355]">{p.category}</p>
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
