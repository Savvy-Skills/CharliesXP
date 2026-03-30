import { PageShell } from '../components/Layout/PageShell';
import { SEOHead } from '../components/SEOHead';

export function WhoIsCharliePage() {
  return (
    <PageShell>
      <SEOHead
        title="Who is Charlie"
        description="Charlie isn't a guidebook author or a critic — just someone deeply curious about London. Find out why human curation beats AI for finding what's actually worth your time."
        path="/who-is-charlie"
        type="article"
      />
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 space-y-8">

        {/* Hero card */}
        <div className="im-card p-10 md:p-14">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--sg-thames)] font-semibold mb-5">
            Who is Charlie
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--sg-navy)] leading-tight mb-8">
            Not a guidebook.<br />Just someone who knows.
          </h1>
          <div className="space-y-4 text-[var(--sg-navy)]/70 leading-relaxed text-lg">
            <p>Charlie isn't a guidebook author or a critic.</p>
            <p>Just someone deeply curious about London — and genuinely passionate about how it's experienced.</p>
            <p className="font-medium text-[var(--sg-navy)]">Chosen with confidence.</p>
            <p className="text-[var(--sg-navy)]/60">Start with a postcode near you.</p>
          </div>
        </div>

        {/* Q&A card — trust anchor */}
        <div className="im-card p-10 md:p-14">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--sg-crimson)] mb-7 leading-snug">
            Why Charlie and not AI?
          </h2>
          <div className="space-y-5 text-[var(--sg-navy)]/70 leading-relaxed">
            <p className="font-medium text-[var(--sg-navy)]">Good question. Genuinely.</p>
            <p>
              AI will give you information. Accurate, fast, and often impressive. Ask it for things
              to do in London with two kids under five and a partner who hates queues — and it will
              give you a reasonable list. It might even be a good one.
            </p>
            <p className="font-semibold text-[var(--sg-navy)]">But it has never actually been there.</p>
            <p>
              It doesn't know that the market is only worth it before 9am on a Saturday. It has
              never walked that route on a rainy Wednesday in November and known — in the way you
              only know from being somewhere — that the café on the corner is worth the detour. It
              doesn't know that taking the Tube from Embankment to Charing Cross is one of London's
              great wastes of time — the stations are so close you can practically see one from the
              other, and you'll spend longer waiting for the lift than the entire walk takes. It has
              never tested the food, sat in the parks, seen the shows, felt the weather, or — and
              this matters more than people admit — worked out which loos are actually worth knowing
              about.
            </p>
            <p className="font-medium text-[var(--sg-navy)]">Charlie has done all of that. Repeatedly. In all weathers.</p>
            <p>
              Information tells you what exists. Charlie tells you what's worth it — for you,
              specifically, on the day you're actually there.
            </p>
            <p className="italic text-[var(--sg-navy)]">That's not something you can search for.</p>
          </div>
        </div>

        {/* What Charlie Does card */}
        <div className="im-card p-10 md:p-14">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--sg-thames)] font-semibold mb-5">
            What Charlie Does
          </p>
          <div className="space-y-5 text-[var(--sg-navy)]/70 leading-relaxed">
            <p>
              There's no algorithm. No sponsored results. No partners.{' '}
              <span className="text-[var(--sg-navy)]">
                When something is recommended, it's because Charlie has been there, tried it, and
                genuinely thinks you'll love it.
              </span>{' '}
              When it's not, it's for the same reason.
            </p>
            <p>
              Your plan is built around you — your time, your group, your interests, your pace.{' '}
              Not what's most popular, most Instagrammed, or placed there for a reason.
            </p>
            <p>
              London offers plenty. Choosing well is what matters.{' '}
              Charlie loves finding what's worth it — and making sure you don't miss it.
            </p>
            <div className="border-l-2 border-[var(--sg-crimson)] pl-6 my-8 space-y-2">
              <p className="text-[var(--sg-navy)] font-medium">The right things stand out.</p>
              <p className="text-[var(--sg-navy)] font-medium">Time well spent.</p>
            </div>
            <p>
              Charlie isn't trying to show you London.
            </p>
            <p className="font-display text-xl font-bold text-[var(--sg-navy)] italic">
              He's trying to show you your London.
            </p>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
