export const MAP_STYLES = {
  standard: 'mapbox://styles/mapbox/standard',
  streets: 'mapbox://styles/mapbox/streets-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
} as const;

export type MapStyleKey = keyof typeof MAP_STYLES;

export const DEFAULT_MAP_STYLE: MapStyleKey = 'standard';

export const DEFAULT_VIEW_STATE = {
  longitude: -0.1276,
  latitude: 51.5074,
  zoom: 12,
  pitch: 30,
  bearing: 0,
};

// Bounding box constraining the map to central London
export const LONDON_BOUNDS: [[number, number], [number, number]] = [
  [-0.31, 51.42], // southwest (covers Wembley, Wimbledon)
  [0.02, 51.57],  // northeast (covers Arsenal, Greenwich)
];

// Only these label layers survive — everything else with "label" or "symbol" gets hidden
export const ALLOWED_LABEL_LAYERS = [
  'continent-label',
  'country-label',
  'state-label',
  'settlement-major-label',
  'settlement-label',
  'water-line-label',
  'water-point-label',
  'transit-label',
];

export const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: '🍽️',
  cafe: '☕',
  bar: '🍸',
  museum: '🏛️',
  park: '🌳',
  beach: '🏖️',
  landmark: '🏛️',
  hotel: '🏨',
  shop: '🛍️',
  other: '📍',
};

// ─── Light preset (Mapbox Standard only) ────────────────────────────────────
// `lightPreset` is a config property on the Standard basemap import. Other
// styles (streets, light, etc.) ignore it — `setConfigProperty` throws and
// the caller swallows it.
export type LightPreset = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * Pick a preset from the user's local clock. Thresholds are intentionally
 * simple — they don't account for seasonal sun angles.
 *
 *   05:00–07:59  dawn
 *   08:00–17:59  day
 *   18:00–19:59  dusk
 *   otherwise    night
 */
export function getLightPresetForNow(now: Date = new Date()): LightPreset {
  const h = now.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 18) return 'day';
  if (h >= 18 && h < 20) return 'dusk';
  return 'night';
}

// ─── Zone palette ───────────────────────────────────────────────────────────
// Single grey family for all zones. Edit these to rebalance the look; every
// zone layer in InteractiveMap reads from here.
export const ZONE_COLORS = {
  // Base zone polygon (expanded view, all enabled zones)
  fill: '#6b7280',
  border: '#4b5563',

  // Hover highlight (cursor over a zone)
  hoverFill: '#6b7280',
  hoverBorder: '#374151',

  // Active zone (the one you're zoomed into)
  activeFill: '#6b7280',

  // Disabled zones (editor toggle only)
  disabledFill: '#9ca3af',
  disabledBorder: '#9ca3af',
  disabledHover: '#9ca3af',

  // Dim overlay that covers the world when you're inside a zone
  worldDim: '#faf8f5',

  // Postcode grid line drawn beneath everything
  gridLine: '#8b7355',
} as const;
