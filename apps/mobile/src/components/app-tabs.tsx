import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { colors } from '@/constants/theme';
import { useCartCount } from '@/store/cart';

export default function AppTabs() {
  const cartCount = useCartCount();

  return (
    <NativeTabs
      tintColor={colors.primary}
      backgroundColor={colors.surface}
      indicatorColor={colors.surfaceMuted}
      labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Нүүр</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="menu">
        <NativeTabs.Trigger.Label>Цэс</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'cup.and.saucer', selected: 'cup.and.saucer.fill' }}
          md="local_cafe"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cart">
        <NativeTabs.Trigger.Label>Сагс</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bag', selected: 'bag.fill' }} md="shopping_bag" />
        {cartCount > 0 ? <NativeTabs.Trigger.Badge>{String(cartCount)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="orders">
        <NativeTabs.Trigger.Label>Захиалга</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'list.bullet.rectangle.portrait', selected: 'list.bullet.rectangle.portrait.fill' }}
          md="receipt_long"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
