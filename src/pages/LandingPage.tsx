import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useParams, useLocation } from 'react-router';
import { ZONE_MAP, ZONE_POLYGON_CENTERS, ZONE_CENTROIDS, ZONE_EXIT_THRESHOLD } from '../utils/zoneMapping';
import { PageShell } from '../components/Layout/PageShell';
import { SEOHead } from '../components/SEOHead';
import { HeroMapSection } from '../components/Landing/HeroMapSection';
import { PaywallModal } from '../components/ui/PaywallModal';
import { MapHeaderProvider } from '../hooks/useMapHeader';
import { usePlaces } from '../hooks/usePlaces';
import { useMapFlyTo } from '../hooks/useMapFlyTo';
import { useMapZoom } from '../hooks/useMapZoom';
import { useAuth } from '../hooks/useAuth';
import { usePackages } from '../hooks/usePackages';
import { useZoneSettings } from '../hooks/useZoneSettings';
import type { Place, Coordinates, MapZoomState } from '../types';

export function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { zoneId: urlZoneId } = useParams<{ zoneId?: string }>();
  const isEditorMode = searchParams.get('editor') === 'true';

  // ── URL is the single source of truth for map state ──────────────────────
  const mapState: MapZoomState = !location.pathname.startsWith('/map')
    ? 'overview'
    : urlZoneId
      ? 'zoneDetail'
      : 'expanded';
  const activeZone = urlZoneId ?? null;

  // Preload packages so PaywallModal opens instantly
  usePackages();

  const { places, getPlacesByZone, activeCategories, refetch, optimisticAdd, optimisticUpdate, optimisticDelete } = usePlaces();
  const { mapRef, flyToPlace, flyToDefault } = useMapFlyTo();
  const { zoomIntoZone, zoomOutToExpanded, zoomOutToOverview, isAnimating } = useMapZoom(mapRef);
  const { unlockedZones: rawUnlockedZones, isZoneUnlocked, isAdmin, refreshAccess } = useAuth();
  const { enabledZoneIds, isZoneEnabled, toggleZone } = useZoneSettings();

  const unlockedZones = isAdmin ? enabledZoneIds : rawUnlockedZones.filter(z => enabledZoneIds.includes(z));
  const [paywallZone, setPaywallZone] = useState<string | null>(null);
  const [paymentToast, setPaymentToast] = useState<'success' | 'cancelled' | null>(null);
  const [editorTab, setEditorTab] = useState<'places' | 'zones'>('places');
  const isMapMode = mapState === 'expanded' || mapState === 'zoneDetail';

  // Handle payment return params (?payment=success|cancelled)
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success' || payment === 'cancelled') {
      setPaymentToast(payment);
      window.history.replaceState(null, '', '/map');
      if (payment === 'success') {
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

  // ── Sync map camera with URL zone changes ─────────────────────────────────
  // When activeZone changes (URL changes), fire the appropriate camera animation.
  const prevZoneRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const prev = prevZoneRef.current;
    prevZoneRef.current = activeZone;

    if (prev === undefined) {
      // Initial mount — if a zone is already in the URL, zoom in after map settles
      if (activeZone) setTimeout(() => zoomIntoZone(activeZone), 400);
      return;
    }

    if (activeZone && activeZone !== prev) {
      // Entered a zone (or switched zones)
      zoomIntoZone(activeZone);
    } else if (!activeZone && prev) {
      // Left a zone — return to previous overview camera
      zoomOutToExpanded();
    }
  }, [activeZone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation helpers ────────────────────────────────────────────────────
  // All navigation goes through React Router. Query params (e.g. ?editor=true) are preserved.

  const navigateToZone = useCallback(
    (zoneId: string) => {
      const qs = searchParams.toString();
      // When jumping from overview, insert /map into browser history so
      // the back button returns to the expanded map rather than skipping to /
      if (mapState === 'overview') {
        window.history.pushState(null, '', `/map${qs ? '?' + qs : ''}`);
      }
      navigate(`/map/${zoneId}${qs ? '?' + qs : ''}`);
    },
    [navigate, searchParams, mapState],
  );

  // ── Editor state ──────────────────────────────────────────────────────────
  const [pendingCoordinates, setPendingCoordinates] = useState<Coordinates | null>(null);
  const [currentView, setCurrentView] = useState({ zoom: 16, pitch: 50, bearing: 0 });
  const [pendingPlaceId, setPendingPlaceId] = useState<string | null>(null);

  const zonePlaces = activeZone ? getPlacesByZone(activeZone) : [];
  const activeZonePlaces = activeZone ? getPlacesByZone(activeZone) : [];
  const activeCategory = activeCategories.length === 1 ? activeCategories[0] : null;

  // Editor mode: handle ?zone= and ?placeId= query params on initial load
  useEffect(() => {
    if (!isEditorMode) return;
    const zone = searchParams.get('zone');
    const placeId = searchParams.get('placeId');
    if (placeId) setPendingPlaceId(placeId);
    // If zone is in query params (legacy) and not already in the path, navigate to correct URL
    if (zone && !urlZoneId) {
      navigate(`/map/${zone}?editor=true${placeId ? '&placeId=' + placeId : ''}`);
    } else if (mapState === 'overview') {
      navigate(`/map?editor=true`);
    }
  }, [isEditorMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to place once it's available in the places array
  useEffect(() => {
    if (!pendingPlaceId || places.length === 0) return;
    const place = places.find((p) => p.id === pendingPlaceId);
    if (place) {
      setTimeout(() => flyToPlace(place), 2000);
      setPendingPlaceId(null);
    }
  }, [pendingPlaceId, places, flyToPlace]);

  // ── Event handlers ────────────────────────────────────────────────────────

  // When the user manually zooms out of a zone, clear the zone from the URL
  const handleZoomChange = useCallback(
    (zoom: number) => {
      if (mapState !== 'zoneDetail' || isAnimating.current) return;
      if (zoom < ZONE_EXIT_THRESHOLD) {
        const qs = searchParams.toString();
        navigate(`/map${qs ? '?' + qs : ''}`);
      }
    },
    [mapState, isAnimating, navigate, searchParams],
  );

  const handlePlaceClick = useCallback(
    (place: Place) => { flyToPlace(place); },
    [flyToPlace],
  );

  const handleMapClick = useCallback(
    (e: { lngLat: { lng: number; lat: number } }) => {
      // Editor: click inside active zone to drop a pin
      if (isEditorMode && mapState === 'zoneDetail' && activeZone) {
        const map = mapRef.current?.getMap();
        if (map) {
          setCurrentView({ zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() });
        }
        setPendingCoordinates({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        return;
      }

      const map = mapRef.current?.getMap();
      if (!map) return;
      const point = map.project([e.lngLat.lng, e.lngLat.lat]);

      // In zone detail: allow clicking a different zone, ignore everything else
      if (mapState === 'zoneDetail') {
        const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });
        const zoneName = features[0]?.properties?.zone as string | undefined;
        if (zoneName && zoneName !== activeZone && (isEditorMode || isZoneEnabled(zoneName))) {
          if (isEditorMode || isZoneUnlocked(zoneName)) {
            navigateToZone(zoneName);
          } else {
            setPaywallZone(zoneName);
          }
        }
        return;
      }

      if (mapState === 'overview') {
        const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });
        if (features.length > 0) {
          const zoneName = features[0].properties?.zone as string;
          if (zoneName && (isEditorMode || isZoneEnabled(zoneName))) {
            if (isEditorMode || isZoneUnlocked(zoneName)) {
              navigateToZone(zoneName);
            } else {
              navigate('/map');
              setTimeout(() => setPaywallZone(zoneName), 300);
            }
            return;
          }
        }
        navigate('/map');
        return;
      }

      // Expanded mode: click to enter a zone
      if (isEditorMode && map.getLayer('zones-disabled-fill')) {
        const disabledFeatures = map.queryRenderedFeatures(point, { layers: ['zones-disabled-fill'] });
        if (disabledFeatures.length > 0) {
          const zoneName = disabledFeatures[0].properties?.zone as string;
          if (zoneName) { navigateToZone(zoneName); return; }
        }
      }

      const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });
      if (features.length > 0) {
        const zoneName = features[0].properties?.zone as string;
        if (!zoneName || (!isEditorMode && !isZoneEnabled(zoneName))) return;
        if (isEditorMode || isZoneUnlocked(zoneName)) {
          navigateToZone(zoneName);
        } else {
          setPaywallZone(zoneName);
        }
      }
    },
    [mapState, mapRef, isZoneUnlocked, isZoneEnabled, isEditorMode, activeZone, navigate, navigateToZone],
  );

  const handleCancelPending = useCallback(() => setPendingCoordinates(null), []);

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
      const center = ZONE_POLYGON_CENTERS[zoneId] ?? ZONE_CENTROIDS[zoneId];
      const updates: Partial<Place> = { zone: zoneId };
      if (center) updates.coordinates = { lng: center.lng, lat: center.lat };
      optimisticUpdate(placeId, updates);
      navigateToZone(zoneId);
    },
    [optimisticUpdate, navigateToZone],
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
    <MapHeaderProvider value={{
      isMapMode,
      isEditorMode,
      editorTab,
      onEditorTabChange: setEditorTab,
      onCollapse: () => { zoomOutToOverview(); navigate('/'); },
      activeZone,
    }}>
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
          onLockedZoneClick={(zoneId) => isEditorMode ? navigateToZone(zoneId) : setPaywallZone(zoneId)}
          onUnlockZone={(zoneId) => setPaywallZone(zoneId)}
          onZoneClick={navigateToZone}
          onZoomOut={() => navigate(-1)}
          enabledZoneIds={enabledZoneIds}
          isZoneEnabled={isZoneEnabled}
          onToggleZone={toggleZone}
          onCollapse={() => { zoomOutToOverview(); navigate('/'); }}
          onExpand={() => navigate('/map')}
          onResetView={flyToDefault}
          onMapClick={handleMapClick}
          onZoomChange={handleZoomChange}
          allUnlockedPlaces={activeZonePlaces}
          activeCategory={activeCategory}
          isEditorMode={isEditorMode}
          editorTab={editorTab}
          onEditorTabChange={setEditorTab}
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
    </MapHeaderProvider>
  );
}
