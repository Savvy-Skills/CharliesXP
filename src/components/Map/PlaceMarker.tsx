import { useRef, useCallback, useEffect } from 'react';
import { Marker, useMap } from 'react-map-gl/mapbox';
import { Move } from 'lucide-react';
import type { Place } from '../../types';
import { CATEGORIES } from '../../types';

interface PlaceMarkerProps {
  place: Place;
  zoom: number;
  onClick: (place: Place) => void;
  draggable?: boolean;
  onDragStart?: (place: Place) => void;
  onDrag?: (place: Place, lngLat: { lng: number; lat: number }) => void;
  onDragEnd?: (place: Place, lngLat: { lng: number; lat: number }) => void;
}

export function PlaceMarker({ place, zoom, onClick, draggable = false, onDragStart, onDrag, onDragEnd }: PlaceMarkerProps) {
  const { current: mapRef } = useMap();
  const categoryColor =
    CATEGORIES.find((c) => c.value === place.category)?.color ?? '#6b7280';

  // Drag state — only used by the drag handle
  const isDragging = useRef(false);
  const lastLngLat = useRef<{ lng: number; lat: number } | null>(null);

  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = false;
    lastLngLat.current = null;
  }, []);

  const handleDragPointerMove = useCallback((e: React.PointerEvent) => {
    if (!mapRef) return;
    // Only track if pointer is captured (button held on drag handle)
    if (!(e.target as HTMLElement).hasPointerCapture(e.pointerId)) return;

    const map = mapRef.getMap();
    const canvas = map.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const lngLat = map.unproject([e.clientX - rect.left, e.clientY - rect.top]);

    if (!isDragging.current) {
      isDragging.current = true;
      map.dragPan.disable();
      onDragStart?.(place);
    }
    lastLngLat.current = { lng: lngLat.lng, lat: lngLat.lat };
    onDrag?.(place, lastLngLat.current);
  }, [mapRef, place, onDragStart, onDrag]);

  const handleDragPointerUp = useCallback(() => {
    if (mapRef) mapRef.getMap().dragPan.enable();
    if (isDragging.current && lastLngLat.current) {
      onDragEnd?.(place, lastLngLat.current);
    }
    isDragging.current = false;
    lastLngLat.current = null;
  }, [mapRef, place, onDragEnd]);

  // Safety: re-enable drag pan on unmount
  useEffect(() => () => {
    if (isDragging.current && mapRef) mapRef.getMap().dragPan.enable();
  }, [mapRef]);

  return (
    <Marker
      longitude={place.coordinates.lng}
      latitude={place.coordinates.lat}
      anchor="center"
      draggable={false}
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        if (!isDragging.current) onClick(place);
      }}
    >
      <div className="relative">
        {/* Drag handle — only visible when this place is being edited */}
        {draggable && (
          <div
            className="absolute -top-7 left-1/2 -translate-x-1/2 z-10
              w-6 h-6 rounded-full bg-[var(--sg-crimson)] shadow-md
              flex items-center justify-center
              cursor-grab active:cursor-grabbing
              hover:scale-110 transition-transform"
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={handleDragPointerUp}
            onPointerCancel={handleDragPointerUp}
            style={{ touchAction: 'none' }}
          >
            <Move size={12} className="text-white" />
          </div>
        )}

        {/* Marker icon */}
        {zoom < 5 ? (
          <div
            className="marker-dot"
            style={{ backgroundColor: categoryColor }}
          />
        ) : zoom < 12 ? (
          <div className="marker-icon" style={{ backgroundColor: categoryColor }}>
            <img
              src={place.iconUrl ?? '/icons/default-place.png'}
              alt=""
              className="w-full h-full p-1 object-contain"
              draggable={false}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/icons/default-place.png'; }}
            />
          </div>
        ) : (
          <div className="marker-detailed">
            <div className="marker-icon" style={{ backgroundColor: categoryColor, width: 42, height: 42 }}>
              <img
                src={place.iconUrl ?? '/icons/default-place.png'}
                alt=""
                className="w-full h-full p-1.5 object-contain"
                draggable={false}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/icons/default-place.png'; }}
              />
            </div>
            <div className="marker-label">{place.name}</div>
          </div>
        )}
      </div>
    </Marker>
  );
}
