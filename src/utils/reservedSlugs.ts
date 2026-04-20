/**
 * Top-level route paths that must not be shadowed by a zone ID. A zone
 * whose `id` matches any of these would win over the app route because
 * React Router's `/:zoneId` catch-all sits at the same level as these
 * static paths.
 *
 * Keep in sync with the route table in src/App.tsx.
 */
export const RESERVED_ZONE_SLUGS = [
  'login',
  'account',
  'admin',
  'style-guide',
  'who-is-charlie',
  'the-london-i-love',
  'families',
  'map',
  'place',
  'zone',
] as const;

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_ZONE_SLUGS as readonly string[]).includes(slug.toLowerCase());
}
