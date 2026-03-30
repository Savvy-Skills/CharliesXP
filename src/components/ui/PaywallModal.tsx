import { Modal } from './Modal';
import { Lock, Check } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName: string;
  onUnlock: () => void;
}

export function PaywallModal({ isOpen, onClose, zoneName, onUnlock }: PaywallModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 pt-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--sg-crimson)]/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-[var(--sg-crimson)]" />
        </div>

        <h2 className="font-display text-xl font-bold text-[var(--sg-navy)] mb-2">
          Unlock {zoneName}
        </h2>
        <p className="text-sm text-[var(--sg-navy)]/60 mb-6">
          Get full access to all restaurants, cafes, bars, and hidden gems in this zone.
        </p>

        <div className="bg-[var(--sg-offwhite)] rounded-xl p-5 mb-6 text-left">
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <span className="text-3xl font-bold text-[var(--sg-navy)]">£3.99</span>
            <span className="text-sm text-[var(--sg-navy)]/60">/zone</span>
          </div>

          <ul className="space-y-2">
            {[
              'All places & recommendations',
              'Detailed reviews & ratings',
              'Insider tips & hidden gems',
              '30 days of full access',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-[var(--sg-navy)]">
                <Check size={14} className="text-green-600 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onUnlock}
          className="w-full py-3 rounded-xl bg-[var(--sg-crimson)] hover:bg-[var(--sg-crimson-hover)] text-white
            font-semibold transition-all cursor-pointer text-sm shadow-md"
        >
          Unlock {zoneName} — £3.99
        </button>

        <div className="mt-3">
          <button
            onClick={onClose}
            className="text-xs text-[var(--sg-navy)]/60 hover:text-[var(--sg-crimson)] transition-colors cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
}
