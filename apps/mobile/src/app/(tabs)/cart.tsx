import { formatPrice } from '@coffee/shared';
import { router } from 'expo-router';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { ProductImage } from '@/components/product-image';
import { QuantityStepper } from '@/components/quantity-stepper';
import { colors, radius, spacing } from '@/constants/theme';
import { usePricedCart, type PricedCartLine } from '@/hooks/use-menu';
import { useTabInsets } from '@/hooks/use-tab-insets';
import { useCart } from '@/store/cart';

export default function CartScreen() {
  const insets = useTabInsets();
  const { lines, total, count, hasUnavailable } = usePricedCart();
  const clear = useCart((state) => state.clear);

  const confirmClear = () => {
    if (Platform.OS === 'web') {
      clear();
      return;
    }
    Alert.alert('Сагсаа хоослох уу?', undefined, [
      { text: 'Болих', style: 'cancel' },
      { text: 'Хоослох', style: 'destructive', onPress: clear },
    ]);
  };

  if (lines.length === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <EmptyState
          emoji="🛍️"
          title="Сагс хоосон байна"
          message="Дуртай ундаагаа сонгоод сагсандаа нэмээрэй."
          actionTitle="Цэс үзэх"
          onAction={() => router.navigate('/menu')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={lines}
        keyExtractor={(line) => line.key}
        renderItem={({ item }) => <CartRow line={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Сагс</Text>
            <Pressable onPress={confirmClear} hitSlop={8}>
              <Text style={styles.clear}>Хоослох</Text>
            </Pressable>
          </View>
        }
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {hasUnavailable ? <Text style={styles.warning}>Дууссан бараагаа хасаад үргэлжлүүлнэ үү.</Text> : null}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Нийт ({count} ширхэг)</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
        <Button title="Захиалах" disabled={hasUnavailable} onPress={() => router.push('/checkout')} />
      </View>
    </View>
  );
}

function CartRow({ line }: { line: PricedCartLine }) {
  const setQuantity = useCart((state) => state.setQuantity);
  const remove = useCart((state) => state.remove);

  return (
    <View style={[styles.row, !line.available && styles.rowUnavailable]}>
      <ProductImage uri={line.imageUrl} icon={line.icon} size={56} style={styles.image} />
      <View style={styles.rowBody}>
        <Text style={styles.name} numberOfLines={1}>
          {line.name}
        </Text>
        <Text style={styles.meta}>
          {line.size ? `${line.size} · ` : ''}
          {formatPrice(line.unitPrice)}
        </Text>
        {line.available ? (
          <Text style={styles.lineTotal}>{formatPrice(line.lineTotal)}</Text>
        ) : (
          <Text style={styles.unavailable}>Одоогоор дууссан</Text>
        )}
      </View>
      {line.available ? (
        <QuantityStepper value={line.quantity} min={0} onChange={(q) => setQuantity(line.key, q)} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Хасах"
          onPress={() => remove(line.key)}
          hitSlop={8}
          style={styles.removeButton}>
          <Icon name="trash" size={18} color={colors.danger} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  clear: { fontSize: 15, color: colors.danger, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowUnavailable: { borderColor: colors.danger, backgroundColor: colors.dangerSurface },
  image: { width: 56, height: 56, borderRadius: radius.md },
  rowBody: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  lineTotal: { fontSize: 14, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },
  unavailable: { fontSize: 13, fontWeight: '700', color: colors.danger },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  warning: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: 15, color: colors.textMuted },
  totalValue: { fontSize: 22, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
});
