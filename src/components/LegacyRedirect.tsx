import { useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router';
import { usePlaces } from '../hooks/usePlaces';

/**
 * Handles /place/:slug → /:zoneId/:placeSlug.
 * Looks up the place's zone via the places cache. While the cache loads,
 * renders a small spinner. If the place is not found once loaded, redirects to /.
 */
export function LegacyPlaceRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const { places, loading } = usePlaces();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !slug) return;
    const place = places.find((p) => p.slug === slug);
    if (!place || !place.zone) {
      navigate('/', { replace: true });
      return;
    }
    navigate(`/${place.zone}/${place.slug}`, { replace: true });
  }, [loading, slug, places, navigate]);

  if (!slug) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--sg-offwhite)]">
      <div
        className="w-6 h-6 rounded-full border-2 border-[var(--sg-crimson)] border-t-transparent animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
