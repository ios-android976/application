import { ORDER_STATUS_LABELS, type OrderStatus } from '@coffee/shared';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, statusColors } from '@/constants/theme';

export function StatusBadge({ status }: { status: OrderStatus }) {
  const palette = statusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>{ORDER_STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
