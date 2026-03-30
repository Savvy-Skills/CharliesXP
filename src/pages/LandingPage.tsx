import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { getZoneForPostcode } from '../utils/zoneMapping';
import { motion } from 'framer-motion';
import { PageShell } from '../components/Layout/PageShell';
import { SEOHead } from '../components/SEOHead';
import { HeroMapSection } from '../components/Landing/HeroMapSection';
import { FeaturedSection } from '../components/Landing/FeaturedSection';
import { CategoryBrowse } from '../components/Landing/CategoryBrowse';
import { ZoneCard } from '../components/Zone/ZoneCard';
import { PaywallModal } from '../components/ui/PaywallModal';
import { usePlaces } from '../hooks/usePlaces';
import { useMapFlyTo } from '../hooks/useMapFlyTo';
import { useMapZoom } from '../hooks/useMapZoom';
import { useUser } from '../hooks/useUser';
import type { Place, Coordinates } from '../types';

export function LandingPage() {
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';

  const { places, zones, getPlacesByZone, activeCategories, addPlace, updatePlace, deletePlace, exportPlaces } = usePlaces();
  const { mapRef, flyToPlace, flyToDefault } = useMapFlyTo();
  const { mapState, activeZone, expandMap, zoomIntoZone, zoomOutToExpanded, zoomOutToOverview, handleZoomChange, handleMoveEnd } = useMapZoom(mapRef);
  const { unlockedZones, isZoneUnlocked, unlockZone } = useUser();
  const [paywallZone, setPaywallZone] = useState<string | null>(null);

  // Editor state
  const [pendingCoordinates, setPendingCoordinates] = useState<Coordinates | null>(null);
  const [currentView, setCurrentView] = useState({ zoom: 16, pitch: 50, bearing: 0 });

  const zonePlaces = activeZone ? getPlacesByZone(activeZone) : [];
  const activeZonePlaces = activeZone ? getPlacesByZone(activeZone) : [];

  const activeCategory = activeCategories.length === 1 ? activeCategories[0] : null;

  // Auto-expand map in editor mode
  useEffect(() => {
    if (isEditorMode && mapState === 'overview') {
      expandMap();
    }
  }, [isEditorMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const features = map.queryRenderedFeatures(point, { layers: ['postcodes-fill'] });

        if (features.length > 0) {
          const postcodeName = features[0].properties?.Name as string;
          const zoneName = getZoneForPostcode(postcodeName);
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

      // In expanded mode: zone clicks always zoom in
      const map = mapRef.current?.getMap();
      if (!map) return;
      const point = map.project([e.lngLat.lng, e.lngLat.lat]);
      const features = map.queryRenderedFeatures(point, { layers: ['postcodes-fill'] });
      if (features.length > 0) {
        const postcodeName = features[0].properties?.Name as string;
        const zoneName = getZoneForPostcode(postcodeName);
        if (!zoneName) return;
        zoomIntoZone(zoneName);
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

  const handleUnlockZone = useCallback(() => {
    if (paywallZone) {
      unlockZone(paywallZone);
      const zoneToZoom = paywallZone;
      setPaywallZone(null);
      expandMap();
      setTimeout(() => zoomIntoZone(zoneToZoom), 400);
    }
  }, [paywallZone, unlockZone, expandMap, zoomIntoZone]);

  // Editor CRUD wrappers
  const handleAddPlace = useCallback((place: Omit<Place, 'id'>) => {
    addPlace({ ...place, zone: activeZone ?? undefined } as Omit<Place, 'id'>);
  }, [addPlace, activeZone]);

  const handleCancelPending = useCallback(() => {
    setPendingCoordinates(null);
  }, []);

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
        onUnlockZone={(zoneId) => { unlockZone(zoneId); }}
        onZoneClick={handleZoneClick}
        onZoomOut={zoomOutToExpanded}
        onCollapse={isEditorMode ? zoomOutToExpanded : zoomOutToOverview}
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
        onAddPlace={handleAddPlace}
        onUpdatePlace={updatePlace}
        onDeletePlace={deletePlace}
        onExportPlaces={exportPlaces}
        onCancelPending={handleCancelPending}
      />

      {!isEditorMode && (
        <div className="bg-[var(--sg-offwhite)]">
          <FeaturedSection places={places} />

          <CategoryBrowse places={places} />

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

          <section id="zones" className="max-w-6xl mx-auto px-5 md:px-8 py-20">
            <div className="text-center mb-14">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--sg-crimson)] mb-3">
                Explore Zones
              </h2>
              <p className="text-[var(--sg-navy)]/60 text-lg">
                Discover London neighbourhood by neighbourhood
              </p>
              <div className="section-divider mt-6">
                <div className="dot" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {zones.map((zone, i) => (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  <ZoneCard
                    zone={zone}
                    placeCount={getPlacesByZone(zone.id).length}
                    isLocked={!isZoneUnlocked(zone.id)}
                  />
                </motion.div>
              ))}
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
        zoneName={paywallZone ?? ''}
        onUnlock={handleUnlockZone}
      />
    </PageShell>
  );
}
