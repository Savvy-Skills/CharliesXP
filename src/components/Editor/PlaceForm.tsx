import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import type { Place, PlaceCategory, Coordinates } from '../../types';
import { MarkerPicker, type CustomMarker } from './MarkerPicker';
import { Button } from '../ui/Button';
import { MANAGED_ZONES, ZONE_MAP } from '../../utils/zoneMapping';
import { IconPicker } from './IconPicker';
import { useTags } from '../../hooks/useTags';

interface PlaceFormProps {
  initial?: Place;
  coordinates?: Coordinates;
  currentView?: { zoom: number; pitch: number; bearing: number };
  onSubmit: (place: Omit<Place, 'id'> | Place) => Promise<string | null | void> | void;
  onCancel: () => void;
  isDragging?: boolean;
  dragCoordinates?: { lng: number; lat: number } | null;
  onMoveToZone?: (placeId: string, zoneId: string) => void;
  onSaveTags?: (placeId: string, tagIds: string[]) => Promise<void> | void;
}

const inputClass = `w-full bg-white border border-[var(--sg-border)] rounded-xl px-3 py-2.5
  text-sm text-[var(--sg-navy)] placeholder-[var(--sg-navy)]/30
  focus:outline-none focus:border-[var(--sg-thames)] focus:ring-2 focus:ring-[var(--sg-thames)]/15
  transition-all duration-200`;

export function PlaceForm({ initial, coordinates, currentView, onSubmit, onCancel, isDragging = false, dragCoordinates, onMoveToZone, onSaveTags }: PlaceFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<PlaceCategory>(initial?.category ?? 'other');
  const [customMarker, setCustomMarker] = useState<CustomMarker | undefined>(
    initial?.category === 'other' && initial?.markerIcon !== 'other'
      ? { name: initial.markerIcon, image: initial.markerImage }
      : undefined
  );
  const [address, setAddress] = useState(initial?.address ?? '');
  const [visitDate, setVisitDate] = useState(initial?.visitDate ?? '');
  const [lng, setLng] = useState(String(initial?.coordinates?.lng ?? coordinates?.lng ?? 0));
  const [lat, setLat] = useState(String(initial?.coordinates?.lat ?? coordinates?.lat ?? 0));
  const [iconUrl, setIconUrl] = useState<string | null>(initial?.iconUrl ?? null);
  const { tags: allTags } = useTags();
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    () => new Set((initial?.tags ?? []).map((t) => t.id)),
  );

  // Sync coordinates from marker drag
  useEffect(() => {
    if (isDragging && dragCoordinates) {
      setLat(String(dragCoordinates.lat));
      setLng(String(dragCoordinates.lng));
    }
  }, [isDragging, dragCoordinates]);

  // Detect if any field has changed from initial values (for edit mode)
  const hasChanges = useMemo(() => {
    if (!initial) return true; // New place — always allow submit
    if (dragCoordinates) return true; // Drag moved the place — always allow save
    const initialTagIds = new Set((initial.tags ?? []).map((t) => t.id));
    const tagsChanged =
      initialTagIds.size !== selectedTagIds.size ||
      Array.from(selectedTagIds).some((id) => !initialTagIds.has(id));
    return (
      name !== (initial.name ?? '') ||
      description !== (initial.description ?? '') ||
      category !== (initial.category ?? 'other') ||
      address !== (initial.address ?? '') ||
      visitDate !== (initial.visitDate ?? '') ||
      lng !== String(initial.coordinates?.lng ?? 0) ||
      lat !== String(initial.coordinates?.lat ?? 0) ||
      iconUrl !== (initial.iconUrl ?? null) ||
      tagsChanged
    );
  }, [name, description, category, address, visitDate, lng, lat, initial, dragCoordinates, iconUrl, selectedTagIds]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const slug = initial?.slug ?? name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const place = {
      ...(initial ? { id: initial.id } : {}),
      slug,
      name,
      description,
      category,
      coordinates: { lng: parseFloat(lng) || 0, lat: parseFloat(lat) || 0 },
      address,
      markerIcon: customMarker?.name ?? category,
      markerImage: customMarker?.image || `/markers/${category}.png`,
      images: initial?.images ?? [],
      visitDate,
      tags: initial?.tags ?? [],
      iconUrl,
      zoom: currentView?.zoom ?? initial?.zoom ?? 16,
      pitch: currentView?.pitch ?? initial?.pitch ?? 50,
      bearing: currentView?.bearing ?? initial?.bearing ?? 0,
    };
    const result = await onSubmit(place);
    if (onSaveTags) {
      const savedId = typeof result === 'string' ? result : initial?.id ?? null;
      if (savedId) {
        await onSaveTags(savedId, Array.from(selectedTagIds));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Scrollable fields */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-2">
        <div>
          <label className="block text-sm font-semibold text-[var(--sg-navy)] mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Borough Market"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--sg-navy)] mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} min-h-[80px] resize-y`}
            placeholder="What makes this place special?"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--sg-navy)] mb-2">Category & Marker</label>
          <MarkerPicker
            value={category}
            customMarker={customMarker}
            onChange={(cat, custom) => {
              setCategory(cat);
              setCustomMarker(custom);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--sg-navy)]/70 mb-1">Map icon</label>
          <IconPicker
            iconUrl={iconUrl}
            defaultUrl="/icons/default-place.png"
            folder="places"
            recordId={initial?.id ?? `new-${Date.now()}`}
            onUploaded={setIconUrl}
            onReset={() => setIconUrl(null)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--sg-navy)]/70 mb-1">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const active = selectedTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    setSelectedTagIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(tag.id)) next.delete(tag.id); else next.add(tag.id);
                      return next;
                    });
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    active ? 'text-white border-transparent' : 'text-[var(--sg-navy)]/70 border-[var(--sg-border)] hover:bg-[var(--sg-offwhite)]'
                  }`}
                  style={active ? { backgroundColor: tag.color } : { backgroundColor: tag.color + '20' }}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--sg-navy)] mb-1.5">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
            placeholder="Full address"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-[var(--sg-navy)] mb-1.5">Latitude</label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className={`${inputClass}${isDragging ? ' opacity-50' : ''}`}
              placeholder="51.5007"
              disabled={isDragging}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--sg-navy)] mb-1.5">Longitude</label>
            <input
              type="text"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className={`${inputClass}${isDragging ? ' opacity-50' : ''}`}
              placeholder="-0.0962"
              disabled={isDragging}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--sg-navy)] mb-1.5">Visit Date</label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Move to another zone — only for existing places */}
        {initial && onMoveToZone && (
          <div className="pt-2 border-t border-[var(--sg-border)]">
            <label className="block text-sm font-semibold text-[var(--sg-navy)] mb-1.5">
              <ArrowRightLeft size={12} className="inline -mt-0.5 mr-1" />
              Move to zone
            </label>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value && initial.id) {
                  onMoveToZone(initial.id, e.target.value);
                }
              }}
              className={inputClass}
            >
              <option value="" disabled>Select zone...</option>
              {MANAGED_ZONES
                .filter(z => z !== initial.zone)
                .map(z => (
                  <option key={z} value={z}>
                    {ZONE_MAP[z]?.name ?? z}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Sticky buttons */}
      <div className="shrink-0 border-t border-[var(--sg-border)] pt-3 pb-1 flex gap-2 bg-white">
        <Button type="submit" className="flex-1" disabled={!hasChanges}>
          {initial ? 'Update Place' : 'Add Place'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
