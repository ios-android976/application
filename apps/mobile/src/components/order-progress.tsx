import { ORDER_PROGRESS, ORDER_STATUS_LABELS, type OrderStatus } from '@coffee/shared';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { colors, radius, spacing } from '@/constants/theme';

/** Four-step tracker: received → preparing → ready → picked up. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  const currentIndex = ORDER_PROGRESS.indexOf(status);

  return (
    <View style={styles.row} accessibilityLabel={`Төлөв: ${ORDER_STATUS_LABELS[status]}`}>
      {ORDER_PROGRESS.map((step, index) => {
        const done = currentIndex >= index;
        const current = currentIndex === index;
        return (
          <View key={step} style={styles.step}>
            <View style={styles.track}>
              <View style={[styles.line, index === 0 && styles.hidden, done && styles.lineDone]} />
              <View style={[styles.dot, done && styles.dotDone, current && styles.dotCurrent]}>
                {done ? <Icon name="check" size={12} color={colors.onPrimary} /> : null}
              </View>
              <View
                style={[
                  styles.line,
                  index === ORDER_PROGRESS.length - 1 && styles.hidden,
                  currentIndex > index && styles.lineDone,
                ]}
              />
            </View>
            <Text style={[styles.label, done && styles.labelDone]} numberOfLines={2}>
              {ORDER_STATUS_LABELS[step]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const DOT = 24;

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: spacing.sm },
  track: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  line: { flex: 1, height: 3, backgroundColor: colors.border },
  lineDone: { backgroundColor: colors.primary },
  hidden: { opacity: 0 },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.primary },
  dotCurrent: {
    borderWidth: 4,
    borderColor: colors.accent,
    width: DOT + 6,
    height: DOT + 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  labelDone: { color: colors.text },
});
