import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="bg-[var(--sg-navy)]" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
        <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-10">

          {/* Brand */}
          <div className="max-w-xs">
            <Link to="/" className="font-display text-xl font-bold text-white hover:text-white/80 transition-colors">
              Charlies XP
            </Link>
            <p className="text-sm text-white/50 mt-2 leading-relaxed">
              Curated London, neighbourhood by neighbourhood. Personal, human, editorial.
            </p>
          </div>

          {/* Nav columns */}
          <div className="flex flex-wrap gap-x-16 gap-y-8 text-sm">
            <nav aria-label="Editorial pages">
              <p className="text-white/30 font-semibold uppercase tracking-wider text-xs mb-3">Editorial</p>
              <ul className="space-y-2">
                <li><Link to="/the-london-i-love" className="text-white/60 hover:text-white transition-colors">The London I Love</Link></li>
                <li><Link to="/the-london-i-love/welcome" className="text-white/60 hover:text-white transition-colors">Where it Begins</Link></li>
                <li><Link to="/the-london-i-love/the-city" className="text-white/60 hover:text-white transition-colors">River. Rhythm. History.</Link></li>
                <li><Link to="/the-london-i-love/power-politics" className="text-white/60 hover:text-white transition-colors">Crown. Parliament. Power.</Link></li>
                <li><Link to="/the-london-i-love/culture-daily-life" className="text-white/60 hover:text-white transition-colors">Pubs. Roasts. Black cabs.</Link></li>
              </ul>
            </nav>

            <nav aria-label="Site pages">
              <p className="text-white/30 font-semibold uppercase tracking-wider text-xs mb-3">Explore</p>
              <ul className="space-y-2">
                <li><Link to="/" className="text-white/60 hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/map" className="text-white/60 hover:text-white transition-colors">Map</Link></li>
                <li><Link to="/who-is-charlie" className="text-white/60 hover:text-white transition-colors">Who is Charlie</Link></li>
                <li><Link to="/families" className="text-white/60 hover:text-white transition-colors">Families</Link></li>
                <li><Link to="/#zones" className="text-white/60 hover:text-white transition-colors">Zones</Link></li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; 2026 Charlies XP. London, United Kingdom.
          </p>
          <p className="text-xs text-white/40">
            charliesxp.com · The London I Love · Confidential · 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
