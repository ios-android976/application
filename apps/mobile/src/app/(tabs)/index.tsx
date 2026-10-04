import {
  formatOrderNumber,
  isActiveOrder,
  ORDER_STATUS_LABELS,
  SHOP,
  SHOP_UTC_OFFSET_HOURS,
  type PublicOrder,
} from '@coffee/shared';
import { Link, router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ProductCard } from '@/components/product-card';
import { ErrorState, LoadingState } from '@/components/query-state';
import { colors, radius, spacing, statusColors } from '@/constants/theme';
import { productIcon, useMenu } from '@/hooks/use-menu';
import { useMyOrders } from '@/hooks/use-orders';
import { useTabInsets } from '@/hooks/use-tab-insets';

function greeting(date = new Date()): string {
  const hour = (date.getUTCHours() + SHOP_UTC_OFFSET_HOURS) % 24;
  if (hour < 12) return 'Өглөөний мэнд';
  if (hour < 18) return 'Өдрийн мэнд';
  return 'Оройн мэнд';
}

export default function HomeScreen() {
  const insets = useTabInsets();
  const menu = useMenu();
  const orders = useMyOrders();
  const activeOrder = orders.data?.find((o) => isActiveOrder(o.status));

  const categories = menu.data?.categories ?? [];
  const featured = menu.data?.products.filter((p) => p.is_featured) ?? [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingBottom: insets.bottom + spacing.xl,
      }}
      refreshControl={
        <RefreshControl
          refreshing={menu.isRefetching}
          onRefresh={() => {
            void menu.refetch();
            void orders.refetch();
          }}
          tintColor={colors.primary}
        />
      }>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting()} 👋</Text>
        <Text style={styles.shopName}>{SHOP.name}</Text>
        <View style={styles.infoRow}>
          <Icon name="location" size={14} color={colors.textMuted} />
          <Text style={styles.info}>{SHOP.address}</Text>
          <Text style={styles.info}>·</Text>
          <Icon name="clock" size={14} color={colors.textMuted} />
          <Text style={styles.info}>{SHOP.openingHours}</Text>
        </View>
      </View>

      {activeOrder ? <ActiveOrderBanner order={activeOrder} /> : null}

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Дараалалгүй</Text>
        <Text style={styles.heroTitle}>Урьдчилж захиалаад{'\n'}бэлэн болохоор нь аваарай</Text>
        <Text style={styles.heroText}>
          Бүртгэл шаардлагагүй. Сонгоод, захиалаад, явцыг нь утаснаасаа хараарай.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/menu')}
          style={({ pressed }) => [styles.heroButton, pressed && { opacity: 0.85 }]}>
          <Text style={styles.heroButtonText}>Цэс үзэх</Text>
          <Icon name="chevronRight" size={14} color={colors.primary} />
        </Pressable>
        <Text style={styles.heroEmoji}>☕</Text>
      </View>

      {menu.isLoading ? (
        <LoadingState />
      ) : menu.error ? (
        <ErrorState onRetry={() => void menu.refetch()} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Ангилал</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                onPress={() => router.navigate({ pathname: '/menu', params: { category: category.id } })}
                style={({ pressed }) => [styles.categoryTile, pressed && styles.categoryTilePressed]}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName} numberOfLines={2}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {featured.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Онцлох</Text>
                <Link href="/menu" style={styles.sectionLink}>
                  Бүгдийг үзэх
                </Link>
              </View>
              <FlatList
                horizontal
                data={featured}
                keyExtractor={(p) => p.id}
                renderItem={({ item }) => <ProductCard product={item} icon={productIcon(item, categories)} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
              />
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function ActiveOrderBanner({ order }: { order: PublicOrder }) {
  const palette = statusColors[order.status];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
      style={({ pressed }) => [
        styles.banner,
        { backgroundColor: palette.background },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.bannerTitle, { color: palette.text }]}>
          Захиалга {formatOrderNumber(order.order_number)} · {ORDER_STATUS_LABELS[order.status]}
        </Text>
        <Text style={[styles.bannerText, { color: palette.text }]}>Явцыг харахын тулд дарна уу</Text>
      </View>
      <Icon name="chevronRight" size={16} color={palette.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, gap: spacing.xs, marginBottom: spacing.lg },
  greeting: { fontSize: 15, color: colors.textMuted },
  shopName: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  info: { fontSize: 13, color: colors.textMuted },
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bannerTitle: { fontSize: 15, fontWeight: '700' },
  bannerText: { fontSize: 13, marginTop: 2, opacity: 0.85 },
  hero: {
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    overflow: 'hidden',
    gap: spacing.sm,
  },
  heroEyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: { color: colors.onPrimary, fontSize: 22, fontWeight: '800', lineHeight: 28 },
  heroText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, maxWidth: '85%' },
  heroButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  heroButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  heroEmoji: {
    position: 'absolute',
    right: -12,
    bottom: -18,
    fontSize: 110,
    opacity: 0.18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingRight: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionLink: { fontSize: 14, fontWeight: '600', color: colors.primary },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryTile: {
    flexGrow: 1,
    flexBasis: '22%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  categoryTilePressed: { backgroundColor: colors.surfaceMuted },
  categoryIcon: { fontSize: 28 },
  categoryName: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
  carousel: { paddingHorizontal: spacing.lg, gap: spacing.md },
});
