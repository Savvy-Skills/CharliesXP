import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Place, PlaceCategory } from '../types';

interface SupabasePlaceRow {
  id: string;
  name: string;
  description: string;
  category: PlaceCategory;
  zone_id: string;
  coordinates: { lng: number; lat: number };
  address: string;
  marker_icon: string;
  marker_image: string;
  images: string[];
  rating: number;
  tags: string[];
  visit_date: string | null;
  camera: { zoom?: number; pitch?: number; bearing?: number };
  model: { url: string; scale?: number; rotation?: [number, number, number] } | null;
  active: boolean;
}

function rowToPlace(row: SupabasePlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    coordinates: row.coordinates,
    address: row.address,
    markerIcon: row.marker_icon,
    markerImage: row.marker_image,
    images: row.images,
    rating: row.rating,
    visitDate: row.visit_date ?? '',
    tags: row.tags,
    zoom: row.camera?.zoom ?? 15,
    pitch: row.camera?.pitch ?? 45,
    bearing: row.camera?.bearing ?? 0,
    zone: row.zone_id,
    model: row.model ?? undefined,
  };
}

export function useSupabasePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('places')
      .select('*')
      .eq('active', true);

    if (err) {
      setError(err.message);
      setPlaces([]);
    } else {
      setPlaces((data as SupabasePlaceRow[]).map(rowToPlace));
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  return { places, loading, error, refetch: fetchPlaces };
}
