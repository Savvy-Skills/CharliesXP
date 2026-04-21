import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Tag } from '../types';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('tags')
      .select('id, slug, name, color, sort_order')
      .order('sort_order', { ascending: true });

    if (err) {
      setError(err.message);
      setTags([]);
    } else {
      setTags(
        (data ?? []).map((r) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          color: r.color,
          sortOrder: r.sort_order,
        })),
      );
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  return { tags, loading, error, refetch: fetchTags };
}
