import { PageShell } from '../components/Layout/PageShell';
import { SEOHead } from '../components/SEOHead';

export function FamiliesPage() {
  return (
    <PageShell>
      <SEOHead
        title="London with Kids"
        description="Exploring London with children, done properly. Charlie knows the difference between what looks good on a website and what actually works with a four-year-old in tow."
        path="/families"
        type="article"
      />
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-16">

        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--sg-thames)] font-semibold mb-3">
            Families
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--sg-navy)] leading-tight">
            London with kids,<br />done properly.
          </h1>
        </div>

        {/* Intro card */}
        <div className="im-card p-10 md:p-14">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--sg-crimson)] mb-7 leading-snug" id="intro">
            Exploring London With Kids
          </h2>
          <div className="space-y-5 text-[var(--sg-navy)]/70 leading-relaxed">
            <p>
              Charlies XP started with the same question most families ask — what are we doing this
              weekend? This half term? These holidays?
            </p>
            <p>
              London is one of the great family cities in the world. Most of its best museums are
              free. Its parks are vast and varied. Its river has boats on it. Its streets have
              history on every corner. And on a rainy day — which will happen — there is always
              somewhere to go.
            </p>
            <p>
              The tricky bit is knowing which things are genuinely worth it with children, and which
              things look good on a website and fall apart in reality. A four-year-old at the
              British Museum is a different experience to a ten-year-old. A rainy Tuesday is
              different to a sunny Saturday. Charlie knows the difference.
            </p>
            <p className="italic text-[var(--sg-navy)]">
              Start with where you're staying — or where you're heading.
            </p>
          </div>
        </div>

        {/* Coming soon indicator */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--sg-navy)]/40 font-medium">
            Family-specific recommendations and area guides coming soon.
          </p>
        </div>

      </div>
    </PageShell>
  );
}
