import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PageShell } from '../components/Layout/PageShell';
import { SEOHead } from '../components/SEOHead';
import { SECTIONS, ContentCard } from './TheLondonILoveData';

export function LondonSectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const index = SECTIONS.findIndex((s) => s.slug === slug);
  const section = SECTIONS[index];

  if (!section) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-[var(--sg-navy)]/60 text-lg mb-4">Section not found</p>
          <Link to="/the-london-i-love" className="text-[var(--sg-crimson)] hover:text-[var(--sg-crimson-hover)] font-medium">
            Back to The London I Love
          </Link>
        </div>
      </PageShell>
    );
  }

  const prev = index > 0 ? SECTIONS[index - 1] : null;
  const next = index < SECTIONS.length - 1 ? SECTIONS[index + 1] : null;

  const sectionDescriptions: Record<string, string> = {
    welcome: "Essential context for first-time visitors — from understanding the UK to the city's ancient diversity and its surprising status as a forest.",
    'the-city': 'The Thames, the Meridian, the fire of 1666 — the physical and historical shape of London, told through stories worth knowing.',
    'power-politics': 'From the monarchy to Parliament, the Empire to council housing — how Britain has been governed, and how it shaped the city you walk through today.',
    'culture-daily-life': 'Pubs, Sunday roasts, the Knowledge, and the unwritten rules Londoners live by. How the city actually works, day to day.',
  };

  return (
    <PageShell>
      <SEOHead
        title={section.label}
        description={sectionDescriptions[section.slug] ?? `${section.label} — ${section.subtitle}.`}
        path={`/the-london-i-love/${section.slug}`}
        type="article"
      />
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-12">

        {/* Back link */}
        <div className="flex items-center gap-3 mb-10">
          <Link
            to="/the-london-i-love"
            className="p-2 rounded-xl bg-[var(--sg-offwhite)] hover:bg-[var(--sg-border)] text-[var(--sg-navy)]/60 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="text-sm text-[var(--sg-navy)]/50">The London I Love</span>
        </div>

        {/* Section header */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--sg-thames)] font-semibold mb-2">
            {String(index + 1).padStart(2, '0')} / {String(SECTIONS.length).padStart(2, '0')}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--sg-navy)] leading-tight mb-2">
            {section.label}
          </h1>
          <p className="text-sm text-[var(--sg-navy)]/50 font-medium">{section.subtitle}</p>
        </div>

        {/* Sub-section nav — all 4 sections */}
        <nav className="flex flex-wrap gap-2 mb-12 pb-8 border-b border-[var(--sg-border)]">
          {SECTIONS.map((s) => (
            <Link
              key={s.slug}
              to={`/the-london-i-love/${s.slug}`}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                ${s.slug === slug
                  ? 'bg-[var(--sg-crimson)] text-white'
                  : 'bg-white border border-[var(--sg-border)] text-[var(--sg-navy)]/60 hover:border-[var(--sg-thames)] hover:text-[var(--sg-navy)]'
                }`}
            >
              {s.shortLabel}
            </Link>
          ))}
        </nav>

        {/* Cards */}
        <div className="space-y-6">
          {section.cards.map((card) => (
            <ContentCard key={card.id} card={card} />
          ))}
        </div>

        {/* Prev / Next navigation */}
        <div className="mt-16 pt-8 border-t border-[var(--sg-border)] flex items-stretch gap-4">
          {prev ? (
            <Link
              to={`/the-london-i-love/${prev.slug}`}
              className="im-card flex-1 p-5 flex items-center gap-3 group"
            >
              <ArrowLeft size={16} className="shrink-0 text-[var(--sg-navy)]/40 group-hover:text-[var(--sg-thames)] transition-colors" />
              <div className="min-w-0">
                <p className="text-xs text-[var(--sg-navy)]/40 mb-0.5">Previous</p>
                <p className="text-sm font-semibold text-[var(--sg-navy)] group-hover:text-[var(--sg-crimson)] transition-colors truncate">
                  {prev.shortLabel}
                </p>
              </div>
            </Link>
          ) : <div className="flex-1" />}

          {next ? (
            <Link
              to={`/the-london-i-love/${next.slug}`}
              className="im-card flex-1 p-5 flex items-center justify-end gap-3 group text-right"
            >
              <div className="min-w-0">
                <p className="text-xs text-[var(--sg-navy)]/40 mb-0.5">Next</p>
                <p className="text-sm font-semibold text-[var(--sg-navy)] group-hover:text-[var(--sg-crimson)] transition-colors truncate">
                  {next.shortLabel}
                </p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-[var(--sg-navy)]/40 group-hover:text-[var(--sg-thames)] transition-colors" />
            </Link>
          ) : <div className="flex-1" />}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-[var(--sg-navy)]/40 font-medium tracking-wide">
            charliesxp.com · The London I Love · Confidential · 2026
          </p>
        </div>

      </div>
    </PageShell>
  );
}
