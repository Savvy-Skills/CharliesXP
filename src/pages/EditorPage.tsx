import { useState, useCallback } from 'react';
import { Link } from 'react-router';
import { Eye } from 'lucide-react';
import { InteractiveMap } from '../components/Map/InteractiveMap';
import { EditorPanel } from '../components/Editor/EditorPanel';
import { usePlaces } from '../hooks/usePlaces';
import { useMapFlyTo } from '../hooks/useMapFlyTo';
import type { Place, Coordinates } from '../types';

export function EditorPage() {
  const { places, addPlace, updatePlace, deletePlace, exportPlaces } = usePlaces();
  const { mapRef, flyToPlace, flyToDefault } = useMapFlyTo();
  const [pendingCoordinates, setPendingCoordinates] = useState<Coordinates | null>(null);
  const [currentView, setCurrentView] = useState({ zoom: 16, pitch: 50, bearing: 0 });

  const handleMapClick = useCallback(
    (e: { lngLat: { lng: number; lat: number } }) => {
      const map = mapRef.current?.getMap();
      if (map) {
        setCurrentView({
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
        });
      }
      setPendingCoordinates({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    },
    [mapRef],
  );

  const handlePlaceClick = useCallback(
    (place: Place) => {
      flyToPlace(place);
    },
    [flyToPlace],
  );

  return (
    <div className="h-full w-full relative">
      <InteractiveMap
        places={places}
        mapRef={mapRef}
        onPlaceClick={handlePlaceClick}
        onMapClick={handleMapClick}
        onResetView={flyToDefault}
      />

      <EditorPanel
        places={places}
        pendingCoordinates={pendingCoordinates}
        currentView={currentView}
        onAdd={addPlace}
        onUpdate={updatePlace}
        onDelete={deletePlace}
        onExport={exportPlaces}
        onCancelPending={() => setPendingCoordinates(null)}
        onPlaceClick={handlePlaceClick}
      />

      <Link
        to="/"
        className="absolute bottom-4 left-4 z-20 p-3 rounded-full
          bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-colors"
        title="Viewer mode"
      >
        <Eye size={20} />
      </Link>
    </div>
  );
}
