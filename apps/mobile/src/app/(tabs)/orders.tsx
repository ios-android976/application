import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { OrderCard } from '@/components/order-card';
import { ErrorState, LoadingState } from '@/components/query-state';
import { colors, spacing } from '@/constants/theme';
import { useMyOrders } from '@/hooks/use-orders';
import { useTabInsets } from '@/hooks/use-tab-insets';

export default function OrdersScreen() {
  const insets = useTabInsets();
  const orders = useMyOrders();

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Захиалга</Text>
      <Text style={styles.subtitle}>Энэ утаснаас өгсөн захиалгууд</Text>
    </View>
  );

  if (orders.isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingHorizontal: spacing.lg }]}>
        {header}
        <LoadingState />
      </View>
    );
  }

  if (orders.error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingHorizontal: spacing.lg }]}>
        {header}
        <ErrorState onRetry={() => void orders.refetch()} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={orders.data ?? []}
      keyExtractor={(order) => order.id}
      renderItem={({ item }) => <OrderCard order={item} />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyState
          emoji="🧾"
          title="Захиалга алга байна"
          message="Таны өгсөн захиалгууд энд харагдана."
          actionTitle="Захиалга өгөх"
          onAction={() => router.navigate('/menu')}
        />
      }
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + spacing.xl,
      }}
      refreshControl={
        <RefreshControl
          refreshing={orders.isRefetching}
          onRefresh={() => void orders.refetch()}
          tintColor={colors.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingVertical: spacing.lg, gap: spacing.xs },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.textMuted },
});
