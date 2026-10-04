import { formatPrice, type Product } from '@coffee/shared';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddButton } from '@/components/add-button';
import { ProductImage } from '@/components/product-image';
import { colors, radius, spacing } from '@/constants/theme';

/** Tall card used in horizontal carousels on the home screen. */
export function ProductCard({ product, icon }: { product: Product; icon: string }) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${formatPrice(product.price)}`}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
        style={({ pressed }) => pressed && styles.pressed}>
        <ProductImage uri={product.image_url} icon={icon} size={120} style={styles.image} />
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
          <Text style={styles.price}>
            {product.sizes.length > 1 ? `${formatPrice(product.price)}-с` : formatPrice(product.price)}
          </Text>
        </View>
      </Pressable>
      {/* A sibling of the card's pressable, so the two touch targets never nest. */}
      <View style={styles.addButton}>
        <AddButton product={product} icon={icon} size={32} />
      </View>
      {!product.is_available ? <SoldOutOverlay /> : null}
    </View>
  );
}

export function SoldOutOverlay() {
  return (
    <View style={styles.soldOut} pointerEvents="none">
      <Text style={styles.soldOutLabel}>Дууссан</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 176,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  image: { height: 132 },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  description: { fontSize: 12, color: colors.textMuted, lineHeight: 16, minHeight: 32 },
  price: {
    marginTop: spacing.xs,
    lineHeight: 32,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  addButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
  soldOut: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(251, 247, 242, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutLabel: {
    backgroundColor: colors.text,
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
});
