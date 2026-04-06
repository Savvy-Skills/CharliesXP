import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface ZoneSettingsReturn {
  enabledZoneIds: string[];
  isZoneEnabled: (zoneId: string) => boolean;
  toggleZone: (zoneId: string, enabled: boolean) => Promise<void>;
  loading: boolean;
}

export function useZoneSettings(): ZoneSettingsReturn {
  const [enabledZoneIds, setEnabledZoneIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnabledZones() {
      setLoading(true);
      const { data, error } = await supabase
        .from('zone_settings')
        .select('zone_id')
        .eq('enabled', true);

      if (error) {
        console.error('Fetch zone settings error:', error);
        setEnabledZoneIds([]);
      } else {
        setEnabledZoneIds((data as { zone_id: string }[]).map(row => row.zone_id));
      }
      setLoading(false);
    }

    fetchEnabledZones();

    // Re-fetch when auth state changes (login/logout) so the query
    // runs with the correct session token
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchEnabledZones();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isZoneEnabled = useCallback(
    (zoneId: string) => enabledZoneIds.includes(zoneId),
    [enabledZoneIds]
  );

  const toggleZone = useCallback(async (zoneId: string, enabled: boolean) => {
    // Snapshot for rollback
    const previous = enabledZoneIds;

    // Optimistic update
    setEnabledZoneIds(prev =>
      enabled ? [...prev, zoneId] : prev.filter(id => id !== zoneId)
    );

    const { error } = await supabase
      .from('zone_settings')
      .update({ enabled })
      .eq('zone_id', zoneId);

    if (error) {
      console.error('Toggle zone error:', error);
      // Rollback to previous state
      setEnabledZoneIds(previous);
    }
  }, [enabledZoneIds]);

  return { enabledZoneIds, isZoneEnabled, toggleZone, loading };
}
