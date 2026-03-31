import { useState, useCallback } from 'react';
import type { PlaceCategory, Zone } from '../types';
import zonesData from '../data/zones.json';
import { useSupabasePlaces } from './useSupabasePlaces';

export function usePlaces() {
  const { places, loading, error, refetch } = useSupabasePlaces();
  const [activeCategories, setActiveCategories] = useState<PlaceCategory[]>([]);

  const filteredPlaces =
    activeCategories.length === 0
      ? places
      : places.filter((p) => activeCategories.includes(p.category));

  const toggleCategory = useCallback((category: PlaceCategory) => {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  const zones: Zone[] = zonesData;

  const getPlaceById = useCallback(
    (id: string) => places.find((p) => p.id === id) ?? null,
    [places],
  );

  const getPlacesByZone = useCallback(
    (zone: string) => places.filter((p) => p.zone === zone),
    [places],
  );

  const getZoneById = useCallback(
    (id: string) => zones.find((z) => z.id === id) ?? null,
    [zones],
  );

  return {
    places,
    filteredPlaces,
    zones,
    activeCategories,
    toggleCategory,
    getPlaceById,
    getPlacesByZone,
    getZoneById,
    loading,
    error,
    refetch,
  };
}
