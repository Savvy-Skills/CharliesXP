# Supabase Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Supabase as the sole backend for CharliesXP — database schema, auth, RLS, Edge Functions, Stripe integration, and frontend wiring.

**Architecture:** Supabase Auth for users, Postgres + RLS for access control, Edge Functions for Stripe webhooks and zone credit redemption. Places data migrates from static JSON to Supabase. Zones stay as static config in code.

**Tech Stack:** Supabase (Auth, Database, Edge Functions), Stripe Checkout, React 19, TypeScript, Vite 8

**Supabase Project:** `uhgvingupamuzsfuiapt` (CharliesXP, us-east-1)

---

## File Structure

### New Files
- `src/lib/supabase.ts` — Supabase client singleton
- `src/hooks/useAuth.tsx` — Replaces `useUser.tsx`, Supabase Auth context
- `src/hooks/useSupabasePlaces.ts` — Fetches places from Supabase (replaces JSON import in `usePlaces.ts`)
- `src/pages/LoginPage.tsx` — Login/signup page with email + Google
- `src/pages/AccountPage.tsx` — User's purchased zones, credits, history
- `src/pages/AdminPage.tsx` — Admin dashboard (places CRUD, users, purchases)
- `supabase/seed.sql` — Seed data (packages + places migration)

### Modified Files
- `src/hooks/usePlaces.ts` — Swap JSON import for Supabase query
- `src/components/ui/PaywallModal.tsx` — Show real packages, link to Stripe
- `src/components/Layout/Header.tsx` — Wire to Supabase auth, add account/admin links
- `src/pages/ZoneDetailPage.tsx` — Use Supabase auth for zone access
- `src/pages/PlaceDetailPage.tsx` — Gate by zone access
- `src/App.tsx` — Add new routes, swap UserProvider for AuthProvider
- `src/types/index.ts` — Add database types
- `.env` — Add Supabase URL + anon key

### Edge Functions (deployed via Supabase MCP)
- `create-checkout` — Creates Stripe Checkout session
- `stripe-webhook` — Handles payment completion
- `redeem-zone-credit` — Lets Smile users unlock zones

---

## Task 1: Database Schema Migration

**Files:** Supabase migration (applied via MCP tool)

This creates all tables, triggers, RLS policies, and the teaser function in a single migration.

- [ ] **Step 1: Apply the schema migration**

Use the `mcp__plugin_supabase_supabase__apply_migration` tool with this SQL:

```sql
-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  price_cents int NOT NULL,
  benefits jsonb NOT NULL DEFAULT '{}',
  stripe_price_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL CHECK (category IN (
    'restaurant','cafe','bar','museum','park','beach','landmark','hotel','shop','other'
  )),
  zone_id text NOT NULL,
  coordinates jsonb NOT NULL,
  address text NOT NULL DEFAULT '',
  marker_icon text NOT NULL DEFAULT '',
  marker_image text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]',
  rating numeric CHECK (rating >= 1 AND rating <= 5),
  tags text[] NOT NULL DEFAULT '{}',
  visit_date text,
  camera jsonb NOT NULL DEFAULT '{}',
  model jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES packages(id),
  zone_ids text[] NOT NULL DEFAULT '{}',
  zone_credits int NOT NULL DEFAULT 0,
  stripe_session_id text,
  amount_cents int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_zones (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  zone_id text NOT NULL,
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, zone_id)
);

-- Indexes
CREATE INDEX idx_places_zone_id ON places(zone_id);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_user_zones_user_id ON user_zones(user_id);

-- ============================================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 3. ZONE TEASER FUNCTION (public, no auth required)
-- ============================================================

CREATE OR REPLACE FUNCTION get_zone_teasers()
RETURNS jsonb AS $$
  SELECT COALESCE(
    jsonb_object_agg(zone_id, categories),
    '{}'::jsonb
  )
  FROM (
    SELECT zone_id, jsonb_object_agg(category, count) AS categories
    FROM (
      SELECT zone_id, category, count(*)::int AS count
      FROM places
      WHERE active = true
      GROUP BY zone_id, category
    ) counts
    GROUP BY zone_id
  ) zones;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_zones ENABLE ROW LEVEL SECURITY;

-- profiles: users read own, admins read all
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- packages: anyone reads active, admins manage
CREATE POLICY "Anyone reads active packages"
  ON packages FOR SELECT
  USING (active = true);

CREATE POLICY "Admins manage packages"
  ON packages FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- places: users read their unlocked zones, admins read all
CREATE POLICY "Users read unlocked zone places"
  ON places FOR SELECT
  USING (
    zone_id IN (SELECT zone_id FROM user_zones WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins manage places"
  ON places FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- purchases: users read own, admins read all
CREATE POLICY "Users read own purchases"
  ON purchases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all purchases"
  ON purchases FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- user_zones: users read own, admins read all
CREATE POLICY "Users read own zones"
  ON user_zones FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all zones"
  ON user_zones FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

- [ ] **Step 2: Verify tables exist**

Use `mcp__plugin_supabase_supabase__list_tables` with `project_id: "uhgvingupamuzsfuiapt"` and `verbose: true`. Confirm all 5 tables are present with correct columns.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Supabase schema migration (tables, RLS, triggers)"
```

---

## Task 2: Seed Packages and Migrate Places Data

**Files:** Supabase SQL execution via MCP

- [ ] **Step 1: Seed the 3 packages**

Use `mcp__plugin_supabase_supabase__execute_sql` to run:

```sql
INSERT INTO packages (slug, name, price_cents, benefits, active) VALUES
  ('individual', 'Individual Postcode', 300, '{"zone_count": 1}', true),
  ('smile', 'Smile Package', 800, '{"zone_count": 5}', true),
  ('atane', 'Atane Package', 1800, '{"unlock_all": true}', true);
```

- [ ] **Step 2: Migrate places from JSON**

Read `src/data/places.json` and generate INSERT statements. The JSON uses `zone` field — map it to `zone_id`. The JSON uses `zoom`, `pitch`, `bearing` as top-level fields — combine into `camera` jsonb. Map `markerIcon` to `marker_icon` and `markerImage` to `marker_image`.

Use `mcp__plugin_supabase_supabase__execute_sql` to insert all places. Example for first entry:

```sql
INSERT INTO places (name, description, category, zone_id, coordinates, address, marker_icon, marker_image, images, rating, tags, visit_date, camera, model, active)
VALUES (
  'Borough Market',
  'London''s oldest and most renowned food market. Incredible street food, artisan producers, and the best sourdough you''ll ever taste.',
  'restaurant',
  'SE1',
  '{"lng": -0.0910, "lat": 51.5055}',
  '8 Southwark St, London SE1 1TL',
  'restaurant',
  '/markers/restaurant.png',
  '[]',
  5,
  ARRAY['food', 'market', 'street-food', 'southwark'],
  '2024-06-15',
  '{"zoom": 17, "pitch": 60, "bearing": 30}',
  NULL,
  true
);
```

Generate and execute INSERT for every place in the JSON file. For places with a `model` field, include it as jsonb (e.g., `'{"url": "/models/test3d.glb", "scale": 50, "rotation": [90, 0, 0]}'`).

- [ ] **Step 3: Verify seed data**

Use `mcp__plugin_supabase_supabase__execute_sql`:

```sql
SELECT count(*) AS place_count FROM places;
SELECT slug, name, price_cents FROM packages ORDER BY price_cents;
```

Confirm place count matches JSON file and all 3 packages exist.

- [ ] **Step 4: Verify teaser function works**

```sql
SELECT get_zone_teasers();
```

Confirm it returns a JSON object with zone IDs as keys and category counts as values.

---

## Task 3: Supabase Client + Environment Setup

**Files:**
- Create: `src/lib/supabase.ts`
- Modify: `.env`
- Modify: `package.json` (add dependency)

- [ ] **Step 1: Install Supabase JS client**

```bash
cd /home/sam/Escritorio/github/interest-map && pnpm add @supabase/supabase-js
```

- [ ] **Step 2: Add Supabase env vars to `.env`**

Get the project URL and anon key using `mcp__plugin_supabase_supabase__get_project_url` and `mcp__plugin_supabase_supabase__get_publishable_keys` with `project_id: "uhgvingupamuzsfuiapt"`.

Add to `.env` (keep existing VITE_MAPBOX_TOKEN):

```
VITE_SUPABASE_URL=https://uhgvingupamuzsfuiapt.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key_from_above>
```

- [ ] **Step 3: Create Supabase client singleton**

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts .env package.json pnpm-lock.yaml
git commit -m "feat: add Supabase client and env config"
```

---

## Task 4: Auth Provider (Replace useUser)

**Files:**
- Create: `src/hooks/useAuth.tsx`
- Modify: `src/App.tsx`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add auth types to `src/types/index.ts`**

Add at the end of the file (keep all existing types):

```typescript
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Package {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  benefits: Record<string, unknown>;
  stripe_price_id: string | null;
  active: boolean;
}

export interface Purchase {
  id: string;
  user_id: string;
  package_id: string;
  zone_ids: string[];
  zone_credits: number;
  stripe_session_id: string | null;
  amount_cents: number;
  created_at: string;
}

export interface UserZone {
  user_id: string;
  zone_id: string;
  purchase_id: string;
  granted_at: string;
}
```

- [ ] **Step 2: Create `src/hooks/useAuth.tsx`**

```typescript
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
    (zoneId: string) => unlockedZones.includes(zoneId),
    [unlockedZones],
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
```

- [ ] **Step 3: Update `src/App.tsx` — swap UserProvider for AuthProvider**

Replace line 4:
```typescript
// Old:
import { UserProvider } from './hooks/useUser';
// New:
import { AuthProvider } from './hooks/useAuth';
```

Replace line 41 (`<UserProvider>`) with `<AuthProvider>` and line 57 (`</UserProvider>`) with `</AuthProvider>`.

Add new lazy routes for login and account pages:

```typescript
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
```

Add routes inside `<Routes>` (after the `/families` route):

```tsx
<Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
<Route path="/account" element={<AnimatedPage><AccountPage /></AnimatedPage>} />
<Route path="/admin" element={<AnimatedPage><AdminPage /></AnimatedPage>} />
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAuth.tsx src/types/index.ts src/App.tsx
git commit -m "feat: add Supabase auth provider, replace UserProvider"
```

---

## Task 5: Update Consumers of useUser to useAuth

**Files:**
- Modify: `src/components/Layout/Header.tsx`
- Modify: `src/pages/ZoneDetailPage.tsx`
- Modify: `src/pages/PlaceDetailPage.tsx`
- Modify: Any other files importing `useUser`

- [ ] **Step 1: Find all useUser consumers**

```bash
grep -rn "useUser" src/ --include="*.tsx" --include="*.ts"
```

- [ ] **Step 2: Update `src/components/Layout/Header.tsx`**

Replace line 4:
```typescript
// Old:
import { useUser } from '../../hooks/useUser';
// New:
import { useAuth } from '../../hooks/useAuth';
```

Replace line 17:
```typescript
// Old:
const { isLoggedIn, login, logout } = useUser();
// New:
const { isLoggedIn, signOut, isAdmin } = useAuth();
```

Update the desktop login button (lines 110-122). Replace the `onClick` and text:
```tsx
{isLoggedIn ? (
  <div className="flex items-center gap-2">
    {isAdmin && (
      <Link to="/admin" className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--sg-navy)]/60 hover:text-[var(--sg-navy)] hover:bg-[var(--sg-border)] transition-colors">
        Admin
      </Link>
    )}
    <Link to="/account" className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--sg-navy)]/60 hover:text-[var(--sg-navy)] hover:bg-[var(--sg-border)] transition-colors">
      Account
    </Link>
    <button
      onClick={signOut}
      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--sg-offwhite)] text-[var(--sg-navy)] hover:bg-[var(--sg-border)] transition-all cursor-pointer"
    >
      <User size={14} /> Logout
    </button>
  </div>
) : (
  <Link
    to="/login"
    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--sg-thames)] text-white hover:bg-[var(--sg-thames-hover)] shadow-sm hover:shadow-md transition-all"
  >
    <User size={14} /> Login / Register
  </Link>
)}
```

Update the mobile login button (lines 181-188) similarly — replace `onClick` with a `Link to="/login"` when not logged in, and `onClick={signOut}` when logged in.

- [ ] **Step 3: Update `src/pages/ZoneDetailPage.tsx`**

Replace line 7:
```typescript
// Old:
import { useUser } from '../hooks/useUser';
// New:
import { useAuth } from '../hooks/useAuth';
```

Replace line 12:
```typescript
// Old:
const { isZoneUnlocked } = useUser();
// New:
const { isZoneUnlocked } = useAuth();
```

No other changes needed — `isZoneUnlocked` has the same signature.

- [ ] **Step 4: Update `src/pages/PlaceDetailPage.tsx`**

Add zone access check. After line 6, add:
```typescript
import { useAuth } from '../hooks/useAuth';
```

After line 12 (`const place = ...`), add:
```typescript
const { isZoneUnlocked } = useAuth();
```

After the existing "Place not found" check (after line 25), add:
```typescript
if (place.zone && !isZoneUnlocked(place.zone)) {
  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-[var(--sg-navy)]/60 text-lg mb-4">This place is in a locked zone</p>
        <Link to="/map" className="text-[var(--sg-crimson)] hover:text-[var(--sg-crimson-hover)] font-medium">
          Back to map
        </Link>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 5: Update any remaining useUser imports**

Check the grep output from Step 1 and update any other files that import `useUser`. For each:
- Replace `import { useUser } from '...'` with `import { useAuth } from '...'`
- Replace `useUser()` call with `useAuth()`
- Map old properties: `isLoggedIn` stays same, `login()` -> redirect to `/login`, `logout()` -> `signOut()`, `unlockZone()` -> handled by Edge Functions now, `isZoneUnlocked()` stays same

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: migrate all useUser consumers to useAuth"
```

---

## Task 6: Supabase Places Hook (Replace JSON Import)

**Files:**
- Create: `src/hooks/useSupabasePlaces.ts`
- Modify: `src/hooks/usePlaces.ts`

- [ ] **Step 1: Create `src/hooks/useSupabasePlaces.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Place, PlaceCategory } from '../types';

interface SupabasePlaceRow {
  id: string;
  name: string;
  description: string;
  category: PlaceCategory;
  zone_id: string;
  coordinates: { lng: number; lat: number };
  address: string;
  marker_icon: string;
  marker_image: string;
  images: string[];
  rating: number;
  tags: string[];
  visit_date: string | null;
  camera: { zoom?: number; pitch?: number; bearing?: number };
  model: { url: string; scale?: number; rotation?: [number, number, number] } | null;
  active: boolean;
}

function rowToPlace(row: SupabasePlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    coordinates: row.coordinates,
    address: row.address,
    markerIcon: row.marker_icon,
    markerImage: row.marker_image,
    images: row.images,
    rating: row.rating,
    visitDate: row.visit_date ?? '',
    tags: row.tags,
    zoom: row.camera?.zoom ?? 15,
    pitch: row.camera?.pitch ?? 45,
    bearing: row.camera?.bearing ?? 0,
    zone: row.zone_id,
    model: row.model ?? undefined,
  };
}

export function useSupabasePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('places')
      .select('*')
      .eq('active', true);

    if (err) {
      setError(err.message);
      setPlaces([]);
    } else {
      setPlaces((data as SupabasePlaceRow[]).map(rowToPlace));
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  return { places, loading, error, refetch: fetchPlaces };
}
```

- [ ] **Step 2: Update `src/hooks/usePlaces.ts`**

Replace the entire file contents with:

```typescript
import { useState, useCallback } from 'react';
import type { Place, PlaceCategory, Zone } from '../types';
import zonesData from '../data/zones.json';
import { useSupabasePlaces } from './useSupabasePlaces';

export function usePlaces() {
  const { places, loading, error, refetch } = useSupabasePlaces();
  const [activeCategories, setActiveCategories] = useState<PlaceCategory[]>([]);

  const filteredPlaces =
    activeCategories.length === 0
      ? places
      : places.filter((p) => activeCategories.includes(p.category));

  const toggleCategory = useCallback((category: PlaceCategory) => {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  const zones: Zone[] = zonesData;

  const getPlaceById = useCallback(
    (id: string) => places.find((p) => p.id === id) ?? null,
    [places],
  );

  const getPlacesByZone = useCallback(
    (zone: string) => places.filter((p) => p.zone === zone),
    [places],
  );

  const getZoneById = useCallback(
    (id: string) => zones.find((z) => z.id === id) ?? null,
    [zones],
  );

  return {
    places,
    filteredPlaces,
    zones,
    activeCategories,
    toggleCategory,
    getPlaceById,
    getPlacesByZone,
    getZoneById,
    loading,
    error,
    refetch,
  };
}
```

Note: `addPlace`, `updatePlace`, `deletePlace`, and `exportPlaces` are removed. Admin CRUD will be handled separately via Edge Functions / direct Supabase calls in the admin page.

- [ ] **Step 3: Verify the app builds**

```bash
cd /home/sam/Escritorio/github/interest-map && pnpm build
```

Fix any type errors that arise.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useSupabasePlaces.ts src/hooks/usePlaces.ts
git commit -m "feat: fetch places from Supabase instead of static JSON"
```

---

## Task 7: Zone Teaser Hook

**Files:**
- Create: `src/hooks/useZoneTeasers.ts`

- [ ] **Step 1: Create `src/hooks/useZoneTeasers.ts`**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type ZoneTeasers = Record<string, Record<string, number>>;

export function useZoneTeasers() {
  const [teasers, setTeasers] = useState<ZoneTeasers>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('get_zone_teasers').then(({ data, error }) => {
      if (!error && data) setTeasers(data as ZoneTeasers);
      setLoading(false);
    });
  }, []);

  return { teasers, loading };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useZoneTeasers.ts
git commit -m "feat: add zone teaser hook for category counts"
```

---

## Task 8: Login Page

**Files:**
- Create: `src/pages/LoginPage.tsx`

- [ ] **Step 1: Create `src/pages/LoginPage.tsx`**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageShell } from '../components/Layout/PageShell';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { isLoggedIn, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isLoggedIn) {
    navigate('/account', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fn = mode === 'login' ? signInWithEmail : signUpWithEmail;
    const { error: err } = await fn(email, password);

    if (err) {
      setError(err.message);
      setLoading(false);
    } else if (mode === 'login') {
      navigate('/account', { replace: true });
    } else {
      setError(null);
      setLoading(false);
      // Show confirmation message for signup
      setMode('login');
      setError('Check your email to confirm your account, then log in.');
    }
  };

  return (
    <PageShell>
      <div className="max-w-sm mx-auto px-4 py-16">
        <h1 className="font-display text-2xl font-bold text-[var(--sg-navy)] text-center mb-8">
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h1>

        <button
          onClick={signInWithGoogle}
          className="w-full py-3 rounded-xl border border-[var(--sg-border)] bg-white text-[var(--sg-navy)] font-medium text-sm hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer mb-6"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[var(--sg-border)]" />
          <span className="text-xs text-[var(--sg-navy)]/40">or</span>
          <div className="flex-1 h-px bg-[var(--sg-border)]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-[var(--sg-border)] bg-white text-sm text-[var(--sg-navy)] placeholder:text-[var(--sg-navy)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sg-thames)]/30"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-[var(--sg-border)] bg-white text-sm text-[var(--sg-navy)] placeholder:text-[var(--sg-navy)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sg-thames)]/30"
          />

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--sg-crimson)] hover:bg-[var(--sg-crimson-hover)] text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--sg-navy)]/60 mt-6">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(null); }} className="text-[var(--sg-crimson)] font-medium cursor-pointer">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(null); }} className="text-[var(--sg-crimson)] font-medium cursor-pointer">
                Log in
              </button>
            </>
          )}
        </p>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-[var(--sg-navy)]/40 hover:text-[var(--sg-crimson)] transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: Verify the app builds**

```bash
cd /home/sam/Escritorio/github/interest-map && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage.tsx
git commit -m "feat: add login/signup page with email + Google"
```

---

## Task 9: Account Page

**Files:**
- Create: `src/pages/AccountPage.tsx`

- [ ] **Step 1: Create `src/pages/AccountPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, CreditCard } from 'lucide-react';
import { PageShell } from '../components/Layout/PageShell';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Purchase } from '../types';

export function AccountPage() {
  const { isLoggedIn, loading: authLoading, profile, unlockedZones, zoneCredits, signOut } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<(Purchase & { package_name?: string })[]>([]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    supabase
      .from('purchases')
      .select('*, packages(name)')
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
  }, [isLoggedIn]);

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
                  {zoneId}
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
                      {p.zone_ids.length > 0 && ` — Zones: ${p.zone_ids.join(', ')}`}
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
          onClick={signOut}
          className="text-sm text-[var(--sg-navy)]/60 hover:text-[var(--sg-crimson)] transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AccountPage.tsx
git commit -m "feat: add account page with zones and purchase history"
```

---

## Task 10: Update PaywallModal for Packages

**Files:**
- Modify: `src/components/ui/PaywallModal.tsx`

- [ ] **Step 1: Rewrite `src/components/ui/PaywallModal.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Modal } from './Modal';
import { Lock, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Package } from '../../types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName: string;
  zoneId: string;
}

export function PaywallModal({ isOpen, onClose, zoneName, zoneId }: PaywallModalProps) {
  const { isLoggedIn, zoneCredits, refreshAccess } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from('packages')
      .select('*')
      .eq('active', true)
      .order('price_cents')
      .then(({ data }) => {
        if (data) setPackages(data as Package[]);
      });
  }, [isOpen]);

  const handleBuyPackage = async (pkg: Package) => {
    if (!isLoggedIn) {
      navigate('/login');
      onClose();
      return;
    }

    // For individual, include zone_id
    const body: Record<string, unknown> = { package_id: pkg.id };
    if (pkg.slug === 'individual') {
      body.zone_ids = [zoneId];
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body,
    });

    if (error) {
      console.error('Checkout error:', error);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const handleRedeemCredit = async () => {
    setRedeeming(true);
    const { error } = await supabase.functions.invoke('redeem-zone-credit', {
      body: { zone_id: zoneId },
    });

    if (error) {
      console.error('Redeem error:', error);
      setRedeeming(false);
      return;
    }

    await refreshAccess();
    setRedeeming(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 pt-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--sg-crimson)]/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-[var(--sg-crimson)]" />
        </div>

        <h2 className="font-display text-xl font-bold text-[var(--sg-navy)] mb-2">
          Unlock {zoneName}
        </h2>
        <p className="text-sm text-[var(--sg-navy)]/60 mb-6">
          Get full access to all restaurants, cafes, bars, and hidden gems in this zone.
        </p>

        {/* Zone credits option */}
        {zoneCredits > 0 && (
          <div className="mb-4">
            <button
              onClick={handleRedeemCredit}
              disabled={redeeming}
              className="w-full py-3 rounded-xl bg-[var(--sg-thames)] hover:bg-[var(--sg-thames-hover)] text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {redeeming ? 'Unlocking...' : `Use zone credit (${zoneCredits} remaining)`}
            </button>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[var(--sg-border)]" />
              <span className="text-xs text-[var(--sg-navy)]/40">or buy a package</span>
              <div className="flex-1 h-px bg-[var(--sg-border)]" />
            </div>
          </div>
        )}

        {/* Package options */}
        <div className="space-y-3 mb-6">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handleBuyPackage(pkg)}
              className="w-full p-4 rounded-xl border border-[var(--sg-border)] bg-[var(--sg-offwhite)] hover:border-[var(--sg-crimson)]/30 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-[var(--sg-navy)]">{pkg.name}</span>
                <span className="text-sm font-bold text-[var(--sg-crimson)]">
                  {'\u00A3'}{(pkg.price_cents / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-[var(--sg-navy)]/60">
                {pkg.slug === 'individual' && 'Unlock this postcode'}
                {pkg.slug === 'smile' && '5 postcodes of your choice'}
                {pkg.slug === 'atane' && 'Unlock everything — all zones'}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="text-xs text-[var(--sg-navy)]/60 hover:text-[var(--sg-crimson)] transition-colors cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Update all PaywallModal consumers to pass `zoneId` prop**

Search for PaywallModal usage and add the `zoneId` prop wherever it's rendered. The exact files will depend on grep results:

```bash
grep -rn "PaywallModal" src/ --include="*.tsx"
```

For each usage, add the `zoneId` prop alongside `zoneName`.

- [ ] **Step 3: Verify app builds**

```bash
cd /home/sam/Escritorio/github/interest-map && pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: update PaywallModal to show real packages and handle credits"
```

---

## Task 11: Edge Function — create-checkout

**Files:** Deployed via Supabase MCP

- [ ] **Step 1: Deploy the `create-checkout` Edge Function**

Use `mcp__plugin_supabase_supabase__deploy_edge_function` with name `create-checkout` and this code:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    const { package_id, zone_ids } = await req.json();

    // Look up the package
    const { data: pkg, error: pkgError } = await supabase
      .from("packages")
      .select("*")
      .eq("id", package_id)
      .eq("active", true)
      .single();

    if (pkgError || !pkg) {
      return new Response(JSON.stringify({ error: "Package not found" }), { status: 400 });
    }

    // Validate zone_ids for individual package
    if (pkg.slug === "individual") {
      if (!zone_ids || zone_ids.length !== 1) {
        return new Response(JSON.stringify({ error: "Individual package requires exactly 1 zone" }), { status: 400 });
      }
    }

    // Check user doesn't already own the zones
    if (zone_ids && zone_ids.length > 0) {
      const { data: existing } = await supabase
        .from("user_zones")
        .select("zone_id")
        .eq("user_id", user.id)
        .in("zone_id", zone_ids);

      if (existing && existing.length > 0) {
        const owned = existing.map((r: { zone_id: string }) => r.zone_id);
        return new Response(
          JSON.stringify({ error: `Already own zones: ${owned.join(", ")}` }),
          { status: 400 }
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: pkg.price_cents,
            product_data: { name: pkg.name },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        package_id: pkg.id,
        package_slug: pkg.slug,
        zone_ids: zone_ids ? JSON.stringify(zone_ids) : "[]",
      },
      success_url: `${req.headers.get("origin") || "http://localhost:5173"}/account?payment=success`,
      cancel_url: `${req.headers.get("origin") || "http://localhost:5173"}/map?payment=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("create-checkout error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
```

- [ ] **Step 2: Set Stripe env var**

Set the `STRIPE_SECRET_KEY` secret in Supabase project settings (Dashboard > Edge Functions > Secrets). This must be done manually in the Supabase dashboard.

---

## Task 12: Edge Function — stripe-webhook

**Files:** Deployed via Supabase MCP

- [ ] **Step 1: Deploy the `stripe-webhook` Edge Function**

Use `mcp__plugin_supabase_supabase__deploy_edge_function` with name `stripe-webhook` and this code:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const ALL_ZONE_IDS = ["SE1", "EC1", "WC2", "NW3", "W1", "SW1", "E1", "EC2"];

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing stripe-signature", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true }));
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata!;
    const userId = meta.user_id;
    const packageId = meta.package_id;
    const packageSlug = meta.package_slug;
    const zoneIds: string[] = JSON.parse(meta.zone_ids || "[]");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up package for benefits
    const { data: pkg } = await supabase
      .from("packages")
      .select("benefits, price_cents")
      .eq("id", packageId)
      .single();

    if (!pkg) {
      console.error("Package not found:", packageId);
      return new Response("Package not found", { status: 400 });
    }

    const benefits = pkg.benefits as Record<string, unknown>;
    const unlockAll = benefits.unlock_all === true;
    const zoneCount = (benefits.zone_count as number) || 0;

    // Determine which zones to unlock now
    let zonesToUnlock: string[];
    let zoneCredits: number;

    if (unlockAll) {
      zonesToUnlock = ALL_ZONE_IDS;
      zoneCredits = 0;
    } else {
      zonesToUnlock = zoneIds;
      zoneCredits = zoneCount - zoneIds.length;
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        user_id: userId,
        package_id: packageId,
        zone_ids: zoneIds,
        zone_credits: zoneCredits,
        stripe_session_id: session.id,
        amount_cents: session.amount_total || pkg.price_cents,
      })
      .select("id")
      .single();

    if (purchaseError) {
      console.error("Purchase insert error:", purchaseError);
      return new Response("Purchase insert failed", { status: 500 });
    }

    // Grant zone access (skip duplicates with ON CONFLICT)
    if (zonesToUnlock.length > 0) {
      const rows = zonesToUnlock.map((zoneId) => ({
        user_id: userId,
        zone_id: zoneId,
        purchase_id: purchase.id,
      }));

      const { error: zonesError } = await supabase
        .from("user_zones")
        .upsert(rows, { onConflict: "user_id,zone_id" });

      if (zonesError) {
        console.error("Zone grant error:", zonesError);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Webhook error", { status: 400 });
  }
});
```

- [ ] **Step 2: Set `STRIPE_WEBHOOK_SECRET` in Supabase secrets**

This is done in Supabase Dashboard > Edge Functions > Secrets. The webhook secret is obtained when you create the webhook endpoint in Stripe Dashboard, pointing to:
`https://uhgvingupamuzsfuiapt.supabase.co/functions/v1/stripe-webhook`

---

## Task 13: Edge Function — redeem-zone-credit

**Files:** Deployed via Supabase MCP

- [ ] **Step 1: Deploy the `redeem-zone-credit` Edge Function**

Use `mcp__plugin_supabase_supabase__deploy_edge_function` with name `redeem-zone-credit` and this code:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const VALID_ZONES = ["SE1", "EC1", "WC2", "NW3", "W1", "SW1", "E1", "EC2"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    const { zone_id } = await req.json();

    if (!zone_id || !VALID_ZONES.includes(zone_id)) {
      return new Response(JSON.stringify({ error: "Invalid zone_id" }), { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check user doesn't already own zone
    const { data: existing } = await supabase
      .from("user_zones")
      .select("zone_id")
      .eq("user_id", user.id)
      .eq("zone_id", zone_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Zone already unlocked" }), { status: 400 });
    }

    // Find a purchase with remaining credits
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select("id, zone_credits, zone_ids")
      .eq("user_id", user.id)
      .gt("zone_credits", 0)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (purchaseError || !purchase) {
      return new Response(JSON.stringify({ error: "No zone credits available" }), { status: 400 });
    }

    // Decrement credit
    const { error: updateError } = await supabase
      .from("purchases")
      .update({
        zone_credits: purchase.zone_credits - 1,
        zone_ids: [...(purchase.zone_ids || []), zone_id],
      })
      .eq("id", purchase.id);

    if (updateError) {
      console.error("Credit decrement error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to redeem credit" }), { status: 500 });
    }

    // Grant zone access
    const { error: grantError } = await supabase
      .from("user_zones")
      .insert({
        user_id: user.id,
        zone_id: zone_id,
        purchase_id: purchase.id,
      });

    if (grantError) {
      console.error("Zone grant error:", grantError);
      return new Response(JSON.stringify({ error: "Failed to grant zone" }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ remaining_credits: purchase.zone_credits - 1 }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Redeem error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
```

---

## Task 14: Admin Page (Basic)

**Files:**
- Create: `src/pages/AdminPage.tsx`

- [ ] **Step 1: Create `src/pages/AdminPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageShell } from '../components/Layout/PageShell';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Place, Profile, Purchase } from '../types';

type Tab = 'places' | 'users' | 'purchases';

export function AdminPage() {
  const { isLoggedIn, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('places');
  const [places, setPlaces] = useState<Place[]>([]);
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
      supabase.from('places').select('*').order('zone_id').then(({ data }) => {
        if (data) setPlaces(data as unknown as Place[]);
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
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">{p.zone}</td>
                      <td className="py-2 pr-4 text-[var(--sg-navy)]/60">{p.category}</td>
                      <td className="py-2 text-[var(--sg-navy)]/60">{p.rating}</td>
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
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: add basic admin dashboard with places, users, purchases tabs"
```

---

## Task 15: Final Wiring and Build Verification

**Files:**
- Modify: various (cleanup)

- [ ] **Step 1: Remove old `useUser` imports that may remain**

```bash
grep -rn "useUser\|UserProvider" src/ --include="*.tsx" --include="*.ts"
```

If any references remain (other than `src/hooks/useUser.tsx` itself), update them to use `useAuth`/`AuthProvider`.

- [ ] **Step 2: Verify complete build**

```bash
cd /home/sam/Escritorio/github/interest-map && pnpm build
```

Fix any TypeScript or build errors.

- [ ] **Step 3: Verify Supabase state**

Use MCP tools to confirm:
- `list_tables` shows all 5 tables
- `execute_sql: SELECT count(*) FROM places` returns correct count
- `execute_sql: SELECT count(*) FROM packages` returns 3
- `list_edge_functions` shows all 3 functions deployed
- `execute_sql: SELECT get_zone_teasers()` returns valid JSON

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "feat: complete Supabase backend integration"
```

---

## Manual Steps (Not Automatable)

These must be done by the user in external dashboards:

1. **Supabase Dashboard:** Enable Google OAuth provider (Authentication > Providers > Google) — requires Google Cloud Console OAuth client ID/secret
2. **Stripe Dashboard:** Create a webhook endpoint pointing to `https://uhgvingupamuzsfuiapt.supabase.co/functions/v1/stripe-webhook`, listening for `checkout.session.completed`
3. **Supabase Dashboard:** Add secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
4. **Supabase Dashboard:** Set first admin: `UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com'`
