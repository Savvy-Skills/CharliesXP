import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type ZoneTeasers = Record<string, Record<string, number>>;

export function useZoneTeasers() {
  const [teasers, setTeasers] = useState<ZoneTeasers>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('get_zone_teasers').then(({ data, error }) => {
      if (!error && data) setTeasers(data as ZoneTeasers);
      setLoading(false);
    });
  }, []);

  return { teasers, loading };
}
