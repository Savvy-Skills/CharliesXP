import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTags } from '../../hooks/useTags';
import type { Tag } from '../../types';

export function TagListPanel() {
  const { tags, loading, refetch } = useTags();
  const [editing, setEditing] = useState<Tag | null>(null);
  const [creating, setCreating] = useState(false);

  async function save(draft: Tag) {
    const row = {
      slug: draft.slug.trim(),
      name: draft.name.trim(),
      color: draft.color.trim(),
      sort_order: draft.sortOrder,
    };
    if (draft.id) {
      await supabase.from('tags').update(row).eq('id', draft.id);
    } else {
      await supabase.from('tags').insert(row);
    }
    await refetch();
    setEditing(null);
    setCreating(false);
  }

  async function remove(tag: Tag) {
    const { count } = await supabase
      .from('place_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', tag.id);
    const msg = count
      ? `Delete tag "${tag.name}"? Removes it from ${count} place${count === 1 ? '' : 's'}.`
      : `Delete tag "${tag.name}"?`;
    if (!window.confirm(msg)) return;
    await supabase.from('tags').delete().eq('id', tag.id);
    await refetch();
  }

  if (loading) return <div className="p-4 text-sm text-[var(--sg-navy)]/60">Loading tags…</div>;

  const showForm: Tag | null =
    editing ??
    (creating
      ? { id: '', slug: '', name: '', color: '#6b7280', sortOrder: (tags.at(-1)?.sortOrder ?? 0) + 10 }
      : null);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tags</h3>
        <button
          type="button"
          className="text-xs text-[var(--sg-crimson)]"
          onClick={() => { setCreating(true); setEditing(null); }}
        >
          + New tag
        </button>
      </div>

      <ul className="space-y-1">
        {tags.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="flex-1">{t.name} <span className="text-[11px] text-[var(--sg-navy)]/40">({t.slug})</span></span>
            <span className="text-[11px] text-[var(--sg-navy)]/40">#{t.sortOrder}</span>
            <button type="button" onClick={() => { setEditing(t); setCreating(false); }} className="text-xs text-[var(--sg-navy)]/60 hover:text-[var(--sg-navy)]">Edit</button>
            <button type="button" onClick={() => remove(t)} className="text-xs text-[var(--sg-crimson)]/70 hover:text-[var(--sg-crimson)]">Delete</button>
          </li>
        ))}
      </ul>

      {showForm && (
        <TagForm
          initial={showForm}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSubmit={save}
        />
      )}
    </div>
  );
}

function TagForm({ initial, onCancel, onSubmit }: {
  initial: Tag;
  onCancel: () => void;
  onSubmit: (draft: Tag) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Tag>(initial);
  return (
    <form
      className="border border-[var(--sg-border)] rounded-lg p-3 space-y-2"
      onSubmit={(e) => { e.preventDefault(); onSubmit(draft); }}
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">
          Name
          <input className="mt-0.5 w-full border rounded px-2 py-1 text-sm" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label className="text-xs">
          Slug
          <input className="mt-0.5 w-full border rounded px-2 py-1 text-sm" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
        </label>
        <label className="text-xs">
          Color (hex)
          <input className="mt-0.5 w-full border rounded px-2 py-1 text-sm" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
        </label>
        <label className="text-xs">
          Sort order
          <input type="number" className="mt-0.5 w-full border rounded px-2 py-1 text-sm" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-xs text-[var(--sg-navy)]/60">Cancel</button>
        <button type="submit" className="text-xs font-semibold text-[var(--sg-crimson)]">Save</button>
      </div>
    </form>
  );
}
