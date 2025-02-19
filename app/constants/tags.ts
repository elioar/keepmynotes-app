export const TAG_COLORS = {
  none: 'transparent',
  green: '#4CAF50',
  purple: '#9C27B0',
  blue: '#2196F3',
  orange: '#FF9800',
  red: '#FF4E4E'
} as const;

export type TagColor = keyof typeof TAG_COLORS;

export function getTagColorValue(color: TagColor | null): string {
  if (!color || color === 'none') return 'transparent';
  return TAG_COLORS[color];
}

const tags = {
  TAG_COLORS,
  getTagColorValue
};

export default tags; 