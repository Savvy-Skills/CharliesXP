import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Modal } from './Modal';
import { Lock, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePackages } from '../../hooks/usePackages';
import { ZONES } from '../../utils/zoneMapping';
import type { Package } from '../../types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName: string;
  zoneId: string;
}

export function PaywallModal({ isOpen, onClose, zoneName, zoneId }: PaywallModalProps) {
  const { isLoggedIn, unlockedZones, zoneCredits, refreshAccess } = useAuth();
  const navigate = useNavigate();
  const { packages } = usePackages();
  const [redeeming, setRedeeming] = useState(false);
  // Smile zone selection
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);

  const zoneCount = selectedPkg
    ? ((selectedPkg.benefits as Record<string, unknown>).zone_count as number) ?? 0
    : 0;

  const handleBuyPackage = async (pkg: Package) => {
    if (!isLoggedIn) {
      navigate('/login');
      onClose();
      return;
    }

    const benefits = pkg.benefits as Record<string, unknown>;

    // Individual: go straight to checkout with current zone
    if (benefits.zone_count === 1) {
      setCheckingOut(true);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { package_id: pkg.id, zone_ids: [zoneId] },
      });
      setCheckingOut(false);
      if (!error && data?.url) window.location.href = data.url;
      else console.error('Checkout error:', error);
      return;
    }

    // Unlock all: go straight to checkout
    if (benefits.unlock_all === true) {
      setCheckingOut(true);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { package_id: pkg.id },
      });
      setCheckingOut(false);
      if (!error && data?.url) window.location.href = data.url;
      else console.error('Checkout error:', error);
      return;
    }

    // Multi-zone (Smile): show zone picker with current zone pre-selected
    setSelectedPkg(pkg);
    setSelectedZones([zoneId]);
  };

  const toggleZone = (id: string) => {
    if (selectedZones.includes(id)) {
      setSelectedZones(selectedZones.filter((z) => z !== id));
    } else if (selectedZones.length < zoneCount) {
      setSelectedZones([...selectedZones, id]);
    }
  };

  const handleSmileCheckout = async () => {
    if (!selectedPkg || selectedZones.length === 0) return;
    setCheckingOut(true);
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { package_id: selectedPkg.id, zone_ids: selectedZones },
    });
    setCheckingOut(false);
    if (!error && data?.url) window.location.href = data.url;
    else console.error('Checkout error:', error);
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

  const handleClose = () => {
    setSelectedPkg(null);
    setSelectedZones([]);
    onClose();
  };

  // Zone picker view for Smile package
  if (selectedPkg) {
    const availableZones = ZONES.filter((z) => !unlockedZones.includes(z.id));

    return (
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className="p-6 pt-8">
          <h2 className="font-display text-lg font-bold text-[var(--sg-navy)] mb-1 text-center">
            Choose your zones
          </h2>
          <p className="text-sm text-[var(--sg-navy)]/60 mb-4 text-center">
            Select {zoneCount} zones for your {selectedPkg.name}
            <span className="block text-xs mt-1">
              {selectedZones.length}/{zoneCount} selected · 30 days access
            </span>
          </p>

          <div className="max-h-[300px] overflow-y-auto space-y-1.5 mb-4 pr-1">
            {availableZones.map((z) => {
              const isSelected = selectedZones.includes(z.id);
              const isFull = selectedZones.length >= zoneCount && !isSelected;
              return (
                <button
                  key={z.id}
                  onClick={() => toggleZone(z.id)}
                  disabled={isFull}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer
                    ${isSelected
                      ? 'bg-[var(--sg-crimson)]/10 border border-[var(--sg-crimson)]/30'
                      : isFull
                        ? 'bg-[var(--sg-offwhite)] opacity-40 cursor-not-allowed'
                        : 'bg-[var(--sg-offwhite)] hover:bg-[var(--sg-border)] border border-transparent'
                    }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0
                    ${isSelected ? 'border-[var(--sg-crimson)] bg-[var(--sg-crimson)]' : 'border-[var(--sg-border)]'}`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[var(--sg-navy)]">{z.id}</span>
                    <span className="text-xs text-[var(--sg-navy)]/40 ml-2 truncate">{z.description.split('—')[0]?.trim()}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSmileCheckout}
            disabled={selectedZones.length < zoneCount || checkingOut}
            className="w-full py-3 rounded-xl bg-[var(--sg-crimson)] hover:bg-[var(--sg-crimson-hover)] text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {checkingOut
              ? 'Redirecting to payment...'
              : selectedZones.length < zoneCount
                ? `Select ${zoneCount - selectedZones.length} more zone${zoneCount - selectedZones.length !== 1 ? 's' : ''}`
                : `Checkout · ${'\u00A3'}${(selectedPkg.price_cents / 100).toFixed(2)} for ${selectedZones.length} zones`}
          </button>

          <button
            onClick={() => { setSelectedPkg(null); setSelectedZones([]); }}
            className="w-full mt-2 text-xs text-[var(--sg-navy)]/60 hover:text-[var(--sg-crimson)] transition-colors cursor-pointer py-1"
          >
            Back to packages
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 pt-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--sg-crimson)]/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-[var(--sg-crimson)]" />
        </div>

        <h2 className="font-display text-xl font-bold text-[var(--sg-navy)] mb-2">
          Unlock {zoneName}
        </h2>
        <p className="text-sm text-[var(--sg-navy)]/60 mb-6">
          Get 30 days of full access to all restaurants, cafes, bars, and hidden gems in this zone.
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
          {packages.map((pkg) => {
            const benefits = pkg.benefits as Record<string, unknown>;
            return (
              <button
                key={pkg.id}
                onClick={() => handleBuyPackage(pkg)}
                disabled={checkingOut}
                className="w-full p-4 rounded-xl border border-[var(--sg-border)] bg-[var(--sg-offwhite)] hover:border-[var(--sg-crimson)]/30 transition-all cursor-pointer text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[var(--sg-navy)]">{pkg.name}</span>
                  <span className="text-sm font-bold text-[var(--sg-crimson)]">
                    {'\u00A3'}{(pkg.price_cents / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-[var(--sg-navy)]/60">
                  {benefits.zone_count === 1 && 'Unlock this zone · 30 days'}
                  {(benefits.zone_count as number) > 1 && `${benefits.zone_count} zones of your choice · 30 days`}
                  {benefits.unlock_all === true && 'Unlock all zones · 30 days'}
                </p>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleClose}
          className="text-xs text-[var(--sg-navy)]/60 hover:text-[var(--sg-crimson)] transition-colors cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
