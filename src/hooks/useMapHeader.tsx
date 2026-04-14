import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface MapHeaderValue {
  isMapMode: boolean;
  isEditorMode: boolean;
  editorTab: 'places' | 'zones' | 'landmarks';
  onEditorTabChange: (tab: 'places' | 'zones' | 'landmarks') => void;
  onCollapse: () => void;
  activeZone: string | null;
}

const MapHeaderContext = createContext<MapHeaderValue | null>(null);

export function MapHeaderProvider({
  value,
  children,
}: {
  value: MapHeaderValue;
  children: ReactNode;
}) {
  return (
    <MapHeaderContext.Provider value={value}>
      {children}
    </MapHeaderContext.Provider>
  );
}

export function useMapHeader(): MapHeaderValue | null {
  return useContext(MapHeaderContext);
}
