import { formatPrice, getDefaultSize, getUnitPrice } from '@coffee/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { ProductImage } from '@/components/product-image';
import { LoadingState } from '@/components/query-state';
import { QuantityStepper } from '@/components/quantity-stepper';
import { colors, radius, spacing } from '@/constants/theme';
import { useProduct } from '@/hooks/use-menu';
import { useCart } from '@/store/cart';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { product, category, isLoading } = useProduct(id);
  const add = useCart((state) => state.add);
  const [chosenSize, setChosenSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // iOS shows this as a sheet below the status bar; Android shows it full screen.
  const topOffset = Platform.OS === 'ios' ? spacing.lg : insets.top + spacing.sm;

  if (isLoading) return <LoadingState />;

  if (!product) {
    return (
      <View style={[styles.screen, { paddingTop: topOffset }]}>
        <EmptyState
          emoji="🤔"
          title="Бүтээгдэхүүн олдсонгүй"
          actionTitle="Буцах"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const size = chosenSize ?? getDefaultSize(product);
  const unitPrice = getUnitPrice(product, size);
  const icon = category?.icon ?? '☕';

  const addToCart = () => {
    add(
      {
        productId: product.id,
        name: product.name,
        size,
        unitPrice,
        imageUrl: product.image_url,
        icon,
      },
      quantity,
    );
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ProductImage uri={product.image_url} icon={icon} size={220} style={styles.image} />

        <View style={styles.body}>
          {category ? <Text style={styles.category}>{category.name}</Text> : null}
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatPrice(unitPrice)}</Text>
          {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

          {product.sizes.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Хэмжээ</Text>
              <View style={styles.sizes}>
                {product.sizes.map((option) => {
                  const selected = option.name === size;
                  return (
                    <Pressable
                      key={option.name}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={`${option.name}, ${formatPrice(product.price + option.price_delta)}`}
                      onPress={() => setChosenSize(option.name)}
                      style={[styles.size, selected && styles.sizeSelected]}>
                      <Text style={[styles.sizeName, selected && styles.sizeTextSelected]}>
                        {option.name}
                      </Text>
                      <Text style={[styles.sizeDelta, selected && styles.sizeTextSelected]}>
                        {option.price_delta > 0 ? `+${formatPrice(option.price_delta)}` : 'Үндсэн'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={[styles.block, styles.quantityRow]}>
            <Text style={styles.blockTitle}>Тоо ширхэг</Text>
            <QuantityStepper value={quantity} onChange={setQuantity} size="large" />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {product.is_available ? (
          <Button title="Сагсанд нэмэх" trailing={formatPrice(unitPrice * quantity)} onPress={addToCart} />
        ) : (
          <Button title="Одоогоор дууссан" disabled />
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Хаах"
        onPress={() => router.back()}
        hitSlop={8}
        style={[styles.close, { top: topOffset }]}>
        <Icon name="close" size={16} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  image: { height: 300 },
  body: { padding: spacing.xl, gap: spacing.xs },
  category: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  price: { fontSize: 20, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },
  description: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginTop: spacing.sm },
  block: { marginTop: spacing.xl, gap: spacing.md },
  blockTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  sizes: { flexDirection: 'row', gap: spacing.sm },
  size: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 2,
  },
  sizeSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeName: { fontSize: 17, fontWeight: '800', color: colors.text },
  sizeDelta: { fontSize: 12, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  sizeTextSelected: { color: colors.onPrimary },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  close: {
    position: 'absolute',
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
