import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--sg-offwhite)]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
