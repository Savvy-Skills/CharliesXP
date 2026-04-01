/**
 * Generates zone boundaries from postcode polygons.
 *
 * - Single-station postcodes: zone boundary = merged postcode boundary
 * - Multi-station postcodes: sub-postcodes manually assigned to stations, then merged
 * - Missing postcodes (HA9): circle fallback
 * - Outputs polygon centroid for each zone (used for lock icon placement)
 *
 * Run: npx tsx scripts/build-zones-geojson.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import union from '@turf/union';
import circle from '@turf/circle';
import centroid from '@turf/centroid';
import pointOnFeature from '@turf/point-on-feature';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { featureCollection, point } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon, FeatureCollection } from 'geojson';

const ROOT = join(import.meta.dirname, '..');

interface ZoneConfig {
  id: string;
  name: string;
  postcode: string;
  color: string;
  centroid: { lng: number; lat: number };
  radius: number;
}

// Load data
const postcodes = JSON.parse(readFileSync(join(ROOT, 'public/london_postcodes.geojson'), 'utf-8'));
const zones: ZoneConfig[] = JSON.parse(readFileSync(join(ROOT, 'src/data/zones.json'), 'utf-8'));

// Index postcode features by Name
const featuresByName: Record<string, Feature<Polygon | MultiPolygon>> = {};
for (const f of postcodes.features) {
  featuresByName[f.properties.Name] = f;
}

/**
 * Manual sub-postcode assignments for multi-station postcodes.
 * Each sub-postcode is assigned to the station zone it best belongs to.
 */
const SUB_POSTCODE_ASSIGNMENTS: Record<string, Record<string, string>> = {
  // SW1: Westminster, Green Park, Victoria
  SW1: {
    SW1A: 'westminster',   // Parliament, Buckingham Palace, Whitehall
    SW1E: 'victoria',      // Victoria Station area
    SW1H: 'westminster',   // Westminster/St James's Park
    SW1P: 'westminster',   // Millbank, Pimlico north
    SW1V: 'victoria',      // Pimlico, Victoria
    SW1W: 'victoria',      // Belgravia south, Victoria
    SW1X: 'victoria',      // Belgravia, between Victoria and Knightsbridge
    SW1Y: 'green-park',    // St James's, Piccadilly south, Green Park
  },
  // W1: Oxford Circus, Piccadilly Circus, Bond Street, Marble Arch
  W1: {
    W1B: 'oxford-circus',      // Oxford Street east
    W1C: 'marble-arch',        // Selfridges, Oxford Street west
    W1D: 'piccadilly-circus',  // Soho south
    W1F: 'piccadilly-circus',  // Soho
    W1G: 'bond-street',        // Harley Street area
    W1H: 'marble-arch',        // Marble Arch, Edgware Road
    W1J: 'piccadilly-circus',  // Mayfair south, Piccadilly
    W1K: 'bond-street',        // Mayfair, Grosvenor Square
    W1S: 'bond-street',        // Bond Street, Savile Row
    W1T: 'oxford-circus',      // Fitzrovia
    W1U: 'bond-street',        // Marylebone south
    W1W: 'oxford-circus',      // Fitzrovia north
  },
  // WC2: Holborn, Charing Cross, Embankment
  WC2: {
    WC2A: 'holborn',         // Lincoln's Inn, Kingsway
    WC2B: 'holborn',         // Covent Garden north
    WC2E: 'holborn',         // Covent Garden, Strand north
    WC2H: 'holborn',         // Shaftesbury Avenue, Chinatown
    WC2N: 'charing-cross',   // Charing Cross, Trafalgar Square
    WC2R: 'embankment',      // Embankment, Strand south, Waterloo Bridge
  },
  // SE1: Waterloo, London Bridge (SE1 is a single polygon, use Voronoi split)
  // NW1: Marylebone, Camden Town (NW1 is a single polygon, use Voronoi split)
};

// Group zones by postcode
const zonesByPostcode: Record<string, ZoneConfig[]> = {};
for (const zone of zones) {
  if (!zonesByPostcode[zone.postcode]) {
    zonesByPostcode[zone.postcode] = [];
  }
  zonesByPostcode[zone.postcode].push(zone);
}

/**
 * Voronoi center overrides for postcodes split by Voronoi.
 * Use when the station location produces a bad split
 * (e.g., Tate Modern falls into London Bridge instead of Waterloo).
 * Only the centroid used for Voronoi calculation is shifted — the actual
 * station location and flyTo target stay unchanged.
 */
const VORONOI_CENTER_OVERRIDES: Record<string, { lng: number; lat: number }> = {
  // Shift Waterloo east so Tate Modern (lng -0.0994) falls in Waterloo zone
  waterloo: { lng: -0.1010, lat: 51.5031 },
};

/**
 * Find all GeoJSON features matching a postcode prefix.
 */
function findPostcodeFeatures(postcode: string): Feature<Polygon | MultiPolygon>[] {
  const features: Feature<Polygon | MultiPolygon>[] = [];
  for (const [name, feature] of Object.entries(featuresByName)) {
    if (name === postcode) {
      features.push(feature);
    } else if (name.startsWith(postcode) && name.length > postcode.length) {
      const suffix = name.slice(postcode.length);
      const lastChar = postcode[postcode.length - 1];
      const firstSuffix = suffix[0];
      if (/\d/.test(lastChar) && /\d/.test(firstSuffix)) {
        continue;
      }
      features.push(feature);
    }
  }
  return features;
}

/**
 * Merge multiple postcode polygons into one using turf/union
 */
function mergePolygons(features: Feature<Polygon | MultiPolygon>[]): Feature<Polygon | MultiPolygon> | null {
  if (features.length === 0) return null;
  if (features.length === 1) return features[0];

  let merged = features[0];
  for (let i = 1; i < features.length; i++) {
    const result = union(featureCollection([merged, features[i]]));
    if (result) merged = result;
  }
  return merged;
}

/**
 * Get the best label point for a zone:
 * 1. Use geometric centroid if it falls inside the polygon
 * 2. Otherwise fall back to point-on-feature (guaranteed inside)
 */
function getLabelPoint(feature: Feature<Polygon | MultiPolygon>): { lng: number; lat: number } {
  const c = centroid(feature);
  const centerCoords = { lng: c.geometry.coordinates[0], lat: c.geometry.coordinates[1] };

  // Check if centroid is inside the polygon
  if (booleanPointInPolygon(c, feature)) {
    return centerCoords;
  }

  // Centroid is outside (concave/irregular shape) — use guaranteed interior point
  const p = pointOnFeature(feature);
  return { lng: p.geometry.coordinates[0], lat: p.geometry.coordinates[1] };
}

// Build zone features
const outputFeatures: Feature<Polygon | MultiPolygon>[] = [];

for (const [postcode, stationsInPostcode] of Object.entries(zonesByPostcode)) {
  const postcodeFeatures = findPostcodeFeatures(postcode);

  // Fallback: no postcode polygons found (e.g., HA9)
  if (postcodeFeatures.length === 0) {
    console.warn(`⚠ No postcode features found for "${postcode}" — using circle fallback`);
    for (const zone of stationsInPostcode) {
      const fallbackCircle = circle(
        [zone.centroid.lng, zone.centroid.lat],
        zone.radius / 1000,
        { units: 'kilometers', steps: 64 }
      );
      const polyCenter = getLabelPoint(fallbackCircle as Feature<Polygon>);
      outputFeatures.push({
        type: 'Feature',
        properties: { zone: zone.id, color: zone.color, name: zone.name, centerLng: polyCenter.lng, centerLat: polyCenter.lat },
        geometry: fallbackCircle.geometry,
      });
      console.log(`  ✓ ${zone.id}: circle fallback (${zone.radius}m)`);
    }
    continue;
  }

  console.log(`${postcode}: ${postcodeFeatures.length} polygon(s) → ${stationsInPostcode.length} station(s)`);

  // Single station: use the full merged postcode boundary
  if (stationsInPostcode.length === 1) {
    const merged = mergePolygons(postcodeFeatures);
    if (!merged) continue;
    const zone = stationsInPostcode[0];
    const polyCenter = getLabelPoint(merged);
    outputFeatures.push({
      type: 'Feature',
      properties: { zone: zone.id, color: zone.color, name: zone.name, centerLng: polyCenter.lng, centerLat: polyCenter.lat },
      geometry: merged.geometry,
    });
    console.log(`  ✓ ${zone.id}: full postcode boundary`);
    continue;
  }

  // Multiple stations: check if we have manual sub-postcode assignments
  const assignments = SUB_POSTCODE_ASSIGNMENTS[postcode];

  if (assignments) {
    // Group sub-postcodes by assigned zone
    const featuresByZone: Record<string, Feature<Polygon | MultiPolygon>[]> = {};
    for (const zone of stationsInPostcode) {
      featuresByZone[zone.id] = [];
    }

    for (const [subPostcode, zoneId] of Object.entries(assignments)) {
      const feature = featuresByName[subPostcode];
      if (feature && featuresByZone[zoneId]) {
        featuresByZone[zoneId].push(feature);
      } else if (!feature) {
        console.warn(`  ⚠ Sub-postcode ${subPostcode} not found in GeoJSON`);
      }
    }

    for (const zone of stationsInPostcode) {
      const zoneFeatures = featuresByZone[zone.id];
      if (!zoneFeatures || zoneFeatures.length === 0) {
        console.warn(`  ⚠ No sub-postcodes assigned to ${zone.id}`);
        continue;
      }
      const merged = mergePolygons(zoneFeatures);
      if (!merged) continue;
      const polyCenter = getLabelPoint(merged);
      outputFeatures.push({
        type: 'Feature',
        properties: { zone: zone.id, color: zone.color, name: zone.name, centerLng: polyCenter.lng, centerLat: polyCenter.lat },
        geometry: merged.geometry,
      });
      console.log(`  ✓ ${zone.id}: merged ${zoneFeatures.length} sub-postcode(s)`);
    }
  } else {
    // No manual assignments — use Voronoi split (for SE1, NW1 which are single polygons)
    const merged = mergePolygons(postcodeFeatures);
    if (!merged) continue;

    // Import voronoi + intersect dynamically for this path
    const voronoiMod = await import('@turf/voronoi');
    const intersectMod = await import('@turf/intersect');
    const bboxMod = await import('@turf/bbox');
    const { point } = await import('@turf/helpers');

    const stationPoints = featureCollection(
      stationsInPostcode.map((z) => {
        const override = VORONOI_CENTER_OVERRIDES[z.id];
        const center = override ?? z.centroid;
        return point([center.lng, center.lat], { zone: z.id, color: z.color, name: z.name });
      })
    );

    const [minX, minY, maxX, maxY] = bboxMod.default(merged);
    const pad = 0.02;
    const voronoiBbox: [number, number, number, number] = [minX - pad, minY - pad, maxX + pad, maxY + pad];

    const voronoiResult = voronoiMod.default(stationPoints as any, { bbox: voronoiBbox });
    if (!voronoiResult) {
      console.warn(`  ⚠ Voronoi failed for ${postcode}`);
      continue;
    }

    for (let i = 0; i < stationsInPostcode.length; i++) {
      const zone = stationsInPostcode[i];
      const voronoiCell = voronoiResult.features[i];
      if (!voronoiCell) continue;

      const clipped = intersectMod.default(
        featureCollection([voronoiCell as Feature<Polygon>, merged as Feature<Polygon>])
      );

      if (!clipped) {
        console.warn(`  ⚠ Intersection empty for ${zone.id}`);
        continue;
      }

      const polyCenter = getLabelPoint(clipped as Feature<Polygon | MultiPolygon>);
      outputFeatures.push({
        type: 'Feature',
        properties: { zone: zone.id, color: zone.color, name: zone.name, centerLng: polyCenter.lng, centerLat: polyCenter.lat },
        geometry: clipped.geometry,
      });
      console.log(`  ✓ ${zone.id}: Voronoi split within ${postcode}`);
    }
  }
}

const output: FeatureCollection = {
  type: 'FeatureCollection',
  features: outputFeatures,
};

const outPath = join(ROOT, 'public/managed_zones.geojson');
writeFileSync(outPath, JSON.stringify(output));
console.log(`\nWrote ${outputFeatures.length} zones to ${outPath}`);

// Also output polygon centers as a small JSON for lock icon placement
const polygonCenters: Record<string, { lng: number; lat: number }> = {};
for (const f of outputFeatures) {
  const props = f.properties as { zone: string; centerLng: number; centerLat: number };
  polygonCenters[props.zone] = { lng: props.centerLng, lat: props.centerLat };
}
const centersPath = join(ROOT, 'src/data/zone-centers.json');
writeFileSync(centersPath, JSON.stringify(polygonCenters, null, 2));
console.log(`Wrote polygon centers to ${centersPath}`);
