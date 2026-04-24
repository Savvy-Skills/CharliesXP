import { useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl';
import MapGL, { type MapRef, type ViewStateChangeEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PlaceMarker } from './PlaceMarker';
import { MAP_STYLES, DEFAULT_MAP_STYLE, DEFAULT_VIEW_STATE, LONDON_BOUNDS, ALLOWED_LABEL_LAYERS, ZONE_COLORS, getLightPresetForNow, type MapStyleKey } from '../../utils/mapStyles';
import { ZONE_ENTER_THRESHOLD } from '../../utils/zoneMapping';
import { createModelLayer } from './ModelLayer';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../ui/Modal';
import type { Place, ViewState } from '../../types';

type StyleOverride = object | string;
type StyleConfig = Record<string, Record<string, unknown>>;
type CameraDirective = { center?: [number, number]; zoom?: number; bearing?: number; pitch?: number };
type ApplyDirective = {
  style?: StyleOverride;
  config?: StyleConfig;
  camera?: CameraDirective;
};

/**
 * Playground exports look like `{ style: "mapbox://...", config: {...}, center, zoom, ... }`.
 * Raw style objects have `version` + `sources` + `layers`. Distinguish so we can route each
 * piece (style URL, config props, camera) to the right API.
 */
function toApplyDirective(parsed: unknown): ApplyDirective | null {
  if (typeof parsed === 'string') return { style: parsed };
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  const looksLikePlayground =
    typeof obj.style === 'string' || obj.config !== undefined || (obj.center !== undefined && obj.sources === undefined);
  if (looksLikePlayground) {
    const dir: ApplyDirective = {};
    if (typeof obj.style === 'string' || (obj.style && typeof obj.style === 'object')) {
      dir.style = obj.style as StyleOverride;
    }
    if (obj.config && typeof obj.config === 'object') dir.config = obj.config as StyleConfig;
    const camera: CameraDirective = {};
    if (Array.isArray(obj.center) && obj.center.length === 2) camera.center = obj.center as [number, number];
    if (typeof obj.zoom === 'number') camera.zoom = obj.zoom;
    if (typeof obj.bearing === 'number') camera.bearing = obj.bearing;
    if (typeof obj.pitch === 'number') camera.pitch = obj.pitch;
    if (Object.keys(camera).length > 0) dir.camera = camera;
    return dir;
  }
  return { style: obj };
}

/**
 * Lenient JSON parser. Accepts the JS object-literal form the Mapbox Playground emits:
 * comments, trailing commas, and unquoted object keys.
 */
function parseLenientJson(input: string): unknown {
  const isIdStart = (c: string) => /[A-Za-z_$]/.test(c);
  const isIdCont = (c: string) => /[\w$-]/.test(c);

  let out = '';
  let i = 0;
  const n = input.length;

  const lastNonSpace = () => {
    for (let p = out.length - 1; p >= 0; p--) {
      if (!/\s/.test(out[p])) return out[p];
    }
    return '';
  };

  while (i < n) {
    const ch = input[i];
    // String literal — copy verbatim (protects string contents from key-quoting etc).
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const start = i;
      i++;
      while (i < n) {
        if (input[i] === '\\') { i += 2; continue; }
        if (input[i] === quote) { i++; break; }
        i++;
      }
      // Normalize single-quoted strings to double quotes.
      if (quote === "'") {
        const inner = input.slice(start + 1, i - 1).replace(/"/g, '\\"');
        out += '"' + inner + '"';
      } else {
        out += input.slice(start, i);
      }
      continue;
    }
    // Line comment.
    if (ch === '/' && input[i + 1] === '/') {
      i += 2;
      while (i < n && input[i] !== '\n') i++;
      continue;
    }
    // Block comment.
    if (ch === '/' && input[i + 1] === '*') {
      i += 2;
      while (i < n && !(input[i] === '*' && input[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // Unquoted identifier — quote it iff it's in object-key position.
    if (isIdStart(ch)) {
      let j = i;
      while (j < n && isIdCont(input[j])) j++;
      const ident = input.slice(i, j);
      let k = j;
      while (k < n && /\s/.test(input[k])) k++;
      const reservedValue = ident === 'true' || ident === 'false' || ident === 'null';
      const prev = lastNonSpace();
      const inKeyPosition = input[k] === ':' && !reservedValue && (prev === '{' || prev === ',' || prev === '');
      out += inKeyPosition ? `"${ident}"` : ident;
      i = j;
      continue;
    }
    out += ch;
    i++;
  }
  // Strip trailing commas before `}` or `]`.
  out = out.replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(out);
}

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
  onDragEnd?: () => void;
  skip3DModels?: boolean;
  activeZone?: string | null;
  /** Zone ID to highlight (from icon hover or external source) */
  hoveredZone?: string | null;
  editorMode?: boolean;
  /** IDs of enabled zones — used to filter layers */
  enabledZoneIds?: string[];
  /** Whether to show disabled zones (editor toggle) */
  showDisabledZones?: boolean;
  /** Only this place's marker is draggable (hold-to-drag) */
  draggablePlaceId?: string | null;
  onMarkerDragStart?: (place: Place) => void;
  onMarkerDrag?: (place: Place, lngLat: { lng: number; lat: number }) => void;
  onMarkerDragEnd?: (place: Place, lngLat: { lng: number; lat: number }) => void;
}

function DebugOverlay({ viewState, activeZone, editorMode, onResetCamera, onOpenStyleModal, hasStyleOverride, onClearStyleOverride }: { viewState: ViewState; activeZone: string | null; editorMode?: boolean; onResetCamera?: () => void; onOpenStyleModal?: () => void; hasStyleOverride?: boolean; onClearStyleOverride?: () => void }) {
  const { profile, isAdmin } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const isEditor = editorMode || searchParams.get('editor') === 'true';

  return (
    <div className="absolute top-4 right-3 z-50 flex flex-col gap-2 items-end">
      <div className="bg-black/70 text-white text-[10px] font-mono px-3 py-2 rounded-lg space-y-0.5">
        <div>role: <span className={isAdmin ? 'text-red-400' : 'text-gray-400'}>{profile?.role ?? 'anon'}</span></div>
        <div>zoom: <span className="text-green-400">{viewState.zoom.toFixed(2)}</span></div>
        <div>bearing: <span className="text-blue-400">{viewState.bearing.toFixed(1)}</span></div>
        <div>lng: {viewState.longitude.toFixed(4)}</div>
        <div>lat: {viewState.latitude.toFixed(4)}</div>
        {activeZone && <div>zone: <span className="text-pink-400">{activeZone}</span></div>}
        {isAdmin && (
          <div className="pt-1 mt-1 border-t border-white/20 space-y-1 pointer-events-auto">
            {isEditor && (
              <a href="/" className="block text-cyan-400 hover:text-cyan-300">
                Exit Editor
              </a>
            )}
            {onOpenStyleModal && (
              <button
                onClick={onOpenStyleModal}
                className="block text-left text-yellow-400 hover:text-yellow-300 cursor-pointer"
              >
                Edit Style JSON{hasStyleOverride ? ' *' : ''}
              </button>
            )}
            {hasStyleOverride && onClearStyleOverride && (
              <button
                onClick={onClearStyleOverride}
                className="block text-left text-gray-300 hover:text-white cursor-pointer"
              >
                Reset Style
              </button>
            )}
          </div>
        )}
      </div>
      {onResetCamera && (
        <button
          onClick={onResetCamera}
          className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-colors shadow-md cursor-pointer border border-[var(--sg-border)] pointer-events-auto"
          title="Reset camera angle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--sg-navy)]/60">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      )}
    </div>
  );
}

function StyleOverrideModal({ isOpen, onClose, onApply, initialValue }: { isOpen: boolean; onClose: () => void; onApply: (directive: ApplyDirective) => void; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError(null);
    }
  }, [isOpen, initialValue]);

  const handleApply = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Paste a JSON style object or a "mapbox://..." URL string.');
      return;
    }
    try {
      const parsed = parseLenientJson(trimmed);
      const directive = toApplyDirective(parsed);
      if (!directive || (!directive.style && !directive.config && !directive.camera)) {
        setError('Nothing to apply. Expected a style JSON, a style URL, or a Playground object with style/config/camera.');
        return;
      }
      onApply(directive);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? `Invalid JSON: ${err.message}` : 'Invalid JSON');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-[var(--sg-navy)] mb-1 font-display">
          Override Map Style
        </h2>
        <p className="text-xs text-[var(--sg-navy)]/60 mb-4">
          Accepts: a full Mapbox style JSON object, a JSON-quoted URL like{' '}
          <code className="bg-[var(--sg-offwhite)] px-1 py-0.5 rounded">"mapbox://styles/mapbox/dark-v11"</code>,
          or a Mapbox Playground export (the whole{' '}
          <code className="bg-[var(--sg-offwhite)] px-1 py-0.5 rounded">{'{ style, config, center, zoom, ... }'}</code> object).
          Comments and trailing commas are allowed.
        </p>
        <textarea
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null); }}
          placeholder={'{\n  "version": 8,\n  "sources": { ... },\n  "layers": [ ... ]\n}'}
          className="w-full h-72 px-3 py-2 rounded-lg border border-[var(--sg-border)]
            bg-[var(--sg-offwhite)] font-mono text-xs text-[var(--sg-navy)]
            focus:outline-none focus:ring-2 focus:ring-[var(--sg-navy)]/30 resize-none custom-scrollbar"
          spellCheck={false}
        />
        {error && (
          <p className="mt-2 text-xs text-red-600 whitespace-pre-wrap">{error}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm text-[var(--sg-navy)]/70
              hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 rounded-lg text-sm bg-[var(--sg-navy)] text-white
              hover:bg-[var(--sg-navy)]/90 transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </Modal>
  );
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
  onDragEnd,
  skip3DModels = false,
  activeZone = null,
  hoveredZone = null,
  editorMode = false,
  enabledZoneIds,
  showDisabledZones = false,
  draggablePlaceId,
  onMarkerDragStart,
  onMarkerDrag,
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
  const [mapStyle] = useState<MapStyleKey>(DEFAULT_MAP_STYLE);
  const [overrideStyle, setOverrideStyle] = useState<StyleOverride | null>(null);
  // Baseline config is the always-on default: auto-detected light preset and
  // POI/transit/place labels hidden. User-applied overrides from the Style
  // JSON modal layer on top. `userOverrodeStyle` is the flag the debug HUD
  // uses to show the `*` and the Reset button — it must NOT reflect the
  // baseline being present.
  const baselineStyleConfig = useMemo<StyleConfig>(() => ({
    basemap: {
      lightPreset: getLightPresetForNow(),
      showPointOfInterestLabels: false,
      showTransitLabels: false,
      showPlaceLabels: false,
      showRoadLabels: true,
    },
  }), []);
  const [styleConfig, setStyleConfig] = useState<StyleConfig | null>(() => baselineStyleConfig);
  const [userOverrodeStyle, setUserOverrodeStyle] = useState(false);
  const styleConfigRef = useRef<StyleConfig | null>(null);
  useEffect(() => { styleConfigRef.current = styleConfig; }, [styleConfig]);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [layerVersion, setLayerVersion] = useState(0);
  const hoveredZoneRef = useRef<string | null>(null);
  const showDisabledZonesRef = useRef(showDisabledZones);
  useEffect(() => { showDisabledZonesRef.current = showDisabledZones; }, [showDisabledZones]);
  const enabledZoneIdsRef = useRef(enabledZoneIds);
  useEffect(() => { enabledZoneIdsRef.current = enabledZoneIds; }, [enabledZoneIds]);

  // Persist viewport to sessionStorage so it can be restored on /map
  useEffect(() => {
    sessionStorage.setItem('map-viewport', JSON.stringify(viewState));
  }, [viewState]);

  // Apply Mapbox Standard-style config props (e.g. basemap.lightPreset).
  // Re-applies on every style.load because swapping styles resets config.
  // Also called directly from `handleLoad` below to guarantee the initial
  // config lands even if this effect registers after `style.load` fires.
  const applyStyleConfig = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const cfg = styleConfigRef.current;
    if (!cfg) return;
    for (const [scope, props] of Object.entries(cfg)) {
      for (const [key, value] of Object.entries(props)) {
        try {
          (map as unknown as { setConfigProperty: (s: string, k: string, v: unknown) => void })
            .setConfigProperty(scope, key, value);
        } catch {
          // Non-Standard styles don't support setConfigProperty — ignore.
        }
      }
    }
  }, [mapRef]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    applyStyleConfig();
    map.on('style.load', applyStyleConfig);
    return () => { map.off('style.load', applyStyleConfig); };
  }, [mapRef, styleConfig, applyStyleConfig]);

  // Keep the Standard `lightPreset` in sync with the local clock. We re-check
  // every 10 minutes and only trigger a state update when the preset actually
  // changes — no point re-running `setConfigProperty` every tick.
  useEffect(() => {
    const tick = () => {
      const next = getLightPresetForNow();
      setStyleConfig((prev) => {
        const current = prev?.basemap?.lightPreset;
        if (current === next) return prev;
        return { ...(prev ?? {}), basemap: { ...(prev?.basemap ?? {}), lightPreset: next } };
      });
    };
    const id = window.setInterval(tick, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    const vs = evt.viewState as ViewState;
    setViewState(vs);
    onZoomChange?.(vs.zoom);
  }, [onZoomChange]);

  const hideClutterLabels = useCallback((map: MapboxMap) => {
    const isShieldId = (id: string) =>
      /shield|road-number|road-exit/.test(id);
    for (const layer of map.getStyle().layers ?? []) {
      const id = layer.id;
      const isSymbol = layer.type === 'symbol';
      const isTextLayer = isSymbol && (id.includes('label') || id.includes('symbol'));
      const isShield   = isSymbol && isShieldId(id);
      if ((isTextLayer || isShield) && !ALLOWED_LABEL_LAYERS.includes(id)) {
        map.setLayoutProperty(id, 'visibility', 'none');
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
          'line-color': ZONE_COLORS.gridLine,
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
          'fill-color': ZONE_COLORS.worldDim,
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
          'fill-color': ZONE_COLORS.activeFill,
          'fill-opacity': 0.02,
        },
        layout: { visibility: 'none' },
      });
    }

    // Build initial filter from ref — prevents disabled zones from ever rendering
    const ids = enabledZoneIdsRef.current;
    const zoneFilter: any =
      ids === undefined
        ? undefined                                           // no filtering (backward compat)
        : ids.length > 0
          ? ['in', ['get', 'zone'], ['literal', ids]]         // only enabled zones
          : ['==', ['get', 'zone'], ''];                      // match nothing (loading or empty)

    // Zone fill — single grey palette, opacity ramps with zoom
    if (!map.getLayer('zones-fill')) {
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        ...(zoneFilter && { filter: zoneFilter }),
        paint: {
          'fill-color': ZONE_COLORS.fill,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.12, 14, 0.06, 16, 0.03],
        },
      });
    }

    // Zone border — outer borders only
    if (!map.getLayer('zones-border')) {
      map.addLayer({
        id: 'zones-border',
        type: 'line',
        source: 'zones',
        ...(zoneFilter && { filter: zoneFilter }),
        paint: {
          'line-color': ZONE_COLORS.border,
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
          'fill-color': ZONE_COLORS.hoverFill,
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
          'line-color': ZONE_COLORS.hoverBorder,
          'line-width': 3.5,
          'line-opacity': 0.9,
        },
      });
    }

    // Disabled zone fill — hidden by default
    if (!map.getLayer('zones-disabled-fill')) {
      map.addLayer({
        id: 'zones-disabled-fill',
        type: 'fill',
        source: 'zones',
        filter: ['==', ['get', 'zone'], ''],
        paint: {
          'fill-color': ZONE_COLORS.disabledFill,
          'fill-opacity': 0.08,
        },
        layout: { visibility: 'none' },
      }, 'zones-fill'); // Insert BELOW zones-fill
    }

    // Disabled zone border — dashed, hidden by default
    if (!map.getLayer('zones-disabled-border')) {
      map.addLayer({
        id: 'zones-disabled-border',
        type: 'line',
        source: 'zones',
        filter: ['==', ['get', 'zone'], ''],
        paint: {
          'line-color': ZONE_COLORS.disabledBorder,
          'line-width': 1.5,
          'line-opacity': 0.5,
          'line-dasharray': [4, 4],
        },
        layout: { visibility: 'none' },
      }, 'zones-fill');
    }

    // Disabled zone hover fill
    if (!map.getLayer('zones-disabled-hover')) {
      map.addLayer({
        id: 'zones-disabled-hover',
        type: 'fill',
        source: 'zones',
        filter: ['==', ['get', 'zone'], ''],
        paint: {
          'fill-color': ZONE_COLORS.disabledHover,
          'fill-opacity': 0.15,
        },
        layout: { visibility: 'none' },
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
        if (map.getLayer('zones-disabled-hover')) {
          map.setFilter('zones-disabled-hover', ['==', ['get', 'zone'], '']);
        }
        return;
      }

      const zoneFeatures = map.queryRenderedFeatures(e.point, { layers: ['zones-fill'] });
      if (zoneFeatures.length > 0) {
        const zone = zoneFeatures[0].properties?.zone as string;
        if (zone && zone !== hoveredZoneRef.current) {
          setHover(zone);
        }
        // Clear disabled hover when over an enabled zone
        if (map.getLayer('zones-disabled-hover')) {
          map.setFilter('zones-disabled-hover', ['==', ['get', 'zone'], '']);
        }
      } else {
        // Also check disabled zones if visible
        if (zoneFeatures.length === 0 && showDisabledZonesRef.current) {
          const disabledFeatures = map.queryRenderedFeatures(e.point, { layers: ['zones-disabled-fill'] });
          if (disabledFeatures.length > 0) {
            const zone = disabledFeatures[0].properties?.zone as string;
            if (zone) {
              clearHover();
              if (map.getLayer('zones-disabled-hover')) {
                map.setFilter('zones-disabled-hover', ['==', ['get', 'zone'], zone]);
              }
              map.getCanvas().style.cursor = 'pointer';
              return;
            }
          }
        }
        // Clear disabled hover
        if (map.getLayer('zones-disabled-hover')) {
          map.setFilter('zones-disabled-hover', ['==', ['get', 'zone'], '']);
        }
        clearHover();
      }
    });

    map.on('mouseleave', 'zones-fill', () => {
      clearHover();
    });
  }, []);

  // Apply zone filters directly to map layers — reads from refs so it's always current
  const applyZoneFilters = useCallback((map: MapboxMap) => {
    const ids = enabledZoneIdsRef.current;
    if (ids === undefined) return; // prop not provided, no filtering

    const enabledFilter: any = ids.length > 0
      ? ['in', ['get', 'zone'], ['literal', ids]]
      : ['==', ['get', 'zone'], ''];
    const disabledFilter: any = ids.length > 0
      ? ['!', ['in', ['get', 'zone'], ['literal', ids]]]
      : ['!=', ['get', 'zone'], ''];

    for (const layerId of ['zones-fill', 'zones-border']) {
      if (map.getLayer(layerId)) map.setFilter(layerId, enabledFilter);
    }

    const disabledVisibility = showDisabledZonesRef.current ? 'visible' : 'none';
    for (const layerId of ['zones-disabled-fill', 'zones-disabled-border', 'zones-disabled-hover']) {
      if (map.getLayer(layerId)) {
        map.setFilter(layerId, disabledFilter);
        map.setLayoutProperty(layerId, 'visibility', disabledVisibility);
      }
    }
  }, []);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const modelPlaces = skip3DModels ? [] : places.filter((p) => p.model);
    // Layer-ID-based hide hacks only apply to legacy styles (streets, light,
    // etc.). Standard uses slot-based layers with different IDs — its clutter
    // is controlled by `showPointOfInterestLabels` / `showTransitLabels`
    // config props, which we set in the initial styleConfig.
    const isStandardStyle = mapStyle === 'standard';
    if (!isStandardStyle) {
      hideClutterLabels(map);
      hideTransitLayers(map);
    }
    // Re-apply Standard config here too — the styleConfig effect may have
    // fired before the map was ready to receive setConfigProperty calls.
    applyStyleConfig();
    addPostcodeLayers(map);
    registerHoverHandlers(map);
    if (modelPlaces.length > 0) add3DModels(map, modelPlaces);
    applyZoneFilters(map);
    // Wait for the map to settle before fading in. `setConfigProperty`
    // above (lightPreset, showPlaceLabels=false, etc.) schedules a repaint
    // on the next frame; revealing before that frame lands makes the
    // fade-in overlap the label/light-preset transition, which reads as a
    // "dirty" flash. `idle` fires once tiles are loaded AND no transitions
    // are pending.
    map.once('idle', () => setMapReady(true));

    map.on('style.load', () => {
      if (!isStandardStyle) {
        hideClutterLabels(map);
        hideTransitLayers(map);
      }
      applyStyleConfig();
      addPostcodeLayers(map);
      if (modelPlaces.length > 0) add3DModels(map, modelPlaces);
      applyZoneFilters(map);
      // Force filter effect to re-run after layers are recreated
      setLayerVersion(v => v + 1);
    });
  }, [mapRef, places, mapStyle, skip3DModels, hideClutterLabels, hideTransitLayers, addPostcodeLayers, registerHoverHandlers, add3DModels, applyZoneFilters, applyStyleConfig]);

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

  // Filter zone layers to only show enabled zones (reactive — runs when props change)
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.isStyleLoaded()) return;
    applyZoneFilters(map);
  }, [enabledZoneIds, showDisabledZones, mapRef, mapReady, layerVersion, applyZoneFilters]);

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
        onDragEnd={() => onDragEnd?.()}
        onClick={isContained ? undefined : onMapClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={(overrideStyle ?? MAP_STYLES[mapStyle]) as Parameters<typeof MapGL>[0]['mapStyle']}
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
              draggable={editorMode && place.id === draggablePlaceId}
              onDragStart={onMarkerDragStart}
              onDrag={onMarkerDrag}
              onDragEnd={onMarkerDragEnd}
            />
          ))}
        {mapChildren}
      </MapGL>

      {/* Debug overlay */}
      <DebugOverlay
        viewState={viewState}
        activeZone={activeZone ?? null}
        editorMode={editorMode}
        onResetCamera={() => {
          const map = mapRef.current?.getMap();
          if (!map) return;
          map.easeTo({ pitch: DEFAULT_VIEW_STATE.pitch, bearing: DEFAULT_VIEW_STATE.bearing, duration: 500 });
        }}
        onOpenStyleModal={() => setStyleModalOpen(true)}
        hasStyleOverride={userOverrodeStyle || overrideStyle !== null}
        onClearStyleOverride={() => { setOverrideStyle(null); setStyleConfig(baselineStyleConfig); setUserOverrodeStyle(false); }}
      />

      <StyleOverrideModal
        isOpen={styleModalOpen}
        onClose={() => setStyleModalOpen(false)}
        onApply={(directive) => {
          if (directive.style !== undefined) setOverrideStyle(directive.style);
          if (directive.config !== undefined) setStyleConfig(directive.config);
          if (directive.style !== undefined || directive.config !== undefined) {
            setUserOverrodeStyle(true);
          }
          if (directive.camera) {
            const map = mapRef.current?.getMap();
            if (map) {
              map.jumpTo({
                center: directive.camera.center,
                zoom: directive.camera.zoom,
                bearing: directive.camera.bearing,
                pitch: directive.camera.pitch,
              });
            }
          }
        }}
        initialValue={
          overrideStyle || styleConfig
            ? JSON.stringify(
                {
                  ...(overrideStyle !== null ? { style: overrideStyle } : {}),
                  ...(styleConfig !== null ? { config: styleConfig } : {}),
                },
                null,
                2,
              )
            : ''
        }
      />

      {children}
    </div>
  );
}
