import { formatDateTime, formatOrderNumber, formatPrice, type PublicOrder } from '@coffee/shared';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { StatusBadge } from '@/components/status-badge';
import { colors, radius, spacing } from '@/constants/theme';

export function summarizeItems(order: Pick<PublicOrder, 'items'>): string {
  return order.items
    .map((item) => `${item.product_name}${item.size ? ` (${item.size})` : ''} ×${item.quantity}`)
    .join(', ');
}

export function OrderCard({ order }: { order: PublicOrder }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text style={styles.number}>{formatOrderNumber(order.order_number)}</Text>
        <StatusBadge status={order.status} />
      </View>
      <Text style={styles.items} numberOfLines={2}>
        {summarizeItems(order)}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{formatDateTime(order.created_at)}</Text>
        <View style={styles.totalRow}>
          <Text style={styles.total}>{formatPrice(order.total)}</Text>
          <Icon name="chevronRight" size={14} color={colors.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { fontSize: 18, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  items: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 13, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  total: { fontSize: 16, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
});
