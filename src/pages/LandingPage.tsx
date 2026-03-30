import { useState, useCallback, useMemo } from 'react';
import { getZoneForPostcode } from '../utils/zoneMapping';
import { motion } from 'framer-motion';
import { PageShell } from '../components/Layout/PageShell';
import { HeroMapSection } from '../components/Landing/HeroMapSection';
import { FeaturedSection } from '../components/Landing/FeaturedSection';
import { CategoryBrowse } from '../components/Landing/CategoryBrowse';
import { ZoneCard } from '../components/Zone/ZoneCard';
import { PaywallModal } from '../components/ui/PaywallModal';
import { usePlaces } from '../hooks/usePlaces';
import { useMapFlyTo } from '../hooks/useMapFlyTo';
import { useMapZoom } from '../hooks/useMapZoom';
import { useUser } from '../hooks/useUser';
import type { Place } from '../types';

export function LandingPage() {
  const { places, zones, getPlacesByZone, activeCategories } = usePlaces();
  const { mapRef, flyToPlace, flyToDefault } = useMapFlyTo();
  const { mapState, activeZone, expandMap, zoomIntoZone, zoomOutToExpanded, zoomOutToOverview, handleZoomChange, handleMoveEnd } = useMapZoom(mapRef);
  const { unlockedZones, isZoneUnlocked, unlockZone } = useUser();
  const [paywallZone, setPaywallZone] = useState<string | null>(null);

  const zonePlaces = activeZone ? getPlacesByZone(activeZone) : [];

  const allUnlockedPlaces = useMemo(() => {
    return places.filter(p => p.zone && isZoneUnlocked(p.zone));
  }, [places, isZoneUnlocked]);

  const activeCategory = activeCategories.length === 1 ? activeCategories[0] : null;

  const handlePlaceClick = useCallback(
    (place: Place) => { flyToPlace(place); },
    [flyToPlace],
  );

  const handleMapClick = useCallback(
    (e: { lngLat: { lng: number; lat: number } }) => {
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
            if (isZoneUnlocked(zoneName)) {
              setTimeout(() => zoomIntoZone(zoneName), 450);
            } else {
              setTimeout(() => setPaywallZone(zoneName), 300);
            }
            return;
          }
        }
        // Clicked outside any zone — still expand
        expandMap();
        return;
      }

      // In expanded mode: zone clicks zoom in or show paywall
      const map = mapRef.current?.getMap();
      if (!map) return;
      const point = map.project([e.lngLat.lng, e.lngLat.lat]);
      const features = map.queryRenderedFeatures(point, { layers: ['postcodes-fill'] });
      if (features.length > 0) {
        const postcodeName = features[0].properties?.Name as string;
        const zoneName = getZoneForPostcode(postcodeName);
        if (!zoneName) return;
        if (isZoneUnlocked(zoneName)) {
          zoomIntoZone(zoneName);
        } else {
          setPaywallZone(zoneName);
        }
      }
    },
    [mapState, mapRef, isZoneUnlocked, zoomIntoZone, expandMap],
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
      // Expand map and auto-zoom into the just-unlocked zone
      expandMap();
      setTimeout(() => zoomIntoZone(zoneToZoom), 400);
    }
  }, [paywallZone, unlockZone, expandMap, zoomIntoZone]);

  return (
    <PageShell>
      <HeroMapSection
        places={places}
        mapRef={mapRef}
        mapState={mapState}
        activeZone={activeZone}
        unlockedZones={unlockedZones}
        zonePlaces={zonePlaces}
        onPlaceClick={handlePlaceClick}
        onLockedZoneClick={(zoneId) => setPaywallZone(zoneId)}
        onZoneClick={handleZoneClick}
        onZoomOut={zoomOutToExpanded}
        onCollapse={zoomOutToOverview}
        onExpand={expandMap}
        onResetView={flyToDefault}
        onMapClick={handleMapClick}
        onZoomChange={handleZoomChange}
        onMoveEnd={handleMoveEnd}
        allUnlockedPlaces={allUnlockedPlaces}
        activeCategory={activeCategory}
      />

      <div className="bg-[var(--sg-offwhite)]">
        <FeaturedSection places={places} />

        <CategoryBrowse places={places} />

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

        <section id="about" className="max-w-6xl mx-auto px-5 md:px-8 pb-20">
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

      <PaywallModal
        isOpen={!!paywallZone}
        onClose={() => setPaywallZone(null)}
        zoneName={paywallZone ?? ''}
        onUnlock={handleUnlockZone}
      />
    </PageShell>
  );
}
