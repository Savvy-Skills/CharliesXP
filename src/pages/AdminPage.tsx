import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, MapPin, Pencil, Trash2, X } from 'lucide-react';
import { PageShell } from '../components/Layout/PageShell';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ZONES } from '../utils/zoneMapping';
import type { Profile, Purchase } from '../types';
import { CATEGORIES } from '../types';

type Tab = 'places' | 'users' | 'purchases';

interface AdminPlace {
  id: string;
  name: string;
  description: string;
  zone_id: string;
  category: string;
  rating: number | null;
  placed: boolean;
  active: boolean;
}

interface PlaceForm {
  name: string;
  description: string;
  category: string;
  zone_id: string;
}

const EMPTY_FORM: PlaceForm = { name: '', description: '', category: 'restaurant', zone_id: '' };

export function AdminPage() {
  const { isLoggedIn, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('places');
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [purchases, setPurchases] = useState<(Purchase & { email?: string })[]>([]);
  const [showForm, setShowForm] = useState<null | 'create' | string>(null);
  const [form, setForm] = useState<PlaceForm>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || !isAdmin)) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isLoggedIn, isAdmin, navigate]);

  const fetchPlaces = () => {
    supabase
      .from('places')
      .select('id, name, description, zone_id, category, rating, placed, active')
      .order('zone_id')
      .then(({ data }) => {
        if (data) setPlaces(data as AdminPlace[]);
      });
  };

  useEffect(() => {
    if (!isAdmin) return;

    if (tab === 'places') {
      fetchPlaces();
    } else if (tab === 'users') {
      supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setUsers(data as Profile[]);
        });
    } else if (tab === 'purchases') {
      supabase
        .from('purchases')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) {
            setPurchases(
              data.map((p: Record<string, unknown>) => ({
                ...(p as unknown as Purchase),
                email: (p.profiles as { email: string } | null)?.email ?? 'Unknown',
              })),
            );
          }
        });
    }
  }, [isAdmin, tab]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm('create');
  };

  const openEdit = (place: AdminPlace) => {
    setForm({
      name: place.name,
      description: place.description,
      category: place.category,
      zone_id: place.zone_id,
    });
    setShowForm(place.id);
  };

  const closeForm = () => {
    setShowForm(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.zone_id) {
      alert('Name, description, and zone are required');
      return;
    }
    setSaving(true);

    if (showForm === 'create') {
      const { error } = await supabase.from('places').insert({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        zone_id: form.zone_id,
        placed: false,
        active: true,
      });
      if (error) {
        console.error('Insert error:', error);
        alert(`Failed to create place: ${error.message}`);
        setSaving(false);
        return;
      }
    } else if (showForm) {
      const { error } = await supabase
        .from('places')
        .update({
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          zone_id: form.zone_id,
        })
        .eq('id', showForm);
      if (error) {
        console.error('Update error:', error);
        alert(`Failed to update place: ${error.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    closeForm();
    fetchPlaces();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('places').delete().eq('id', id);
    setDeleting(null);
    fetchPlaces();
  };

  if (authLoading || !isAdmin) return null;

  const unplacedPlaces = places.filter((p) => !p.placed);
  const allPlaces = places;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'places', label: 'Places' },
    { key: 'users', label: 'Users' },
    { key: 'purchases', label: 'Purchases' },
  ];

  const zoneName = (zoneId: string | null) => {
    if (!zoneId) return '—';
    const zone = ZONES.find((z) => z.id === zoneId);
    return zone?.name ?? zoneId;
  };

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-[var(--sg-navy)] mb-6">
          Admin Dashboard
        </h1>

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
          <div className="space-y-6">
            {/* Add Place button */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--sg-navy)]/60">{places.length} places total</p>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--sg-crimson)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus size={16} /> Add Place
              </button>
            </div>

            {/* Add / Edit form */}
            {showForm && (
              <div className="rounded-xl border border-[var(--sg-border)] bg-white p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-[var(--sg-navy)]">
                    {showForm === 'create' ? 'Add Place' : 'Edit Place'}
                  </h2>
                  <button
                    onClick={closeForm}
                    className="text-[var(--sg-navy)]/40 hover:text-[var(--sg-navy)] cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--sg-border)] px-3 py-2 text-sm text-[var(--sg-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--sg-crimson)]/30"
                      placeholder="Place name"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-[var(--sg-border)] px-3 py-2 text-sm text-[var(--sg-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--sg-crimson)]/30 resize-none"
                      placeholder="Place description"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--sg-border)] px-3 py-2 text-sm text-[var(--sg-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--sg-crimson)]/30"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">
                      Zone
                    </label>
                    <select
                      value={form.zone_id}
                      onChange={(e) => setForm((f) => ({ ...f, zone_id: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--sg-border)] px-3 py-2 text-sm text-[var(--sg-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--sg-crimson)]/30"
                    >
                      <option value="">— No zone —</option>
                      {ZONES.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.name.trim() || !form.description.trim()}
                    className="px-4 py-2 rounded-xl bg-[var(--sg-crimson)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={closeForm}
                    className="px-4 py-2 rounded-xl bg-[var(--sg-offwhite)] text-[var(--sg-navy)] text-sm font-medium hover:bg-[var(--sg-border)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Unplaced Places */}
            {unplacedPlaces.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[var(--sg-crimson)] mb-2">
                  Unplaced Places ({unplacedPlaces.length})
                </h2>
                <div className="overflow-x-auto rounded-xl border border-[var(--sg-crimson)]/20 bg-[var(--sg-crimson)]/5">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[var(--sg-navy)]/60 border-b border-[var(--sg-border)]">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Zone</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unplacedPlaces.map((p) => (
                        <tr key={p.id} className="border-b border-[var(--sg-border)]/30">
                          <td className="py-2 px-3 font-medium text-[var(--sg-navy)]">{p.name}</td>
                          <td className="py-2 px-3 text-[var(--sg-navy)]/60">{p.category}</td>
                          <td className="py-2 px-3 text-[var(--sg-navy)]/60">
                            {zoneName(p.zone_id)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {deleting === p.id ? (
                              <span className="inline-flex items-center gap-2 text-xs">
                                <span className="text-[var(--sg-crimson)]">Delete {p.name}?</span>
                                <button
                                  onClick={() => handleDelete(p.id)}
                                  className="text-[var(--sg-crimson)] font-semibold hover:underline cursor-pointer"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setDeleting(null)}
                                  className="text-[var(--sg-navy)]/60 hover:underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    navigate(`/map?editor=true&placeId=${p.id}&zone=${p.zone_id}`)
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--sg-thames)] text-white text-xs font-medium hover:opacity-90 cursor-pointer"
                                  title="Place on Map"
                                >
                                  <MapPin size={12} /> Place
                                </button>
                                <button
                                  onClick={() => openEdit(p)}
                                  className="p-1 rounded-lg text-[var(--sg-navy)]/40 hover:text-[var(--sg-navy)] hover:bg-[var(--sg-border)] cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => setDeleting(p.id)}
                                  className="p-1 rounded-lg text-[var(--sg-navy)]/40 hover:text-[var(--sg-crimson)] hover:bg-[var(--sg-crimson)]/10 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* All Places */}
            <div>
              <h2 className="text-sm font-semibold text-[var(--sg-navy)] mb-2">
                All Places ({allPlaces.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[var(--sg-navy)]/60 border-b border-[var(--sg-border)]">
                    <tr>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Zone</th>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Rating</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPlaces.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--sg-border)]/50">
                        <td className="py-2 pr-4 font-medium text-[var(--sg-navy)]">
                          {p.name}
                          {!p.placed && (
                            <span className="ml-1.5 inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[var(--sg-crimson)]/10 text-[var(--sg-crimson)]">
                              unplaced
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-[var(--sg-navy)]/60">
                          {zoneName(p.zone_id)}
                        </td>
                        <td className="py-2 pr-4 text-[var(--sg-navy)]/60">{p.category}</td>
                        <td className="py-2 pr-4 text-[var(--sg-navy)]/60">
                          {p.rating ?? '—'}
                        </td>
                        <td className="py-2 text-right">
                          {deleting === p.id ? (
                            <span className="inline-flex items-center gap-2 text-xs">
                              <span className="text-[var(--sg-crimson)]">Delete {p.name}?</span>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="text-[var(--sg-crimson)] font-semibold hover:underline cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleting(null)}
                                className="text-[var(--sg-navy)]/60 hover:underline cursor-pointer"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => navigate(`/map?editor=true&placeId=${p.id}&zone=${p.zone_id}`)}
                                className="p-1 rounded-lg text-[var(--sg-navy)]/40 hover:text-[var(--sg-thames)] hover:bg-[var(--sg-thames)]/10 cursor-pointer"
                                title="View on Map"
                              >
                                <MapPin size={14} />
                              </button>
                              <button
                                onClick={() => openEdit(p)}
                                className="p-1 rounded-lg text-[var(--sg-navy)]/40 hover:text-[var(--sg-navy)] hover:bg-[var(--sg-border)] cursor-pointer"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleting(p.id)}
                                className="p-1 rounded-lg text-[var(--sg-navy)]/40 hover:text-[var(--sg-crimson)] hover:bg-[var(--sg-crimson)]/10 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">
                        {'\u00A3'}
                        {(p.amount_cents / 100).toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">
                        {p.zone_ids.join(', ') || '—'}
                      </td>
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
