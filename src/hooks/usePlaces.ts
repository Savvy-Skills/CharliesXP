import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Place, PlaceCategory, Zone } from '../types';
import initialPlaces from '../data/places.json';
import zonesData from '../data/zones.json';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>(initialPlaces as Place[]);
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

  const addPlace = useCallback((place: Omit<Place, 'id'>) => {
    const newPlace: Place = { ...place, id: uuidv4() };
    setPlaces((prev) => [...prev, newPlace]);
    return newPlace;
  }, []);

  const updatePlace = useCallback((id: string, updates: Partial<Place>) => {
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePlace = useCallback((id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const exportPlaces = useCallback(() => {
    const json = JSON.stringify(places, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'places.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [places]);

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
    addPlace,
    updatePlace,
    deletePlace,
    exportPlaces,
    getPlaceById,
    getPlacesByZone,
    getZoneById,
  };
}
