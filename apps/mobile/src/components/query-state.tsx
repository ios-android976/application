import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { colors } from '@/constants/theme';

export function LoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      emoji="📡"
      title="Холбогдож чадсангүй"
      message="Интернэт холболтоо шалгаад дахин оролдоно уу."
      actionTitle="Дахин оролдох"
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});
