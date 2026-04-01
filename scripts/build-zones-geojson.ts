/**
 * Generates zone boundaries from postcode polygons.
 * Each zone = one postcode. Sub-postcodes are merged into one boundary.
 * Missing postcodes (HA9) use a circle fallback.
 *
 * Run: npx tsx scripts/build-zones-geojson.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import union from '@turf/union';
import circle from '@turf/circle';
import centroid from '@turf/centroid';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import pointOnFeature from '@turf/point-on-feature';
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

const postcodes = JSON.parse(readFileSync(join(ROOT, 'public/london_postcodes.geojson'), 'utf-8'));
const zones: ZoneConfig[] = JSON.parse(readFileSync(join(ROOT, 'src/data/zones.json'), 'utf-8'));

// Index postcode features by Name
const featuresByName: Record<string, Feature<Polygon | MultiPolygon>> = {};
for (const f of postcodes.features) {
  featuresByName[f.properties.Name] = f;
}

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
      // Don't match SE10 when looking for SE1
      if (/\d/.test(lastChar) && /\d/.test(firstSuffix)) continue;
      features.push(feature);
    }
  }
  return features;
}

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

function getLabelPoint(feature: Feature<Polygon | MultiPolygon>): { lng: number; lat: number } {
  const c = centroid(feature);
  const coords = { lng: c.geometry.coordinates[0], lat: c.geometry.coordinates[1] };
  if (booleanPointInPolygon(c, feature)) return coords;
  const p = pointOnFeature(feature);
  return { lng: p.geometry.coordinates[0], lat: p.geometry.coordinates[1] };
}

// Build zone features
const outputFeatures: Feature<Polygon | MultiPolygon>[] = [];

for (const zone of zones) {
  const postcodeFeatures = findPostcodeFeatures(zone.postcode);

  if (postcodeFeatures.length === 0) {
    console.warn(`⚠ No postcode features for "${zone.postcode}" — circle fallback`);
    const fallback = circle([zone.centroid.lng, zone.centroid.lat], zone.radius / 1000, { units: 'kilometers', steps: 64 });
    const center = getLabelPoint(fallback as Feature<Polygon>);
    outputFeatures.push({
      type: 'Feature',
      properties: { zone: zone.id, color: zone.color, name: zone.name, centerLng: center.lng, centerLat: center.lat },
      geometry: fallback.geometry,
    });
    console.log(`  ✓ ${zone.id}: circle fallback (${zone.radius}m)`);
    continue;
  }

  const merged = mergePolygons(postcodeFeatures);
  if (!merged) continue;

  const center = getLabelPoint(merged);
  outputFeatures.push({
    type: 'Feature',
    properties: { zone: zone.id, color: zone.color, name: zone.name, centerLng: center.lng, centerLat: center.lat },
    geometry: merged.geometry,
  });
  console.log(`✓ ${zone.id}: merged ${postcodeFeatures.length} polygon(s)`);
}

const output: FeatureCollection = { type: 'FeatureCollection', features: outputFeatures };
const outPath = join(ROOT, 'public/managed_zones.geojson');
writeFileSync(outPath, JSON.stringify(output));
console.log(`\nWrote ${outputFeatures.length} zones to ${outPath}`);

// Output polygon centers
const polygonCenters: Record<string, { lng: number; lat: number }> = {};
for (const f of outputFeatures) {
  const props = f.properties as { zone: string; centerLng: number; centerLat: number };
  polygonCenters[props.zone] = { lng: props.centerLng, lat: props.centerLat };
}
const centersPath = join(ROOT, 'src/data/zone-centers.json');
writeFileSync(centersPath, JSON.stringify(polygonCenters, null, 2));
console.log(`Wrote polygon centers to ${centersPath}`);
