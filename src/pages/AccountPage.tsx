import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, CreditCard } from 'lucide-react';
import { PageShell } from '../components/Layout/PageShell';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ZONE_MAP } from '../utils/zoneMapping';
import type { Purchase } from '../types';

export function AccountPage() {
  const { isLoggedIn, loading: authLoading, profile, unlockedZones, zoneCredits, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<(Purchase & { package_name?: string })[]>([]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    supabase
      .from('purchases')
      .select('*, packages(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setPurchases(
            data.map((p: Record<string, unknown>) => ({
              ...(p as unknown as Purchase),
              package_name: (p.packages as { name: string } | null)?.name ?? 'Unknown',
            }))
          );
        }
      });
  }, [isLoggedIn, user]);

  if (authLoading) return null;
  if (!isLoggedIn) return null;

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/map" className="p-2 rounded-xl bg-[var(--sg-offwhite)] hover:bg-[var(--sg-border)] text-[var(--sg-navy)]/60 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-sm text-[var(--sg-navy)]/60">Back to map</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-[var(--sg-navy)] mb-2">My Account</h1>
        <p className="text-sm text-[var(--sg-navy)]/60 mb-8">{profile?.email}</p>

        {/* Unlocked Zones */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-bold text-[var(--sg-navy)] mb-4 flex items-center gap-2">
            <MapPin size={18} /> Unlocked Zones
          </h2>
          {unlockedZones.length === 0 ? (
            <p className="text-sm text-[var(--sg-navy)]/60">No zones unlocked yet. <Link to="/map" className="text-[var(--sg-crimson)]">Explore the map</Link></p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unlockedZones.map((zoneId) => (
                <Link
                  key={zoneId}
                  to={`/zone/${zoneId}`}
                  className="px-4 py-2 rounded-xl bg-[var(--sg-offwhite)] text-sm font-medium text-[var(--sg-navy)] hover:bg-[var(--sg-border)] transition-colors"
                >
                  {ZONE_MAP[zoneId]?.name || zoneId}
                </Link>
              ))}
            </div>
          )}
          {zoneCredits > 0 && (
            <p className="mt-3 text-sm text-[var(--sg-thames)] font-medium">
              {zoneCredits} zone credit{zoneCredits !== 1 ? 's' : ''} remaining — click a locked zone on the map to use them
            </p>
          )}
        </section>

        {/* Purchase History */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-bold text-[var(--sg-navy)] mb-4 flex items-center gap-2">
            <CreditCard size={18} /> Purchase History
          </h2>
          {purchases.length === 0 ? (
            <p className="text-sm text-[var(--sg-navy)]/60">No purchases yet.</p>
          ) : (
            <div className="space-y-3">
              {purchases.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-[var(--sg-offwhite)] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--sg-navy)]">{p.package_name}</p>
                    <p className="text-xs text-[var(--sg-navy)]/60">
                      {new Date(p.created_at).toLocaleDateString('en-GB')}
                      {p.zone_ids.length > 0 && ` — Zones: ${p.zone_ids.map(id => ZONE_MAP[id]?.name || id).join(', ')}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--sg-navy)]">
                    {'\u00A3'}{(p.amount_cents / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <button
          onClick={() => signOut()}
          className="text-sm text-[var(--sg-navy)]/60 hover:text-[var(--sg-crimson)] transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </PageShell>
  );
}
