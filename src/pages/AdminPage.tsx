import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, MapPin, Pencil, Trash2, X, ChevronDown, ChevronUp, Ban } from 'lucide-react';
import { PageShell } from '../components/Layout/PageShell';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ZONES } from '../utils/zoneMapping';
import type { Profile, Purchase } from '../types';
import { CATEGORIES } from '../types';

type Tab = 'places' | 'zones' | 'landmarks' | 'users' | 'purchases' | 'packages';

interface AdminPackage {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  benefits: Record<string, unknown>;
  stripe_price_id: string | null;
  active: boolean;
}

interface PackageForm {
  slug: string;
  name: string;
  price_cents: number;
  benefits_zone_count: string;
  benefits_unlock_all: boolean;
  active: boolean;
}

const EMPTY_PKG_FORM: PackageForm = {
  slug: '', name: '', price_cents: 300, benefits_zone_count: '1', benefits_unlock_all: false, active: true,
};

interface AdminPlace {
  id: string;
  name: string;
  description: string;
  zone_id: string;
  category: string;
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

interface AdminLandmark {
  id: string;
  name: string;
  zone_id: string;
  coordinates: { lng: number; lat: number };
  icon: string;
  min_zoom: number;
}

interface LandmarkForm {
  name: string;
  zone_id: string;
  min_zoom: number;
  lng: string;
  lat: string;
}

const EMPTY_LM_FORM: LandmarkForm = { name: '', zone_id: '', min_zoom: 14, lng: '', lat: '' };

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

  // Packages state
  const [adminPackages, setAdminPackages] = useState<AdminPackage[]>([]);
  const [showPkgForm, setShowPkgForm] = useState<null | 'create' | string>(null);
  const [pkgForm, setPkgForm] = useState<PackageForm>(EMPTY_PKG_FORM);
  const [pkgSaving, setPkgSaving] = useState(false);

  // Zones state
  const [enabledZoneIds, setEnabledZoneIds] = useState<Set<string>>(new Set());
  const [zoneTogglingId, setZoneTogglingId] = useState<string | null>(null);
  const [zonePlaceCounts, setZonePlaceCounts] = useState<Record<string, number>>({});

  // Landmarks state
  const [adminLandmarks, setAdminLandmarks] = useState<AdminLandmark[]>([]);
  const [showLmForm, setShowLmForm] = useState<null | 'create' | string>(null);
  const [lmForm, setLmForm] = useState<LandmarkForm>(EMPTY_LM_FORM);
  const [lmSaving, setLmSaving] = useState(false);
  const [lmDeleting, setLmDeleting] = useState<string | null>(null);

  // User management state
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userZones, setUserZones] = useState<{ zone_id: string; expires_at: string; purchase_id: string }[]>([]);
  const [userPurchases, setUserPurchases] = useState<{ id: string; amount_cents: number; zone_ids: string[]; zone_credits: number; created_at: string }[]>([]);

  const fetchUserDetails = async (userId: string) => {
    const [zonesRes, purchasesRes] = await Promise.all([
      supabase.from('user_zones').select('zone_id, expires_at, purchase_id').eq('user_id', userId),
      supabase.from('purchases').select('id, amount_cents, zone_ids, zone_credits, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    if (zonesRes.data) setUserZones(zonesRes.data);
    if (purchasesRes.data) setUserPurchases(purchasesRes.data);
  };

  const toggleUserExpand = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      fetchUserDetails(userId);
    }
  };

  const expireUserZone = async (userId: string, zoneId: string) => {
    await supabase.from('user_zones').update({ expires_at: new Date().toISOString() }).eq('user_id', userId).eq('zone_id', zoneId);
    fetchUserDetails(userId);
  };

  const expireAllUserZones = async (userId: string) => {
    await supabase.from('user_zones').update({ expires_at: new Date().toISOString() }).eq('user_id', userId);
    fetchUserDetails(userId);
  };

  const deleteAllUserPurchases = async (userId: string) => {
    if (!confirm('Delete all purchases and zone access for this user? This cannot be undone.')) return;
    await supabase.from('user_zones').delete().eq('user_id', userId);
    await supabase.from('purchases').delete().eq('user_id', userId);
    setUserZones([]);
    setUserPurchases([]);
  };

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || !isAdmin)) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isLoggedIn, isAdmin, navigate]);

  const fetchPlaces = () => {
    supabase
      .from('places')
      .select('id, name, description, zone_id, category, placed, active')
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
    } else if (tab === 'zones') {
      supabase
        .from('zone_settings')
        .select('zone_id')
        .eq('enabled', true)
        .then(({ data }) => {
          if (data) setEnabledZoneIds(new Set(data.map((r: { zone_id: string }) => r.zone_id)));
        });
      supabase
        .from('places')
        .select('zone_id')
        .then(({ data }) => {
          if (data) {
            const counts: Record<string, number> = {};
            for (const p of data as { zone_id: string }[]) {
              if (p.zone_id) counts[p.zone_id] = (counts[p.zone_id] ?? 0) + 1;
            }
            setZonePlaceCounts(counts);
          }
        });
    } else if (tab === 'packages') {
      supabase
        .from('packages')
        .select('*')
        .order('price_cents')
        .then(({ data }) => {
          if (data) setAdminPackages(data as AdminPackage[]);
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
    } else if (tab === 'landmarks') {
      supabase
        .from('landmarks')
        .select('*')
        .order('name')
        .then(({ data }) => {
          if (data) setAdminLandmarks(data as AdminLandmark[]);
        });
    }
  }, [isAdmin, tab]);

  const toggleZoneEnabled = async (zoneId: string, enabled: boolean) => {
    setZoneTogglingId(zoneId);
    setEnabledZoneIds(prev => {
      const next = new Set(prev);
      enabled ? next.add(zoneId) : next.delete(zoneId);
      return next;
    });
    const { error } = await supabase
      .from('zone_settings')
      .update({ enabled })
      .eq('zone_id', zoneId);
    if (error) {
      console.error('Toggle zone error:', error);
      // rollback
      setEnabledZoneIds(prev => {
        const next = new Set(prev);
        enabled ? next.delete(zoneId) : next.add(zoneId);
        return next;
      });
    }
    setZoneTogglingId(null);
  };

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

  // Package handlers
  const openPkgCreate = () => {
    setPkgForm(EMPTY_PKG_FORM);
    setShowPkgForm('create');
  };

  const openPkgEdit = (pkg: AdminPackage) => {
    const benefits = pkg.benefits || {};
    setPkgForm({
      slug: pkg.slug,
      name: pkg.name,
      price_cents: pkg.price_cents,
      benefits_zone_count: String((benefits as Record<string, unknown>).zone_count ?? ''),
      benefits_unlock_all: (benefits as Record<string, unknown>).unlock_all === true,
      active: pkg.active,
    });
    setShowPkgForm(pkg.id);
  };

  const closePkgForm = () => {
    setShowPkgForm(null);
    setPkgForm(EMPTY_PKG_FORM);
  };

  const handlePkgSave = async () => {
    if (!pkgForm.name.trim() || !pkgForm.slug.trim()) {
      alert('Name and slug are required');
      return;
    }
    setPkgSaving(true);

    const benefits: Record<string, unknown> = {};
    if (pkgForm.benefits_unlock_all) {
      benefits.unlock_all = true;
    } else if (pkgForm.benefits_zone_count) {
      benefits.zone_count = parseInt(pkgForm.benefits_zone_count, 10);
    }

    const { data, error } = await supabase.functions.invoke('admin-sync-package', {
      body: {
        action: showPkgForm === 'create' ? 'create' : 'update',
        package_id: showPkgForm !== 'create' ? showPkgForm : undefined,
        name: pkgForm.name.trim(),
        slug: pkgForm.slug.trim(),
        price_cents: pkgForm.price_cents,
        benefits,
        active: pkgForm.active,
      },
    });

    if (error) {
      console.error('Package sync error:', error);
      alert(`Failed to save package: ${error.message}`);
    } else if (data?.error) {
      alert(`Failed to save package: ${data.error}`);
    }

    setPkgSaving(false);
    closePkgForm();
    // Refresh packages
    supabase.from('packages').select('*').order('price_cents').then(({ data: d }) => {
      if (d) setAdminPackages(d as AdminPackage[]);
    });
  };

  // Landmark handlers
  const fetchLandmarks = () => {
    supabase.from('landmarks').select('*').order('name').then(({ data }) => {
      if (data) setAdminLandmarks(data as AdminLandmark[]);
    });
  };

  const openLmCreate = () => {
    setLmForm(EMPTY_LM_FORM);
    setShowLmForm('create');
  };

  const openLmEdit = (lm: AdminLandmark) => {
    setLmForm({
      name: lm.name,
      zone_id: lm.zone_id,
      min_zoom: lm.min_zoom,
      lng: String(lm.coordinates.lng),
      lat: String(lm.coordinates.lat),
    });
    setShowLmForm(lm.id);
  };

  const closeLmForm = () => {
    setShowLmForm(null);
    setLmForm(EMPTY_LM_FORM);
  };

  const handleLmSave = async () => {
    if (!lmForm.name.trim() || !lmForm.lng || !lmForm.lat) {
      alert('Name and coordinates are required');
      return;
    }
    setLmSaving(true);

    const payload = {
      name: lmForm.name.trim(),
      zone_id: lmForm.zone_id || null,
      min_zoom: lmForm.min_zoom,
      coordinates: { lng: parseFloat(lmForm.lng), lat: parseFloat(lmForm.lat) },
      icon: '',
    };

    if (showLmForm === 'create') {
      const { error } = await supabase.from('landmarks').insert(payload);
      if (error) {
        console.error('Insert landmark error:', error);
        alert(`Failed to create landmark: ${error.message}`);
        setLmSaving(false);
        return;
      }
    } else if (showLmForm) {
      const { error } = await supabase.from('landmarks').update(payload).eq('id', showLmForm);
      if (error) {
        console.error('Update landmark error:', error);
        alert(`Failed to update landmark: ${error.message}`);
        setLmSaving(false);
        return;
      }
    }

    setLmSaving(false);
    closeLmForm();
    fetchLandmarks();
  };

  const handleLmDelete = async (id: string) => {
    await supabase.from('landmarks').delete().eq('id', id);
    setLmDeleting(null);
    fetchLandmarks();
  };

  if (authLoading || !isAdmin) return null;

  const unplacedPlaces = places.filter((p) => !p.placed);
  const allPlaces = places;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'places', label: 'Places' },
    { key: 'zones', label: 'Zones' },
    { key: 'landmarks', label: 'Landmarks' },
    { key: 'packages', label: 'Packages' },
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
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${tab === t.key
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

        {tab === 'zones' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--sg-navy)]/60">
              <span className="font-semibold text-[var(--sg-navy)]">{enabledZoneIds.size} enabled</span> / {ZONES.length} total zones
            </p>
            <div className="overflow-x-auto rounded-xl border border-[var(--sg-border)] bg-white">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--sg-navy)]/60 border-b border-[var(--sg-border)]">
                  <tr>
                    <th className="py-2 pl-4 pr-4 w-40">Zone</th>
                    <th className="py-2 pr-4 w-20">Places</th>
                    <th className="py-2 pr-4 w-16">Status</th>
                    <th className="py-2 pr-4 w-16 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...ZONES]
                    .sort((a, b) => {
                      const aE = enabledZoneIds.has(a.id);
                      const bE = enabledZoneIds.has(b.id);
                      if (aE !== bE) return aE ? -1 : 1;
                      return 0;
                    })
                    .map((zone) => {
                      const isEnabled = enabledZoneIds.has(zone.id);
                      const count = zonePlaceCounts[zone.id] ?? 0;
                      return (
                        <tr key={zone.id} className="border-b border-[var(--sg-border)]/50">
                          <td className="py-2.5 pl-4 pr-4">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: isEnabled ? zone.color : '#d1d5db' }}
                              />
                              <span className={`font-medium ${isEnabled ? 'text-[var(--sg-navy)]' : 'text-[var(--sg-navy)]/40'}`}>
                                {zone.name}
                              </span>
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-[var(--sg-navy)]/60">
                            {count > 0 ? count : '—'}
                          </td>
                          <td className="py-2.5 pr-4">
                            <button
                              onClick={() => toggleZoneEnabled(zone.id, !isEnabled)}
                              disabled={zoneTogglingId === zone.id}
                              className="shrink-0 cursor-pointer focus:outline-none disabled:opacity-50"
                            >
                              <div
                                className="relative rounded-full transition-colors duration-200"
                                style={{
                                  width: 32,
                                  height: 18,
                                  backgroundColor: isEnabled ? 'var(--sg-thames)' : '#d1d5db',
                                }}
                              >
                                <div
                                  className="absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-200"
                                  style={{ transform: isEnabled ? 'translateX(16px)' : 'translateX(2px)' }}
                                />
                              </div>
                            </button>
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            <button
                              onClick={() => navigate(`/map?editor=true&zone=${zone.id}`)}
                              className="p-1 rounded-lg text-[var(--sg-navy)]/40 hover:text-[var(--sg-thames)] hover:bg-[var(--sg-thames)]/10 cursor-pointer"
                              title="View on Map"
                            >
                              <MapPin size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'landmarks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--sg-navy)]/60">{adminLandmarks.length} landmarks total</p>
              <button
                onClick={openLmCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--sg-crimson)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus size={16} /> Add Landmark
              </button>
            </div>

            {showLmForm && (
              <div className="rounded-xl border border-[var(--sg-border)] bg-white p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-[var(--sg-navy)]">
                    {showLmForm === 'create' ? 'Add Landmark' : 'Edit Landmark'}
                  </h2>
                  <button
                    onClick={closeLmForm}
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
                      value={lmForm.name}
                      onChange={(e) => setLmForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--sg-border)] px-3 py-2 text-sm text-[var(--sg-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--sg-crimson)]/30"
                      placeholder="Landmark name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">
                      Zone
                    </label>
                    <select
                      value={lmForm.zone_id}
                      onChange={(e) => setLmForm((f) => ({ ...f, zone_id: e.target.value }))}
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

                  <div>
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">
                      Min Zoom (10-20)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={20}
                      value={lmForm.min_zoom}
                      onChange={(e) => setLmForm((f) => ({ ...f, min_zoom: Math.min(20, Math.max(10, parseInt(e.target.value) || 14)) }))}
                      className="w-full rounded-lg border border-[var(--sg-border)] px-3 py-2 text-sm text-[var(--sg-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--sg-crimson)]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">
                      Longitude *
                    </label>
                    <input
                      type="text"
                      value={lmForm.lng}
                      onChange={(e) => setLmForm((f) => ({ ...f, lng: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--sg-border)] px-3 py-2 text-sm text-[var(--sg-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--sg-crimson)]/30"
                      placeholder="-0.1246"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">
                      Latitude *
                    </label>
                    <input
                      type="text"
                      value={lmForm.lat}
                      onChange={(e) => setLmForm((f) => ({ ...f, lat: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--sg-border)] px-3 py-2 text-sm text-[var(--sg-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--sg-crimson)]/30"
                      placeholder="51.4975"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleLmSave}
                    disabled={lmSaving || !lmForm.name.trim() || !lmForm.lng || !lmForm.lat}
                    className="px-4 py-2 rounded-xl bg-[var(--sg-crimson)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {lmSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={closeLmForm}
                    className="px-4 py-2 rounded-xl bg-[var(--sg-offwhite)] text-[var(--sg-navy)] text-sm font-medium hover:bg-[var(--sg-border)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--sg-navy)]/60 border-b border-[var(--sg-border)]">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Zone</th>
                    <th className="py-2 pr-4">Min Zoom</th>
                    <th className="py-2 pr-4">Coordinates</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminLandmarks.map((lm) => (
                    <tr key={lm.id} className="border-b border-[var(--sg-border)]/50">
                      <td className="py-2 pr-4 font-medium text-[var(--sg-navy)]">{lm.name}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">
                        {zoneName(lm.zone_id)}
                      </td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">{lm.min_zoom}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60 text-xs">
                        {lm.coordinates.lng.toFixed(5)}, {lm.coordinates.lat.toFixed(5)}
                      </td>
                      <td className="py-2 text-right">
                        {lmDeleting === lm.id ? (
                          <span className="inline-flex items-center gap-2 text-xs">
                            <span className="text-[var(--sg-crimson)]">Delete {lm.name}?</span>
                            <button
                              onClick={() => handleLmDelete(lm.id)}
                              className="text-[var(--sg-crimson)] font-semibold hover:underline cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setLmDeleting(null)}
                              className="text-[var(--sg-navy)]/60 hover:underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openLmEdit(lm)}
                              className="p-1 rounded-lg text-[var(--sg-navy)]/40 hover:text-[var(--sg-navy)] hover:bg-[var(--sg-border)] cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setLmDeleting(lm.id)}
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

        {tab === 'users' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--sg-navy)]/60 mb-4">{users.length} users</p>
            <div className="space-y-1">
              {users.map((u) => (
                <div key={u.id} className="rounded-xl border border-[var(--sg-border)] overflow-hidden">
                  {/* User row */}
                  <button
                    onClick={() => toggleUserExpand(u.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[var(--sg-navy)]">{u.email}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-[var(--sg-crimson)]/10 text-[var(--sg-crimson)]' : 'bg-[var(--sg-offwhite)] text-[var(--sg-navy)]/40'}`}>
                        {u.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--sg-navy)]/40">
                        {new Date(u.created_at).toLocaleDateString('en-GB')}
                      </span>
                      {expandedUser === u.id ? <ChevronUp size={14} className="text-[var(--sg-navy)]/40" /> : <ChevronDown size={14} className="text-[var(--sg-navy)]/40" />}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {expandedUser === u.id && (
                    <div className="border-t border-[var(--sg-border)] bg-[var(--sg-offwhite)]/50 px-4 py-3 space-y-4">
                      {/* Quick actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => expireAllUserZones(u.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-medium hover:bg-orange-100 cursor-pointer"
                        >
                          <Ban size={12} /> Expire All Zones
                        </button>
                        <button
                          onClick={() => deleteAllUserPurchases(u.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 cursor-pointer"
                        >
                          <Trash2 size={12} /> Delete All Purchases
                        </button>
                      </div>

                      {/* Active zones */}
                      <div>
                        <h4 className="text-xs font-semibold text-[var(--sg-navy)]/60 mb-2">Zones ({userZones.length})</h4>
                        {userZones.length === 0 ? (
                          <p className="text-xs text-[var(--sg-navy)]/40">No zones</p>
                        ) : (
                          <div className="space-y-1">
                            {userZones.map((uz) => {
                              const expired = new Date(uz.expires_at) < new Date();
                              return (
                                <div key={uz.zone_id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-[var(--sg-navy)]">{uz.zone_id}</span>
                                    <span className={`text-xs ${expired ? 'text-red-500' : 'text-green-600'}`}>
                                      {expired ? 'Expired' : `Expires ${new Date(uz.expires_at).toLocaleDateString('en-GB')}`}
                                    </span>
                                  </div>
                                  {!expired && (
                                    <button
                                      onClick={() => expireUserZone(u.id, uz.zone_id)}
                                      className="text-xs text-orange-500 hover:text-orange-700 cursor-pointer font-medium"
                                    >
                                      Expire
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Purchases */}
                      <div>
                        <h4 className="text-xs font-semibold text-[var(--sg-navy)]/60 mb-2">Purchases ({userPurchases.length})</h4>
                        {userPurchases.length === 0 ? (
                          <p className="text-xs text-[var(--sg-navy)]/40">No purchases</p>
                        ) : (
                          <div className="space-y-1">
                            {userPurchases.map((p) => (
                              <div key={p.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white">
                                <div>
                                  <span className="text-sm font-medium text-[var(--sg-navy)]">
                                    {'\u00A3'}{(p.amount_cents / 100).toFixed(2)}
                                  </span>
                                  <span className="text-xs text-[var(--sg-navy)]/40 ml-2">
                                    {p.zone_ids.join(', ') || '—'}
                                  </span>
                                  {p.zone_credits > 0 && (
                                    <span className="text-xs text-[var(--sg-thames)] ml-2">{p.zone_credits} credits left</span>
                                  )}
                                </div>
                                <span className="text-xs text-[var(--sg-navy)]/40">
                                  {new Date(p.created_at).toLocaleDateString('en-GB')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'packages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--sg-navy)]/60">{adminPackages.length} packages</p>
              <button
                onClick={openPkgCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--sg-crimson)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus size={16} /> Add Package
              </button>
            </div>

            {showPkgForm && (
              <div className="rounded-xl border border-[var(--sg-border)] bg-white p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-[var(--sg-navy)]">
                    {showPkgForm === 'create' ? 'Add Package' : 'Edit Package'}
                  </h2>
                  <button onClick={closePkgForm} className="text-[var(--sg-navy)]/40 hover:text-[var(--sg-navy)] cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">Slug</label>
                    <input
                      value={pkgForm.slug}
                      onChange={(e) => setPkgForm({ ...pkgForm, slug: e.target.value })}
                      placeholder="e.g. individual"
                      disabled={showPkgForm !== 'create'}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--sg-border)] text-sm text-[var(--sg-navy)] disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">Name</label>
                    <input
                      value={pkgForm.name}
                      onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                      placeholder="e.g. Individual Postcode"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--sg-border)] text-sm text-[var(--sg-navy)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">Price (pence)</label>
                    <input
                      type="number"
                      value={pkgForm.price_cents}
                      onChange={(e) => setPkgForm({ ...pkgForm, price_cents: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--sg-border)] text-sm text-[var(--sg-navy)]"
                    />
                    <span className="text-xs text-[var(--sg-navy)]/40 mt-0.5 block">
                      {'\u00A3'}{(pkgForm.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--sg-navy)]/60 mb-1">Benefits</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-[var(--sg-navy)]">
                        <input
                          type="checkbox"
                          checked={pkgForm.benefits_unlock_all}
                          onChange={(e) => setPkgForm({ ...pkgForm, benefits_unlock_all: e.target.checked, benefits_zone_count: '' })}
                        />
                        Unlock all zones
                      </label>
                      {!pkgForm.benefits_unlock_all && (
                        <input
                          type="number"
                          value={pkgForm.benefits_zone_count}
                          onChange={(e) => setPkgForm({ ...pkgForm, benefits_zone_count: e.target.value })}
                          placeholder="Zone count"
                          className="w-full px-3 py-2 rounded-lg border border-[var(--sg-border)] text-sm text-[var(--sg-navy)]"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-[var(--sg-navy)]">
                  <input
                    type="checkbox"
                    checked={pkgForm.active}
                    onChange={(e) => setPkgForm({ ...pkgForm, active: e.target.checked })}
                  />
                  Active (visible to users)
                </label>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handlePkgSave}
                    disabled={pkgSaving}
                    className="px-4 py-2 rounded-xl bg-[var(--sg-crimson)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    {pkgSaving ? 'Syncing with Stripe...' : 'Save & Sync to Stripe'}
                  </button>
                  <button
                    onClick={closePkgForm}
                    className="px-4 py-2 rounded-xl bg-[var(--sg-offwhite)] text-[var(--sg-navy)] text-sm font-medium hover:bg-[var(--sg-border)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--sg-navy)]/60 border-b border-[var(--sg-border)]">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Slug</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2 pr-4">Benefits</th>
                    <th className="py-2 pr-4">Stripe</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminPackages.map((pkg) => (
                    <tr key={pkg.id} className="border-b border-[var(--sg-border)]/50">
                      <td className="py-2 pr-4 font-medium text-[var(--sg-navy)]">{pkg.name}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60 font-mono text-xs">{pkg.slug}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]">{'\u00A3'}{(pkg.price_cents / 100).toFixed(2)}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60 text-xs">
                        {(pkg.benefits as Record<string, unknown>).unlock_all === true
                          ? 'All zones'
                          : `${(pkg.benefits as Record<string, unknown>).zone_count ?? '?'} zone(s)`}
                      </td>
                      <td className="py-2 pr-4">
                        {pkg.stripe_price_id ? (
                          <span className="text-xs text-green-600 font-medium">Linked</span>
                        ) : (
                          <span className="text-xs text-orange-500 font-medium">Not linked</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs font-medium ${pkg.active ? 'text-green-600' : 'text-[var(--sg-navy)]/40'}`}>
                          {pkg.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => openPkgEdit(pkg)}
                          className="p-1 rounded-lg text-[var(--sg-navy)]/40 hover:text-[var(--sg-navy)] hover:bg-[var(--sg-border)] cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
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
