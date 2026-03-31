import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Modal } from './Modal';
import { Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePackages } from '../../hooks/usePackages';
import type { Package } from '../../types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName: string;
  zoneId: string;
}

export function PaywallModal({ isOpen, onClose, zoneName, zoneId }: PaywallModalProps) {
  const { isLoggedIn, zoneCredits, refreshAccess } = useAuth();
  const navigate = useNavigate();
  const { packages } = usePackages();
  const [redeeming, setRedeeming] = useState(false);

  const handleBuyPackage = async (pkg: Package) => {
    if (!isLoggedIn) {
      navigate('/login');
      onClose();
      return;
    }

    const body: Record<string, unknown> = { package_id: pkg.id };
    if (pkg.slug === 'individual') {
      body.zone_ids = [zoneId];
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body,
    });

    if (error) {
      console.error('Checkout error:', error);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const handleRedeemCredit = async () => {
    setRedeeming(true);
    const { error } = await supabase.functions.invoke('redeem-zone-credit', {
      body: { zone_id: zoneId },
    });

    if (error) {
      console.error('Redeem error:', error);
      setRedeeming(false);
      return;
    }

    await refreshAccess();
    setRedeeming(false);
    onClose();
  };

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

        {zoneCredits > 0 && (
          <div className="mb-4">
            <button
              onClick={handleRedeemCredit}
              disabled={redeeming}
              className="w-full py-3 rounded-xl bg-[var(--sg-thames)] hover:bg-[var(--sg-thames-hover)] text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {redeeming ? 'Unlocking...' : `Use zone credit (${zoneCredits} remaining)`}
            </button>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[var(--sg-border)]" />
              <span className="text-xs text-[var(--sg-navy)]/40">or buy a package</span>
              <div className="flex-1 h-px bg-[var(--sg-border)]" />
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handleBuyPackage(pkg)}
              className="w-full p-4 rounded-xl border border-[var(--sg-border)] bg-[var(--sg-offwhite)] hover:border-[var(--sg-crimson)]/30 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-[var(--sg-navy)]">{pkg.name}</span>
                <span className="text-sm font-bold text-[var(--sg-crimson)]">
                  {'\u00A3'}{(pkg.price_cents / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-[var(--sg-navy)]/60">
                {pkg.slug === 'individual' && 'Unlock this zone'}
                {pkg.slug === 'smile' && '5 zones of your choice'}
                {pkg.slug === 'atane' && 'Unlock everything — all zones'}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="text-xs text-[var(--sg-navy)]/60 hover:text-[var(--sg-crimson)] transition-colors cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
