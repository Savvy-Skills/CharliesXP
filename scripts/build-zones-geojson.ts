/**
 * Generates zone boundaries from postcode polygons.
 *
 * - Single-station postcodes: zone boundary = merged postcode boundary
 * - Multi-station postcodes: Voronoi-split the merged postcode between stations
 * - Missing postcodes (HA9): circle fallback
 *
 * Run: npx tsx scripts/build-zones-geojson.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import union from '@turf/union';
import voronoi from '@turf/voronoi';
import intersect from '@turf/intersect';
import circle from '@turf/circle';
import bbox from '@turf/bbox';
import { featureCollection, point } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon, FeatureCollection, Point } from 'geojson';

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

// Group zones by postcode
const zonesByPostcode: Record<string, ZoneConfig[]> = {};
for (const zone of zones) {
  if (!zonesByPostcode[zone.postcode]) {
    zonesByPostcode[zone.postcode] = [];
  }
  zonesByPostcode[zone.postcode].push(zone);
}

/**
 * Find all GeoJSON features matching a postcode prefix.
 * e.g., "SW1" matches SW1A, SW1E, SW1H, etc.
 * e.g., "SE1" matches exactly SE1 (and SE10 is NOT matched because we check prefix + non-alphanumeric or end)
 */
function findPostcodeFeatures(postcode: string): Feature<Polygon | MultiPolygon>[] {
  const features: Feature<Polygon | MultiPolygon>[] = [];
  for (const [name, feature] of Object.entries(featuresByName)) {
    // Exact match or prefix match where next char is a letter (sub-postcode)
    if (name === postcode) {
      features.push(feature);
    } else if (name.startsWith(postcode) && name.length > postcode.length) {
      // Ensure we don't match SE10 when looking for SE1
      // Sub-postcodes add a letter: SW1A, EC2M, W1B
      // But SE1 should not match SE10, SE11, etc.
      const suffix = name.slice(postcode.length);
      // If the postcode ends with a digit and suffix starts with a digit, skip (SE1 → SE10)
      const lastChar = postcode[postcode.length - 1];
      const firstSuffix = suffix[0];
      if (/\d/.test(lastChar) && /\d/.test(firstSuffix)) {
        continue; // Skip: this is a different postcode area (SE1 vs SE10)
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
      outputFeatures.push({
        type: 'Feature',
        properties: { zone: zone.id, color: zone.color, name: zone.name },
        geometry: fallbackCircle.geometry,
      });
      console.log(`  ✓ ${zone.id}: circle fallback (${zone.radius}m)`);
    }
    continue;
  }

  // Merge all sub-postcode polygons into one boundary
  const mergedPostcode = mergePolygons(postcodeFeatures);
  if (!mergedPostcode) {
    console.warn(`⚠ Failed to merge polygons for ${postcode}`);
    continue;
  }

  console.log(`${postcode}: merged ${postcodeFeatures.length} polygon(s) → ${stationsInPostcode.length} station(s)`);

  // Single station: use the full merged postcode boundary
  if (stationsInPostcode.length === 1) {
    const zone = stationsInPostcode[0];
    outputFeatures.push({
      type: 'Feature',
      properties: { zone: zone.id, color: zone.color, name: zone.name },
      geometry: mergedPostcode.geometry,
    });
    console.log(`  ✓ ${zone.id}: full postcode boundary`);
    continue;
  }

  // Multiple stations: Voronoi-split within the postcode boundary
  const stationPoints = featureCollection(
    stationsInPostcode.map((z) =>
      point([z.centroid.lng, z.centroid.lat], { zone: z.id, color: z.color, name: z.name })
    )
  );

  // Use the postcode's bounding box (with padding) for Voronoi generation
  const [minX, minY, maxX, maxY] = bbox(mergedPostcode);
  const pad = 0.02; // ~2km padding
  const voronoiBbox: [number, number, number, number] = [minX - pad, minY - pad, maxX + pad, maxY + pad];

  const voronoiResult = voronoi(stationPoints as FeatureCollection<Point>, { bbox: voronoiBbox });
  if (!voronoiResult) {
    console.warn(`  ⚠ Voronoi failed for ${postcode} — assigning full boundary to first station`);
    const zone = stationsInPostcode[0];
    outputFeatures.push({
      type: 'Feature',
      properties: { zone: zone.id, color: zone.color, name: zone.name },
      geometry: mergedPostcode.geometry,
    });
    continue;
  }

  // Intersect each Voronoi cell with the merged postcode boundary
  for (let i = 0; i < stationsInPostcode.length; i++) {
    const zone = stationsInPostcode[i];
    const voronoiCell = voronoiResult.features[i];

    if (!voronoiCell) {
      console.warn(`  ⚠ No Voronoi cell for ${zone.id}`);
      continue;
    }

    const clipped = intersect(
      featureCollection([voronoiCell as Feature<Polygon>, mergedPostcode as Feature<Polygon>])
    );

    if (!clipped) {
      console.warn(`  ⚠ Intersection empty for ${zone.id} — station may be outside postcode boundary`);
      // Fallback: use a circle within the postcode
      const fallbackCircle = circle(
        [zone.centroid.lng, zone.centroid.lat],
        zone.radius / 1000,
        { units: 'kilometers', steps: 64 }
      );
      const circleClipped = intersect(
        featureCollection([fallbackCircle as Feature<Polygon>, mergedPostcode as Feature<Polygon>])
      );
      if (circleClipped) {
        outputFeatures.push({
          type: 'Feature',
          properties: { zone: zone.id, color: zone.color, name: zone.name },
          geometry: circleClipped.geometry,
        });
        console.log(`  ✓ ${zone.id}: circle-clipped fallback within postcode`);
      }
      continue;
    }

    outputFeatures.push({
      type: 'Feature',
      properties: { zone: zone.id, color: zone.color, name: zone.name },
      geometry: clipped.geometry,
    });
    console.log(`  ✓ ${zone.id}: Voronoi split within ${postcode}`);
  }
}

const output: FeatureCollection = {
  type: 'FeatureCollection',
  features: outputFeatures,
};

const outPath = join(ROOT, 'public/managed_zones.geojson');
writeFileSync(outPath, JSON.stringify(output));
console.log(`\nWrote ${outputFeatures.length} zones to ${outPath}`);
