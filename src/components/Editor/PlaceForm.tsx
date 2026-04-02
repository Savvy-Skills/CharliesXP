import { useState, type FormEvent } from 'react';
import type { Place, PlaceCategory, Coordinates } from '../../types';
import { MarkerPicker } from './MarkerPicker';
import { Button } from '../ui/Button';

interface PlaceFormProps {
  initial?: Place;
  coordinates?: Coordinates;
  currentView?: { zoom: number; pitch: number; bearing: number };
  onSubmit: (place: Omit<Place, 'id'> | Place) => void;
  onCancel: () => void;
}

const inputClass = `w-full bg-white border border-[var(--sg-border)] rounded-xl px-3 py-2.5
  text-sm text-[var(--sg-navy)] placeholder-[var(--sg-navy)]/30
  focus:outline-none focus:border-[var(--sg-thames)] focus:ring-2 focus:ring-[var(--sg-thames)]/15
  transition-all duration-200`;

export function PlaceForm({ initial, coordinates, currentView, onSubmit, onCancel }: PlaceFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<PlaceCategory>(initial?.category ?? 'other');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [rating, setRating] = useState(initial?.rating ?? 3);
  const [visitDate, setVisitDate] = useState(initial?.visitDate ?? '');
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [lng, setLng] = useState(String(initial?.coordinates?.lng ?? coordinates?.lng ?? 0));
  const [lat, setLat] = useState(String(initial?.coordinates?.lat ?? coordinates?.lat ?? 0));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const place = {
      ...(initial ? { id: initial.id } : {}),
      name,
      description,
      category,
      coordinates: { lng: parseFloat(lng) || 0, lat: parseFloat(lat) || 0 },
      address,
      markerIcon: category,
      markerImage: `/markers/${category}.png`,
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <MarkerPicker value={category} onChange={setCategory} />
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
            className={inputClass}
            placeholder="51.5007"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--sg-navy)] mb-1.5">Longitude</label>
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className={inputClass}
            placeholder="-0.0962"
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

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {initial ? 'Update Place' : 'Add Place'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
