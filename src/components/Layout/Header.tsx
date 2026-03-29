import { useState } from 'react';
import { Link } from 'react-router';
import { Menu, X, User } from 'lucide-react';
import { useUser } from '../../hooks/useUser';

const NAV_LINKS = [
  { to: '/#zones', label: 'Zones' },
  { to: '/#about', label: 'About' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, login, logout } = useUser();

  return (
    <header className="sticky top-0 z-50 bg-[var(--sg-offwhite)]/97 backdrop-blur-lg"
      style={{ boxShadow: '0 1px 0 var(--sg-border), 0 4px 16px rgba(53,60,79,0.04)' }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[var(--sg-crimson)] flex items-center justify-center">
            <span className="text-white text-sm font-bold font-display">IM</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold text-[var(--sg-navy)] leading-none tracking-tight">
              Interest Map
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--sg-navy)]/40 font-medium hidden sm:block">
              London Guides
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
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

          <div className="w-px h-6 bg-[var(--sg-border)]" />

          <button
            onClick={isLoggedIn ? logout : login}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold
              transition-all duration-200 cursor-pointer
              ${isLoggedIn
                ? 'bg-[var(--sg-offwhite)] text-[var(--sg-navy)] hover:bg-[var(--sg-border)]'
                : 'bg-[var(--sg-thames)] text-white hover:bg-[#5565a0] shadow-sm hover:shadow-md'
              }`}
          >
            <User size={14} />
            {isLoggedIn ? 'Logout' : 'Login / Register'}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-xl text-[var(--sg-navy)] hover:bg-[var(--sg-offwhite)] cursor-pointer transition-colors"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-[var(--sg-border)] bg-[var(--sg-offwhite)] px-5 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
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
          <button
            onClick={() => { isLoggedIn ? logout() : login(); setMenuOpen(false); }}
            className="w-full mt-2 px-4 py-3 rounded-xl text-sm font-semibold text-center
              bg-[var(--sg-thames)] text-white hover:bg-[#5565a0] transition-colors cursor-pointer"
          >
            {isLoggedIn ? 'Logout' : 'Login / Register'}
          </button>
        </nav>
      )}
    </header>
  );
}
