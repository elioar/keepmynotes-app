import { Ionicons } from '@expo/vector-icons';

export const TAG_COLORS = {
  none: 'transparent',
  green: '#4CAF50',
  purple: '#9C27B0',
  blue: '#2196F3',
  orange: '#FF9800',
  red: '#FF4E4E'
} as const;

export type TagColor = keyof typeof TAG_COLORS;

export const TAG_ICONS: Record<TagColor, keyof typeof Ionicons.glyphMap> = {
  none: 'remove-outline',
  green: 'person-outline',
  purple: 'briefcase-outline',
  blue: 'book-outline',
  orange: 'bulb-outline',
  red: 'alert-circle-outline'
};

export const TAG_LABELS: Record<TagColor, string> = {
  none: 'No Category',
  green: 'Personal',
  purple: 'Work',
  blue: 'Study',
  orange: 'Ideas',
  red: 'Important'
};

export function getTagColorValue(color: TagColor | null): string {
  if (!color || color === 'none') return 'transparent';
  return TAG_COLORS[color];
}

const tags = {
  TAG_COLORS,
  getTagColorValue
};

export default tags; 