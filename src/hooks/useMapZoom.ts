import { useCallback, useRef } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import { DEFAULT_VIEW_STATE } from '../utils/mapStyles';
import { ZONE_POLYGON_CENTERS, ZONE_CENTROIDS } from '../utils/zoneMapping';

/**
 * Camera-animation primitives for the map. Stateless — the caller decides
 * *when* to animate. Zone entry/exit now happens on explicit click actions
 * only; pan and scroll-zoom just update the URL and leave the camera alone.
 *
 * `isAnimating` is exposed so callers can suppress handlers that would
 * otherwise double-fire during a programmatic flight (e.g., the zoom-
 * threshold auto-enter/exit in MapPage).
 */
export function useMapZoom(mapRef: React.RefObject<MapRef | null>) {
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

  /** Fly into a zone centroid. Click-driven; never called reactively. */
  const zoomIntoZone = useCallback(
    (zoneId: string) => {
      const centroid = ZONE_POLYGON_CENTERS[zoneId] ?? ZONE_CENTROIDS[zoneId];
      if (!centroid) return;
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
    [flyToWithGuard],
  );

  /** Fly to the city-level default view. Used by the close-zone button. */
  const zoomOutToOverview = useCallback(() => {
    flyToWithGuard({
      center: [DEFAULT_VIEW_STATE.longitude, DEFAULT_VIEW_STATE.latitude],
      zoom: DEFAULT_VIEW_STATE.zoom,
      pitch: DEFAULT_VIEW_STATE.pitch,
      bearing: DEFAULT_VIEW_STATE.bearing,
      duration: 1200,
      essential: true,
    }, 1200);
  }, [flyToWithGuard]);

  return { zoomIntoZone, zoomOutToOverview, isAnimating };
}
