import { useParams, Link } from 'react-router';
import { ArrowLeft, MapPin, Lock } from 'lucide-react';
import { PageShell } from '../components/Layout/PageShell';
import { ZonePlacesList } from '../components/Zone/ZonePlacesList';
import { usePlaces } from '../hooks/usePlaces';
import { useUser } from '../hooks/useUser';

export function ZoneDetailPage() {
  const { name } = useParams<{ name: string }>();
  const { getZoneById, getPlacesByZone } = usePlaces();
  const { isZoneUnlocked } = useUser();
  const zone = name ? getZoneById(name) : null;
  const zonePlaces = name ? getPlacesByZone(name) : [];
  const unlocked = name ? isZoneUnlocked(name) : false;

  if (!zone) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-[#8b7355] text-lg mb-4">Zone not found</p>
          <Link to="/" className="text-[#7c2d36] hover:text-[#9b4550] font-medium">
            Back to home
          </Link>
        </div>
      </PageShell>
    );
  }

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

        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${zone.color ?? '#7c2d36'}15` }}
          >
            {unlocked ? (
              <MapPin size={24} style={{ color: zone.color ?? '#7c2d36' }} />
            ) : (
              <Lock size={24} className="text-[#8b7355]" />
            )}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#2d1f1a]">{zone.name}</h1>
            <span className="text-sm text-[#8b7355]">
              {unlocked
                ? `${zonePlaces.length} place${zonePlaces.length !== 1 ? 's' : ''}`
                : 'Locked — purchase to unlock'}
            </span>
          </div>
        </div>

        <p className="text-[#5c3a2e] leading-relaxed mb-8">{zone.description}</p>

        {unlocked ? (
          <>
            <h2 className="font-serif text-lg font-bold text-[#2d1f1a] mb-4">Places in {zone.id}</h2>
            <ZonePlacesList places={zonePlaces} />
          </>
        ) : (
          <div className="bg-[#f5f0eb] rounded-xl p-8 text-center">
            <Lock size={32} className="text-[#8b7355] mx-auto mb-3" />
            <p className="text-[#5c3a2e] font-medium mb-2">This zone is locked</p>
            <p className="text-sm text-[#8b7355]">
              Purchase access to see all places and recommendations in {zone.id}.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
