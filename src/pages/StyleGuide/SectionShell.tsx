import type { ReactNode } from 'react';
import { Link } from 'lucide-react';

interface SectionShellProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function SectionShell({ id, title, children }: SectionShellProps) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-8">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--sg-font)', color: 'var(--sg-crimson)' }}
        >
          {title}
        </h2>
        <a
          href={`#${id}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Link to ${title}`}
        >
          <Link size={16} style={{ color: 'var(--sg-thames)' }} />
        </a>
      </div>
      <div>{children}</div>
      <div
        className="mt-12 h-px"
        style={{ background: 'var(--sg-border)' }}
      />
    </section>
  );
}
