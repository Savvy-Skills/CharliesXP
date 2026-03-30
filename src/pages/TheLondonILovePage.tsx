import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '../components/Layout/PageShell';
import { SEOHead } from '../components/SEOHead';
import { SECTIONS } from './TheLondonILoveData';

export function TheLondonILovePage() {
  return (
    <PageShell>
      <SEOHead
        title="The London I Love"
        description="London through the eyes of someone who has walked every part of it. Four sections covering the city's history, culture, politics, and daily life — from someone who actually lives it."
        path="/the-london-i-love"
        type="article"
      />
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-16">

        <div className="mb-14">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--sg-thames)] font-semibold mb-3">
            Editorial
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--sg-navy)] leading-tight mb-4">
            The London I Love
          </h1>
          <p className="text-[var(--sg-navy)]/60 text-lg leading-relaxed max-w-xl">
            London through the eyes of someone who has walked every part of it.
            Four sections. Dozens of stories.
          </p>
        </div>

        <div className="space-y-4">
          {SECTIONS.map((section, i) => (
            <Link
              key={section.slug}
              to={`/the-london-i-love/${section.slug}`}
              className="im-card flex items-center justify-between p-6 md:p-8 group"
            >
              <div>
                <p className="text-xs text-[var(--sg-navy)]/40 font-semibold uppercase tracking-wider mb-2">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--sg-navy)] group-hover:text-[var(--sg-crimson)] transition-colors leading-snug mb-1">
                  {section.label}
                </h2>
                <p className="text-sm text-[var(--sg-navy)]/50">{section.subtitle} · {section.cards.length} stories</p>
              </div>
              <ArrowRight
                size={20}
                className="shrink-0 ml-6 text-[var(--sg-border)] group-hover:text-[var(--sg-thames)] group-hover:translate-x-1 transition-all duration-200"
              />
            </Link>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--sg-border)] text-center">
          <p className="text-xs text-[var(--sg-navy)]/40 font-medium tracking-wide">
            charliesxp.com · The London I Love · Confidential · 2026
          </p>
        </div>

      </div>
    </PageShell>
  );
}
