import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router';
import { ZONE_MAP, ZONE_POLYGON_CENTERS, ZONE_CENTROIDS, ZONE_ENTER_THRESHOLD, ZONE_EXIT_THRESHOLD } from '../utils/zoneMapping';
import { PageShell } from '../components/Layout/PageShell';
import { SEOHead } from '../components/SEOHead';
import { HeroMapSection } from '../components/Landing/HeroMapSection';
import { PaywallModal } from '../components/ui/PaywallModal';
import { WelcomePopup, hasDismissedWelcome } from '../components/Welcome/WelcomePopup';
import { MapHeaderProvider } from '../hooks/useMapHeader';
import { usePlaces } from '../hooks/usePlaces';
import { useMapFlyTo } from '../hooks/useMapFlyTo';
import { useMapZoom } from '../hooks/useMapZoom';
import { useAuth } from '../hooks/useAuth';
import { usePackages } from '../hooks/usePackages';
import { useZoneSettings } from '../hooks/useZoneSettings';
import type { Place, Coordinates, MapZoomState } from '../types';

export function MapPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { zoneId: urlZoneId, placeSlug: urlPlaceSlug } = useParams<{ zoneId?: string; placeSlug?: string }>();
  const isEditorMode = searchParams.get('editor') === 'true';

  // ── URL is the single source of truth for map state ──────────────────────
  // Root path `/` renders the expanded full-screen map. Zone path `/:zoneId`
  // renders the zone-detail state. The old `'overview'` state (small hero
  // preview) is retired now that the landing page is gone.
  const mapState: MapZoomState = urlZoneId ? 'zoneDetail' : 'expanded';
  const activeZone = urlZoneId ?? null;
  const selectedPlaceSlug = urlPlaceSlug ?? null;

  // Preload packages so PaywallModal opens instantly
  usePackages();

  const { places, getPlacesByZone, activeCategories, refetch, optimisticAdd, optimisticUpdate, optimisticDelete, setPlaceTags } = usePlaces();
  const { mapRef, flyToPlace, flyToDefault } = useMapFlyTo();
  const { zoomIntoZone, zoomOutToOverview, isAnimating } = useMapZoom(mapRef);
  const { unlockedZones: rawUnlockedZones, isZoneUnlocked, isAdmin, refreshAccess, user } = useAuth();
  const { enabledZoneIds, isZoneEnabled, toggleZone } = useZoneSettings();

  const canOpenPlace =
    !!activeZone &&
    (isEditorMode || isZoneUnlocked(activeZone)) &&
    isZoneEnabled(activeZone);

  // When the zone is locked or disabled, keep the URL but don't open the detail.
  // This preserves the shareable link for the recipient.
  const effectivePlaceSlug = canOpenPlace ? selectedPlaceSlug : null;

  const unlockedZones = isAdmin ? enabledZoneIds : rawUnlockedZones.filter(z => enabledZoneIds.includes(z));
  const [paywallZone, setPaywallZone] = useState<string | null>(null);
  const [paymentToast, setPaymentToast] = useState<'success' | 'cancelled' | null>(null);
  const [editorTab, setEditorTab] = useState<'places' | 'zones' | 'landmarks' | 'tags'>('places');
  const [welcomePopupOpen, setWelcomePopupOpen] = useState<boolean>(() => {
    return !user && !hasDismissedWelcome();
  });
  const isMapMode = true;  // MapPage is always map-mode now that landing is gone

  // Handle payment return params (?payment=success|cancelled)
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success' || payment === 'cancelled') {
      setPaymentToast(payment);
      window.history.replaceState(null, '', '/');
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

  // ── Settle-time reconciliation ────────────────────────────────────────────
  // While a programmatic flyTo is running, `handleZoomChange` is silenced by
  // `isAnimating` (otherwise the fly-out through thresholds would oscillate).
  // If the user scrolls past a threshold during that window and stops before
  // the timer clears, no move event fires afterward — the URL gets stuck out
  // of sync with the actual zoom. `reconcileThresholds` runs once after each
  // flight completes, reading the zoom directly and correcting the URL if
  // the user is on the wrong side of a threshold.
  const reconcileThresholds = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const zoom = map.getZoom();
    const path = window.location.pathname;
    const currentZone = path === '/' ? null : (path.split('/')[1] || null);
    const qs = searchParams.toString();
    const suffix = qs ? '?' + qs : '';

    if (currentZone && zoom < ZONE_EXIT_THRESHOLD) {
      navigate(`/${suffix}`, { replace: true });
      return;
    }
    if (!currentZone && zoom >= ZONE_ENTER_THRESHOLD) {
      const center = map.getCenter();
      const point = map.project([center.lng, center.lat]);
      const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });
      const zoneName = features[0]?.properties?.zone as string | undefined;
      if (!zoneName) return;
      if (!isEditorMode && !isZoneEnabled(zoneName)) return;
      navigate(`/${zoneName}${suffix}`, { replace: true });
    }
  }, [mapRef, navigate, searchParams, isEditorMode, isZoneEnabled]);

  // ── Deep-link: fly into a zone on initial mount ───────────────────────────
  // URL changes no longer drive camera animations. The only reactive flyTo is
  // this mount-time poll for a pre-existing URL zone (e.g. someone lands on
  // /W1 directly or refreshes). Every other zone transition is animated by
  // the click handler that caused it (enterZone / closeZone).
  useEffect(() => {
    if (!activeZone) return;
    let cancelled = false;
    const tryFly = () => {
      if (cancelled) return;
      const map = mapRef.current?.getMap();
      if (map?.isStyleLoaded()) {
        zoomIntoZone(activeZone);
        setTimeout(reconcileThresholds, 1700);
        return;
      }
      setTimeout(tryFly, 200);
    };
    tryFly();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — mount-only

  // ── Redirect on unknown zone or unknown place ─────────────────────────────
  useEffect(() => {
    if (!urlZoneId) return;
    const zoneExists = !!ZONE_MAP[urlZoneId];
    if (!zoneExists) {
      navigate('/', { replace: true });
      return;
    }
    if (!urlPlaceSlug) return;
    // Don't redirect unknown places inside a LOCKED zone — keep the URL
    // so a user who later unlocks the zone still lands on their share link.
    if (!(isEditorMode || isZoneUnlocked(urlZoneId))) return;
    const place = places.find(
      (p) => p.slug === urlPlaceSlug && p.zone === urlZoneId,
    );
    if (!place) navigate(`/${urlZoneId}`, { replace: true });
  }, [urlZoneId, urlPlaceSlug, places, isEditorMode, isZoneUnlocked, navigate]);

  // ── Camera sequence: fly to place after zoomIntoZone settles ──────────────
  useEffect(() => {
    if (!effectivePlaceSlug || !activeZone) return;
    const place = places.find(
      (p) => p.slug === effectivePlaceSlug && p.zone === activeZone,
    );
    if (!place) return;
    // Wait for zone-in animation to finish (1500ms per useMapZoom) before the
    // second camera move. This runs on every URL change — consecutive opens
    // in the same zone will retrigger, which is desired for different places.
    const t = setTimeout(() => flyToPlace(place), 1600);
    return () => clearTimeout(t);
  }, [effectivePlaceSlug, activeZone, places, flyToPlace]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  // Two flavours:
  //   • `navigateToZone` / `navigateCloseZone` — pure URL updates, no camera
  //     animation. Used by scroll-zoom thresholds and drag-pan handlers so
  //     the camera stays under the user's control.
  //   • `enterZone` / `closeZone` — click-driven. They update the URL AND
  //     fire an explicit flyTo, because a click is an expression of intent
  //     for the camera to move.
  //
  // Threshold / pan transitions use `replace: true` to keep the history
  // stack tidy during continuous motion. Click transitions push so the
  // browser back button does what the user expects.

  const navigateToZone = useCallback(
    (zoneId: string) => {
      const qs = searchParams.toString();
      navigate(`/${zoneId}${qs ? '?' + qs : ''}`, { replace: true });
    },
    [navigate, searchParams],
  );

  const navigateCloseZone = useCallback(() => {
    const qs = searchParams.toString();
    navigate(`/${qs ? '?' + qs : ''}`, { replace: true });
  }, [navigate, searchParams]);

  const enterZone = useCallback(
    (zoneId: string) => {
      const qs = searchParams.toString();
      navigate(`/${zoneId}${qs ? '?' + qs : ''}`);
      zoomIntoZone(zoneId);
      setTimeout(reconcileThresholds, 1700);
    },
    [navigate, searchParams, zoomIntoZone, reconcileThresholds],
  );

  const closeZone = useCallback(() => {
    const qs = searchParams.toString();
    navigate(`/${qs ? '?' + qs : ''}`);
    zoomOutToOverview();
    setTimeout(reconcileThresholds, 1400);
  }, [navigate, searchParams, zoomOutToOverview, reconcileThresholds]);

  const navigateToPlace = useCallback(
    (zoneId: string, placeSlug: string) => {
      const qs = searchParams.toString();
      navigate(`/${zoneId}/${placeSlug}${qs ? '?' + qs : ''}`);
    },
    [navigate, searchParams],
  );

  const navigateClosePlace = useCallback(
    (zoneId: string) => {
      const qs = searchParams.toString();
      navigate(`/${zoneId}${qs ? '?' + qs : ''}`);
    },
    [navigate, searchParams],
  );

  // ── Editor state ──────────────────────────────────────────────────────────
  const [pendingCoordinates, setPendingCoordinates] = useState<Coordinates | null>(null);
  const [currentView, setCurrentView] = useState({ zoom: 16, pitch: 50, bearing: 0 });
  const [pendingPlaceId, setPendingPlaceId] = useState<string | null>(null);

  const zonePlaces = activeZone ? getPlacesByZone(activeZone) : [];
  const activeZonePlaces = activeZone ? getPlacesByZone(activeZone) : [];
  const activeCategory = activeCategories.length === 1 ? activeCategories[0] : null;

  // Editor mode: migrate legacy ?zone=X query param into the URL path on
  // initial load. The old self-navigate for the `mapState === 'expanded'`
  // branch was a no-op (you're already at `/?editor=true` if the effect
  // reaches it) and a latent cause of spurious "redirected to editor"
  // behaviour if anything ever re-fired it — removed.
  useEffect(() => {
    if (!isEditorMode) return;
    const zone = searchParams.get('zone');
    const placeId = searchParams.get('placeId');
    if (placeId) setPendingPlaceId(placeId);
    if (zone && !urlZoneId) {
      navigate(`/${zone}?editor=true${placeId ? '&placeId=' + placeId : ''}`);
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

  // Scroll-zoom threshold: pure URL update. The camera is mid-motion under
  // the user's finger — do NOT animate. `isAnimating` guards against this
  // handler firing during an in-flight click-initiated flyTo.
  const handleZoomChange = useCallback(
    (zoom: number) => {
      if (isAnimating.current) return;

      if (mapState === 'zoneDetail' && zoom < ZONE_EXIT_THRESHOLD) {
        navigateCloseZone();
        return;
      }

      if (mapState === 'expanded' && zoom >= ZONE_ENTER_THRESHOLD) {
        const map = mapRef.current?.getMap();
        if (!map) return;
        const center = map.getCenter();
        const point = map.project([center.lng, center.lat]);
        const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });
        const zoneName = features[0]?.properties?.zone as string | undefined;
        if (!zoneName) return;
        if (!isEditorMode && !isZoneEnabled(zoneName)) return;
        navigateToZone(zoneName);
      }
    },
    [mapState, isAnimating, mapRef, isEditorMode, isZoneEnabled, navigateToZone, navigateCloseZone],
  );

  // Drag-pan inside a zone: URL follows the viewport, no camera animation.
  // Bound to `dragend` (not `moveend`) so scroll-zoom and programmatic
  // flyTo don't retrigger zone switching.
  const handleDragEnd = useCallback(() => {
    if (isAnimating.current) return;
    if (isEditorMode) return;
    if (mapState !== 'zoneDetail') return;

    const map = mapRef.current?.getMap();
    if (!map || !map.isStyleLoaded()) return;

    const center = map.getCenter();
    const point = map.project([center.lng, center.lat]);
    const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });
    const zoneName = features[0]?.properties?.zone as string | undefined;
    if (!zoneName || zoneName === activeZone) return;
    if (!isZoneEnabled(zoneName)) return;

    navigateToZone(zoneName);
  }, [mapState, activeZone, isAnimating, isEditorMode, isZoneEnabled, mapRef, navigateToZone]);

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
            enterZone(zoneName);
          } else {
            setPaywallZone(zoneName);
          }
        }
        return;
      }

      // Expanded: clicking a zone polygon enters it. Editor can also target
      // disabled zones via a dedicated layer.
      if (isEditorMode && map.getLayer('zones-disabled-fill')) {
        const disabledFeatures = map.queryRenderedFeatures(point, { layers: ['zones-disabled-fill'] });
        if (disabledFeatures.length > 0) {
          const zoneName = disabledFeatures[0].properties?.zone as string;
          if (zoneName) { enterZone(zoneName); return; }
        }
      }

      const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });
      if (features.length > 0) {
        const zoneName = features[0].properties?.zone as string;
        if (!zoneName || (!isEditorMode && !isZoneEnabled(zoneName))) return;
        if (isEditorMode || isZoneUnlocked(zoneName)) {
          enterZone(zoneName);
        } else {
          setPaywallZone(zoneName);
        }
      }
    },
    [mapState, mapRef, isZoneUnlocked, isZoneEnabled, isEditorMode, activeZone, enterZone],
  );

  const handleCancelPending = useCallback(() => setPendingCoordinates(null), []);

  const handleAddPlace = useCallback(
    (place: Omit<Place, 'id'>): Promise<string | null> => optimisticAdd(place, activeZone ?? ''),
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
      enterZone(zoneId);
    },
    [optimisticUpdate, enterZone],
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Charlies XP',
    url: 'https://charliesxp.com',
    description: 'Experience London like a Londoner. Personal, human, editorial guides to London.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://charliesxp.com/',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <MapHeaderProvider value={{
      isMapMode,
      isEditorMode,
      editorTab,
      onEditorTabChange: setEditorTab,
      onCollapse: closeZone,
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
          onLockedZoneClick={(zoneId) => isEditorMode ? enterZone(zoneId) : setPaywallZone(zoneId)}
          onUnlockZone={(zoneId) => setPaywallZone(zoneId)}
          onZoneClick={enterZone}
          onZoomOut={closeZone}
          enabledZoneIds={enabledZoneIds}
          isZoneEnabled={isZoneEnabled}
          onToggleZone={toggleZone}
          onCollapse={closeZone}
          onExpand={() => navigate('/')}
          onResetView={flyToDefault}
          onMapClick={handleMapClick}
          onZoomChange={handleZoomChange}
          onDragEnd={handleDragEnd}
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
          onSaveTags={setPlaceTags}
          selectedPlaceSlug={effectivePlaceSlug}
          onOpenPlace={navigateToPlace}
          onClosePlace={navigateClosePlace}
          onCloseZone={closeZone}
        />

        <PaywallModal
          isOpen={!!paywallZone}
          onClose={() => setPaywallZone(null)}
          zoneName={paywallZone ? (ZONE_MAP[paywallZone]?.name ?? paywallZone) : ''}
          zoneId={paywallZone ?? ''}
        />
        <WelcomePopup
          isOpen={welcomePopupOpen}
          onClose={() => setWelcomePopupOpen(false)}
        />
      </PageShell>
    </>
    </MapHeaderProvider>
  );
}
