import {
  formatDateTime,
  formatOrderNumber,
  formatPrice,
  isActiveOrder,
  ORDER_STATUS_DESCRIPTIONS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
} from '@coffee/shared';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { OrderProgress } from '@/components/order-progress';
import { ErrorState, LoadingState } from '@/components/query-state';
import { colors, radius, spacing, statusColors } from '@/constants/theme';
import { useOrder } from '@/hooks/use-orders';

const STATUS_EMOJI = {
  pending: '🧾',
  preparing: '☕',
  ready: '🎉',
  completed: '😊',
  cancelled: '😔',
} as const;

export default function OrderScreen() {
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const insets = useSafeAreaInsets();
  const order = useOrder(id);

  if (order.isLoading) return <LoadingState />;
  if (order.error) return <ErrorState onRetry={() => void order.refetch()} />;
  if (!order.data) {
    return (
      <EmptyState
        emoji="🤔"
        title="Захиалга олдсонгүй"
        actionTitle="Нүүр рүү"
        onAction={() => router.dismissTo('/')}
      />
    );
  }

  const data = order.data;
  const palette = statusColors[data.status];

  return (
    <>
      <Stack.Screen options={{ title: `Захиалга ${formatOrderNumber(data.order_number)}` }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        refreshControl={
          <RefreshControl
            refreshing={order.isRefetching}
            onRefresh={() => void order.refetch()}
            tintColor={colors.primary}
          />
        }>
        {placed ? (
          <View style={styles.placed}>
            <Text style={styles.placedTitle}>Захиалга амжилттай илгээгдлээ!</Text>
            <Text style={styles.placedText}>Энэ дугаараа касс дээр хэлээрэй.</Text>
          </View>
        ) : null}

        <View style={[styles.statusCard, { backgroundColor: palette.background }]}>
          <Text style={styles.statusEmoji}>{STATUS_EMOJI[data.status]}</Text>
          <Text style={[styles.orderNumber, { color: palette.text }]}>
            {formatOrderNumber(data.order_number)}
          </Text>
          <Text style={[styles.statusLabel, { color: palette.text }]}>
            {ORDER_STATUS_LABELS[data.status]}
          </Text>
          <Text style={[styles.statusText, { color: palette.text }]}>
            {ORDER_STATUS_DESCRIPTIONS[data.status]}
          </Text>
        </View>

        {data.status !== 'cancelled' ? (
          <View style={styles.card}>
            <OrderProgress status={data.status} />
            {isActiveOrder(data.status) ? (
              <Text style={styles.live}>● Төлөв автоматаар шинэчлэгдэнэ</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Row label="Нэр" value={data.customer_name} />
          <Row label="Төрөл" value={ORDER_TYPE_LABELS[data.order_type]} />
          <Row label="Огноо" value={formatDateTime(data.created_at)} />
          {data.note ? <Row label="Хүсэлт" value={data.note} /> : null}
        </View>

        <View style={styles.card}>
          {data.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.quantity} × {item.product_name}
                {item.size ? ` (${item.size})` : ''}
              </Text>
              <Text style={styles.itemPrice}>{formatPrice(item.line_total)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Нийт</Text>
            <Text style={styles.totalValue}>{formatPrice(data.total)}</Text>
          </View>
        </View>

        {placed ? (
          <Button title="Нүүр хуудас руу буцах" variant="secondary" onPress={() => router.dismissTo('/')} />
        ) : null}
      </ScrollView>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  placed: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.successSurface,
    gap: 2,
  },
  placedTitle: { fontSize: 16, fontWeight: '800', color: colors.success },
  placedText: { fontSize: 14, color: colors.success },
  statusCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.xl,
    gap: spacing.xs,
  },
  statusEmoji: { fontSize: 44 },
  orderNumber: { fontSize: 44, fontWeight: '900', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  statusLabel: { fontSize: 20, fontWeight: '800' },
  statusText: { fontSize: 15, textAlign: 'center', lineHeight: 21, opacity: 0.9 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  live: { fontSize: 12, color: colors.success, textAlign: 'center', fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg },
  infoLabel: { fontSize: 14, color: colors.textMuted },
  infoValue: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600', textAlign: 'right' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  itemName: { flex: 1, fontSize: 15, color: colors.text },
  itemPrice: { fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  totalLabel: { fontSize: 17, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
});
