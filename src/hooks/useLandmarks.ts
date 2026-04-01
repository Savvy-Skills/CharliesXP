import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Landmark {
  id: string;
  name: string;
  zone_id: string;
  coordinates: { lng: number; lat: number };
  icon: string;
}

export function useLandmarks() {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('landmarks')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) setLandmarks(data as Landmark[]);
        setLoading(false);
      });
  }, []);

  return { landmarks, loading };
}
