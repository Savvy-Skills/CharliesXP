import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--sg-offwhite)]">
      {/* Skip to main content — visible on focus for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]
          focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[var(--sg-crimson)] focus:text-white
          focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
