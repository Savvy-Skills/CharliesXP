import { Marker } from 'react-map-gl/mapbox';
import type { Place } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface PlaceMarkerProps {
  place: Place;
  zoom: number;
  onClick: (place: Place) => void;
  draggable?: boolean;
  onDragEnd?: (place: Place, lngLat: { lng: number; lat: number }) => void;
}

export function PlaceMarker({ place, zoom, onClick, draggable = false, onDragEnd }: PlaceMarkerProps) {
  const categoryColor =
    CATEGORIES.find((c) => c.value === place.category)?.color ?? '#6b7280';
  const emoji = CATEGORY_EMOJI[place.category] ?? '';

  return (
    <Marker
      longitude={place.coordinates.lng}
      latitude={place.coordinates.lat}
      anchor="center"
      draggable={draggable}
      onDragEnd={(e) => onDragEnd?.(place, e.lngLat)}
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick(place);
      }}
    >
      {zoom < 5 ? (
        <div
          className="marker-dot"
          style={{ backgroundColor: categoryColor }}
        />
      ) : zoom < 12 ? (
        <div className="marker-icon" style={{ backgroundColor: categoryColor }}>
          <span>{emoji}</span>
        </div>
      ) : (
        <div className="marker-detailed">
          <div
            className="marker-icon"
            style={{ backgroundColor: categoryColor, width: 42, height: 42, fontSize: 20 }}
          >
            <span>{emoji}</span>
          </div>
          <div className="marker-label">{place.name}</div>
        </div>
      )}
    </Marker>
  );
}
