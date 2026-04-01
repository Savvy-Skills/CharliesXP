import { useState, useCallback, useRef, useEffect } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import type { MapZoomState, ViewState } from '../types';
import { DEFAULT_VIEW_STATE } from '../utils/mapStyles';
import { ZONE_CENTROIDS, ZONE_ENTER_THRESHOLD, ZONE_EXIT_THRESHOLD } from '../utils/zoneMapping';

export function useMapZoom(mapRef: React.RefObject<MapRef | null>) {
  const [mapState, setMapState] = useState<MapZoomState>(() => {
    if (window.location.pathname !== '/map') return 'overview';
    const saved = sessionStorage.getItem('map-zoom-state');
    if (saved) {
      try {
        const { mapState: s } = JSON.parse(saved);
        if (s === 'overview' || s === 'expanded' || s === 'zoneDetail') return s;
      } catch { /* fall through */ }
    }
    return 'expanded';
  });
  const [activeZone, setActiveZone] = useState<string | null>(() => {
    if (window.location.pathname !== '/map') return null;
    const saved = sessionStorage.getItem('map-zoom-state');
    if (saved) {
      try { return JSON.parse(saved).activeZone ?? null; } catch { /* fall through */ }
    }
    return null;
  });
  const previousView = useRef<ViewState | null>(null);

  // Prevent auto-switch during programmatic flyTo animations
  const isAnimating = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const expandMap = useCallback(() => {
    setMapState('expanded');
    const search = window.location.search;
    window.history.pushState(null, '', '/map' + search);
  }, []);

  // Debounced auto-switch — only fires after zoom has been stable for 400ms
  // Skips entirely during programmatic flyTo animations
  const handleZoomChange = useCallback((zoom: number) => {
    if (isAnimating.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      // Re-check animating flag after debounce
      if (isAnimating.current) return;

      if (mapState === 'zoneDetail' && zoom < ZONE_EXIT_THRESHOLD) {
        setMapState('expanded');
        setActiveZone(null);
      } else if (mapState === 'expanded' && zoom >= ZONE_ENTER_THRESHOLD) {
        const map = mapRef.current?.getMap();
        if (!map) return;
        const center = map.getCenter();
        const point = map.project([center.lng, center.lat]);
        const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });
        if (features.length > 0) {
          const zoneName = features[0].properties?.zone as string;
          if (zoneName) {
            setMapState('zoneDetail');
            setActiveZone(zoneName);
          }
        }
      }
    }, 150);
  }, [mapState, mapRef]);

  // Helper: run a flyTo with animation guard
  const flyToWithGuard = useCallback(
    (opts: Parameters<MapRef['flyTo']>[0], duration: number) => {
      const map = mapRef.current;
      if (!map) return;

      isAnimating.current = true;
      map.flyTo(opts);

      // Release guard after animation completes
      setTimeout(() => {
        isAnimating.current = false;
      }, duration + 100);
    },
    [mapRef],
  );

  const zoomIntoZone = useCallback(
    (zoneId: string) => {
      const map = mapRef.current;
      if (!map) return;

      const centroid = ZONE_CENTROIDS[zoneId];
      if (!centroid) return;

      const currentMap = map.getMap();
      previousView.current = {
        longitude: currentMap.getCenter().lng,
        latitude: currentMap.getCenter().lat,
        zoom: currentMap.getZoom(),
        pitch: currentMap.getPitch(),
        bearing: currentMap.getBearing(),
      };

      setMapState('zoneDetail');
      setActiveZone(zoneId);

      flyToWithGuard({
        center: [centroid.lng, centroid.lat],
        zoom: 14,
        pitch: 40,
        bearing: 0,
        duration: 1500,
        essential: true,
      }, 1500);
    },
    [mapRef, flyToWithGuard],
  );

  const zoomOutToExpanded = useCallback(() => {
    const target = previousView.current ?? DEFAULT_VIEW_STATE;
    previousView.current = null;
    setMapState('expanded');
    setActiveZone(null);

    flyToWithGuard({
      center: [target.longitude, target.latitude],
      zoom: target.zoom,
      pitch: target.pitch,
      bearing: target.bearing,
      duration: 1200,
      essential: true,
    }, 1200);
  }, [flyToWithGuard]);

  const zoomOutToOverview = useCallback(() => {
    previousView.current = null;
    setMapState('overview');
    setActiveZone(null);
    window.history.pushState(null, '', '/');

    flyToWithGuard({
      center: [DEFAULT_VIEW_STATE.longitude, DEFAULT_VIEW_STATE.latitude],
      zoom: DEFAULT_VIEW_STATE.zoom,
      pitch: DEFAULT_VIEW_STATE.pitch,
      bearing: DEFAULT_VIEW_STATE.bearing,
      duration: 1200,
      essential: true,
    }, 1200);
  }, [flyToWithGuard]);

  const handleMoveEnd = useCallback(() => {
    if (isAnimating.current) return;
    if (mapState !== 'zoneDetail') return;

    const map = mapRef.current?.getMap();
    if (!map) return;
    if (map.getZoom() < ZONE_ENTER_THRESHOLD) return;

    const center = map.getCenter();
    const point = map.project([center.lng, center.lat]);
    const features = map.queryRenderedFeatures(point, { layers: ['zones-fill'] });

    if (features.length > 0) {
      const zoneName = features[0].properties?.zone as string;
      if (zoneName && zoneName !== activeZone) {
        setActiveZone(zoneName);
      }
    } else {
      setActiveZone(null);
    }
  }, [mapState, activeZone, mapRef]);

  // Persist map state to sessionStorage for restoration on /map
  useEffect(() => {
    sessionStorage.setItem('map-zoom-state', JSON.stringify({ mapState, activeZone }));
  }, [mapState, activeZone]);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (path === '/' && mapState !== 'overview') {
        setMapState('overview');
        setActiveZone(null);
        flyToWithGuard({
          center: [DEFAULT_VIEW_STATE.longitude, DEFAULT_VIEW_STATE.latitude],
          zoom: DEFAULT_VIEW_STATE.zoom,
          pitch: DEFAULT_VIEW_STATE.pitch,
          bearing: DEFAULT_VIEW_STATE.bearing,
          duration: 800,
          essential: true,
        }, 800);
      } else if (path === '/map' && mapState === 'overview') {
        setMapState('expanded');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [mapState, flyToWithGuard]);

  return { mapState, activeZone, expandMap, zoomIntoZone, zoomOutToExpanded, zoomOutToOverview, handleZoomChange, handleMoveEnd };
}
