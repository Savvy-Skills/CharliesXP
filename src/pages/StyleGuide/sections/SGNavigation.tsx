import { useState } from 'react';
import { MapPin, Star, BookOpen, User } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { SectionShell } from '../SectionShell';

const tabs = [
  { id: 'explore', label: 'Explore', icon: MapPin },
  { id: 'saved', label: 'Saved', icon: Star },
  { id: 'guides', label: 'Guides', icon: BookOpen },
  { id: 'profile', label: 'Profile', icon: User },
];

const breadcrumbItems = [
  { label: 'Home', href: '#navigation' },
  { label: 'Southwark', href: '#navigation' },
  { label: 'Borough Market', href: '#navigation' },
];

export function SGNavigation() {
  const [activeTab, setActiveTab] = useState('explore');

  return (
    <SectionShell id="navigation" title="Navigation">
      <div className="space-y-10">
        {/* Tab bar */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Tab Bar</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--sg-border)', background: '#fff' }}>
            <div className="flex" style={{ borderBottom: '1px solid var(--sg-border)' }}>
              {tabs.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative"
                    style={{
                      color: active ? 'var(--sg-crimson)' : 'var(--sg-navy)',
                      opacity: active ? 1 : 0.5,
                      fontFamily: 'var(--sg-font)',
                    }}
                  >
                    <Icon size={18} />
                    {label}
                    {active && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                        style={{ background: 'var(--sg-crimson)' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-4 text-sm" style={{ color: 'var(--sg-navy)', opacity: 0.5, fontFamily: 'var(--sg-font)' }}>
              Active tab: <strong style={{ color: 'var(--sg-crimson)', opacity: 1 }}>{tabs.find(t => t.id === activeTab)?.label}</strong>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'var(--sg-font)' }}>Breadcrumbs</p>
          <nav className="flex items-center flex-wrap gap-1">
            {breadcrumbItems.map((item, i) => (
              <span key={item.label} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={14} style={{ color: 'var(--sg-navy)', opacity: 0.3 }} />}
                {i === breadcrumbItems.length - 1 ? (
                  <span className="text-sm font-semibold" style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>
                    {item.label}
                  </span>
                ) : (
                  <a
                    href={item.href}
                    className="text-sm transition-opacity hover:opacity-75"
                    style={{ color: 'var(--sg-thames)', fontFamily: 'var(--sg-font)' }}
                  >
                    {item.label}
                  </a>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </SectionShell>
  );
}
