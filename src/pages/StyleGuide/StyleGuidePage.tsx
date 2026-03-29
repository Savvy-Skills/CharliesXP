import { useEffect, useRef, useState } from 'react';
import { StyleGuideSidebar } from './StyleGuideSidebar';
import { SGTypography } from './sections/SGTypography';
import { SGColourPalette } from './sections/SGColourPalette';
import { SGButtons } from './sections/SGButtons';
import { SGCards } from './sections/SGCards';
import { SGFormControls } from './sections/SGFormControls';
import { SGChips } from './sections/SGChips';
import { SGBadges } from './sections/SGBadges';
import { SGDialogs } from './sections/SGDialogs';
import { SGLists } from './sections/SGLists';
import { SGNavigation } from './sections/SGNavigation';
import { SGProgress } from './sections/SGProgress';
import { SGSnackbars } from './sections/SGSnackbars';
import { SGTooltips } from './sections/SGTooltips';
import { SGDividers } from './sections/SGDividers';
import { SGAvatars } from './sections/SGAvatars';
import { SGIcons } from './sections/SGIcons';
import { SGDataTable } from './sections/SGDataTable';
import { SGBanners } from './sections/SGBanners';
import { SG_SECTIONS, type SGSectionId } from './sg-tokens';

export function StyleGuidePage() {
  const [activeSection, setActiveSection] = useState<SGSectionId>('typography');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sections = SG_SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SGSectionId);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    sections.forEach((el) => observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--sg-offwhite)',
        '--sg-crimson': '#9D3A3D',
        '--sg-navy': '#353C4F',
        '--sg-thames': '#6676A8',
        '--sg-offwhite': '#F7F4F0',
        '--sg-border': '#D8D0C8',
        '--sg-font': '"Cormorant Garamond", serif',
      } as React.CSSProperties}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center px-8 h-14 border-b backdrop-blur-sm"
        style={{
          background: 'rgba(247,244,240,0.9)',
          borderColor: 'var(--sg-border)',
        }}
      >
        <a
          href="/"
          className="text-sm mr-6 opacity-50 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}
        >
          ← Back
        </a>
        <span
          className="text-base font-semibold tracking-tight"
          style={{ fontFamily: 'var(--sg-font)', color: 'var(--sg-crimson)' }}
        >
          CharliesXP — Style Guide
        </span>
      </header>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8 flex gap-12 pt-8 pb-32">
        <StyleGuideSidebar activeSection={activeSection} />

        <main className="flex-1 min-w-0 space-y-16">
          <SGTypography />
          <SGColourPalette />
          <SGButtons />
          <SGCards />
          <SGFormControls />
          <SGChips />
          <SGBadges />
          <SGDialogs />
          <SGLists />
          <SGNavigation />
          <SGProgress />
          <SGSnackbars />
          <SGTooltips />
          <SGDividers />
          <SGAvatars />
          <SGIcons />
          <SGDataTable />
          <SGBanners />
        </main>
      </div>
    </div>
  );
}
