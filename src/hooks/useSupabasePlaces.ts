import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Place, PlaceCategory, Tag } from '../types';

interface SupabasePlaceRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: PlaceCategory;
  zone_id: string;
  coordinates: { lng: number; lat: number };
  address: string;
  marker_icon: string;
  marker_image: string;
  images: string[];
  icon_url: string | null;
  visit_date: string | null;
  camera: { zoom?: number; pitch?: number; bearing?: number };
  model: { url: string; scale?: number; rotation?: [number, number, number] } | null;
  active: boolean;
  place_tags?: Array<{ tags: { id: string; slug: string; name: string; color: string; sort_order: number } }>;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-|-$/g, '');
}

function rowToPlace(row: SupabasePlaceRow): Place {
  const tags: Tag[] = (row.place_tags ?? [])
    .map((pt) => ({
      id: pt.tags.id,
      slug: pt.tags.slug,
      name: pt.tags.name,
      color: pt.tags.color,
      sortOrder: pt.tags.sort_order,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: row.id,
    slug: row.slug ?? generateSlug(row.name),
    name: row.name,
    description: row.description,
    category: row.category,
    coordinates: row.coordinates,
    address: row.address,
    markerIcon: row.marker_icon,
    markerImage: row.marker_image,
    images: row.images,
    visitDate: row.visit_date ?? '',
    tags,
    iconUrl: row.icon_url,
    zoom: row.camera?.zoom ?? 15,
    pitch: row.camera?.pitch ?? 45,
    bearing: row.camera?.bearing ?? 0,
    zone: row.zone_id,
    model: row.model ?? undefined,
  };
}

function placeToRow(place: Omit<Place, 'id' | 'slug'>, activeZone: string): Record<string, unknown> {
  return {
    name: place.name,
    slug: generateSlug(place.name),
    description: place.description,
    category: place.category,
    zone_id: place.zone ?? activeZone,
    coordinates: place.coordinates,
    address: place.address,
    marker_icon: place.markerIcon,
    marker_image: place.markerImage,
    images: place.images,
    icon_url: place.iconUrl ?? null,
    visit_date: place.visitDate,
    camera: { zoom: place.zoom, pitch: place.pitch, bearing: place.bearing },
    placed: true,
    active: true,
  };
}

function partialPlaceToDbUpdates(updates: Partial<Place>): Record<string, unknown> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.zone !== undefined) dbUpdates.zone_id = updates.zone;
  if (updates.coordinates !== undefined) {
    dbUpdates.coordinates = updates.coordinates;
    dbUpdates.placed = true;
  }
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.iconUrl !== undefined) dbUpdates.icon_url = updates.iconUrl;
  return dbUpdates;
}

export function useSupabasePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('places')
      .select('*, place_tags(tags(id, slug, name, color, sort_order))')
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

  // ── Optimistic Add ──
  const optimisticAdd = useCallback(async (place: Omit<Place, 'id'>, activeZone: string): Promise<string | null> => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticPlace: Place = { ...place, id: tempId, zone: place.zone ?? activeZone };

    // Immediately add to local state
    setPlaces(prev => [...prev, optimisticPlace]);

    const { data, error: err } = await supabase
      .from('places')
      .insert(placeToRow(place, activeZone))
      .select()
      .single();

    if (err) {
      console.error('Add place error:', err);
      // Revert: remove the temp place
      setPlaces(prev => prev.filter(p => p.id !== tempId));
      return null;
    }
    // Replace temp with real DB record
    const realPlace = rowToPlace(data as SupabasePlaceRow);
    setPlaces(prev => prev.map(p => p.id === tempId ? realPlace : p));
    return realPlace.id;
  }, []);

  // ── Optimistic Update ──
  const optimisticUpdate = useCallback(async (id: string, updates: Partial<Place>) => {
    // Snapshot for rollback
    let snapshot: Place | undefined;
    setPlaces(prev => {
      snapshot = prev.find(p => p.id === id);
      return prev.map(p => p.id === id ? { ...p, ...updates } : p);
    });

    const dbUpdates = partialPlaceToDbUpdates(updates);
    if (Object.keys(dbUpdates).length === 0) return;

    const { error: err } = await supabase.from('places').update(dbUpdates).eq('id', id);
    if (err) {
      console.error('Update place error:', err);
      // Revert to snapshot
      if (snapshot) {
        setPlaces(prev => prev.map(p => p.id === id ? snapshot! : p));
      }
    }
  }, []);

  // ── Optimistic Delete ──
  const optimisticDelete = useCallback(async (id: string) => {
    // Snapshot for rollback
    let snapshot: Place | undefined;
    let snapshotIndex = -1;
    setPlaces(prev => {
      snapshotIndex = prev.findIndex(p => p.id === id);
      snapshot = prev[snapshotIndex];
      return prev.filter(p => p.id !== id);
    });

    const { error: err } = await supabase.from('places').delete().eq('id', id);
    if (err) {
      console.error('Delete place error:', err);
      // Revert: re-insert at original position
      if (snapshot) {
        setPlaces(prev => {
          const next = [...prev];
          next.splice(snapshotIndex, 0, snapshot!);
          return next;
        });
      }
    }
  }, []);

  const setPlaceTags = useCallback(async (placeId: string, tagIds: string[]) => {
    const { error: delErr } = await supabase
      .from('place_tags')
      .delete()
      .eq('place_id', placeId);
    if (delErr) { console.error('place_tags delete:', delErr); return; }
    if (tagIds.length === 0) return;
    const rows = tagIds.map((tag_id) => ({ place_id: placeId, tag_id }));
    const { error: insErr } = await supabase.from('place_tags').insert(rows);
    if (insErr) console.error('place_tags insert:', insErr);
  }, []);

  return {
    places,
    loading,
    error,
    refetch: fetchPlaces,
    optimisticAdd,
    optimisticUpdate,
    optimisticDelete,
    setPlaceTags,
  };
}
