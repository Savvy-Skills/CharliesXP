import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface UserState {
  isLoggedIn: boolean;
  unlockedZones: string[];
}

interface UserContextValue extends UserState {
  login: () => void;
  logout: () => void;
  unlockZone: (zoneId: string) => void;
  isZoneUnlocked: (zoneId: string) => boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>({
    isLoggedIn: false,
    unlockedZones: [],
  });

  const login = useCallback(() => {
    setState((prev) => ({ ...prev, isLoggedIn: true }));
  }, []);

  const logout = useCallback(() => {
    setState({ isLoggedIn: false, unlockedZones: [] });
  }, []);

  const unlockZone = useCallback((zoneId: string) => {
    setState((prev) => ({
      ...prev,
      isLoggedIn: true,
      unlockedZones: prev.unlockedZones.includes(zoneId)
        ? prev.unlockedZones
        : [...prev.unlockedZones, zoneId],
    }));
  }, []);

  const isZoneUnlocked = useCallback(
    (zoneId: string) => state.unlockedZones.includes(zoneId),
    [state.unlockedZones],
  );

  return (
    <UserContext.Provider value={{ ...state, login, logout, unlockZone, isZoneUnlocked }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
