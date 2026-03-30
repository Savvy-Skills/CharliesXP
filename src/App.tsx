import { Routes, Route, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { UserProvider } from './hooks/useUser';
import { LandingPage } from './pages/LandingPage';
import { FullScreenMapPage } from './pages/FullScreenMapPage';
import { PlaceDetailPage } from './pages/PlaceDetailPage';
import { ZoneDetailPage } from './pages/ZoneDetailPage';
import { EditorPage } from './pages/EditorPage';
import { StyleGuidePage } from './pages/StyleGuide/StyleGuidePage';

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
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname === '/map' ? '/' : location.pathname}>
          <Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} />
          <Route path="/map" element={<AnimatedPage><LandingPage /></AnimatedPage>} />
          <Route path="/explore" element={<FullScreenMapPage />} />
          <Route path="/place/:id" element={<AnimatedPage><PlaceDetailPage /></AnimatedPage>} />
          <Route path="/zone/:name" element={<AnimatedPage><ZoneDetailPage /></AnimatedPage>} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/style-guide" element={<StyleGuidePage />} />
        </Routes>
      </AnimatePresence>
    </UserProvider>
  );
}
