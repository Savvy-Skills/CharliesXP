import zonesData from '../data/zones.json';
import type { Zone } from '../types';

/** All 28 zones loaded from config */
export const ZONES: Zone[] = zonesData as Zone[];

/** O(1) lookup by zone slug */
export const ZONE_MAP: Record<string, Zone> = Object.fromEntries(
  ZONES.map((z) => [z.id, z]),
);

/** Zone centroids for flyTo animations — derived from zones config */
export const ZONE_CENTROIDS: Record<string, { lng: number; lat: number }> = Object.fromEntries(
  ZONES.map((z) => [z.id, z.centroid]),
);

/** All valid zone IDs */
export const MANAGED_ZONES: string[] = ZONES.map((z) => z.id);

/**
 * Given a map coordinate, returns the nearest zone ID within that zone's radius.
 * Uses Haversine distance. Returns null if no zone is within range.
 */
export function getZoneForPoint(lng: number, lat: number): string | null {
  let nearest: string | null = null;
  let minDist = Infinity;

  for (const zone of ZONES) {
    const dist = haversine(lat, lng, zone.centroid.lat, zone.centroid.lng);
    if (dist <= zone.radius && dist < minDist) {
      minDist = dist;
      nearest = zone.id;
    }
  }

  return nearest;
}

/** Haversine distance in meters between two lat/lng points */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Zoom thresholds for the two-level system */
export const CITY_ZOOM = 12;
export const ZONE_ZOOM = 14;
export const ZONE_ENTER_THRESHOLD = 13.5;
export const ZONE_EXIT_THRESHOLD = 13;
