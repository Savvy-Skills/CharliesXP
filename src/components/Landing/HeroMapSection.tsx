import { useCallback, useState, useEffect } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import { Marker } from 'react-map-gl/mapbox';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, MapPin } from 'lucide-react';
import { InteractiveMap } from '../Map/InteractiveMap';
import ZoneTeaser from '../Map/ZoneTeaser';
import { PlacePreviewCard } from '../Map/PlacePreviewCard';
import { ZoneFilterTabs } from '../Map/ZoneFilterTabs';
import { ZoneSidePanel } from '../Map/ZoneSidePanel';
import { ZoneLockIcon } from '../Map/ZoneLockIcon';
import { EditorPanel } from '../Editor/EditorPanel';
import type { Place, PlaceCategory, MapZoomState, Coordinates } from '../../types';
import { ZONE_CENTROIDS, ZONE_MAP } from '../../utils/zoneMapping';
import { useLandmarks } from '../../hooks/useLandmarks';

interface HeroMapSectionProps {
  places: Place[];
  mapRef: React.RefObject<MapRef | null>;
  mapState: MapZoomState;
  activeZone: string | null;
  unlockedZones: string[];
  zonePlaces: Place[];
  onPlaceClick: (place: Place) => void;
  onLockedZoneClick: (zoneId: string) => void;
  onUnlockZone: (zoneId: string) => void;
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
  // Editor props
  isEditorMode?: boolean;
  pendingCoordinates?: Coordinates | null;
  currentView?: { zoom: number; pitch: number; bearing: number };
  onAddPlace?: (place: Omit<Place, 'id'>) => void;
  onUpdatePlace?: (id: string, updates: Partial<Place>) => void;
  onDeletePlace?: (id: string) => void;
  onExportPlaces?: () => void;
  onCancelPending?: () => void;
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
  onUnlockZone,
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
  // Editor
  isEditorMode = false,
  pendingCoordinates,
  currentView = { zoom: 16, pitch: 50, bearing: 0 },
  onAddPlace,
  onUpdatePlace,
  onDeletePlace,
  onExportPlaces,
  onCancelPending,
}: HeroMapSectionProps) {
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null);
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const { landmarks } = useLandmarks();

  const showLandmarks = mapState === 'expanded' || mapState === 'zoneDetail';

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

  // In editor mode, bypass zone lock
  const isZoneLocked = isEditorMode ? false : (activeZone ? !unlockedZones.includes(activeZone) : false);
  const filteredZonePlaces =
    zonePlaces.filter((p) => !activeCategory || p.category === activeCategory);

  // In editor mode, all zones are treated as unlocked for icons
  const allZonesWithCentroids = Object.entries(ZONE_CENTROIDS);
  const lockedZonesWithCentroids = isEditorMode
    ? []
    : allZonesWithCentroids.filter(([zoneId]) => !unlockedZones.includes(zoneId));
  const unlockedZonesWithCentroids = isEditorMode
    ? allZonesWithCentroids
    : allZonesWithCentroids.filter(([zoneId]) => unlockedZones.includes(zoneId));

  const isFullscreen = mapState === 'expanded' || mapState === 'zoneDetail';
  const showLockedIcons = !isEditorMode;
  const showUnlockedIcons = mapState === 'overview' || mapState === 'expanded';

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

  // Marker drag handler for editor mode
  const handleMarkerDragEnd = useCallback(
    (place: Place, lngLat: { lng: number; lat: number }) => {
      onUpdatePlace?.(place.id, { coordinates: lngLat });
    },
    [onUpdatePlace],
  );

  // Determine which sidebar to show
  const renderSidebar = () => {
    if (isEditorMode) {
      if (mapState === 'zoneDetail' && activeZone) {
        return (
          <EditorPanel
            places={filteredZonePlaces}
            pendingCoordinates={pendingCoordinates ?? null}
            currentView={currentView}
            onAdd={onAddPlace ?? (() => {})}
            onUpdate={onUpdatePlace ?? (() => {})}
            onDelete={onDeletePlace ?? (() => {})}
            onExport={onExportPlaces ?? (() => {})}
            onCancelPending={onCancelPending ?? (() => {})}
            onPlaceClick={handlePlaceClick}
          />
        );
      }
      // "Select a zone" prompt when not in zoneDetail
      return (
        <div className="h-full w-full bg-white border-r border-[var(--sg-border)] flex flex-col items-center justify-center p-8">
          <div className="w-14 h-14 rounded-full bg-[var(--sg-crimson)]/10 flex items-center justify-center mb-4">
            <MapPin size={24} className="text-[var(--sg-crimson)]" />
          </div>
          <h3 className="font-display text-lg font-bold text-[var(--sg-navy)] mb-2">
            Select a Zone
          </h3>
          <p className="text-sm text-[var(--sg-navy)]/50 text-center leading-relaxed">
            Click on a zone on the map to start editing places.
          </p>
        </div>
      );
    }

    // Normal mode: ZoneSidePanel
    if (mapState === 'zoneDetail' && activeZone) {
      return (
        <ZoneSidePanel
          zoneId={activeZone}
          zoneName={ZONE_MAP[activeZone]?.name}
          places={filteredZonePlaces}
          onPlaceClick={handlePlaceClick}
          locked={!unlockedZones.includes(activeZone)}
          onUnlock={() => onUnlockZone(activeZone)}
        />
      );
    }
    return null;
  };

  // Should the sidebar be visible?
  const showSidebar = isEditorMode
    ? (mapState === 'expanded' || mapState === 'zoneDetail')
    : (mapState === 'zoneDetail' && activeZone);

  // ── Fullscreen mode ──
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-[var(--sg-offwhite)] flex flex-col">
        {/* Top bar */}
        {mapState === 'zoneDetail' && activeZone && !isEditorMode ? (
          <ZoneFilterTabs
            zoneId={activeZone}
            places={zonePlaces}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onBack={handleBack}
          />
        ) : mapState === 'zoneDetail' && activeZone && isEditorMode ? (
          <div className="bg-white border-b border-[var(--sg-border)] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--sg-crimson)]/10 text-[var(--sg-crimson)]">
                Editor
              </span>
              <span className="text-sm font-semibold text-[var(--sg-navy)]">
                {activeZone ? (ZONE_MAP[activeZone]?.name ?? activeZone) : ''}
              </span>
            </div>
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                text-[var(--sg-navy)] hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer"
            >
              <X size={15} />
              <span className="text-xs font-semibold">Back</span>
            </button>
          </div>
        ) : (
          <div className="bg-white border-b border-[var(--sg-border)] px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--sg-navy)]">
              {isEditorMode ? 'Editor — Select a Zone' : 'Explore London'}
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
          {/* Side panel */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ x: -380 }}
                animate={{ x: 0 }}
                exit={{ x: -380 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute top-0 left-0 bottom-0 w-[380px] z-20 hidden md:block"
              >
                {renderSidebar()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map — always full width */}
          <div className="h-full w-full relative">
            <InteractiveMap
              places={mapState === 'zoneDetail' && !isZoneLocked ? filteredZonePlaces : []}
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
              editorMode={isEditorMode}
              onMarkerDragEnd={isEditorMode ? handleMarkerDragEnd : undefined}
              mapChildren={
                <>
                  {showLockedIcons && lockedZonesWithCentroids.map(([zoneId, coords]) => (
                    <ZoneLockIcon
                      key={zoneId}
                      longitude={coords.lng}
                      latitude={coords.lat}
                      zoneId={zoneId}
                      zoneName={ZONE_MAP[zoneId]?.name}
                      onClick={() => onLockedZoneClick(zoneId)}
                      onMouseEnter={() => setHoveredZoneId(zoneId)}
                      onMouseLeave={() => setHoveredZoneId(null)}
                    />
                  ))}
                  {showUnlockedIcons && unlockedZonesWithCentroids.map(([zoneId, coords]) => (
                    <ZoneLockIcon
                      key={zoneId}
                      longitude={coords.lng}
                      latitude={coords.lat}
                      zoneId={zoneId}
                      zoneName={ZONE_MAP[zoneId]?.name}
                      unlocked
                      onClick={() => onZoneClick(zoneId)}
                      onMouseEnter={() => setHoveredZoneId(zoneId)}
                      onMouseLeave={() => setHoveredZoneId(null)}
                    />
                  ))}
                  {showLandmarks && landmarks.map((lm) => (
                    <Marker
                      key={lm.id}
                      longitude={lm.coordinates.lng}
                      latitude={lm.coordinates.lat}
                      anchor="center"
                    >
                      <div className="flex flex-col items-center pointer-events-none">
                        <div className="w-3 h-3 rounded-full bg-[var(--sg-crimson)]/60 border border-white/80 shadow-sm" />
                        <span className="text-[9px] font-medium text-[var(--sg-navy)]/50 mt-0.5 whitespace-nowrap max-w-[80px] truncate">
                          {lm.name}
                        </span>
                      </div>
                    </Marker>
                  ))}
                </>
              }
            />

            {/* Place preview card (for map marker clicks) — not in editor mode */}
            {mapState === 'zoneDetail' && !isEditorMode && (
              <PlacePreviewCard place={previewPlace} onClose={handleClosePreview} />
            )}

            {/* Zone teaser summary panel — not in editor mode */}
            {mapState === 'zoneDetail' && !isEditorMode && (
              <ZoneTeaser
                zoneId={activeZone}
                zoneName={activeZone ? ZONE_MAP[activeZone]?.name : undefined}
                places={allUnlockedPlaces ?? []}
                activeCategory={activeCategoryProp ?? null}
              />
            )}

            {/* Bottom bar — not in editor mode */}
            {!isEditorMode && (
              <div className="absolute bottom-0 left-0 right-0 z-30">
                <div className="bg-gradient-to-t from-[var(--sg-navy)]/80 to-transparent
                  px-6 py-3 flex items-center justify-center">
                  <span className="text-xs text-[var(--sg-offwhite)]/80">
                    <span className="text-[var(--sg-thames)] font-semibold">{unlockedZones.length}</span> zone{unlockedZones.length !== 1 ? 's' : ''} unlocked
                    {mapState === 'expanded' && ' — tap a zone to explore'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Default collapsed state (overview) — never shown in editor mode ──
  return (
    <section className="relative max-w-6xl mx-auto">
      <div className="relative overflow-hidden" style={{ height: '45vh' }}>
        <InteractiveMap
          places={[]}
          mapRef={mapRef}
          onPlaceClick={() => { }}
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
                zoneName={ZONE_MAP[zoneId]?.name}
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
