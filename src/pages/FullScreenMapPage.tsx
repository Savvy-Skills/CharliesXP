import { useState, useCallback } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { InteractiveMap } from '../components/Map/InteractiveMap';
import { CategoryFilter } from '../components/Viewer/CategoryFilter';
import { PlaceList } from '../components/Viewer/PlaceList';
import { PlacePreviewCard } from '../components/Map/PlacePreviewCard';
import { usePlaces } from '../hooks/usePlaces';
import { useMapFlyTo } from '../hooks/useMapFlyTo';
import type { Place } from '../types';

export function FullScreenMapPage() {
  const { filteredPlaces, activeCategories, toggleCategory } = usePlaces();
  const { mapRef, flyToPlace, flyBack, flyToDefault } = useMapFlyTo();
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null);

  const handlePlaceClick = useCallback(
    (place: Place) => {
      flyToPlace(place);
      setPreviewPlace(place);
    },
    [flyToPlace],
  );

  const handleClosePreview = useCallback(() => {
    setPreviewPlace(null);
    flyBack();
  }, [flyBack]);

  return (
    <div className="h-screen w-full relative overflow-hidden">
      <InteractiveMap
        places={filteredPlaces}
        mapRef={mapRef}
        onPlaceClick={handlePlaceClick}
        onResetView={flyToDefault}
        mode="full"
      >
        <CategoryFilter
          activeCategories={activeCategories}
          onToggle={toggleCategory}
        />
        <PlaceList places={filteredPlaces} onPlaceClick={handlePlaceClick} />
      </InteractiveMap>

      <PlacePreviewCard place={previewPlace} onClose={handleClosePreview} />

      <Link
        to="/"
        className="absolute top-4 left-4 z-20 p-2.5 rounded-lg
          bg-white/90 backdrop-blur-sm hover:bg-white
          text-[#8b7355] shadow-md transition-colors border border-[#e8dfd5]"
        title="Back to home"
      >
        <ArrowLeft size={18} />
      </Link>

      <Link
        to="/editor"
        className="absolute bottom-20 md:bottom-4 right-4 z-20 p-3 rounded-full
          bg-[#7c2d36] hover:bg-[#9b4550] text-white shadow-lg transition-colors"
        title="Edit mode"
      >
        <Edit3 size={20} />
      </Link>
    </div>
  );
}
