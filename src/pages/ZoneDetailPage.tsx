import { useParams, Link } from 'react-router';
import { ArrowLeft, MapPin, Lock } from 'lucide-react';
import { PageShell } from '../components/Layout/PageShell';
import { SEOHead } from '../components/SEOHead';
import { usePlaces } from '../hooks/usePlaces';
import { useAuth } from '../hooks/useAuth';

export function ZoneDetailPage() {
  const { name } = useParams<{ name: string }>();
  const { getZoneById, getPlacesByZone } = usePlaces();
  const { isZoneUnlocked } = useAuth();
  const zone = name ? getZoneById(name) : null;
  const zonePlaces = name ? getPlacesByZone(name) : [];
  const unlocked = name ? isZoneUnlocked(name) : false;

  if (!zone) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-[var(--sg-navy)]/60 text-lg mb-4">Zone not found</p>
          <Link to="/" className="text-[var(--sg-crimson)] hover:text-[var(--sg-crimson-hover)] font-medium">
            Back to home
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SEOHead
        title={`${zone.name} — London Zone`}
        description={`Explore ${zone.name}, a curated London zone on Charlies XP. ${zone.description.slice(0, 120)}…`}
        path={`/zone/${zone.id}`}
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

        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${zone.color ?? '#9D3A3D'}15` }}
          >
            {unlocked ? (
              <MapPin size={24} style={{ color: zone.color ?? '#9D3A3D' }} />
            ) : (
              <Lock size={24} className="text-[var(--sg-navy)]/60" />
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--sg-navy)]">{zone.name}</h1>
            <span className="text-sm text-[var(--sg-navy)]/60">
              {unlocked
                ? `${zonePlaces.length} place${zonePlaces.length !== 1 ? 's' : ''}`
                : 'Locked — purchase to unlock'}
            </span>
          </div>
        </div>

        <p className="text-[var(--sg-navy)] leading-relaxed mb-8">{zone.description}</p>

        {unlocked ? (
          <Link
            to={`/map/${zone.id}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--sg-crimson)]
              hover:bg-[var(--sg-crimson-hover)] text-white text-sm font-semibold transition-colors"
          >
            <MapPin size={16} /> See all places on the map
          </Link>
        ) : (
          <div className="bg-[var(--sg-offwhite)] rounded-xl p-8 text-center">
            <Lock size={32} className="text-[var(--sg-navy)]/60 mx-auto mb-3" />
            <p className="text-[var(--sg-navy)] font-medium mb-2">This zone is locked</p>
            <p className="text-sm text-[var(--sg-navy)]/60">
              Purchase access to see all places and recommendations in {zone.name}.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
