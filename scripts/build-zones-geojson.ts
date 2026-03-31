/**
 * Generates zone boundaries as clipped Voronoi cells.
 * Each zone is a Voronoi cell (nearest-station polygon) clipped to a max radius circle.
 *
 * Run: npx tsx scripts/build-zones-geojson.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import voronoi from '@turf/voronoi';
import circle from '@turf/circle';
import intersect from '@turf/intersect';
import { featureCollection, point } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon, FeatureCollection, Point } from 'geojson';

const ROOT = join(import.meta.dirname, '..');

interface ZoneConfig {
  id: string;
  name: string;
  color: string;
  centroid: { lng: number; lat: number };
  radius: number;
}

const zones: ZoneConfig[] = JSON.parse(
  readFileSync(join(ROOT, 'src/data/zones.json'), 'utf-8')
);

// Create points for Voronoi
const points = featureCollection(
  zones.map((z) =>
    point([z.centroid.lng, z.centroid.lat], { zone: z.id, color: z.color, name: z.name })
  )
);

// Bounding box for Voronoi — must be larger than all points
// Covers greater London area with generous padding
const bbox: [number, number, number, number] = [-0.55, 51.30, 0.20, 51.70];

// Generate Voronoi polygons
const voronoiPolygons = voronoi(points as FeatureCollection<Point>, { bbox });

if (!voronoiPolygons) {
  console.error('Failed to generate Voronoi diagram');
  process.exit(1);
}

const clippedFeatures: Feature<Polygon | MultiPolygon>[] = [];

for (let i = 0; i < zones.length; i++) {
  const zone = zones[i];
  const voronoiCell = voronoiPolygons.features[i];

  if (!voronoiCell) {
    console.warn(`No Voronoi cell for zone ${zone.id}`);
    continue;
  }

  // Create a circle around the station (radius in km)
  const clipCircle = circle(
    [zone.centroid.lng, zone.centroid.lat],
    zone.radius / 1000, // convert meters to km
    { units: 'kilometers', steps: 64 }
  );

  // Intersect Voronoi cell with circle to clip it
  const clipped = intersect(featureCollection([voronoiCell as Feature<Polygon>, clipCircle as Feature<Polygon>]));

  if (!clipped) {
    console.warn(`Intersection produced null for zone ${zone.id}, using circle only`);
    clippedFeatures.push({
      type: 'Feature',
      properties: {
        zone: zone.id,
        color: zone.color,
        name: zone.name,
      },
      geometry: clipCircle.geometry,
    });
    continue;
  }

  clippedFeatures.push({
    type: 'Feature',
    properties: {
      zone: zone.id,
      color: zone.color,
      name: zone.name,
    },
    geometry: clipped.geometry,
  });

  console.log(`✓ ${zone.id}: Voronoi cell clipped to ${zone.radius}m radius`);
}

const output: FeatureCollection = {
  type: 'FeatureCollection',
  features: clippedFeatures,
};

const outPath = join(ROOT, 'public/managed_zones.geojson');
writeFileSync(outPath, JSON.stringify(output));
console.log(`\nWrote ${clippedFeatures.length} zones to ${outPath}`);
