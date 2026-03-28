import { Link } from 'react-router';
import { Star } from 'lucide-react';
import type { Place } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';

interface ZonePlacesListProps {
  places: Place[];
}

export function ZonePlacesList({ places }: ZonePlacesListProps) {
  if (places.length === 0) {
    return <p className="text-[#8b7355] text-sm py-4">No places in this zone yet.</p>;
  }

  return (
    <div className="space-y-3">
      {places.map((place) => {
        const cat = CATEGORIES.find((c) => c.value === place.category);
        return (
          <Link
            key={place.id}
            to={`/place/${place.id}`}
            className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm
              border border-[#e8dfd5] hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0"
              style={{ backgroundColor: cat?.color ?? '#6b7280' }}
            >
              {CATEGORY_EMOJI[place.category]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#2d1f1a] truncate">{place.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[#8b7355]">{cat?.label}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: place.rating }).map((_, i) => (
                    <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
