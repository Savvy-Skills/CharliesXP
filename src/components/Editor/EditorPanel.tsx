import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Trash2, Edit3, X } from 'lucide-react';
import type { Place, Coordinates } from '../../types';
import { CATEGORIES } from '../../types';
import { CATEGORY_EMOJI } from '../../utils/mapStyles';
import { PlaceForm } from './PlaceForm';
import { Button } from '../ui/Button';

interface EditorPanelProps {
  places: Place[];
  pendingCoordinates: Coordinates | null;
  currentView: { zoom: number; pitch: number; bearing: number };
  onAdd: (place: Omit<Place, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Place>) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onCancelPending: () => void;
  onPlaceClick: (place: Place) => void;
}

export function EditorPanel({
  places,
  pendingCoordinates,
  currentView,
  onAdd,
  onUpdate,
  onDelete,
  onExport,
  onCancelPending,
  onPlaceClick,
}: EditorPanelProps) {
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  const showForm = pendingCoordinates !== null || editingPlace !== null;

  return (
    <div className="h-full w-full bg-white border-r border-[var(--sg-border)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--sg-border)] flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-[var(--sg-navy)]">
          Editor
        </h2>
        <Button size="sm" variant="secondary" onClick={onExport}>
          <Download size={14} className="mr-1 inline" />
          Export
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--sg-navy)]">
                  {editingPlace ? 'Edit Place' : 'New Place'}
                </h3>
                <button
                  onClick={() => {
                    setEditingPlace(null);
                    onCancelPending();
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
                onSubmit={(place) => {
                  if ('id' in place && place.id) {
                    onUpdate(place.id, place);
                  } else {
                    onAdd(place as Omit<Place, 'id'>);
                  }
                  setEditingPlace(null);
                  onCancelPending();
                }}
                onCancel={() => {
                  setEditingPlace(null);
                  onCancelPending();
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
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
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                            style={{ backgroundColor: cat?.color ?? '#6b7280' }}
                          >
                            {CATEGORY_EMOJI[place.category]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--sg-navy)] truncate">
                              {place.name}
                            </p>
                            <p className="text-xs text-[var(--sg-navy)]/40 truncate">{place.address}</p>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
