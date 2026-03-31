import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageShell } from '../components/Layout/PageShell';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Profile, Purchase } from '../types';

type Tab = 'places' | 'users' | 'purchases';

interface AdminPlace {
  id: string;
  name: string;
  zone_id: string;
  category: string;
  rating: number | null;
}

export function AdminPage() {
  const { isLoggedIn, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('places');
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [purchases, setPurchases] = useState<(Purchase & { email?: string })[]>([]);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || !isAdmin)) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isLoggedIn, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    if (tab === 'places') {
      supabase.from('places').select('id, name, zone_id, category, rating').order('zone_id').then(({ data }) => {
        if (data) setPlaces(data as AdminPlace[]);
      });
    } else if (tab === 'users') {
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setUsers(data as Profile[]);
      });
    } else if (tab === 'purchases') {
      supabase.from('purchases').select('*, profiles(email)').order('created_at', { ascending: false }).then(({ data }) => {
        if (data) {
          setPurchases(
            data.map((p: Record<string, unknown>) => ({
              ...(p as unknown as Purchase),
              email: (p.profiles as { email: string } | null)?.email ?? 'Unknown',
            }))
          );
        }
      });
    }
  }, [isAdmin, tab]);

  if (authLoading || !isAdmin) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'places', label: 'Places' },
    { key: 'users', label: 'Users' },
    { key: 'purchases', label: 'Purchases' },
  ];

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-[var(--sg-navy)] mb-6">Admin Dashboard</h1>

        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                tab === t.key
                  ? 'bg-[var(--sg-crimson)] text-white'
                  : 'bg-[var(--sg-offwhite)] text-[var(--sg-navy)] hover:bg-[var(--sg-border)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'places' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--sg-navy)]/60 mb-4">{places.length} places</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--sg-navy)]/60 border-b border-[var(--sg-border)]">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Zone</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {places.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--sg-border)]/50">
                      <td className="py-2 pr-4 font-medium text-[var(--sg-navy)]">{p.name}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">{p.zone_id}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">{p.category}</td>
                      <td className="py-2 text-[var(--sg-navy)]/60">{p.rating ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--sg-navy)]/60 mb-4">{users.length} users</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--sg-navy)]/60 border-b border-[var(--sg-border)]">
                  <tr>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--sg-border)]/50">
                      <td className="py-2 pr-4 font-medium text-[var(--sg-navy)]">{u.email}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">{u.role}</td>
                      <td className="py-2 text-[var(--sg-navy)]/60">
                        {new Date(u.created_at).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'purchases' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--sg-navy)]/60 mb-4">{purchases.length} purchases</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--sg-navy)]/60 border-b border-[var(--sg-border)]">
                  <tr>
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Zones</th>
                    <th className="py-2 pr-4">Credits Left</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--sg-border)]/50">
                      <td className="py-2 pr-4 font-medium text-[var(--sg-navy)]">{p.email}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">{'\u00A3'}{(p.amount_cents / 100).toFixed(2)}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">{p.zone_ids.join(', ') || '—'}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">{p.zone_credits}</td>
                      <td className="py-2 text-[var(--sg-navy)]/60">
                        {new Date(p.created_at).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
