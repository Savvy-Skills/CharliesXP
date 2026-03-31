import { useState, useRef } from 'react';
import { Link } from 'react-router';
import { Menu, X, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SECTIONS } from '../../pages/TheLondonILoveData';

const SIMPLE_NAV = [
  { to: '/who-is-charlie', label: 'Who is Charlie' },
  { to: '/families', label: 'Families' },
  { to: '/#zones', label: 'Zones' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [londonOpen, setLondonOpen] = useState(false);
  const [mobileEditorialOpen, setMobileEditorialOpen] = useState(false);
  const { isLoggedIn, signOut, isAdmin } = useAuth();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDropdown = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setLondonOpen(true);
  };

  const closeDropdown = () => {
    closeTimer.current = setTimeout(() => setLondonOpen(false), 120);
  };

  return (
    <header
      className="sticky top-0 z-50 bg-[var(--sg-offwhite)]/97 backdrop-blur-lg"
      style={{ boxShadow: '0 1px 0 var(--sg-border), 0 4px 16px rgba(53,60,79,0.04)' }}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center group" aria-label="Charlies XP — home">
          <img
            src="/logo.jpg"
            alt="Charlies XP — Experience London Like a Londoner"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <nav aria-label="Main navigation" className="flex items-center gap-6">

            {/* The London I Love — dropdown */}
            <div
              className="relative"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
            >
              <Link
                to="/the-london-i-love"
                aria-haspopup="true"
                aria-expanded={londonOpen}
                className="flex items-center gap-1 relative text-sm font-medium text-[var(--sg-navy)]/60 hover:text-[var(--sg-navy)] transition-colors
                  after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px]
                  after:bg-[var(--sg-thames)] after:transition-all after:duration-300
                  hover:after:w-full"
              >
                The London I Love
                <ChevronDown size={13} aria-hidden="true" className={`transition-transform duration-200 ${londonOpen ? 'rotate-180' : ''}`} />
              </Link>

              {londonOpen && (
                <div
                  role="menu"
                  aria-label="The London I Love sections"
                  className="absolute top-full left-0 mt-3 w-64 bg-white rounded-xl border border-[var(--sg-border)] shadow-lg overflow-hidden z-50"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  <div className="p-1.5">
                    {SECTIONS.map((section) => (
                      <Link
                        key={section.slug}
                        to={`/the-london-i-love/${section.slug}`}
                        role="menuitem"
                        onClick={() => setLondonOpen(false)}
                        className="block px-4 py-2.5 rounded-lg text-sm text-[var(--sg-navy)]/70 hover:text-[var(--sg-navy)] hover:bg-[var(--sg-offwhite)] transition-colors"
                      >
                        <span className="font-medium">{section.shortLabel}</span>
                        <span className="block text-xs text-[var(--sg-navy)]/40 mt-0.5">{section.subtitle}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {SIMPLE_NAV.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="relative text-sm font-medium text-[var(--sg-navy)]/60 hover:text-[var(--sg-navy)] transition-colors
                  after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px]
                  after:bg-[var(--sg-thames)] after:transition-all after:duration-300
                  hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="w-px h-6 bg-[var(--sg-border)]" aria-hidden="true" />

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin" className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--sg-navy)]/60 hover:text-[var(--sg-navy)] hover:bg-[var(--sg-border)] transition-colors">
                  Admin
                </Link>
              )}
              <Link to="/account" className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--sg-navy)]/60 hover:text-[var(--sg-navy)] hover:bg-[var(--sg-border)] transition-colors">
                Account
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--sg-offwhite)] text-[var(--sg-navy)] hover:bg-[var(--sg-border)] transition-all cursor-pointer"
              >
                <User size={14} /> Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--sg-thames)] text-white hover:bg-[var(--sg-thames-hover)] shadow-sm hover:shadow-md transition-all"
            >
              <User size={14} /> Login / Register
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl
            text-[var(--sg-navy)] hover:bg-[var(--sg-border)] cursor-pointer transition-colors"
        >
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav id="mobile-menu" aria-label="Mobile navigation" className="md:hidden border-t border-[var(--sg-border)] bg-[var(--sg-offwhite)] px-5 py-4 space-y-1">

          {/* The London I Love — expandable */}
          <div>
            <button
              onClick={() => setMobileEditorialOpen(!mobileEditorialOpen)}
              aria-expanded={mobileEditorialOpen}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium
                text-[var(--sg-navy)] hover:bg-[var(--sg-border)] transition-colors cursor-pointer"
            >
              The London I Love
              <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-200 ${mobileEditorialOpen ? 'rotate-180' : ''} text-[var(--sg-navy)]/40`} />
            </button>
            {mobileEditorialOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {SECTIONS.map((section) => (
                  <Link
                    key={section.slug}
                    to={`/the-london-i-love/${section.slug}`}
                    onClick={() => { setMenuOpen(false); setMobileEditorialOpen(false); }}
                    className="block px-4 py-2.5 rounded-xl text-sm text-[var(--sg-navy)]/70 hover:bg-[var(--sg-border)] transition-colors"
                  >
                    {section.shortLabel}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {SIMPLE_NAV.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-[var(--sg-navy)]
                hover:bg-[var(--sg-border)] transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-[var(--sg-navy)] hover:bg-[var(--sg-border)] transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/account"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-[var(--sg-navy)] hover:bg-[var(--sg-border)] transition-colors"
              >
                Account
              </Link>
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="w-full mt-2 px-4 py-3 rounded-xl text-sm font-semibold text-center
                  bg-[var(--sg-offwhite)] text-[var(--sg-navy)] hover:bg-[var(--sg-border)] transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block mt-2 px-4 py-3 rounded-xl text-sm font-semibold text-center
                bg-[var(--sg-thames)] text-white hover:bg-[var(--sg-thames-hover)] transition-colors"
            >
              Login / Register
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
