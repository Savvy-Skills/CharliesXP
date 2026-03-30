export const SG_COLORS = {
  crimson: '#9D3A3D',
  navy: '#353C4F',
  thames: '#6676A8',
  offwhite: '#F7F4F0',
  border: '#D8D0C8',
} as const;

export const SG_SECTIONS = [
  { id: 'typography',    label: 'Typography' },
  { id: 'colour',        label: 'Colour Palette' },
  { id: 'buttons',       label: 'Buttons' },
  { id: 'cards',         label: 'Cards' },
  { id: 'form-controls', label: 'Form Controls' },
  { id: 'chips',         label: 'Chips' },
  { id: 'badges',        label: 'Badges' },
  { id: 'dialogs',       label: 'Dialogs' },
  { id: 'lists',         label: 'Lists' },
  { id: 'navigation',    label: 'Navigation' },
  { id: 'progress',      label: 'Progress' },
  { id: 'snackbars',     label: 'Snackbars' },
  { id: 'tooltips',      label: 'Tooltips' },
  { id: 'dividers',      label: 'Dividers' },
  { id: 'avatars',       label: 'Avatars' },
  { id: 'icons',         label: 'Icons' },
  { id: 'data-table',    label: 'Data Table' },
  { id: 'banners',       label: 'Banners' },
] as const;

export type SGSectionId = typeof SG_SECTIONS[number]['id'];
