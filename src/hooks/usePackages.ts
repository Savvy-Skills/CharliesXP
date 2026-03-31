import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Package } from '../types';

let cachedPackages: Package[] | null = null;

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>(cachedPackages ?? []);
  const [loading, setLoading] = useState(!cachedPackages);

  useEffect(() => {
    if (cachedPackages) return;

    supabase
      .from('packages')
      .select('*')
      .eq('active', true)
      .order('price_cents')
      .then(({ data }) => {
        if (data) {
          cachedPackages = data as Package[];
          setPackages(cachedPackages);
        }
        setLoading(false);
      });
  }, []);

  return { packages, loading };
}
