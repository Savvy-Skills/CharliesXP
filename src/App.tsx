import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { UserProvider } from './hooks/useUser';

// Code-split every route for optimal initial load
const LandingPage       = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const FullScreenMapPage = lazy(() => import('./pages/FullScreenMapPage').then(m => ({ default: m.FullScreenMapPage })));
const PlaceDetailPage   = lazy(() => import('./pages/PlaceDetailPage').then(m => ({ default: m.PlaceDetailPage })));
const ZoneDetailPage    = lazy(() => import('./pages/ZoneDetailPage').then(m => ({ default: m.ZoneDetailPage })));
const EditorPage        = lazy(() => import('./pages/EditorPage').then(m => ({ default: m.EditorPage })));
const StyleGuidePage    = lazy(() => import('./pages/StyleGuide/StyleGuidePage').then(m => ({ default: m.StyleGuidePage })));
const WhoIsCharliePage  = lazy(() => import('./pages/WhoIsCharliePage').then(m => ({ default: m.WhoIsCharliePage })));
const TheLondonILovePage = lazy(() => import('./pages/TheLondonILovePage').then(m => ({ default: m.TheLondonILovePage })));
const LondonSectionPage = lazy(() => import('./pages/LondonSectionPage').then(m => ({ default: m.LondonSectionPage })));
const FamiliesPage      = lazy(() => import('./pages/FamiliesPage').then(m => ({ default: m.FamiliesPage })));

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

export default function App() {
  const location = useLocation();

  return (
    <UserProvider>
      <Suspense fallback={<PageFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} />
            <Route path="/explore" element={<FullScreenMapPage />} />
            <Route path="/place/:id" element={<AnimatedPage><PlaceDetailPage /></AnimatedPage>} />
            <Route path="/zone/:name" element={<AnimatedPage><ZoneDetailPage /></AnimatedPage>} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/style-guide" element={<StyleGuidePage />} />
            <Route path="/who-is-charlie" element={<AnimatedPage><WhoIsCharliePage /></AnimatedPage>} />
            <Route path="/the-london-i-love" element={<AnimatedPage><TheLondonILovePage /></AnimatedPage>} />
            <Route path="/the-london-i-love/:slug" element={<AnimatedPage><LondonSectionPage /></AnimatedPage>} />
            <Route path="/families" element={<AnimatedPage><FamiliesPage /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </UserProvider>
  );
}
