import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl';
import MapGL, { type MapRef, type ViewStateChangeEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PlaceMarker } from './PlaceMarker';
import { MAP_STYLES, DEFAULT_VIEW_STATE, LONDON_BOUNDS, ALLOWED_LABEL_LAYERS, type MapStyleKey } from '../../utils/mapStyles';
import { ZONE_ENTER_THRESHOLD } from '../../utils/zoneMapping';
import { createModelLayer } from './ModelLayer';
import type { Place, ViewState } from '../../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export type MapMode = 'contained' | 'full';

interface InteractiveMapProps {
  places: Place[];
  mapRef: React.RefObject<MapRef | null>;
  onPlaceClick: (place: Place) => void;
  onMapClick?: (e: { lngLat: { lng: number; lat: number } }) => void;
  onResetView: () => void;
  mode?: MapMode;
  interactive?: boolean;
  mapChildren?: ReactNode;
  children?: ReactNode;
  onZoomChange?: (zoom: number) => void;
  onMoveEnd?: () => void;
  skip3DModels?: boolean;
  activeZone?: string | null;
  /** Zone ID to highlight (from icon hover or external source) */
  hoveredZone?: string | null;
  editorMode?: boolean;
  onMarkerDragEnd?: (place: Place, lngLat: { lng: number; lat: number }) => void;
}

// World polygon for full-map dim overlay
const WORLD_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [{
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]],
    },
  }],
};

export function InteractiveMap({
  places,
  mapRef,
  onPlaceClick,
  onMapClick,
  onResetView: _onResetView,
  mode = 'full',
  interactive = true,
  mapChildren,
  children,
  onZoomChange,
  onMoveEnd,
  skip3DModels = false,
  activeZone = null,
  hoveredZone = null,
  editorMode = false,
  onMarkerDragEnd,
}: InteractiveMapProps) {
  const isContained = mode === 'contained';
  const canInteract = !isContained && interactive;
  const [viewState, setViewState] = useState<ViewState>(() => {
    if (window.location.pathname === '/map') {
      const saved = sessionStorage.getItem('map-viewport');
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
      }
    }
    return DEFAULT_VIEW_STATE;
  });
  const [mapStyle] = useState<MapStyleKey>('streets');
  const [mapReady, setMapReady] = useState(false);
  const hoveredZoneRef = useRef<string | null>(null);

  // Persist viewport to sessionStorage so it can be restored on /map
  useEffect(() => {
    sessionStorage.setItem('map-viewport', JSON.stringify(viewState));
  }, [viewState]);

  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    const vs = evt.viewState as ViewState;
    setViewState(vs);
    onZoomChange?.(vs.zoom);
  }, [onZoomChange]);

  const hideClutterLabels = useCallback((map: MapboxMap) => {
    for (const layer of map.getStyle().layers ?? []) {
      const isTextLayer =
        layer.type === 'symbol' &&
        (layer.id.includes('label') || layer.id.includes('symbol'));
      if (isTextLayer && !ALLOWED_LABEL_LAYERS.includes(layer.id)) {
        map.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    }
  }, []);

  const hideTransitLayers = useCallback((map: MapboxMap) => {
    // Hide rail lines and transit station icons/labels
    for (const layer of map.getStyle().layers ?? []) {
      const id = layer.id;
      if (
        id.includes('rail') ||
        id.includes('transit') ||
        id.includes('airport') ||
        id.includes('ferry')
      ) {
        map.setLayoutProperty(id, 'visibility', 'none');
      }
    }
  }, []);

  const addPostcodeLayers = useCallback((map: MapboxMap) => {
    // Source: All postcodes (for background lines + click detection)
    if (!map.getSource('postcodes')) {
      map.addSource('postcodes', {
        type: 'geojson',
        data: '/london_postcodes.geojson',
      });
    }

    // Source: Merged zone polygons (outer borders, per-zone colors)
    if (!map.getSource('zones')) {
      map.addSource('zones', {
        type: 'geojson',
        data: '/managed_zones.geojson',
      });
    }

    // Source: World polygon for full-map dim
    if (!map.getSource('world-dim-src')) {
      map.addSource('world-dim-src', {
        type: 'geojson',
        data: WORLD_GEOJSON as GeoJSON.FeatureCollection,
      });
    }

    // Subtle background lines for all postcodes
    if (!map.getLayer('postcodes-bg')) {
      map.addLayer({
        id: 'postcodes-bg',
        type: 'line',
        source: 'postcodes',
        paint: {
          'line-color': '#8b7355',
          'line-width': 0.3,
          'line-opacity': 0.15,
        },
      });
    }

    // World dim — covers ENTIRE map when inside a zone (hidden by default)
    if (!map.getLayer('world-dim')) {
      map.addLayer({
        id: 'world-dim',
        type: 'fill',
        source: 'world-dim-src',
        paint: {
          'fill-color': '#faf8f5',
          'fill-opacity': 0.6,
        },
        layout: { visibility: 'none' },
      });
    }

    // Active zone fill — shows active zone color above the dim (hidden by default)
    if (!map.getLayer('zones-active-fill')) {
      map.addLayer({
        id: 'zones-active-fill',
        type: 'fill',
        source: 'zones',
        filter: ['==', ['get', 'zone'], ''],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.02,
        },
        layout: { visibility: 'none' },
      });
    }

    // Zone fill — semi-transparent, per-zone color
    if (!map.getLayer('zones-fill')) {
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.12, 14, 0.06, 16, 0.03],
        },
      });
    }

    // Zone border — outer borders only, per-zone color
    if (!map.getLayer('zones-border')) {
      map.addLayer({
        id: 'zones-border',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2.5, 13, 2, 15, 1, 17, 0.3],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.7, 13, 0.6, 15, 0.35, 17, 0.15],
        },
      });
    }

    // Hover highlight fill — initially hidden
    if (!map.getLayer('zones-hover-fill')) {
      map.addLayer({
        id: 'zones-hover-fill',
        type: 'fill',
        source: 'zones',
        filter: ['==', ['get', 'zone'], ''],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.2,
        },
      });
    }

    // Hover highlight border — initially hidden
    if (!map.getLayer('zones-hover-border')) {
      map.addLayer({
        id: 'zones-hover-border',
        type: 'line',
        source: 'zones',
        filter: ['==', ['get', 'zone'], ''],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3.5,
          'line-opacity': 0.9,
        },
      });
    }
  }, []);

  const add3DModels = useCallback((map: MapboxMap, modelPlaces: Place[]) => {
    for (const place of modelPlaces) {
      if (!place.model) continue;
      const layerId = `3d-model-${place.id}`;
      if (map.getLayer(layerId)) continue;

      const modelLayer = createModelLayer({
        id: layerId,
        url: place.model.url,
        origin: [place.coordinates.lng, place.coordinates.lat],
        scale: place.model.scale ?? 50,
        rotation: place.model.rotation ?? [90, 0, 0],
        onClick: () => onPlaceClick(place),
      });
      map.addLayer(modelLayer);
    }
  }, [onPlaceClick]);

  // Register hover handlers directly in handleLoad (guaranteed map is ready)
  const registerHoverHandlers = useCallback((map: MapboxMap) => {
    const clearHover = () => {
      if (hoveredZoneRef.current) {
        map.setFilter('zones-hover-fill', ['==', ['get', 'zone'], '']);
        map.setFilter('zones-hover-border', ['==', ['get', 'zone'], '']);
        hoveredZoneRef.current = null;
        map.getCanvas().style.cursor = '';
      }
    };

    const setHover = (zone: string) => {
      hoveredZoneRef.current = zone;
      map.setFilter('zones-hover-fill', ['==', ['get', 'zone'], zone]);
      map.setFilter('zones-hover-border', ['==', ['get', 'zone'], zone]);
      map.getCanvas().style.cursor = 'pointer';
    };

    map.on('mousemove', (e: MapMouseEvent) => {
      if (!map.getLayer('zones-hover-fill')) return;

      const zoom = map.getZoom();
      if (zoom >= ZONE_ENTER_THRESHOLD) {
        clearHover();
        return;
      }

      const zoneFeatures = map.queryRenderedFeatures(e.point, { layers: ['zones-fill'] });
      if (zoneFeatures.length > 0) {
        const zone = zoneFeatures[0].properties?.zone as string;
        if (zone && zone !== hoveredZoneRef.current) {
          setHover(zone);
        }
      } else {
        clearHover();
      }
    });

    map.on('mouseleave', 'zones-fill', () => {
      clearHover();
    });
  }, []);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const modelPlaces = skip3DModels ? [] : places.filter((p) => p.model);
    hideClutterLabels(map);
    hideTransitLayers(map);
    addPostcodeLayers(map);
    registerHoverHandlers(map);
    if (modelPlaces.length > 0) add3DModels(map, modelPlaces);
    setMapReady(true);

    map.on('style.load', () => {
      hideClutterLabels(map);
      hideTransitLayers(map);
      addPostcodeLayers(map);
      if (modelPlaces.length > 0) add3DModels(map, modelPlaces);
    });
  }, [mapRef, places, hideClutterLabels, hideTransitLayers, addPostcodeLayers, registerHoverHandlers, add3DModels]);

  // Toggle dim overlay when activeZone changes — dims ENTIRE map except active zone
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.isStyleLoaded()) return;

    if (activeZone) {
      // Show world dim (covers everything)
      if (map.getLayer('world-dim')) {
        map.setLayoutProperty('world-dim', 'visibility', 'visible');
      }
      // Show active zone fill above the dim
      if (map.getLayer('zones-active-fill')) {
        map.setFilter('zones-active-fill', ['==', ['get', 'zone'], activeZone]);
        map.setLayoutProperty('zones-active-fill', 'visibility', 'visible');
      }
    } else {
      if (map.getLayer('world-dim')) {
        map.setLayoutProperty('world-dim', 'visibility', 'none');
      }
      if (map.getLayer('zones-active-fill')) {
        map.setLayoutProperty('zones-active-fill', 'visibility', 'none');
      }
    }
  }, [activeZone, mapRef]);

  // External hover from icon hover (ZoneLockIcon onMouseEnter/Leave)
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.isStyleLoaded()) return;
    if (!map.getLayer('zones-hover-fill')) return;

    if (hoveredZone) {
      hoveredZoneRef.current = hoveredZone;
      map.setFilter('zones-hover-fill', ['==', ['get', 'zone'], hoveredZone]);
      map.setFilter('zones-hover-border', ['==', ['get', 'zone'], hoveredZone]);
    } else if (hoveredZoneRef.current) {
      map.setFilter('zones-hover-fill', ['==', ['get', 'zone'], '']);
      map.setFilter('zones-hover-border', ['==', ['get', 'zone'], '']);
      hoveredZoneRef.current = null;
    }
  }, [hoveredZone, mapRef]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--sg-offwhite)]">
        <div className="text-center p-8">
          <p className="text-xl font-semibold text-[var(--sg-navy)] mb-2 font-display">Mapbox Token Required</p>
          <p className="text-[var(--sg-navy)]/60">
            Create a <code className="bg-[var(--sg-offwhite)] px-2 py-0.5 rounded text-[var(--sg-navy)]">.env</code> file with your{' '}
            <code className="bg-[var(--sg-offwhite)] px-2 py-0.5 rounded text-[var(--sg-navy)]">VITE_MAPBOX_TOKEN</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full relative transition-opacity duration-300"
      style={{ opacity: mapReady ? 1 : 0 }}
    >
      <MapGL
        ref={mapRef}
        {...viewState}
        onMove={isContained ? undefined : handleMove}
        onMoveEnd={() => onMoveEnd?.()}
        onClick={isContained ? undefined : onMapClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLES[mapStyle]}
        style={{ width: '100%', height: '100%' }}
        maxPitch={85}
        maxBounds={LONDON_BOUNDS}
        onLoad={handleLoad}
        antialias
        scrollZoom={canInteract}
        dragPan={canInteract}
        dragRotate={canInteract}
        doubleClickZoom={canInteract}
        touchZoomRotate={canInteract}
        touchPitch={canInteract}
        keyboard={canInteract}
      >
        {activeZone && places
          .filter((place) => !place.model)
          .map((place) => (
            <PlaceMarker
              key={place.id}
              place={place}
              zoom={viewState.zoom}
              onClick={isContained ? () => { } : onPlaceClick}
              draggable={editorMode}
              onDragEnd={onMarkerDragEnd}
            />
          ))}
        {mapChildren}
      </MapGL>

      {/* Debug overlay */}
      <div className={`absolute top-4 right-3 z-50 bg-black/70 text-white text-[10px]
        font-mono px-3 py-2 rounded-lg pointer-events-none space-y-0.5`}>
        <div>zoom: <span className="text-green-400">{viewState.zoom.toFixed(2)}</span></div>
        <div>pitch: <span className="text-yellow-400">{viewState.pitch.toFixed(1)}</span></div>
        <div>bearing: <span className="text-blue-400">{viewState.bearing.toFixed(1)}</span></div>
        <div>lng: {viewState.longitude.toFixed(4)}</div>
        <div>lat: {viewState.latitude.toFixed(4)}</div>
        {activeZone && <div>zone: <span className="text-pink-400">{activeZone}</span></div>}
      </div>

      {children}
    </div>
  );
}
