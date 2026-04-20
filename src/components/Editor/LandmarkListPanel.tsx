import { useState, useMemo, useEffect } from 'react';
import { Search, X, Pencil, Trash2 } from 'lucide-react';
import type { Landmark } from '../../hooks/useSupabaseLandmarks';
import { ZONES } from '../../utils/zoneMapping';

interface LandmarkListPanelProps {
  landmarks: Landmark[];
  onAdd: (landmark: Omit<Landmark, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<Landmark, 'id'>>) => void;
  onDelete: (id: string) => void;
  pendingCoordinates: { lng: number; lat: number } | null;
  pendingZoneId: string | null;
  onCancelPending: () => void;
  editingLandmarkId: string | null;
  onEditLandmark: (id: string | null) => void;
  onFlyTo: (coords: { lng: number; lat: number }) => void;
}

interface LandmarkForm {
  name: string;
  zone_id: string;
  min_zoom: number;
}

const EMPTY_FORM: LandmarkForm = { name: '', zone_id: '', min_zoom: 14 };

export function LandmarkListPanel({
  landmarks,
  onAdd,
  onUpdate,
  onDelete,
  pendingCoordinates,
  pendingZoneId,
  onCancelPending,
  editingLandmarkId,
  onEditLandmark,
  onFlyTo,
}: LandmarkListPanelProps) {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<LandmarkForm>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const showForm = pendingCoordinates !== null || editingLandmarkId !== null;

  const editingLandmark = editingLandmarkId
    ? landmarks.find((l) => l.id === editingLandmarkId)
    : null;

  // Initialize form when editing starts
  useEffect(() => {
    if (editingLandmark) {
      setForm({
        name: editingLandmark.name,
        zone_id: editingLandmark.zone_id,
        min_zoom: editingLandmark.min_zoom,
      });
    } else if (pendingCoordinates) {
      setForm({ ...EMPTY_FORM, zone_id: pendingZoneId ?? '' });
    }
  }, [editingLandmarkId, editingLandmark, pendingCoordinates, pendingZoneId]);

  const filteredLandmarks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return landmarks;
    return landmarks.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.zone_id.toLowerCase().includes(q),
    );
  }, [search, landmarks]);

  const handleSave = () => {
    if (!form.name.trim()) return;

    if (editingLandmarkId) {
      onUpdate(editingLandmarkId, {
        name: form.name.trim(),
        zone_id: form.zone_id,
        min_zoom: form.min_zoom,
      });
      onEditLandmark(null);
    } else if (pendingCoordinates) {
      onAdd({
        name: form.name.trim(),
        zone_id: form.zone_id,
        coordinates: pendingCoordinates,
        icon: '',
        iconUrl: null,
        min_zoom: form.min_zoom,
      });
      onCancelPending();
    }
    setForm(EMPTY_FORM);
  };

  const handleCancel = () => {
    if (editingLandmarkId) {
      onEditLandmark(null);
    } else {
      onCancelPending();
    }
    setForm(EMPTY_FORM);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setConfirmDelete(null);
    if (editingLandmarkId === id) {
      onEditLandmark(null);
      setForm(EMPTY_FORM);
    }
  };

  return (
    <div className="h-full w-full bg-white border-r border-[var(--sg-border)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0 border-b border-[var(--sg-border)]">
        <div className="relative mb-2">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sg-navy)]/30 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search landmarks…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-[var(--sg-offwhite)] border border-[var(--sg-border)] rounded-lg
              text-[var(--sg-navy)] placeholder-[var(--sg-navy)]/30 focus:outline-none focus:ring-1
              focus:ring-[var(--sg-thames)] focus:border-[var(--sg-thames)] transition-colors"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--sg-navy)]/50">
            <span className="font-semibold text-[var(--sg-navy)]/70">{landmarks.length}</span> landmarks
          </p>
          <span className="text-[10px] text-[var(--sg-navy)]/40">Click map to add</span>
        </div>
      </div>

      {/* Inline form — shown when adding or editing */}
      {showForm && (
        <div className="px-4 py-3 border-b border-[var(--sg-border)] bg-[var(--sg-offwhite)]/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--sg-navy)]">
              {editingLandmarkId ? 'Edit Landmark' : 'Add Landmark'}
            </h3>
            <button
              onClick={handleCancel}
              className="text-[var(--sg-navy)]/40 hover:text-[var(--sg-navy)] cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-[var(--sg-navy)]/60 uppercase mb-1">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Landmark name"
              className="w-full rounded-lg border border-[var(--sg-border)] px-3 py-2 text-sm text-[var(--sg-navy)]
                focus:outline-none focus:ring-1 focus:ring-[var(--sg-thames)] focus:border-[var(--sg-thames)]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-[var(--sg-navy)]/60 uppercase mb-1">
              Zone
            </label>
            <select
              value={form.zone_id}
              onChange={(e) => setForm((f) => ({ ...f, zone_id: e.target.value }))}
              className="w-full rounded-lg border border-[var(--sg-border)] px-3 py-2 text-sm text-[var(--sg-navy)]
                focus:outline-none focus:ring-1 focus:ring-[var(--sg-thames)] focus:border-[var(--sg-thames)] bg-white"
            >
              <option value="">— No zone —</option>
              {ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-[var(--sg-navy)]/60 uppercase mb-1">
              Min Zoom (10-20)
            </label>
            <input
              type="number"
              min={10}
              max={20}
              value={form.min_zoom}
              onChange={(e) => setForm((f) => ({ ...f, min_zoom: Math.min(20, Math.max(10, parseInt(e.target.value) || 14)) }))}
              className="w-full rounded-lg border border-[var(--sg-border)] px-3 py-2 text-sm text-[var(--sg-navy)]
                focus:outline-none focus:ring-1 focus:ring-[var(--sg-thames)] focus:border-[var(--sg-thames)]"
            />
          </div>

          {/* Coordinates display */}
          {(pendingCoordinates || editingLandmark) && (
            <div>
              <label className="block text-[10px] font-medium text-[var(--sg-navy)]/60 uppercase mb-1">
                Coordinates
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={(pendingCoordinates ?? editingLandmark?.coordinates)?.lng.toFixed(5) ?? ''}
                  className="flex-1 rounded-lg border border-[var(--sg-border)] px-3 py-2 text-xs text-[var(--sg-navy)]/50 bg-[var(--sg-offwhite)]"
                />
                <input
                  readOnly
                  value={(pendingCoordinates ?? editingLandmark?.coordinates)?.lat.toFixed(5) ?? ''}
                  className="flex-1 rounded-lg border border-[var(--sg-border)] px-3 py-2 text-xs text-[var(--sg-navy)]/50 bg-[var(--sg-offwhite)]"
                />
              </div>
              <p className="text-[10px] text-[var(--sg-navy)]/35 mt-1">
                {editingLandmarkId ? 'Drag marker on map to adjust' : 'Click map to reposition'}
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="w-full py-2 rounded-lg bg-[var(--sg-crimson)] text-white text-sm font-medium
              hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingLandmarkId ? 'Update Landmark' : 'Save Landmark'}
          </button>
        </div>
      )}

      {/* Landmark list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {filteredLandmarks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-[var(--sg-navy)]/40">
              {search ? 'No landmarks match your search.' : 'No landmarks yet. Click the map to add one.'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {filteredLandmarks.map((lm) => {
              const isEditing = editingLandmarkId === lm.id;
              return (
                <div
                  key={lm.id}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors group ${
                    isEditing
                      ? 'bg-[var(--sg-thames)]/8 ring-1 ring-[var(--sg-thames)]/20'
                      : 'hover:bg-[var(--sg-offwhite)]'
                  }`}
                >
                  {/* Crimson dot */}
                  <div className="w-3 h-3 rounded-full bg-[var(--sg-crimson)]/60 border border-white/80 shrink-0" />

                  {/* Name + zone info (clickable — flies to landmark) */}
                  <button
                    onClick={() => onFlyTo(lm.coordinates)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span className="text-sm font-medium text-[var(--sg-navy)] truncate block">
                      {lm.name}
                    </span>
                    <span className="text-[10px] text-[var(--sg-navy)]/40">
                      {lm.zone_id || '\u2014'} · zoom \u2265 {lm.min_zoom}
                    </span>
                  </button>

                  {/* Actions */}
                  {confirmDelete === lm.id ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] shrink-0">
                      <button
                        onClick={() => handleDelete(lm.id)}
                        className="text-[var(--sg-crimson)] font-semibold hover:underline cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[var(--sg-navy)]/60 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditLandmark(lm.id)}
                        className="p-1 rounded-lg text-[var(--sg-navy)]/40 hover:text-[var(--sg-navy)] hover:bg-[var(--sg-border)] cursor-pointer"
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(lm.id)}
                        className="p-1 rounded-lg text-[var(--sg-navy)]/40 hover:text-[var(--sg-crimson)] hover:bg-[var(--sg-crimson)]/10 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
