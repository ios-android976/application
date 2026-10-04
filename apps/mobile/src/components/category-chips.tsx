import type { Category } from '@coffee/shared';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

type CategoryChipsProps = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Adds a leading "all" chip that maps to null */
  showAll?: boolean;
};

export function CategoryChips({ categories, selectedId, onSelect, showAll = true }: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled">
      {showAll ? <Chip label="Бүгд" selected={selectedId === null} onPress={() => onSelect(null)} /> : null}
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={`${category.icon} ${category.name}`}
          selected={selectedId === category.id}
          onPress={() => onSelect(category.id)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && !selected && styles.chipPressed,
      ]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: { backgroundColor: colors.surfaceMuted },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  labelSelected: { color: colors.onPrimary },
});
