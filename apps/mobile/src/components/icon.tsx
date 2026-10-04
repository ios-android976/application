import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { colors } from '@/constants/theme';

/** SF Symbols on iOS, Material Symbols on Android and web. */
const ICONS = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  menu: { ios: 'cup.and.saucer.fill', android: 'local_cafe', web: 'local_cafe' },
  cart: { ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' },
  orders: { ios: 'list.bullet.rectangle.portrait.fill', android: 'receipt_long', web: 'receipt_long' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  location: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
} satisfies Record<string, Exclude<SymbolViewProps['name'], string>>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
};

export function Icon({ name, size = 20, color = colors.text }: IconProps) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
