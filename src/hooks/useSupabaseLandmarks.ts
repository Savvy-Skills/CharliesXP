import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Landmark {
  id: string;
  name: string;
  zone_id: string;
  coordinates: { lng: number; lat: number };
  icon: string;
  min_zoom: number;
}

interface SupabaseLandmarkRow {
  id: string;
  name: string;
  zone_id: string;
  coordinates: { lng: number; lat: number };
  icon: string;
  min_zoom: number;
}

function rowToLandmark(row: SupabaseLandmarkRow): Landmark {
  return {
    id: row.id,
    name: row.name,
    zone_id: row.zone_id,
    coordinates: row.coordinates,
    icon: row.icon,
    min_zoom: row.min_zoom,
  };
}

function landmarkToRow(landmark: Omit<Landmark, 'id'>): Record<string, unknown> {
  return {
    name: landmark.name,
    zone_id: landmark.zone_id,
    coordinates: landmark.coordinates,
    icon: landmark.icon,
    min_zoom: landmark.min_zoom,
  };
}

export function useSupabaseLandmarks() {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLandmarks = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('landmarks')
      .select('*');

    if (err) {
      setError(err.message);
      setLandmarks([]);
    } else {
      setLandmarks((data as SupabaseLandmarkRow[]).map(rowToLandmark));
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLandmarks();
  }, [fetchLandmarks]);

  const addLandmark = useCallback(async (landmark: Omit<Landmark, 'id'>) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticLandmark: Landmark = { ...landmark, id: tempId };

    setLandmarks(prev => [...prev, optimisticLandmark]);

    const { data, error: err } = await supabase
      .from('landmarks')
      .insert(landmarkToRow(landmark))
      .select()
      .single();

    if (err) {
      console.error('Add landmark error:', err);
      setLandmarks(prev => prev.filter(l => l.id !== tempId));
    } else {
      const realLandmark = rowToLandmark(data as SupabaseLandmarkRow);
      setLandmarks(prev => prev.map(l => l.id === tempId ? realLandmark : l));
    }
  }, []);

  const updateLandmark = useCallback(async (id: string, updates: Partial<Omit<Landmark, 'id'>>) => {
    let snapshot: Landmark | undefined;
    setLandmarks(prev => {
      snapshot = prev.find(l => l.id === id);
      return prev.map(l => l.id === id ? { ...l, ...updates } : l);
    });

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.zone_id !== undefined) dbUpdates.zone_id = updates.zone_id;
    if (updates.coordinates !== undefined) dbUpdates.coordinates = updates.coordinates;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.min_zoom !== undefined) dbUpdates.min_zoom = updates.min_zoom;

    if (Object.keys(dbUpdates).length === 0) return;

    const { error: err } = await supabase.from('landmarks').update(dbUpdates).eq('id', id);
    if (err) {
      console.error('Update landmark error:', err);
      if (snapshot) {
        setLandmarks(prev => prev.map(l => l.id === id ? snapshot! : l));
      }
    }
  }, []);

  const deleteLandmark = useCallback(async (id: string) => {
    let snapshot: Landmark | undefined;
    let snapshotIndex = -1;
    setLandmarks(prev => {
      snapshotIndex = prev.findIndex(l => l.id === id);
      snapshot = prev[snapshotIndex];
      return prev.filter(l => l.id !== id);
    });

    const { error: err } = await supabase.from('landmarks').delete().eq('id', id);
    if (err) {
      console.error('Delete landmark error:', err);
      if (snapshot) {
        setLandmarks(prev => {
          const next = [...prev];
          next.splice(snapshotIndex, 0, snapshot!);
          return next;
        });
      }
    }
  }, []);

  return {
    landmarks,
    loading,
    error,
    addLandmark,
    updateLandmark,
    deleteLandmark,
  };
}
