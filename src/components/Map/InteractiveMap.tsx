import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type mapboxgl from 'mapbox-gl';
import MapGL, { type MapRef, type ViewStateChangeEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PlaceMarker } from './PlaceMarker';
import { MapControls } from './MapControls';
import { MAP_STYLES, DEFAULT_VIEW_STATE, LONDON_BOUNDS, ALLOWED_LABEL_LAYERS, type MapStyleKey } from '../../utils/mapStyles';
import { ALL_ZONE_POSTCODES, getZoneExcludeFilter } from '../../utils/zoneMapping';
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
  /** When false, disables zoom/pan/rotate but keeps click events for zone detection */
  interactive?: boolean;
  /** Children rendered INSIDE MapGL (Markers, Sources, etc.) */
  mapChildren?: ReactNode;
  /** Children rendered OUTSIDE MapGL (overlays, controls, panels) */
  children?: ReactNode;
  /** Called when zoom level changes (for parent to react to manual zoom) */
  onZoomChange?: (zoom: number) => void;
  /** Skip loading 3D models (prevents them from intercepting zone clicks) */
  skip3DModels?: boolean;
  /** Active zone for dim overlay (dims everything outside this zone) */
  activeZone?: string | null;
}

export function InteractiveMap({
  places,
  mapRef,
  onPlaceClick,
  onMapClick,
  onResetView,
  mode = 'full',
  interactive = true,
  mapChildren,
  children,
  onZoomChange,
  skip3DModels = false,
  activeZone = null,
}: InteractiveMapProps) {
  const isContained = mode === 'contained';
  const canInteract = !isContained && interactive;
  const [viewState, setViewState] = useState<ViewState>(DEFAULT_VIEW_STATE);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('streets');
  const [terrainEnabled, setTerrainEnabled] = useState(false);

  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    const vs = evt.viewState as ViewState;
    setViewState(vs);
    onZoomChange?.(vs.zoom);
  }, [onZoomChange]);

  const handleStyleChange = useCallback((style: MapStyleKey) => {
    setMapStyle(style);
  }, []);

  const hideClutterLabels = useCallback((map: mapboxgl.Map) => {
    for (const layer of map.getStyle().layers ?? []) {
      const isTextLayer =
        layer.type === 'symbol' &&
        (layer.id.includes('label') || layer.id.includes('symbol'));
      if (isTextLayer && !ALLOWED_LABEL_LAYERS.includes(layer.id)) {
        map.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    }
  }, []);

  // Only show these managed zones on the map
  const zoneFilter: mapboxgl.FilterSpecification = ['in', ['get', 'Name'], ['literal', ALL_ZONE_POSTCODES]];

  const addPostcodeLayers = useCallback((map: mapboxgl.Map) => {
    if (map.getSource('postcodes')) return;

    map.addSource('postcodes', {
      type: 'geojson',
      data: '/london_postcodes.geojson',
    });

    // Subtle fill for all zones in the GeoJSON (background context)
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

    // Highlighted fill for managed zones only
    map.addLayer({
      id: 'postcodes-fill',
      type: 'fill',
      source: 'postcodes',
      filter: zoneFilter,
      paint: {
        'fill-color': '#7c2d36',
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.1, 14, 0.06, 16, 0.02],
      },
    });

    // Prominent border for managed zones
    map.addLayer({
      id: 'postcodes-border',
      type: 'line',
      source: 'postcodes',
      filter: zoneFilter,
      paint: {
        'line-color': '#7c2d36',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2.5, 13, 2, 15, 1, 17, 0.3],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 13, 0.5, 15, 0.3, 17, 0.1],
      },
    });

    // Dim overlay — covers everything outside the active zone (hidden by default)
    map.addLayer({
      id: 'postcodes-dim',
      type: 'fill',
      source: 'postcodes',
      paint: {
        'fill-color': '#faf8f5',
        'fill-opacity': 0.55,
      },
      layout: { visibility: 'none' },
    });
  }, []);

  const add3DModels = useCallback((map: mapboxgl.Map, modelPlaces: Place[]) => {
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

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const modelPlaces = skip3DModels ? [] : places.filter((p) => p.model);
    hideClutterLabels(map);
    addPostcodeLayers(map);
    if (modelPlaces.length > 0) add3DModels(map, modelPlaces);

    map.on('style.load', () => {
      hideClutterLabels(map);
      addPostcodeLayers(map);
      if (modelPlaces.length > 0) add3DModels(map, modelPlaces);
    });
  }, [mapRef, places, hideClutterLabels, addPostcodeLayers, add3DModels]);

  // Toggle dim overlay when activeZone changes
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.isStyleLoaded()) return;
    if (!map.getLayer('postcodes-dim')) return;

    if (activeZone) {
      map.setFilter('postcodes-dim', getZoneExcludeFilter(activeZone));
      map.setLayoutProperty('postcodes-dim', 'visibility', 'visible');
    } else {
      map.setLayoutProperty('postcodes-dim', 'visibility', 'none');
    }
  }, [activeZone, mapRef]);

  const handleToggleTerrain = useCallback(() => {
    setTerrainEnabled((prev) => {
      const map = mapRef.current?.getMap();
      if (map) {
        if (!prev) {
          if (!map.getSource('mapbox-dem')) {
            map.addSource('mapbox-dem', {
              type: 'raster-dem',
              url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
              tileSize: 512,
              maxzoom: 14,
            });
          }
          map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        } else {
          map.setTerrain(null);
        }
      }
      return !prev;
    });
  }, [mapRef]);

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
    <div className="h-full w-full relative">
      <MapGL
        ref={mapRef}
        {...viewState}
        onMove={isContained ? undefined : handleMove}
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
        {viewState.zoom >= 13.86 && places
          .filter((place) => !place.model)
          .map((place) => (
            <PlaceMarker
              key={place.id}
              place={place}
              zoom={viewState.zoom}
              onClick={isContained ? () => {} : onPlaceClick}
            />
          ))}
        {mapChildren}
      </MapGL>

      {/* Debug overlay */}
      <div className="absolute bottom-12 right-3 z-50 bg-black/70 text-white text-[10px]
        font-mono px-3 py-2 rounded-lg pointer-events-none space-y-0.5">
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
