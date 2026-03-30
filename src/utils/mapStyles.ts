export const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
} as const;

export type MapStyleKey = keyof typeof MAP_STYLES;

export const DEFAULT_VIEW_STATE = {
  longitude: -0.1276,
  latitude: 51.5074,
  zoom: 12,
  pitch: 30,
  bearing: 0,
};

// Bounding box constraining the map to central London
export const LONDON_BOUNDS: [[number, number], [number, number]] = [
  [-0.22, 51.47], // southwest
  [0.01, 51.55],  // northeast
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
