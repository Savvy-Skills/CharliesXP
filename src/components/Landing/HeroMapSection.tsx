import { useCallback, useState, useEffect } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { InteractiveMap } from '../Map/InteractiveMap';
import ZoneTeaser from '../Map/ZoneTeaser';
import { PlacePreviewCard } from '../Map/PlacePreviewCard';
import { ZoneFilterTabs } from '../Map/ZoneFilterTabs';
import { ZoneSidePanel } from '../Map/ZoneSidePanel';
import { ZoneLockIcon } from '../Map/ZoneLockIcon';
import type { Place, PlaceCategory, MapZoomState } from '../../types';
import { ZONE_CENTROIDS } from '../../utils/zoneMapping';

interface HeroMapSectionProps {
  places: Place[];
  mapRef: React.RefObject<MapRef | null>;
  mapState: MapZoomState;
  activeZone: string | null;
  unlockedZones: string[];
  zonePlaces: Place[];
  onPlaceClick: (place: Place) => void;
  onLockedZoneClick: (zoneId: string) => void;
  onZoneClick: (zoneId: string) => void;
  onZoomOut: () => void;
  onCollapse: () => void;
  onExpand: () => void;
  onResetView: () => void;
  onMapClick?: (e: { lngLat: { lng: number; lat: number } }) => void;
  onZoomChange?: (zoom: number) => void;
  onMoveEnd?: () => void;
  allUnlockedPlaces?: Place[];
  activeCategory?: PlaceCategory | null;
}

export function HeroMapSection({
  places: _places,
  mapRef,
  mapState,
  activeZone,
  unlockedZones,
  zonePlaces,
  onPlaceClick,
  onLockedZoneClick,
  onZoneClick,
  onZoomOut,
  onCollapse,
  onExpand,
  onResetView,
  onMapClick,
  onZoomChange,
  onMoveEnd,
  allUnlockedPlaces,
  activeCategory: activeCategoryProp,
}: HeroMapSectionProps) {
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null);
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  const handlePlaceClick = useCallback(
    (place: Place) => {
      setPreviewPlace(place);
      onPlaceClick(place);
    },
    [onPlaceClick],
  );

  const handleClosePreview = useCallback(() => {
    setPreviewPlace(null);
  }, []);

  const handleBack = useCallback(() => {
    onZoomOut();
    setPreviewPlace(null);
    setActiveCategory(null);
  }, [onZoomOut]);

  const filteredZonePlaces =
    zonePlaces.filter((p) => !activeCategory || p.category === activeCategory);

  const lockedZonesWithCentroids = Object.entries(ZONE_CENTROIDS)
    .filter(([zoneId]) => !unlockedZones.includes(zoneId));

  const unlockedZonesWithCentroids = Object.entries(ZONE_CENTROIDS)
    .filter(([zoneId]) => unlockedZones.includes(zoneId));

  const isFullscreen = mapState === 'expanded' || mapState === 'zoneDetail';
  const showZoneIcons = mapState === 'overview' || mapState === 'expanded';

  // Mapbox needs resize() when container size changes
  useEffect(() => {
    const timer = setTimeout(() => mapRef.current?.getMap()?.resize(), 50);
    const timer2 = setTimeout(() => mapRef.current?.getMap()?.resize(), 400);
    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, [isFullscreen, mapState, mapRef]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  // ── Fullscreen mode ──
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-[var(--sg-offwhite)] flex flex-col">
        {/* Top bar: tabs (only in zoneDetail) or close button (in expanded) */}
        {mapState === 'zoneDetail' && activeZone ? (
          <ZoneFilterTabs
            zoneId={activeZone}
            places={zonePlaces}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onBack={handleBack}
          />
        ) : (
          <div className="bg-white border-b border-[var(--sg-border)] px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--sg-navy)]">
              Explore London
            </span>
            <button
              onClick={onCollapse}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                text-[var(--sg-navy)] hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer"
            >
              <X size={15} />
              <span className="text-xs font-semibold">Close</span>
            </button>
          </div>
        )}

        {/* Main area: map takes full width, sidebar overlays from left */}
        <div className="flex-1 relative overflow-hidden">
          {/* Side panel — overlays on top of map from the left */}
          <AnimatePresence>
            {mapState === 'zoneDetail' && activeZone && (
              <motion.div
                initial={{ x: -380 }}
                animate={{ x: 0 }}
                exit={{ x: -380 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute top-0 left-0 bottom-0 w-[380px] z-20 hidden md:block"
              >
                <ZoneSidePanel
                  zoneId={activeZone}
                  places={filteredZonePlaces}
                  onPlaceClick={handlePlaceClick}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map — always full width */}
          <div className="h-full w-full relative">
            <InteractiveMap
              places={mapState === 'zoneDetail' ? filteredZonePlaces : []}
              mapRef={mapRef}
              onPlaceClick={handlePlaceClick}
              onMapClick={onMapClick}
              onResetView={onResetView}
              mode="full"
              interactive
              onZoomChange={onZoomChange}
              onMoveEnd={onMoveEnd}
              skip3DModels
              activeZone={mapState === 'zoneDetail' ? activeZone : null}
              hoveredZone={hoveredZoneId}
              mapChildren={
                showZoneIcons
                  ? <>
                      {lockedZonesWithCentroids.map(([zoneId, coords]) => (
                        <ZoneLockIcon
                          key={zoneId}
                          longitude={coords.lng}
                          latitude={coords.lat}
                          zoneId={zoneId}
                          onClick={() => onLockedZoneClick(zoneId)}
                          onMouseEnter={() => setHoveredZoneId(zoneId)}
                          onMouseLeave={() => setHoveredZoneId(null)}
                        />
                      ))}
                      {unlockedZonesWithCentroids.map(([zoneId, coords]) => (
                        <ZoneLockIcon
                          key={zoneId}
                          longitude={coords.lng}
                          latitude={coords.lat}
                          zoneId={zoneId}
                          unlocked
                          onClick={() => onZoneClick(zoneId)}
                          onMouseEnter={() => setHoveredZoneId(zoneId)}
                          onMouseLeave={() => setHoveredZoneId(null)}
                        />
                      ))}
                    </>
                  : undefined
              }
            />

            {/* Place preview card (for map marker clicks) */}
            {mapState === 'zoneDetail' && (
              <PlacePreviewCard place={previewPlace} onClose={handleClosePreview} />
            )}

            {/* Zone teaser summary panel */}
            {mapState === 'zoneDetail' && allUnlockedPlaces && (
              <ZoneTeaser
                places={allUnlockedPlaces}
                activeCategory={activeCategoryProp ?? null}
              />
            )}

            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 z-30">
              <div className="bg-gradient-to-t from-[var(--sg-navy)]/80 to-transparent
                px-6 py-3 flex items-center justify-center">
                <span className="text-xs text-[var(--sg-offwhite)]/80">
                  <span className="text-[var(--sg-thames)] font-semibold">{unlockedZones.length}</span> zone{unlockedZones.length !== 1 ? 's' : ''} unlocked
                  {mapState === 'expanded' && ' — tap a zone to explore'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Default collapsed state (overview) ──
  return (
    <section className="relative">
      <div className="relative overflow-hidden" style={{ height: '45vh' }}>
        <InteractiveMap
          places={[]}
          mapRef={mapRef}
          onPlaceClick={() => {}}
          onMapClick={onMapClick}
          onResetView={onResetView}
          mode="full"
          interactive={false}
          hoveredZone={hoveredZoneId}
          mapChildren={
            lockedZonesWithCentroids.map(([zoneId, coords]) => (
              <ZoneLockIcon
                key={zoneId}
                longitude={coords.lng}
                latitude={coords.lat}
                zoneId={zoneId}
                onClick={() => onLockedZoneClick(zoneId)}
                onMouseEnter={() => setHoveredZoneId(zoneId)}
                onMouseLeave={() => setHoveredZoneId(null)}
              />
            ))
          }
        />

        <button
          onClick={onExpand}
          className="absolute bottom-0 left-0 right-0 z-30 w-full cursor-pointer"
        >
          <div className="bg-gradient-to-t from-[var(--sg-navy)]/90 to-[var(--sg-navy)]/60 backdrop-blur-sm
            px-6 py-3.5 flex items-center justify-center gap-3">
            <Sparkles size={14} className="text-[var(--sg-thames)]" />
            <span className="text-sm font-medium text-[var(--sg-offwhite)]">
              Tap the map or here to start exploring
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}
