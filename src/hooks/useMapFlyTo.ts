import { useCallback, useRef } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import type { Place, ViewState } from '../types';
import { DEFAULT_VIEW_STATE } from '../utils/mapStyles';

export function useMapFlyTo() {
  const mapRef = useRef<MapRef>(null);
  const previousView = useRef<ViewState | null>(null);

  const flyToPlace = useCallback((place: Place) => {
    const map = mapRef.current;
    if (!map) return;

    const currentMap = map.getMap();
    previousView.current = {
      longitude: currentMap.getCenter().lng,
      latitude: currentMap.getCenter().lat,
      zoom: currentMap.getZoom(),
      pitch: currentMap.getPitch(),
      bearing: currentMap.getBearing(),
    };

    map.flyTo({
      center: [place.coordinates.lng, place.coordinates.lat],
      zoom: place.zoom,
      pitch: place.pitch,
      bearing: place.bearing,
      duration: 2000,
      essential: true,
    });
  }, []);

  const flyBack = useCallback(() => {
    const map = mapRef.current;
    if (!map || !previousView.current) return;

    const prev = previousView.current;
    map.flyTo({
      center: [prev.longitude, prev.latitude],
      zoom: prev.zoom,
      pitch: prev.pitch,
      bearing: prev.bearing,
      duration: 1500,
      essential: true,
    });

    previousView.current = null;
  }, []);

  const flyToDefault = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    map.flyTo({
      center: [DEFAULT_VIEW_STATE.longitude, DEFAULT_VIEW_STATE.latitude],
      zoom: DEFAULT_VIEW_STATE.zoom,
      pitch: DEFAULT_VIEW_STATE.pitch,
      bearing: DEFAULT_VIEW_STATE.bearing,
      duration: 1500,
      essential: true,
    });
  }, []);

  return { mapRef, flyToPlace, flyBack, flyToDefault };
}
