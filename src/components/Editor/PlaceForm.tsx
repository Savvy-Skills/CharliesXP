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

export function PlaceForm({ initial, coordinates, currentView, onSubmit, onCancel }: PlaceFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<PlaceCategory>(initial?.category ?? 'other');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [rating, setRating] = useState(initial?.rating ?? 3);
  const [visitDate, setVisitDate] = useState(initial?.visitDate ?? '');
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const place = {
      ...(initial ? { id: initial.id } : {}),
      name,
      description,
      category,
      coordinates: initial?.coordinates ?? coordinates ?? { lng: 0, lat: 0 },
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

  const inputClass = `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2
    text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[var(--sg-thames)]
    focus:ring-1 focus:ring-[var(--sg-thames)]/30`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Place name"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} min-h-[80px] resize-y`}
          placeholder="What makes this place special?"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Category & Marker</label>
        <MarkerPicker value={category} onChange={setCategory} />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Address</label>
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
          <label className="block text-xs font-medium text-slate-400 mb-1">Rating</label>
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
          <label className="block text-xs font-medium text-slate-400 mb-1">Visit Date</label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Tags</label>
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
