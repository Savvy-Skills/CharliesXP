import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="bg-[#2d1f1a]">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <span className="font-display text-xl font-bold text-white">Interest Map</span>
            <p className="text-sm text-[#8b7355] mt-1">Curated London, neighbourhood by neighbourhood.</p>
          </div>

          <nav className="flex gap-8 text-sm">
            <Link to="/#zones" className="text-[#b8a08a] hover:text-white transition-colors">
              Zones
            </Link>
            <Link to="/#about" className="text-[#b8a08a] hover:text-white transition-colors">
              About
            </Link>
          </nav>
        </div>

        <div className="mt-10 pt-8 border-t border-[#3d2f2a] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6b5544]">
            &copy; 2026 Interest Map. Built with Mapbox.
          </p>
          <p className="text-xs text-[#6b5544]">
            London, United Kingdom
          </p>
        </div>
      </div>
    </footer>
  );
}
