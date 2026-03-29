import {
  ArrowLeft, ArrowUpRight, Edit3, Map, MapPin, Lock, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Star, Eye, Layers, Mountain, RotateCcw, Check,
  Menu, X, User, Plus, Download, Trash2, Sparkles, Calendar, ExternalLink,
  Link, Copy, Info, Bell, Search, Settings, Heart, Share2, Bookmark,
} from 'lucide-react';
import { SectionShell } from '../SectionShell';

const icons = [
  { name: 'ArrowLeft', Icon: ArrowLeft },
  { name: 'ArrowUpRight', Icon: ArrowUpRight },
  { name: 'Edit3', Icon: Edit3 },
  { name: 'Map', Icon: Map },
  { name: 'MapPin', Icon: MapPin },
  { name: 'Lock', Icon: Lock },
  { name: 'ChevronUp', Icon: ChevronUp },
  { name: 'ChevronDown', Icon: ChevronDown },
  { name: 'ChevronLeft', Icon: ChevronLeft },
  { name: 'ChevronRight', Icon: ChevronRight },
  { name: 'Star', Icon: Star },
  { name: 'Eye', Icon: Eye },
  { name: 'Layers', Icon: Layers },
  { name: 'Mountain', Icon: Mountain },
  { name: 'RotateCcw', Icon: RotateCcw },
  { name: 'Check', Icon: Check },
  { name: 'Menu', Icon: Menu },
  { name: 'X', Icon: X },
  { name: 'User', Icon: User },
  { name: 'Plus', Icon: Plus },
  { name: 'Download', Icon: Download },
  { name: 'Trash2', Icon: Trash2 },
  { name: 'Sparkles', Icon: Sparkles },
  { name: 'Calendar', Icon: Calendar },
  { name: 'ExternalLink', Icon: ExternalLink },
  { name: 'Link', Icon: Link },
  { name: 'Copy', Icon: Copy },
  { name: 'Info', Icon: Info },
  { name: 'Bell', Icon: Bell },
  { name: 'Search', Icon: Search },
  { name: 'Settings', Icon: Settings },
  { name: 'Heart', Icon: Heart },
  { name: 'Share2', Icon: Share2 },
  { name: 'Bookmark', Icon: Bookmark },
];

export function SGIcons() {
  return (
    <SectionShell id="icons" title="Icons">
      <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
        {icons.map(({ name, Icon }) => (
          <div
            key={name}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl cursor-default transition-colors hover:bg-white"
            style={{ border: '1px solid transparent' }}
            title={name}
          >
            <Icon
              size={22}
              className="transition-colors"
              style={{ color: 'var(--sg-navy)' }}
            />
            <span
              className="text-center leading-tight transition-colors"
              style={{ fontSize: '9px', color: 'var(--sg-navy)', opacity: 0.4, fontFamily: 'monospace' }}
            >
              {name}
            </span>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
