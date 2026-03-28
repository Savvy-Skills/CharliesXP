import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, Trash2, Edit3, X, ChevronLeft } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const showForm = pendingCoordinates !== null || editingPlace !== null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: isCollapsed ? 'calc(100% - 40px)' : 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute top-0 right-0 bottom-0 w-full sm:w-96 z-30
        bg-[#1e1e2e]/95 backdrop-blur-md border-l border-white/10 shadow-2xl
        flex flex-col"
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-10 top-4 w-10 h-10 bg-[#1e1e2e]/95
          backdrop-blur-md rounded-l-lg flex items-center justify-center
          hover:bg-white/10 transition-colors cursor-pointer border border-white/10 border-r-0"
      >
        <ChevronLeft
          size={18}
          className={`text-white transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
        />
      </button>

      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white">Editor</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onExport}>
            <Download size={14} className="mr-1 inline" />
            Export
          </Button>
        </div>
      </div>

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
                <h3 className="text-sm font-semibold text-white">
                  {editingPlace ? 'Edit Place' : 'New Place'}
                </h3>
                <button
                  onClick={() => {
                    setEditingPlace(null);
                    onCancelPending();
                  }}
                  className="p-1 hover:bg-white/10 rounded cursor-pointer"
                >
                  <X size={16} className="text-slate-400" />
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
              <p className="text-xs text-slate-400 mb-4">
                Click on the map to add a new place, or edit existing ones below.
              </p>

              {places.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No places yet. Click on the map to add one!
                </p>
              ) : (
                <div className="space-y-2">
                  {places.map((place) => {
                    const cat = CATEGORIES.find((c) => c.value === place.category);
                    return (
                      <div
                        key={place.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5
                          hover:bg-white/10 transition-colors group"
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
                            <p className="text-sm font-medium text-white truncate">
                              {place.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{place.address}</p>
                          </div>
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingPlace(place)}
                            className="p-1.5 hover:bg-white/10 rounded cursor-pointer"
                          >
                            <Edit3 size={14} className="text-slate-400" />
                          </button>
                          <button
                            onClick={() => onDelete(place.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded cursor-pointer"
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
    </motion.div>
  );
}
