import { Modal } from './Modal';
import { Lock, Check, MapPin } from 'lucide-react';

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
        <div className="w-14 h-14 rounded-full bg-[#7c2d36]/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-[#7c2d36]" />
        </div>

        <h2 className="font-serif text-xl font-bold text-[#2d1f1a] mb-2">
          Unlock {zoneName}
        </h2>
        <p className="text-sm text-[#8b7355] mb-6">
          Get full access to all restaurants, cafes, bars, and hidden gems in this zone.
        </p>

        <div className="bg-[#faf8f5] rounded-xl p-5 mb-6 text-left">
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <span className="text-3xl font-bold text-[#2d1f1a]">£3.99</span>
            <span className="text-sm text-[#8b7355]">/zone</span>
          </div>

          <ul className="space-y-2">
            {[
              'All places & recommendations',
              'Detailed reviews & ratings',
              'Insider tips & hidden gems',
              '30 days of full access',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-[#5c3a2e]">
                <Check size={14} className="text-green-600 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onUnlock}
          className="w-full py-3 rounded-xl bg-[#c9a96e] hover:bg-[#b89555] text-white
            font-semibold transition-colors cursor-pointer text-sm shadow-md"
        >
          Unlock {zoneName} — £3.99
        </button>

        <div className="mt-3">
          <button
            onClick={onClose}
            className="text-xs text-[#8b7355] hover:text-[#7c2d36] transition-colors cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
}
