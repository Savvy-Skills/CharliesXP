import { useState, useCallback } from 'react';
import { Link } from 'react-router';
import { Edit3 } from 'lucide-react';
import { InteractiveMap } from '../components/Map/InteractiveMap';
import { CategoryFilter } from '../components/Viewer/CategoryFilter';
import { PlaceList } from '../components/Viewer/PlaceList';
import { PlaceModalContent } from '../components/Viewer/PlaceModal';
import { Modal } from '../components/ui/Modal';
import { BottomSheet } from '../components/ui/BottomSheet';
import { usePlaces } from '../hooks/usePlaces';
import { useMapFlyTo } from '../hooks/useMapFlyTo';
import type { Place } from '../types';

function useIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export function ViewerPage() {
  const { filteredPlaces, activeCategories, toggleCategory } = usePlaces();
  const { mapRef, flyToPlace, flyBack, flyToDefault } = useMapFlyTo();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const isMobile = useIsMobile();

  const handlePlaceClick = useCallback(
    (place: Place) => {
      flyToPlace(place);
      setSelectedPlace(place);
    },
    [flyToPlace],
  );

  const handleClose = useCallback(() => {
    setSelectedPlace(null);
    flyBack();
  }, [flyBack]);

  return (
    <div className="h-full w-full relative">
      <InteractiveMap
        places={filteredPlaces}
        mapRef={mapRef}
        onPlaceClick={handlePlaceClick}
        onResetView={flyToDefault}
      >
        <CategoryFilter
          activeCategories={activeCategories}
          onToggle={toggleCategory}
        />
        <PlaceList places={filteredPlaces} onPlaceClick={handlePlaceClick} />
      </InteractiveMap>

      {isMobile ? (
        <BottomSheet isOpen={!!selectedPlace} onClose={handleClose}>
          {selectedPlace && <PlaceModalContent place={selectedPlace} />}
        </BottomSheet>
      ) : (
        <Modal isOpen={!!selectedPlace} onClose={handleClose}>
          {selectedPlace && <PlaceModalContent place={selectedPlace} />}
        </Modal>
      )}

      <Link
        to="/editor"
        className="absolute bottom-20 md:bottom-4 right-4 z-20 p-3 rounded-full
          bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg transition-colors"
        title="Edit mode"
      >
        <Edit3 size={20} />
      </Link>
    </div>
  );
}
