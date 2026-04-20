import { useCallback, useRef } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import type { ViewState } from '../types';
import { DEFAULT_VIEW_STATE } from '../utils/mapStyles';
import { ZONE_POLYGON_CENTERS, ZONE_CENTROIDS, ZONE_EXIT_THRESHOLD } from '../utils/zoneMapping';

/**
 * Pure camera-animation hook. Has no knowledge of URL or app state —
 * the caller (MapPage) owns those and tells this hook when to move.
 */
export function useMapZoom(mapRef: React.RefObject<MapRef | null>) {
  const previousView = useRef<ViewState | null>(null);
  const isAnimating = useRef(false);

  const flyToWithGuard = useCallback(
    (opts: Parameters<MapRef['flyTo']>[0], duration: number) => {
      const map = mapRef.current;
      if (!map) return;
      isAnimating.current = true;
      map.flyTo(opts);
      setTimeout(() => { isAnimating.current = false; }, duration + 100);
    },
    [mapRef],
  );

  /** Fly into a zone, storing the current view so we can return later. */
  const zoomIntoZone = useCallback(
    (zoneId: string) => {
      const map = mapRef.current;
      if (!map) return;
      const centroid = ZONE_POLYGON_CENTERS[zoneId] ?? ZONE_CENTROIDS[zoneId];
      if (!centroid) return;

      const currentMap = map.getMap();
      // Clamp saved zoom below exit threshold so zoomOutToExpanded never lands
      // us at a zoom that would immediately re-trigger the zoom-in entry.
      previousView.current = {
        longitude: currentMap.getCenter().lng,
        latitude: currentMap.getCenter().lat,
        zoom: Math.min(currentMap.getZoom(), ZONE_EXIT_THRESHOLD - 0.5),
        pitch: currentMap.getPitch(),
        bearing: currentMap.getBearing(),
      };

      flyToWithGuard({
        center: [centroid.lng, centroid.lat],
        zoom: 14,
        pitch: 40,
        bearing: 0,
        duration: 1500,
        essential: true,
        padding: { top: 80, bottom: 20, left: 20, right: 20 },
      }, 1500);
    },
    [mapRef, flyToWithGuard],
  );

  /** Fly back to the view that was saved before entering the zone. */
  const zoomOutToExpanded = useCallback(() => {
    const target = previousView.current ?? DEFAULT_VIEW_STATE;
    previousView.current = null;
    flyToWithGuard({
      center: [target.longitude, target.latitude],
      zoom: target.zoom,
      pitch: target.pitch,
      bearing: target.bearing,
      duration: 1200,
      essential: true,
    }, 1200);
  }, [flyToWithGuard]);

  /** Fly back to the city-level default view (used on map collapse). */
  const zoomOutToOverview = useCallback(() => {
    previousView.current = null;
    flyToWithGuard({
      center: [DEFAULT_VIEW_STATE.longitude, DEFAULT_VIEW_STATE.latitude],
      zoom: DEFAULT_VIEW_STATE.zoom,
      pitch: DEFAULT_VIEW_STATE.pitch,
      bearing: DEFAULT_VIEW_STATE.bearing,
      duration: 1200,
      essential: true,
    }, 1200);
  }, [flyToWithGuard]);

  return { zoomIntoZone, zoomOutToExpanded, zoomOutToOverview, isAnimating };
}
