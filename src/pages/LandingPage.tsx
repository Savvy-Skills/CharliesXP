import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { ZONE_MAP, MANAGED_ZONES } from '../utils/zoneMapping';
import { PageShell } from '../components/Layout/PageShell';
import { SEOHead } from '../components/SEOHead';
import { HeroMapSection } from '../components/Landing/HeroMapSection';
import { PaywallModal } from '../components/ui/PaywallModal';
import { usePlaces } from '../hooks/usePlaces';
import { useMapFlyTo } from '../hooks/useMapFlyTo';
import { useMapZoom } from '../hooks/useMapZoom';
import { useAuth } from '../hooks/useAuth';
import { usePackages } from '../hooks/usePackages';
import type { Place, Coordinates } from '../types';

export function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditorMode = searchParams.get('editor') === 'true';

  // Preload packages so PaywallModal opens instantly
  usePackages();

  const { places, getPlacesByZone, activeCategories, refetch, optimisticAdd, optimisticUpdate, optimisticDelete } = usePlaces();
  const { mapRef, flyToPlace, flyToDefault } = useMapFlyTo();
  const { mapState, activeZone, expandMap, zoomIntoZone, zoomOutToExpanded, zoomOutToOverview, handleZoomChange, handleMoveEnd } = useMapZoom(mapRef);
  const { unlockedZones: rawUnlockedZones, isZoneUnlocked, isAdmin, refreshAccess } = useAuth();

  // Admins have all zones unlocked
  const unlockedZones = isAdmin ? MANAGED_ZONES : rawUnlockedZones;
  const [paywallZone, setPaywallZone] = useState<string | null>(null);
  const [paymentToast, setPaymentToast] = useState<'success' | 'cancelled' | null>(null);
  // Handle payment return params
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success' || payment === 'cancelled') {
      setPaymentToast(payment);
      // Clean URL without triggering navigation/reload
      window.history.replaceState(null, '', '/map');
      if (payment === 'success') {
        // Poll for zone access (webhook may take a moment)
        const poll = async (attempts = 0) => {
          await refreshAccess();
          refetch();
          if (attempts < 5) setTimeout(() => poll(attempts + 1), 2000);
        };
        setTimeout(() => poll(), 1000);
      }
      setTimeout(() => setPaymentToast(null), 6000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Editor state
  const [pendingCoordinates, setPendingCoordinates] = useState<Coordinates | null>(null);
  const [currentView, setCurrentView] = useState({ zoom: 16, pitch: 50, bearing: 0 });

  const zonePlaces = activeZone ? getPlacesByZone(activeZone) : [];
  const activeZonePlaces = activeZone ? getPlacesByZone(activeZone) : [];

  const activeCategory = activeCategories.length === 1 ? activeCategories[0] : null;

  // Auto-expand map in editor mode, zoom into zone if specified
  const [pendingPlaceId, setPendingPlaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditorMode) return;

    const zone = searchParams.get('zone');
    const placeId = searchParams.get('placeId');

    if (placeId) setPendingPlaceId(placeId);

    if (mapState === 'overview') {
      expandMap();
      if (zone) {
        setTimeout(() => zoomIntoZone(zone), 500);
      }
    } else if (zone && mapState === 'expanded') {
      zoomIntoZone(zone);
    }
  }, [isEditorMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to place once it's available in the places array
  useEffect(() => {
    if (!pendingPlaceId || places.length === 0) return;
    const place = places.find((p) => p.id === pendingPlaceId);
    if (place) {
      // Delay to let zone zoom finish first
      setTimeout(() => flyToPlace(place), 2000);
      setPendingPlaceId(null);
    }
  }, [pendingPlaceId, places, flyToPlace]);

  const handlePlaceClick = useCallback(
    (place: Place) => { flyToPlace(place); },
    [flyToPlace],
  );

  const handleMapClick = useCallback(
    (e: { lngLat: { lng: number; lat: number } }) => {
      // Editor mode: capture coordinates for place creation when inside a zone
      if (isEditorMode && mapState === 'zoneDetail' && activeZone) {
        const map = mapRef.current?.getMap();
        if (map) {
          setCurrentView({
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing(),
          });
        }
        setPendingCoordinates({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        return;
      }

      if (mapState === 'zoneDetail') return;

      // From overview: any click expands the map
      if (mapState === 'overview') {
        const map = mapRef.current?.getMap();
        if (!map) return;
        const point = map.project([e.lngLat.lng, e.lngLat.lat]);
        const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });

        if (features.length > 0) {
          const zoneName = features[0].properties?.zone as string;
          if (zoneName) {
            expandMap();
            if (isEditorMode || isZoneUnlocked(zoneName)) {
              setTimeout(() => zoomIntoZone(zoneName), 450);
            } else {
              setTimeout(() => setPaywallZone(zoneName), 300);
            }
            return;
          }
        }
        expandMap();
        return;
      }

      // In expanded mode: zoom in if unlocked, paywall if locked
      const map = mapRef.current?.getMap();
      if (!map) return;
      const point = map.project([e.lngLat.lng, e.lngLat.lat]);
      const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });
      if (features.length > 0) {
        const zoneName = features[0].properties?.zone as string;
        if (!zoneName) return;
        if (isEditorMode || isZoneUnlocked(zoneName)) {
          zoomIntoZone(zoneName);
        } else {
          setPaywallZone(zoneName);
        }
      }
    },
    [mapState, mapRef, isZoneUnlocked, zoomIntoZone, expandMap, isEditorMode, activeZone],
  );

  const handleZoneClick = useCallback(
    (zoneId: string) => {
      zoomIntoZone(zoneId);
    },
    [zoomIntoZone],
  );


  const handleCancelPending = useCallback(() => {
    setPendingCoordinates(null);
  }, []);

  // Editor CRUD — optimistic updates
  const handleAddPlace = useCallback(
    (place: Omit<Place, 'id'>) => optimisticAdd(place, activeZone ?? ''),
    [activeZone, optimisticAdd],
  );

  const handleUpdatePlace = useCallback(
    (id: string, updates: Partial<Place>) => optimisticUpdate(id, updates),
    [optimisticUpdate],
  );

  const handleDeletePlace = useCallback(
    (id: string) => optimisticDelete(id),
    [optimisticDelete],
  );

  const handleMoveToZone = useCallback(
    (placeId: string, zoneId: string) => {
      optimisticUpdate(placeId, { zone: zoneId });
      // Navigate to the new zone so the place appears there
      zoomIntoZone(zoneId);
    },
    [optimisticUpdate, zoomIntoZone],
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Charlies XP',
    url: 'https://charliesxp.com',
    description: 'Experience London like a Londoner. Personal, human, editorial guides to London.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://charliesxp.com/map',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      {/* Payment toast — outside PageShell for z-index */}
      {paymentToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999]" style={{ pointerEvents: 'auto' }}>
          <div className={`px-6 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
            paymentToast === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-[var(--sg-navy)] text-white'
          }`}>
            {paymentToast === 'success' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                Payment successful! Your zones are being unlocked...
              </>
            ) : (
              <>Payment cancelled. No charge was made.</>
            )}
            <button onClick={() => setPaymentToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
      )}
    <PageShell>
      <SEOHead
        title="Experience London Like a Londoner"
        description="Charlies XP — personal, human, editorial guides to London's best places, zones, and hidden stories. From someone who has walked every part of the city."
        path="/"
        jsonLd={jsonLd}
      />
      <HeroMapSection
        places={places}
        mapRef={mapRef}
        mapState={mapState}
        activeZone={activeZone}
        unlockedZones={unlockedZones}
        zonePlaces={zonePlaces}
        onPlaceClick={handlePlaceClick}
        onLockedZoneClick={(zoneId) => isEditorMode ? zoomIntoZone(zoneId) : setPaywallZone(zoneId)}
        onUnlockZone={(zoneId) => setPaywallZone(zoneId)}
        onZoneClick={handleZoneClick}
        onZoomOut={zoomOutToExpanded}
        onCollapse={() => {
          zoomOutToOverview();
          if (isEditorMode) {
            navigate('/', { replace: true });
          }
        }}
        onExpand={expandMap}
        onResetView={flyToDefault}
        onMapClick={handleMapClick}
        onZoomChange={handleZoomChange}
        onMoveEnd={handleMoveEnd}
        allUnlockedPlaces={activeZonePlaces}
        activeCategory={activeCategory}
        // Editor props
        isEditorMode={isEditorMode}
        pendingCoordinates={pendingCoordinates}
        currentView={currentView}
        onCancelPending={handleCancelPending}
        onAddPlace={handleAddPlace}
        onUpdatePlace={handleUpdatePlace}
        onDeletePlace={handleDeletePlace}
        onMoveToZone={handleMoveToZone}
      />

      {!isEditorMode && (
        <div className="bg-[var(--sg-offwhite)]">
          {/* Why Charlie and not AI — trust panel */}
          <section className="max-w-3xl mx-auto px-5 md:px-8 py-16">
            <div className="im-card p-10 md:p-14">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--sg-crimson)] mb-7 leading-snug">
                Why Charlie and not AI?
              </h2>
              <div className="space-y-5 text-[var(--sg-navy)]/70 leading-relaxed">
                <p className="font-medium text-[var(--sg-navy)]">Good question. Genuinely.</p>
                <p>
                  AI will give you information. Accurate, fast, and often impressive. But it has
                  never actually been there.
                </p>
                <p>
                  It doesn't know that the market is only worth it before 9am on a Saturday. It has
                  never walked that route on a rainy Wednesday in November and known — in the way you
                  only know from being somewhere — that the café on the corner is worth the detour.
                  It has never tested the food, sat in the parks, seen the shows, or felt the weather.
                </p>
                <p className="font-medium text-[var(--sg-navy)]">
                  Charlie has done all of that. Repeatedly. In all weathers.
                </p>
                <p>
                  Information tells you what exists. Charlie tells you what's worth it — for you,
                  specifically, on the day you're actually there.
                </p>
                <p className="italic text-[var(--sg-navy)]">That's not something you can search for.</p>
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--sg-border)] flex flex-col sm:flex-row gap-3">
                <a
                  href="/who-is-charlie"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                    bg-[var(--sg-crimson)] hover:bg-[var(--sg-crimson-hover)] text-white text-sm font-semibold
                    transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Meet Charlie
                </a>
                <a
                  href="/the-london-i-love"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                    bg-[var(--sg-offwhite)] hover:bg-[var(--sg-border)] text-[var(--sg-navy)] text-sm font-semibold
                    transition-all duration-200"
                >
                  The London I Love
                </a>
              </div>
            </div>
          </section>

          <section id="about" className="max-w-6xl mx-auto px-5 md:px-8 py-20">
            <div className="im-card p-10 md:p-16 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--sg-crimson)] mb-6">
                About Interest Map
              </h2>
              <p className="text-[var(--sg-navy)]/60 max-w-2xl mx-auto leading-relaxed text-lg">
                A curated collection of the best spots in central London — from hidden cocktail bars
                to world-class museums. Every place has been personally visited and reviewed.
                Unlock zones to discover insider guides, detailed reviews, and hidden gems
                in each London neighbourhood.
              </p>
            </div>
          </section>
        </div>
      )}

      <PaywallModal
        isOpen={!!paywallZone}
        onClose={() => setPaywallZone(null)}
        zoneName={paywallZone ? (ZONE_MAP[paywallZone]?.name ?? paywallZone) : ''}
        zoneId={paywallZone ?? ''}
      />
    </PageShell>
    </>
  );
}
