import type { OrderStatus } from '@coffee/shared';
import { Platform } from 'react-native';

export const colors = {
  background: '#FBF7F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EBE1',
  border: '#E9DED1',
  text: '#2B1D14',
  textMuted: '#7D6B5D',
  primary: '#6F4E37',
  primaryPressed: '#5A3E2B',
  onPrimary: '#FFFFFF',
  accent: '#C8A27C',
  danger: '#B42318',
  dangerSurface: '#FEECEB',
  success: '#027A48',
  successSurface: '#E7F6EE',
} as const;

export const statusColors: Record<OrderStatus, { background: string; text: string }> = {
  pending: { background: '#FEF3C7', text: '#92400E' },
  preparing: { background: '#E0EAFF', text: '#2D3A8C' },
  ready: { background: '#D1FADF', text: '#05603A' },
  completed: { background: '#EFE8E1', text: '#5C4A3D' },
  cancelled: { background: '#FEE4E2', text: '#912018' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const fonts = {
  rounded: Platform.select({ ios: 'ui-rounded', default: undefined }),
};

/** Height of the native tab bar that floats over tab screens (web uses an in-flow bar). */
export const TAB_BAR_HEIGHT = Platform.select({ ios: 50, android: 80, default: 0 }) ?? 0;
