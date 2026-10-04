import { formatPrice, type Product } from '@coffee/shared';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddButton } from '@/components/add-button';
import { ProductImage } from '@/components/product-image';
import { colors, radius, spacing } from '@/constants/theme';

/** Compact row used in the menu list. */
export function ProductRow({ product, icon }: { product: Product; icon: string }) {
  const soldOut = !product.is_available;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${soldOut ? 'дууссан' : formatPrice(product.price)}`}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <ProductImage
          uri={product.image_url}
          icon={icon}
          size={76}
          style={[styles.image, soldOut && styles.faded]}
        />
        <View style={styles.body}>
          <Text style={[styles.name, soldOut && styles.faded]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
          <Text style={[styles.price, soldOut && styles.soldOutText]}>
            {soldOut
              ? 'Дууссан'
              : product.sizes.length > 1
                ? `${formatPrice(product.price)}-с`
                : formatPrice(product.price)}
          </Text>
        </View>
      </Pressable>
      <AddButton product={product} icon={icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  image: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
  },
  faded: { opacity: 0.45 },
  body: {
    flex: 1,
    gap: 2,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  description: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  price: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  soldOutText: { color: colors.textMuted },
});
