import { motion } from 'framer-motion';
import { SG_SECTIONS, type SGSectionId } from './sg-tokens';

interface StyleGuideSidebarProps {
  activeSection: SGSectionId;
}

export function StyleGuideSidebar({ activeSection }: StyleGuideSidebarProps) {
  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-14 pt-8 pb-20 pr-6 max-h-screen overflow-y-auto custom-scrollbar">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}
        >
          Components
        </p>
        <nav className="space-y-0.5">
          {SG_SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="relative flex items-center px-3 py-2 rounded-lg text-sm transition-colors group"
                style={{
                  color: isActive ? 'var(--sg-crimson)' : 'var(--sg-navy)',
                  fontFamily: 'var(--sg-font)',
                  fontWeight: isActive ? 600 : 400,
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(157,58,61,0.08)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative">{section.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
