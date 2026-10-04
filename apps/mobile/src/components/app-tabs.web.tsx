import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { colors, radius, spacing } from '@/constants/theme';
import { useCartCount } from '@/store/cart';

// Native tabs are iOS/Android only; on web the same routes get a simple bottom bar.
export default function AppTabs() {
  const cartCount = useCartCount();

  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={styles.bar}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="home" label="Нүүр" />
        </TabTrigger>
        <TabTrigger name="menu" href="/menu" asChild>
          <TabButton icon="menu" label="Цэс" />
        </TabTrigger>
        <TabTrigger name="cart" href="/cart" asChild>
          <TabButton icon="cart" label="Сагс" badge={cartCount} />
        </TabTrigger>
        <TabTrigger name="orders" href="/orders" asChild>
          <TabButton icon="orders" label="Захиалга" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: IconName; label: string; badge?: number };

function TabButton({ icon, label, badge, isFocused, ...props }: TabButtonProps) {
  const color = isFocused ? colors.primary : colors.textMuted;
  return (
    <Pressable {...props} style={styles.tab}>
      <View>
        <Icon name={icon} size={22} color={color} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: { fontSize: 11, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onPrimary, fontSize: 11, fontWeight: '700' },
});
