import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ZONES } from '../../utils/zoneMapping';

interface ZoneListPanelProps {
  enabledZoneIds: string[];
  onToggleZone: (zoneId: string, enabled: boolean) => void;
  placeCounts: Record<string, number>;
  onZoneClick: (zoneId: string) => void;
}

interface ConfirmDialog {
  zoneId: string;
  placeCount: number;
}

export function ZoneListPanel({
  enabledZoneIds,
  onToggleZone,
  placeCounts,
  onZoneClick,
}: ZoneListPanelProps) {
  const [search, setSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

  const filteredZones = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ZONES;
    return ZONES.filter(
      (z) =>
        z.id.toLowerCase().includes(q) ||
        z.name.toLowerCase().includes(q) ||
        z.postcode.toLowerCase().includes(q),
    );
  }, [search]);

  const enabledCount = enabledZoneIds.length;
  const totalCount = ZONES.length;

  function handleToggle(zoneId: string, currentlyEnabled: boolean) {
    if (currentlyEnabled) {
      // Disabling — check if zone has places
      const count = placeCounts[zoneId] ?? 0;
      if (count > 0) {
        setConfirmDialog({ zoneId, placeCount: count });
        return;
      }
    }
    onToggleZone(zoneId, !currentlyEnabled);
  }

  function handleConfirmDisable() {
    if (!confirmDialog) return;
    onToggleZone(confirmDialog.zoneId, false);
    setConfirmDialog(null);
  }

  return (
    <div className="h-full w-full bg-white border-r border-[var(--sg-border)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0 border-b border-[var(--sg-border)]">
        {/* Search input */}
        <div className="relative mb-2">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sg-navy)]/30 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search zones…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-[var(--sg-offwhite)] border border-[var(--sg-border)] rounded-lg
              text-[var(--sg-navy)] placeholder-[var(--sg-navy)]/30 focus:outline-none focus:ring-1
              focus:ring-[var(--sg-thames)] focus:border-[var(--sg-thames)] transition-colors"
          />
        </div>

        {/* Summary */}
        <p className="text-xs text-[var(--sg-navy)]/50">
          <span className="font-semibold text-[var(--sg-navy)]/70">{enabledCount} enabled</span>
          {' / '}
          {totalCount} total
        </p>
      </div>

      {/* Zone list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {filteredZones.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-[var(--sg-navy)]/40">No zones match your search.</p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {filteredZones.map((zone) => {
              const isEnabled = enabledZoneIds.includes(zone.id);
              const count = placeCounts[zone.id] ?? 0;
              const dotColor = isEnabled ? zone.color : '#d1d5db';

              return (
                <div
                  key={zone.id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[var(--sg-offwhite)] transition-colors group"
                >
                  {/* Color dot */}
                  <div
                    className="w-3 h-3 rounded-full shrink-0 transition-colors"
                    style={{ backgroundColor: dotColor }}
                  />

                  {/* Zone name (clickable) */}
                  <button
                    onClick={() => onZoneClick(zone.id)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span
                      className={`text-sm font-medium truncate block transition-colors ${
                        isEnabled
                          ? 'text-[var(--sg-navy)]'
                          : 'text-[var(--sg-navy)]/40'
                      }`}
                    >
                      {zone.name}
                    </span>
                  </button>

                  {/* Place count badge */}
                  {count > 0 && (
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        color: 'var(--sg-thames)',
                        backgroundColor: 'color-mix(in srgb, var(--sg-thames) 12%, transparent)',
                      }}
                    >
                      {count}
                    </span>
                  )}

                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(zone.id, isEnabled)}
                    role="switch"
                    aria-checked={isEnabled}
                    aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${zone.name}`}
                    className="shrink-0 cursor-pointer focus:outline-none"
                  >
                    <div
                      className="relative transition-colors duration-200 rounded-full"
                      style={{
                        width: 32,
                        height: 18,
                        backgroundColor: isEnabled ? 'var(--sg-thames)' : undefined,
                      }}
                      data-enabled={isEnabled}
                    >
                      {/* Track */}
                      <div
                        className={`absolute inset-0 rounded-full transition-colors duration-200 ${
                          isEnabled ? '' : 'bg-gray-300'
                        }`}
                        style={isEnabled ? { backgroundColor: 'var(--sg-thames)' } : {}}
                      />
                      {/* Thumb */}
                      <div
                        className="absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-200"
                        style={{
                          transform: isEnabled ? 'translateX(16px)' : 'translateX(2px)',
                        }}
                      />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation dialog overlay */}
      {confirmDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl mx-4 p-5 max-w-xs w-full">
            <h4 className="text-sm font-semibold text-[var(--sg-navy)] mb-2">
              Disable {confirmDialog.zoneId}?
            </h4>
            <p className="text-xs text-[var(--sg-navy)]/60 leading-relaxed mb-5">
              This zone has {confirmDialog.placeCount} place
              {confirmDialog.placeCount !== 1 ? 's' : ''}. Disabling will hide them from users. No
              data will be lost.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-3 py-1.5 text-xs font-medium text-[var(--sg-navy)]/60 hover:text-[var(--sg-navy)]
                  hover:bg-[var(--sg-offwhite)] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisable}
                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg cursor-pointer transition-colors"
                style={{ backgroundColor: 'var(--sg-crimson)' }}
              >
                Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
