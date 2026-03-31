# Supabase Backend Design

> Approved: 2026-03-31

## Overview

Backend architecture for the Interest Map (Charlie's XP) using Supabase as the sole backend — no separate server. Covers authentication, zone-based access control, payment processing via Stripe Checkout, admin dashboard, and migration of place data from static JSON to Supabase.

## Decisions

- **No separate backend** — Supabase handles auth, database, RLS, and Edge Functions
- **Zones stay in code** — 8 fixed London postcodes as static config, easy to migrate to DB later
- **Places move to Supabase** — dynamic content managed via admin dashboard
- **Package-as-Config model** — flexible packages with JSON benefits column
- **One-time purchases, no subscriptions** — simplifies billing significantly
- **Stripe Checkout** — redirect-based payment, webhook grants access
- **Google OAuth + Email/Password** — via Supabase Auth
- **RLS gates place data** — unlocked zones only, teaser is aggregated counts via DB function

---

## Database Schema

### `profiles`

Extends Supabase Auth. Auto-created via trigger on signup.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK, FK -> auth.users) | |
| email | text | synced from auth |
| display_name | text | nullable |
| role | text | `'user'` (default) or `'admin'` |
| created_at | timestamptz | default now() |

### `packages`

Purchasable tiers. Admin-managed.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| slug | text (unique) | `'individual'`, `'smile'`, `'atane'` |
| name | text | display name |
| price_cents | int | 300, 800, 1800 |
| benefits | jsonb | e.g. `{ "zone_count": 5 }` |
| stripe_price_id | text | links to Stripe product |
| active | boolean | soft disable without deleting |
| created_at | timestamptz | default now() |

Initial packages:

- **Individual** — `{ "zone_count": 1 }` — £3
- **Smile** — `{ "zone_count": 5 }` — £8
- **Atane** — `{ "unlock_all": true }` — £18

### `places`

Migrated from `src/data/places.json`. All place content lives here.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | |
| description | text | |
| category | text | restaurant, cafe, bar, museum, park, beach, landmark, hotel, shop, other |
| zone_id | text | e.g. `'SE1'` |
| coordinates | jsonb | `{ "lng": -0.08, "lat": 51.50 }` |
| address | text | |
| images | jsonb | array of URLs |
| rating | numeric | 1-5 |
| tags | text[] | |
| visit_date | text | |
| camera | jsonb | `{ "zoom", "pitch", "bearing" }` |
| model | jsonb | nullable, `{ "url", "scale", "rotation" }` |
| active | boolean | default true |
| created_at | timestamptz | default now() |

### `purchases`

Transaction records. One row per purchase — users can have multiple.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK -> profiles) | |
| package_id | uuid (FK -> packages) | |
| zone_ids | text[] | zones selected at purchase time |
| zone_credits | int | remaining zones to unlock (Smile starts at 5) |
| stripe_session_id | text | for reconciliation |
| amount_cents | int | actual amount paid |
| created_at | timestamptz | default now() |

Credit logic:
- **Individual**: `zone_credits: 0`, zone unlocked immediately
- **Smile**: `zone_credits: 5` (or less if zones picked at checkout), decremented as user picks zones
- **Atane**: `zone_credits: 0`, all 8 zones unlocked immediately

### `user_zones`

Access control table. RLS reads this to gate content.

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid (FK -> profiles) | |
| zone_id | text | e.g. `'SE1'` |
| purchase_id | uuid (FK -> purchases) | |
| granted_at | timestamptz | default now() |
| PK | (user_id, zone_id) | composite, prevents duplicates |

---

## Zone Teaser Function

Public RPC that returns aggregated category counts per zone. No actual place data exposed.

```sql
CREATE FUNCTION get_zone_teasers()
RETURNS jsonb AS $$
  SELECT jsonb_object_agg(zone_id, categories)
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
```

- `SECURITY DEFINER` bypasses RLS to read all places
- Returns: `{ "SE1": { "restaurant": 5, "museum": 3 }, "EC1": { ... } }`
- Called via `supabase.rpc('get_zone_teasers')` — no auth required

---

## Authentication

### Providers
- Email + Password (Supabase Auth built-in)
- Google OAuth (configured in Supabase dashboard)

### Profile Creation Trigger
```sql
CREATE FUNCTION handle_new_user()
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
```

### Admin Promotion
- First admin set manually via SQL: `UPDATE profiles SET role = 'admin' WHERE email = '...'`
- Subsequent admins promoted via admin dashboard (Edge Function checks caller is admin)

---

## Row Level Security

### `profiles`
- **SELECT**: users read own profile; admins read all
- **UPDATE**: users update own `display_name` only

### `places`
- **SELECT**: users read places in their unlocked zones (join `user_zones`); admins read all
- **INSERT/UPDATE/DELETE**: admins only

```sql
CREATE POLICY "Users read unlocked zone places"
ON places FOR SELECT USING (
  zone_id IN (SELECT zone_id FROM user_zones WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### `packages`
- **SELECT**: anyone can read active packages (public, for pricing display)
- **INSERT/UPDATE**: admins only

### `purchases`
- **SELECT**: users read own; admins read all
- **INSERT**: Edge Functions only (service role key)

### `user_zones`
- **SELECT**: users read own; admins read all
- **INSERT/DELETE**: Edge Functions only (service role key)

---

## Edge Functions

### 1. `create-checkout`

Creates a Stripe Checkout session and returns the URL.

- **Input**: `{ package_id, zone_ids? }`
- **Validation**:
  - Package exists and is active
  - For Individual: exactly 1 `zone_id` required, user doesn't already own it
  - For Smile: `zone_ids` optional (0-5), user doesn't already own them
  - For Atane: no `zone_ids` needed
- **Output**: `{ url: "https://checkout.stripe.com/..." }`
- Stores `user_id` and `package_id` in Stripe session metadata for webhook

### 2. `stripe-webhook`

Handles `checkout.session.completed` event from Stripe.

- Validates webhook signature
- Reads `user_id`, `package_id` from session metadata
- Looks up package benefits
- Creates `purchases` row:
  - Individual: `zone_credits: 0`, inserts `user_zones` for the selected zone
  - Smile: `zone_credits: 5 - len(zone_ids)`, inserts `user_zones` for any pre-selected zones
  - Atane: `zone_credits: 0`, inserts `user_zones` for all 8 zones
- All within a database transaction

### 3. `redeem-zone-credit`

Lets Smile users unlock zones from their credit balance.

- **Input**: `{ zone_id }`
- **Validation**:
  - User has a purchase with `zone_credits > 0`
  - User doesn't already own the zone
  - Zone ID is valid
- **Action**: decrements `zone_credits`, inserts `user_zones`
- **Output**: `{ remaining_credits: N }`

### 4. `admin-actions`

Protected admin operations (or split into multiple functions).

- Caller must have `role = 'admin'` in profiles
- Operations:
  - Place CRUD
  - View all users + purchases
  - Manually grant/revoke zone access
  - Promote users to admin

---

## Frontend Integration

### Auth (`useUser` replacement)
- `UserProvider` wraps app with Supabase client + `onAuthStateChange`
- Exposes: `user`, `session`, `isAdmin`, `unlockedZones`, `zoneCredits`, `signIn()`, `signOut()`, `signInWithGoogle()`
- On auth change: fetches `user_zones` and active purchases with remaining credits

### New Pages
- **Login/Signup** — email + password form, Google button
- **Account** — purchased zones, remaining credits, purchase history
- **Admin Dashboard** — places CRUD, users list, purchases, package management, manual zone grants

### Modified Components
- **InteractiveMap** — fetches places from Supabase (RLS-filtered by unlocked zones), teaser counts from `get_zone_teasers()` RPC
- **PaywallModal** — shows real packages from DB, redirects to Stripe Checkout via `create-checkout`
- **ZoneDetailPage** — checks `user_zones` for access, shows places or teaser + paywall
- **PlaceDetailPage** — only accessible for unlocked zones, redirects to paywall otherwise
- **Header** — login/logout, account link, admin link if admin

### Data Flow
```
Before: static JSON -> React state -> components

After:  Supabase places table (RLS-filtered) -> React hooks -> components
        Supabase get_zone_teasers() RPC -> teaser data -> locked zone UI
        Supabase packages table -> pricing UI -> Stripe Checkout
        Supabase user_zones -> access checks -> gate content
```

### Map States Per Zone
1. **Locked** — zone borders + teaser category counts + lock icon (no markers)
2. **Unlocked** — full place markers from Supabase + interactivity
3. **Admin** — sees everything

---

## Static Config (Stays in Code)

- Zone definitions: id, name, description, color, centroid coordinates
- GeoJSON boundaries (`london_postcodes.geojson`)
- Map styles and camera defaults
- Editorial content pages ("Who Is Charlie", "The London I Love", etc.)

These can be migrated to Supabase later if needed — the schema references zones by string ID (`'SE1'`), so the migration would just be adding a `zones` table and swapping imports for queries.

---

## Package Flexibility

The `benefits` JSONB column on `packages` is designed to be extensible. Current benefit types:

- `zone_count: N` — grants N zone credits
- `unlock_all: true` — unlocks all zones immediately

Future benefit types can be added without schema changes, e.g.:
- `charlies_pick: true`
- `early_access: true`
- `custom_maps: true`

The Edge Functions interpret the benefits JSON — adding a new type means updating the function logic, not the schema.
