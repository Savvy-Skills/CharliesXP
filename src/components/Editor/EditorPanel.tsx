import { useState, useEffect, useRef } from 'react';
import { Trash2, Edit3, X } from 'lucide-react';
import type { Place, Coordinates } from '../../types';
import { CATEGORIES } from '../../types';
import { PlaceForm } from './PlaceForm';

interface EditorPanelProps {
  places: Place[];
  pendingCoordinates: Coordinates | null;
  currentView: { zoom: number; pitch: number; bearing: number };
  onAdd: (place: Omit<Place, 'id'>) => Promise<string | null> | string | null | void;
  onUpdate: (id: string, updates: Partial<Place>) => void;
  onDelete: (id: string) => void;
  onCancelPending: () => void;
  onPlaceClick: (place: Place) => void;
  /** When set, opens the edit form for this place. Use a unique value (e.g. id + timestamp) to re-trigger for the same place. */
  editPlaceKey?: string | null;
  isDragging?: boolean;
  dragCoordinates?: { lng: number; lat: number } | null;
  onDragComplete?: () => void;
  onMoveToZone?: (placeId: string, zoneId: string) => void;
  onSaveTags?: (placeId: string, tagIds: string[]) => Promise<void> | void;
}

export function EditorPanel({
  places,
  pendingCoordinates,
  currentView,
  onAdd,
  onUpdate,
  onDelete,
  onCancelPending,
  onPlaceClick,
  editPlaceKey,
  isDragging = false,
  dragCoordinates,
  onDragComplete,
  onMoveToZone,
  onSaveTags,
}: EditorPanelProps) {
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const placesRef = useRef(places);
  placesRef.current = places;

  // Open edit form when a place is clicked on the map
  // Only reacts to editPlaceKey changes — uses ref for places to avoid
  // re-opening the form when places array changes (e.g. after drag revert)
  useEffect(() => {
    if (!editPlaceKey) return;
    const id = editPlaceKey.split('::')[0];
    const place = placesRef.current.find(p => p.id === id);
    if (place) setEditingPlace(place);
  }, [editPlaceKey]);

  const showForm = pendingCoordinates !== null || editingPlace !== null;

  return (
    <div className="h-full w-full bg-white border-r border-[var(--sg-border)] flex flex-col overflow-hidden">
      {/* Content */}
      {showForm ? (
        /* Form mode — PlaceForm handles its own scroll + sticky buttons */
        <div className="flex-1 flex flex-col overflow-hidden px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-sm font-semibold text-[var(--sg-navy)]">
              {editingPlace ? 'Edit Place' : 'New Place'}
            </h3>
            <button
              onClick={() => {
                setEditingPlace(null);
                onCancelPending();
                onDragComplete?.();
              }}
              className="p-1.5 hover:bg-[var(--sg-offwhite)] rounded-lg cursor-pointer transition-colors"
            >
              <X size={16} className="text-[var(--sg-navy)]/40" />
            </button>
          </div>
          <PlaceForm
            initial={editingPlace ?? undefined}
            coordinates={pendingCoordinates ?? undefined}
            currentView={currentView}
            isDragging={isDragging}
            dragCoordinates={dragCoordinates}
            onSaveTags={onSaveTags}
            onSubmit={async (place) => {
              let savedId: string | null = null;
              if ('id' in place && place.id) {
                onUpdate(place.id, place);
                savedId = place.id;
              } else {
                const result = await onAdd(place as Omit<Place, 'id'>);
                savedId = typeof result === 'string' ? result : null;
              }
              setEditingPlace(null);
              onCancelPending();
              onDragComplete?.();
              return savedId;
            }}
            onCancel={() => {
              setEditingPlace(null);
              onCancelPending();
              onDragComplete?.();
            }}
            onMoveToZone={onMoveToZone ? (placeId, zoneId) => {
              setEditingPlace(null);
              onCancelPending();
              onDragComplete?.();
              onMoveToZone(placeId, zoneId);
            } : undefined}
          />
        </div>
      ) : (
        /* List mode — scrollable list */
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <p className="text-xs text-[var(--sg-navy)]/50 mb-4">
            Click on the map to add a new place, or edit existing ones below.
          </p>

          {places.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--sg-navy)]/40">No places in this zone yet.</p>
              <p className="text-xs text-[var(--sg-navy)]/30 mt-1">Click on the map to add one!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {places.map((place) => {
                const cat = CATEGORIES.find((c) => c.value === place.category);
                return (
                  <div
                    key={place.id}
                    className="flex items-center gap-3 p-3 rounded-xl
                      hover:bg-[var(--sg-offwhite)] transition-colors group"
                  >
                    <button
                      onClick={() => onPlaceClick(place)}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-full shrink-0"
                        style={{ backgroundColor: cat?.color ?? '#6b7280' }}
                        aria-label={cat?.label ?? 'Place'}
                      />
                      <span className="sr-only">{cat?.label ?? place.category}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--sg-navy)] truncate">
                          {place.name}
                        </p>
                        <p className="text-xs text-[var(--sg-navy)]/40 truncate">{place.address}</p>
                        <p className="text-[10px] text-[var(--sg-navy)]/30 font-mono mt-0.5">
                          {place.coordinates.lat.toFixed(4)}, {place.coordinates.lng.toFixed(4)}
                        </p>
                      </div>
                    </button>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingPlace(place)}
                        className="p-1.5 hover:bg-[var(--sg-border)] rounded-lg cursor-pointer transition-colors"
                      >
                        <Edit3 size={14} className="text-[var(--sg-navy)]/40" />
                      </button>
                      <button
                        onClick={() => onDelete(place.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
