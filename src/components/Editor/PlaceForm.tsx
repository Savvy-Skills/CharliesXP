import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import type { Place, PlaceCategory, Coordinates } from '../../types';
import { MarkerPicker, type CustomMarker } from './MarkerPicker';
import { Button } from '../ui/Button';
import { MANAGED_ZONES, ZONE_MAP } from '../../utils/zoneMapping';

interface PlaceFormProps {
  initial?: Place;
  coordinates?: Coordinates;
  currentView?: { zoom: number; pitch: number; bearing: number };
  onSubmit: (place: Omit<Place, 'id'> | Place) => void;
  onCancel: () => void;
  isDragging?: boolean;
  dragCoordinates?: { lng: number; lat: number } | null;
  onMoveToZone?: (placeId: string, zoneId: string) => void;
}

const inputClass = `w-full bg-white border border-[var(--sg-border)] rounded-xl px-3 py-2.5
  text-sm text-[var(--sg-navy)] placeholder-[var(--sg-navy)]/30
  focus:outline-none focus:border-[var(--sg-thames)] focus:ring-2 focus:ring-[var(--sg-thames)]/15
  transition-all duration-200`;

export function PlaceForm({ initial, coordinates, currentView, onSubmit, onCancel, isDragging = false, dragCoordinates, onMoveToZone }: PlaceFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<PlaceCategory>(initial?.category ?? 'other');
  const [customMarker, setCustomMarker] = useState<CustomMarker | undefined>(
    initial?.category === 'other' && initial?.markerIcon !== 'other'
      ? { name: initial.markerIcon, image: initial.markerImage }
      : undefined
  );
  const [address, setAddress] = useState(initial?.address ?? '');
  const [rating, setRating] = useState(initial?.rating ?? 3);
  const [visitDate, setVisitDate] = useState(initial?.visitDate ?? '');
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [lng, setLng] = useState(String(initial?.coordinates?.lng ?? coordinates?.lng ?? 0));
  const [lat, setLat] = useState(String(initial?.coordinates?.lat ?? coordinates?.lat ?? 0));

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
    return (
      name !== (initial.name ?? '') ||
      description !== (initial.description ?? '') ||
      category !== (initial.category ?? 'other') ||
      address !== (initial.address ?? '') ||
      rating !== (initial.rating ?? 3) ||
      visitDate !== (initial.visitDate ?? '') ||
      tags !== (initial.tags.join(', ') ?? '') ||
      lng !== String(initial.coordinates?.lng ?? 0) ||
      lat !== String(initial.coordinates?.lat ?? 0)
    );
  }, [name, description, category, address, rating, visitDate, tags, lng, lat, initial, dragCoordinates]);

  const handleSubmit = (e: FormEvent) => {
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
      rating,
      visitDate,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      zoom: currentView?.zoom ?? initial?.zoom ?? 16,
      pitch: currentView?.pitch ?? initial?.pitch ?? 50,
      bearing: currentView?.bearing ?? initial?.bearing ?? 0,
    };
    onSubmit(place);
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-[var(--sg-navy)] mb-1.5">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className={inputClass}
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</option>
              ))}
            </select>
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
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--sg-navy)] mb-1.5">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="coffee, paris, classic (comma-separated)"
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
