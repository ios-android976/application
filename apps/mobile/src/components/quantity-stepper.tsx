import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { colors, radius, spacing } from '@/constants/theme';

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  /** Lowest value the minus button can reach; 0 lets it remove the line */
  min?: number;
  max?: number;
  size?: 'small' | 'large';
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  size = 'small',
}: QuantityStepperProps) {
  const large = size === 'large';
  const buttonSize = large ? 44 : 32;

  return (
    <View style={styles.row}>
      <StepButton
        icon="minus"
        size={buttonSize}
        disabled={value <= min}
        onPress={() => onChange(value - 1)}
        label="Хасах"
      />
      <Text style={[styles.value, large && styles.valueLarge]}>{value}</Text>
      <StepButton
        icon="plus"
        size={buttonSize}
        disabled={value >= max}
        onPress={() => onChange(value + 1)}
        label="Нэмэх"
      />
    </View>
  );
}

function StepButton({
  icon,
  size,
  disabled,
  onPress,
  label,
}: {
  icon: 'plus' | 'minus';
  size: number;
  disabled: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Icon name={icon} size={size * 0.45} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.border },
  disabled: { opacity: 0.4 },
  value: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  valueLarge: {
    minWidth: 36,
    fontSize: 20,
  },
});
