import { useCallback, useState, useEffect, useMemo } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import { Marker } from 'react-map-gl/mapbox';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, MapPin } from 'lucide-react';
import { InteractiveMap } from '../Map/InteractiveMap';
import ZoneTeaser from '../Map/ZoneTeaser';
import { PlacePreviewCard } from '../Map/PlacePreviewCard';
import { MapToolbar } from '../Map/MapToolbar';
import { ZoneSidePanel } from '../Map/ZoneSidePanel';
import { ZoneLockIcon } from '../Map/ZoneLockIcon';
import { EditorPanel } from '../Editor/EditorPanel';
import { ZoneListPanel } from '../Editor/ZoneListPanel';
import { MobileDrawer } from '../ui/MobileDrawer';
import type { Place, PlaceCategory, MapZoomState, Coordinates } from '../../types';
import { ZONE_POLYGON_CENTERS, ZONE_MAP } from '../../utils/zoneMapping';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';
import { useLandmarks } from '../../hooks/useLandmarks';
import { useZoneTeasers } from '../../hooks/useZoneTeasers';

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
  onCancelPending?: () => void;
  onMoveToZone?: (placeId: string, zoneId: string) => void;
  enabledZoneIds?: string[];
  isZoneEnabled?: (zoneId: string) => boolean;
  onToggleZone?: (zoneId: string, enabled: boolean) => void;
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
  onCancelPending,
  onMoveToZone,
  enabledZoneIds = [],
  isZoneEnabled: _isZoneEnabled,
  onToggleZone,
}: HeroMapSectionProps) {
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null);
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [editPlaceKey, setEditPlaceKey] = useState<string | null>(null);
  const [showDisabledZones, setShowDisabledZones] = useState(false);
  const [editorTab, setEditorTab] = useState<'places' | 'zones'>('places');
  const { landmarks } = useLandmarks();
  const { teasers } = useZoneTeasers();

  const showLandmarks = mapState === 'expanded' || mapState === 'zoneDetail';

  const handlePlaceClick = useCallback(
    (place: Place) => {
      if (isEditorMode) {
        setEditPlaceKey(`${place.id}::${Date.now()}`);
      } else {
        setPreviewPlace(place);
      }
      onPlaceClick(place);
    },
    [onPlaceClick, isEditorMode],
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

  // Use polygon centers for icon placement (center of zone boundary, not station location)
  const allZonesWithCentroids = Object.entries(ZONE_POLYGON_CENTERS)
    .filter(([zoneId]) => enabledZoneIds.includes(zoneId));
  const placeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const place of _places) {
      if (place.zone) {
        counts[place.zone] = (counts[place.zone] ?? 0) + 1;
      }
    }
    return counts;
  }, [_places]);

  const lockedZonesWithCentroids = isEditorMode
    ? []
    : allZonesWithCentroids.filter(([zoneId]) => !unlockedZones.includes(zoneId));
  const unlockedZonesWithCentroids = isEditorMode
    ? allZonesWithCentroids
    : allZonesWithCentroids.filter(([zoneId]) => unlockedZones.includes(zoneId));

  const isFullscreen = mapState === 'expanded' || mapState === 'zoneDetail';
  const isZoneDetail = mapState === 'zoneDetail' && activeZone;
  const teaserTotal = activeZone && teasers[activeZone]
    ? Object.values(teasers[activeZone]).reduce((a, b) => a + b, 0)
    : 0;
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

  // Marker drag handlers for editor mode
  // Coordinates are NOT saved on drag end — only when the form is submitted
  const [isDragging, setIsDragging] = useState(false);
  const [dragCoordinates, setDragCoordinates] = useState<{ lng: number; lat: number } | null>(null);
  const [draggedPlaceId, setDraggedPlaceId] = useState<string | null>(null);

  const handleMarkerDragStart = useCallback((place: Place) => {
    setIsDragging(true);
    setDraggedPlaceId(place.id);
    // Also open the edit form for this place
    setEditPlaceKey(`${place.id}::${Date.now()}`);
  }, []);

  const handleMarkerDrag = useCallback(
    (_place: Place, lngLat: { lng: number; lat: number }) => {
      // Clip to active zone — don't allow dragging outside the zone boundary
      const map = mapRef.current?.getMap();
      if (map && activeZone) {
        const point = map.project([lngLat.lng, lngLat.lat]);
        const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });
        const inZone = features.some(f => f.properties?.zone === activeZone);
        if (!inZone) return;
      }
      setDragCoordinates(lngLat);
    },
    [mapRef, activeZone],
  );

  const handleMarkerDragEnd = useCallback(
    (_place: Place, lngLat: { lng: number; lat: number }) => {
      setIsDragging(false);
      // Clip final position too
      const map = mapRef.current?.getMap();
      if (map && activeZone) {
        const point = map.project([lngLat.lng, lngLat.lat]);
        const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });
        const inZone = features.some(f => f.properties?.zone === activeZone);
        if (!inZone) return; // Keep last valid dragCoordinates
      }
      // Keep dragCoordinates and draggedPlaceId — marker stays at new position
      // Coordinates will be saved when user clicks "Update Place" in the form
      setDragCoordinates(lngLat);
    },
    [],
  );

  // Clear drag override when form is submitted or cancelled
  const clearDragOverride = useCallback(() => {
    setDraggedPlaceId(null);
    setDragCoordinates(null);
  }, []);

  // Override coordinates for a place being dragged (marker stays at new position until form save)
  const displayPlaces = draggedPlaceId && dragCoordinates
    ? filteredZonePlaces.map(p => p.id === draggedPlaceId ? { ...p, coordinates: dragCoordinates } : p)
    : filteredZonePlaces;

  // Determine which sidebar to show
  const renderSidebar = () => {
    if (isEditorMode) {
      if (editorTab === 'zones') {
        return (
          <ZoneListPanel
            enabledZoneIds={enabledZoneIds}
            onToggleZone={onToggleZone ?? (() => {})}
            placeCounts={placeCounts}
            activeZone={activeZone}
            showDisabledOnMap={showDisabledZones}
            onToggleShowDisabledOnMap={() => setShowDisabledZones(!showDisabledZones)}
            onZoneClick={(zoneId) => {
              setEditorTab('places');
              onZoneClick(zoneId);
            }}
          />
        );
      }
      if (mapState === 'zoneDetail' && activeZone) {
        const zone = ZONE_MAP[activeZone];
        return (
          <div className="h-full w-full bg-white border-r border-[var(--sg-border)] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--sg-border)] flex items-center gap-2 shrink-0">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: zone?.color ?? '#6b7280' }}
              />
              <span className="font-display text-sm font-bold text-[var(--sg-navy)]">
                {zone?.name ?? activeZone}
              </span>
              <span className="text-xs text-[var(--sg-navy)]/40 ml-auto">
                {displayPlaces.length} place{displayPlaces.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <EditorPanel
                places={displayPlaces}
                pendingCoordinates={pendingCoordinates ?? null}
                currentView={currentView}
                onAdd={onAddPlace ?? (() => {})}
                onUpdate={onUpdatePlace ?? (() => {})}
                onDelete={onDeletePlace ?? (() => {})}
                onCancelPending={() => { onCancelPending?.(); setEditPlaceKey(null); }}
                onPlaceClick={handlePlaceClick}
                editPlaceKey={editPlaceKey}
                isDragging={isDragging}
                dragCoordinates={dragCoordinates}
                onDragComplete={clearDragOverride}
                onMoveToZone={onMoveToZone}
              />
            </div>
          </div>
        );
      }
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
          teaserCounts={teasers[activeZone]}
        />
      );
    }
    return null;
  };

  // Should the sidebar be visible?
  const showSidebar = isEditorMode
    ? (mapState === 'expanded' || mapState === 'zoneDetail' || editorTab === 'zones')
    : (mapState === 'zoneDetail' && activeZone);

  // ── Fullscreen mode ──
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-[var(--sg-offwhite)] flex flex-col">
        {/* White header bar */}
        <div className="bg-white border-b border-[var(--sg-border)] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile: show zone name in zoneDetail */}
            {isZoneDetail ? (
              <>
                <span className="text-sm font-semibold text-[var(--sg-navy)] md:hidden">
                  {ZONE_MAP[activeZone!]?.name ?? activeZone}
                </span>
                <span className="text-sm font-semibold text-[var(--sg-navy)] hidden md:inline">
                  {isEditorMode ? 'Editor' : 'Explore London'}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-[var(--sg-navy)]">
                {isEditorMode ? 'Editor' : 'Explore London'}
              </span>
            )}
            {isEditorMode && (
              <>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--sg-crimson)]/10 text-[var(--sg-crimson)]">
                  Edit Mode
                </span>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => setEditorTab('places')}
                    className={`text-xs px-2 py-1 rounded-md cursor-pointer transition-colors ${
                      editorTab === 'places'
                        ? 'bg-[var(--sg-navy)] text-white'
                        : 'text-[var(--sg-navy)]/50 hover:bg-[var(--sg-offwhite)]'
                    }`}
                  >
                    Places
                  </button>
                  <button
                    onClick={() => setEditorTab('zones')}
                    className={`text-xs px-2 py-1 rounded-md cursor-pointer transition-colors ${
                      editorTab === 'zones'
                        ? 'bg-[var(--sg-navy)] text-white'
                        : 'text-[var(--sg-navy)]/50 hover:bg-[var(--sg-offwhite)]'
                    }`}
                  >
                    Zones
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onCollapse}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[var(--sg-navy)] hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer"
          >
            <X size={15} />
            <span className="text-xs font-semibold">Close</span>
          </button>
        </div>

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
            {/* Search + filter toolbar overlaid on map */}
            <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
              <MapToolbar
                mapState={mapState}
                activeZone={activeZone}
                sidebarOpen={!!showSidebar}
                onZoneSelect={onZoneClick}
                places={zonePlaces}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                onBack={handleBack}
                onCollapse={onCollapse}
                isEditorMode={isEditorMode}
              />
            </div>
            <InteractiveMap
              places={mapState === 'zoneDetail' && !isZoneLocked ? displayPlaces : []}
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
              enabledZoneIds={enabledZoneIds}
              showDisabledZones={isEditorMode && showDisabledZones}
              draggablePlaceId={isEditorMode && editPlaceKey ? editPlaceKey.split('::')[0] : null}
              onMarkerDragStart={isEditorMode ? handleMarkerDragStart : undefined}
              onMarkerDrag={isEditorMode ? handleMarkerDrag : undefined}
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

            {/* Zone teaser summary panel — desktop only */}
            {mapState === 'zoneDetail' && !isEditorMode && (
              <div className="hidden md:block">
                <ZoneTeaser
                  zoneId={activeZone}
                  zoneName={activeZone ? ZONE_MAP[activeZone]?.name : undefined}
                  teaserCounts={activeZone ? teasers[activeZone] : undefined}
                  places={allUnlockedPlaces ?? []}
                  activeCategory={activeCategoryProp ?? null}
                />
              </div>
            )}

            {/* Mobile bottom drawer — absolute inside map container, same as MapToolbar */}
            <div className="md:hidden">
              <MobileDrawer
                isOpen={!!isZoneDetail && !isEditorMode}
                onClose={handleBack}
                containerHeight={typeof window !== 'undefined' ? window.innerHeight - 48 : 700}
                peekContent={
                  <p className="text-sm text-[var(--sg-navy)] text-center">
                    {isZoneLocked
                      ? <>This zone has <span className="font-bold text-[var(--sg-crimson)]">{teaserTotal}</span> place{teaserTotal !== 1 ? 's' : ''} waiting for you</>
                      : <><span className="font-bold text-[var(--sg-thames)]">{filteredZonePlaces.length}</span> place{filteredZonePlaces.length !== 1 ? 's' : ''} to explore</>
                    }
                  </p>
                }
              >
                {/* Render sidebar with header hidden (already in map header + peek) */}
                {mapState === 'zoneDetail' && activeZone && !isEditorMode && (
                  <ZoneSidePanel
                    zoneId={activeZone}
                    zoneName={ZONE_MAP[activeZone]?.name}
                    places={filteredZonePlaces}
                    onPlaceClick={handlePlaceClick}
                    locked={!unlockedZones.includes(activeZone)}
                    onUnlock={() => onUnlockZone(activeZone)}
                    teaserCounts={teasers[activeZone]}
                    hideHeader
                  />
                )}
                {/* Zone teaser inside drawer for mobile */}
                {mapState === 'zoneDetail' && activeZone && teasers[activeZone] && (
                  <div className="px-5 py-4 border-t border-[var(--sg-border)]">
                    <div className="text-xs font-bold text-[#7c2d36] uppercase tracking-wider mb-2">
                      {ZONE_MAP[activeZone]?.name ?? activeZone}
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(teasers[activeZone])
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-[#2d1f1a]">
                              <span className="text-base">{CATEGORY_EMOJI[category] ?? '📍'}</span>
                              <span className="capitalize">{category}s</span>
                            </span>
                            <span className="font-medium text-[#7c2d36]">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </MobileDrawer>
            </div>

            {/* Bottom bar — not in editor, not in zoneDetail */}
            {!isEditorMode && !(mapState === 'zoneDetail' && activeZone) && (
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
          enabledZoneIds={enabledZoneIds}
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
