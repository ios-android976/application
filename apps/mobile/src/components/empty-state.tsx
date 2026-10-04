import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { colors, spacing } from '@/constants/theme';

type EmptyStateProps = {
  emoji: string;
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
};

export function EmptyState({ emoji, title, message, actionTitle, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emoji: { fontSize: 56, marginBottom: spacing.sm },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  action: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
