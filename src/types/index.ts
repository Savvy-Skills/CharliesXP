export interface Coordinates {
  lng: number;
  lat: number;
}

export interface Place {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: PlaceCategory;
  coordinates: Coordinates;
  address: string;
  markerIcon: string;
  markerImage: string;
  images: string[];
  visitDate: string;
  tags: Tag[];
  iconUrl: string | null;
  zoom: number;
  pitch: number;
  bearing: number;
  zone?: string;
  model?: {
    url: string;
    scale?: number;
    rotation?: [number, number, number];
  };
}

export interface Zone {
  id: string;
  name: string;
  postcode: string;
  description: string;
  color: string;
  centroid: { lng: number; lat: number };
  radius: number;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  color: string;
  sortOrder: number;
}

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'museum'
  | 'park'
  | 'beach'
  | 'landmark'
  | 'hotel'
  | 'shop'
  | 'other';

export const CATEGORIES: { value: PlaceCategory; label: string; color: string }[] = [
  { value: 'restaurant', label: 'Restaurant', color: '#ef4444' },
  { value: 'cafe', label: 'Café', color: '#f97316' },
  { value: 'bar', label: 'Bar', color: '#a855f7' },
  { value: 'museum', label: 'Museum', color: '#3b82f6' },
  { value: 'park', label: 'Park', color: '#22c55e' },
  { value: 'beach', label: 'Beach', color: '#06b6d4' },
  { value: 'landmark', label: 'Landmark', color: '#eab308' },
  { value: 'hotel', label: 'Hotel', color: '#ec4899' },
  { value: 'shop', label: 'Shop', color: '#8b5cf6' },
  { value: 'other', label: 'Other', color: '#6b7280' },
];

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export type MapZoomState = 'overview' | 'expanded' | 'zoneDetail';

export interface User {
  isLoggedIn: boolean;
  unlockedZones: string[];
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Package {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  benefits: Record<string, unknown>;
  stripe_price_id: string | null;
  active: boolean;
}

export interface Purchase {
  id: string;
  user_id: string;
  package_id: string;
  zone_ids: string[];
  zone_credits: number;
  stripe_session_id: string | null;
  amount_cents: number;
  created_at: string;
}

export interface UserZone {
  user_id: string;
  zone_id: string;
  purchase_id: string;
  granted_at: string;
}
