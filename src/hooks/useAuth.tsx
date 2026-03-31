import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  unlockedZones: string[];
  zoneCredits: number;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isZoneUnlocked: (zoneId: string) => boolean;
  refreshAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unlockedZones, setUnlockedZones] = useState<string[]>([]);
  const [zoneCredits, setZoneCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    const [profileRes, zonesRes, creditsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_zones').select('zone_id').eq('user_id', userId),
      supabase
        .from('purchases')
        .select('zone_credits')
        .eq('user_id', userId)
        .gt('zone_credits', 0),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (zonesRes.data) setUnlockedZones(zonesRes.data.map((r) => r.zone_id));
    if (creditsRes.data) {
      const total = creditsRes.data.reduce((sum, r) => sum + r.zone_credits, 0);
      setZoneCredits(total);
    }
  }, []);

  const clearUserData = useCallback(() => {
    setProfile(null);
    setUnlockedZones([]);
    setZoneCredits(0);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchUserData(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchUserData(s.user.id);
      else clearUserData();
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData, clearUserData]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearUserData();
  }, [clearUserData]);

  const isZoneUnlocked = useCallback(
    (zoneId: string) => profile?.role === 'admin' || unlockedZones.includes(zoneId),
    [unlockedZones, profile],
  );

  const refreshAccess = useCallback(async () => {
    if (user) await fetchUserData(user.id);
  }, [user, fetchUserData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoggedIn: !!user,
        isAdmin: profile?.role === 'admin',
        unlockedZones,
        zoneCredits,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        isZoneUnlocked,
        refreshAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
