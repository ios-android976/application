import { getDefaultSize, getUnitPrice, type Product } from '@coffee/shared';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/icon';
import { colors, radius } from '@/constants/theme';
import { useCart } from '@/store/cart';

/** Round "+" that adds one of the product in its default size, then shows a check for a moment. */
export function AddButton({ product, icon, size = 36 }: { product: Product; icon: string; size?: number }) {
  const add = useCart((state) => state.add);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1200);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const onPress = () => {
    const sizeName = getDefaultSize(product);
    add({
      productId: product.id,
      name: product.name,
      size: sizeName,
      unitPrice: getUnitPrice(product, sizeName),
      imageUrl: product.image_url,
      icon,
    });
    setJustAdded(true);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name} сагсанд нэмэх`}
      disabled={!product.is_available}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size },
        justAdded && styles.added,
        pressed && styles.pressed,
        !product.is_available && styles.disabled,
      ]}>
      <Icon name={justAdded ? 'check' : 'plus'} size={size * 0.45} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  added: { backgroundColor: colors.success },
  pressed: { backgroundColor: colors.primaryPressed },
  disabled: { backgroundColor: colors.border },
});
