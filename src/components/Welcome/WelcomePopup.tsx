import { useState } from 'react';
import { Link } from 'react-router';
import { Modal } from '../ui/Modal';

const WELCOME_DISMISSED_KEY = 'welcome_dismissed';

export function hasDismissedWelcome(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(WELCOME_DISMISSED_KEY) === '1';
}

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomePopup({ isOpen, onClose }: WelcomePopupProps) {
  const [dontShow, setDontShow] = useState(false);

  const handleClose = () => {
    if (dontShow) {
      window.localStorage.setItem(WELCOME_DISMISSED_KEY, '1');
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <article className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <header className="text-center">
          <h2 className="font-display text-xl font-bold text-[var(--sg-crimson)]">
            About Interest Map
          </h2>
          <p className="text-sm text-[var(--sg-navy)]/70 leading-relaxed mt-2">
            A curated collection of the best spots in central London, from hidden cocktail bars
            to world-class museums. Every place has been personally visited and reviewed. Unlock
            zones to discover insider guides and hidden gems.
          </p>
        </header>

        <section className="pt-4 border-t border-[var(--sg-border)]">
          <h3 className="font-display text-lg font-bold text-[var(--sg-crimson)]">
            Why Charlie and not AI?
          </h3>
          <div className="space-y-2 text-sm text-[var(--sg-navy)]/75 leading-relaxed mt-2">
            <p>
              AI gives you information. Accurate, fast, impressive. But it has never actually
              been there.
            </p>
            <p className="font-medium text-[var(--sg-navy)]">
              Charlie has. Repeatedly. In all weathers.
            </p>
            <p>Information tells you what exists. Charlie tells you what's worth it.</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/who-is-charlie"
              onClick={handleClose}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                bg-[var(--sg-crimson)] hover:bg-[var(--sg-crimson-hover)] text-white text-sm font-semibold
                transition-colors"
            >
              Meet Charlie
            </Link>
            <Link
              to="/the-london-i-love"
              onClick={handleClose}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                bg-[var(--sg-offwhite)] hover:bg-[var(--sg-border)] text-[var(--sg-navy)] text-sm font-semibold
                transition-colors"
            >
              The London I Love
            </Link>
          </div>
        </section>

        <footer className="pt-4 border-t border-[var(--sg-border)] flex items-center justify-between gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-[var(--sg-navy)]/70 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="h-4 w-4 accent-[var(--sg-crimson)]"
            />
            Don't show this again
          </label>
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-lg bg-[var(--sg-navy)] text-white text-sm font-semibold
              hover:bg-[var(--sg-navy)]/90 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </footer>
      </article>
    </Modal>
  );
}
