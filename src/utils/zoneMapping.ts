import type { FilterSpecification } from 'mapbox-gl';

/**
 * Maps each managed zone to its constituent GeoJSON postcode entries.
 * The london_postcodes.geojson uses sub-postcodes (EC1A, EC1M...) for most zones,
 * but exact codes (SE1, NW3, E1) for others.
 */
export const ZONE_POSTCODES: Record<string, string[]> = {
  SE1: ['SE1'],
  EC1: ['EC1A', 'EC1M', 'EC1N', 'EC1R', 'EC1V', 'EC1Y'],
  WC2: ['WC2A', 'WC2B', 'WC2E', 'WC2H', 'WC2N', 'WC2R'],
  NW3: ['NW3'],
  W1: ['W1B', 'W1C', 'W1D', 'W1F', 'W1G', 'W1H', 'W1J', 'W1K', 'W1S', 'W1T', 'W1U', 'W1W'],
  SW1: ['SW1A', 'SW1E', 'SW1H', 'SW1P', 'SW1V', 'SW1W', 'SW1X', 'SW1Y'],
  E1: ['E1', 'E1W'],
  EC2: ['EC2A', 'EC2M', 'EC2N', 'EC2R', 'EC2V', 'EC2Y'],
};

/** All managed zone IDs */
export const MANAGED_ZONES = Object.keys(ZONE_POSTCODES);

/** Flat list of every sub-postcode belonging to a managed zone — use in Mapbox filters */
export const ALL_ZONE_POSTCODES: string[] = Object.values(ZONE_POSTCODES).flat();

/** Reverse lookup: sub-postcode → parent zone ID (e.g. 'EC1A' → 'EC1') */
const POSTCODE_TO_ZONE: Record<string, string> = {};
for (const [zone, postcodes] of Object.entries(ZONE_POSTCODES)) {
  for (const pc of postcodes) {
    POSTCODE_TO_ZONE[pc] = zone;
  }
}

/** Given a GeoJSON postcode Name (e.g. 'EC1A'), returns the managed zone ('EC1') or null */
export function getZoneForPostcode(postcode: string): string | null {
  return POSTCODE_TO_ZONE[postcode] ?? null;
}

/** Returns the Mapbox filter expression matching all postcodes for a given zone */
export function getZoneFilter(zoneId: string): FilterSpecification {
  const postcodes = ZONE_POSTCODES[zoneId];
  if (!postcodes) return ['==', ['get', 'Name'], ''];
  return ['in', ['get', 'Name'], ['literal', postcodes]];
}

/** Returns a Mapbox filter matching all postcodes EXCEPT those in the given zone */
export function getZoneExcludeFilter(zoneId: string): FilterSpecification {
  const postcodes = ZONE_POSTCODES[zoneId] ?? [];
  return ['all',
    ['in', ['get', 'Name'], ['literal', ALL_ZONE_POSTCODES]],
    ...postcodes.map(pc => ['!=', ['get', 'Name'], pc] as FilterSpecification)
  ];
}

/** Zone centroids for flyTo animations */
export const ZONE_CENTROIDS: Record<string, { lng: number; lat: number }> = {
  SE1: { lng: -0.0934, lat: 51.5020 },
  EC1: { lng: -0.1050, lat: 51.5235 },
  WC2: { lng: -0.1220, lat: 51.5115 },
  NW3: { lng: -0.1700, lat: 51.5560 },
  W1:  { lng: -0.1440, lat: 51.5140 },
  SW1: { lng: -0.1340, lat: 51.4990 },
  E1:  { lng: -0.0600, lat: 51.5170 },
  EC2: { lng: -0.0850, lat: 51.5190 },
};

/** Zoom thresholds for the two-level system */
export const CITY_ZOOM = 12;
export const ZONE_ZOOM = 14;
export const ZONE_ENTER_THRESHOLD = 13.5;
export const ZONE_EXIT_THRESHOLD = 13;
