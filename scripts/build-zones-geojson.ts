/**
 * Merges sub-postcode polygons into unified zone polygons.
 * Reads london_postcodes.geojson + zones.json → outputs public/managed_zones.geojson
 *
 * Run: npx tsx scripts/build-zones-geojson.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import union from '@turf/union';
import { featureCollection, multiPolygon, polygon } from '@turf/helpers';

const ROOT = join(import.meta.dirname, '..');
const postcodes = JSON.parse(readFileSync(join(ROOT, 'public/london_postcodes.geojson'), 'utf-8'));
const zones = JSON.parse(readFileSync(join(ROOT, 'src/data/zones.json'), 'utf-8'));

// Zone → sub-postcodes mapping (same as zoneMapping.ts)
const ZONE_POSTCODES: Record<string, string[]> = {
  SE1: ['SE1'],
  EC1: ['EC1A', 'EC1M', 'EC1N', 'EC1R', 'EC1V', 'EC1Y'],
  WC2: ['WC2A', 'WC2B', 'WC2E', 'WC2H', 'WC2N', 'WC2R'],
  NW3: ['NW3'],
  W1: ['W1B', 'W1C', 'W1D', 'W1F', 'W1G', 'W1H', 'W1J', 'W1K', 'W1S', 'W1T', 'W1U', 'W1W'],
  SW1: ['SW1A', 'SW1E', 'SW1H', 'SW1P', 'SW1V', 'SW1W', 'SW1X', 'SW1Y'],
  E1: ['E1', 'E1W'],
  EC2: ['EC2A', 'EC2M', 'EC2N', 'EC2R', 'EC2V', 'EC2Y'],
};

const zoneColors: Record<string, string> = {};
for (const z of zones) {
  zoneColors[z.id] = z.color;
}

// Index all GeoJSON features by Name
const featuresByName: Record<string, any> = {};
for (const f of postcodes.features) {
  featuresByName[f.properties.Name] = f;
}

const mergedFeatures = [];

for (const [zoneId, subPostcodes] of Object.entries(ZONE_POSTCODES)) {
  const polygons = subPostcodes
    .map(pc => featuresByName[pc])
    .filter(Boolean);

  if (polygons.length === 0) {
    console.warn(`No polygons found for zone ${zoneId}`);
    continue;
  }

  let merged: any;
  if (polygons.length === 1) {
    merged = polygons[0];
  } else {
    // Union all sub-postcode polygons into one
    merged = polygons[0];
    for (let i = 1; i < polygons.length; i++) {
      const result = union(featureCollection([merged, polygons[i]]));
      if (result) merged = result;
    }
  }

  // Normalize geometry — ensure it's a proper Polygon or MultiPolygon
  const geom = merged.geometry;

  mergedFeatures.push({
    type: 'Feature',
    properties: {
      zone: zoneId,
      color: zoneColors[zoneId] ?? '#7c2d36',
    },
    geometry: geom,
  });

  console.log(`✓ ${zoneId}: merged ${polygons.length} polygon(s) → ${geom.type}`);
}

const output = {
  type: 'FeatureCollection',
  features: mergedFeatures,
};

const outPath = join(ROOT, 'public/managed_zones.geojson');
writeFileSync(outPath, JSON.stringify(output));
console.log(`\nWrote ${mergedFeatures.length} zones to ${outPath}`);
