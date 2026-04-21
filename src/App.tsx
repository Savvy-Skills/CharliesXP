import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './hooks/useAuth';
import { LegacyPlaceRedirect } from './components/LegacyRedirect';

// Code-split every route for optimal initial load
const MapPage           = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })));
const StyleGuidePage    = lazy(() => import('./pages/StyleGuide/StyleGuidePage').then(m => ({ default: m.StyleGuidePage })));
const WhoIsCharliePage  = lazy(() => import('./pages/WhoIsCharliePage').then(m => ({ default: m.WhoIsCharliePage })));
const TheLondonILovePage = lazy(() => import('./pages/TheLondonILovePage').then(m => ({ default: m.TheLondonILovePage })));
const LondonSectionPage = lazy(() => import('./pages/LondonSectionPage').then(m => ({ default: m.LondonSectionPage })));
const FamiliesPage      = lazy(() => import('./pages/FamiliesPage').then(m => ({ default: m.FamiliesPage })));
const LoginPage         = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AccountPage       = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const AdminPage         = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--sg-offwhite)]" aria-label="Loading page">
      <div className="w-6 h-6 rounded-full border-2 border-[var(--sg-crimson)] border-t-transparent animate-spin" role="status" />
    </div>
  );
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function LegacyMapRedirect() {
  const { zoneId, placeSlug } = useParams<{ zoneId?: string; placeSlug?: string }>();
  const target = placeSlug && zoneId
    ? `/${zoneId}/${placeSlug}`
    : zoneId
      ? `/${zoneId}`
      : '/';
  return <Navigate to={target} replace />;
}

function LegacyZoneRedirect() {
  const { name } = useParams<{ name: string }>();
  return <Navigate to={name ? `/${name}` : '/'} replace />;
}

/**
 * Returns true for URLs rendered by MapPage (map canonical routes) so we can
 * share one AnimatePresence key across /, /:zoneId, /:zoneId/:placeSlug, and
 * the legacy /map/* redirects.
 */
function isMapPath(pathname: string): boolean {
  const staticPrefixes = [
    '/login', '/account', '/admin', '/style-guide',
    '/who-is-charlie', '/the-london-i-love', '/families',
    '/place', '/zone',
  ];
  return !staticPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
        <AnimatePresence mode="wait">
          <Routes
            location={location}
            key={isMapPath(location.pathname) ? '_map' : location.pathname}
          >
            {/* Static app routes (first — they outrank /:zoneId catch-all) */}
            <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
            <Route path="/account" element={<AnimatedPage><AccountPage /></AnimatedPage>} />
            <Route path="/admin" element={<AnimatedPage><AdminPage /></AnimatedPage>} />
            <Route path="/style-guide" element={<StyleGuidePage />} />
            <Route path="/who-is-charlie" element={<AnimatedPage><WhoIsCharliePage /></AnimatedPage>} />
            <Route path="/the-london-i-love" element={<AnimatedPage><TheLondonILovePage /></AnimatedPage>} />
            <Route path="/the-london-i-love/:slug" element={<AnimatedPage><LondonSectionPage /></AnimatedPage>} />
            <Route path="/families" element={<AnimatedPage><FamiliesPage /></AnimatedPage>} />

            {/* Legacy redirects (precede /:zoneId catch-all) */}
            <Route path="/map" element={<Navigate to="/" replace />} />
            <Route path="/map/:zoneId" element={<LegacyMapRedirect />} />
            <Route path="/map/:zoneId/:placeSlug" element={<LegacyMapRedirect />} />
            <Route path="/place/:slug" element={<LegacyPlaceRedirect />} />
            <Route path="/zone/:name" element={<LegacyZoneRedirect />} />
            {/* Editor shortcut — keep before /:zoneId catch-all so it's not
                treated as an unknown zone and bounced to /. */}
            <Route path="/editor" element={<Navigate to="/?editor=true" replace />} />

            {/* Canonical map routes */}
            <Route path="/" element={<AnimatedPage><MapPage /></AnimatedPage>} />
            <Route path="/:zoneId" element={<AnimatedPage><MapPage /></AnimatedPage>} />
            <Route path="/:zoneId/:placeSlug" element={<AnimatedPage><MapPage /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </AuthProvider>
  );
}
