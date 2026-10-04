import type { Product } from '@coffee/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryChips } from '@/components/category-chips';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { ProductRow } from '@/components/product-row';
import { ErrorState, LoadingState } from '@/components/query-state';
import { colors, radius, spacing } from '@/constants/theme';
import { useMenu } from '@/hooks/use-menu';
import { useTabInsets } from '@/hooks/use-tab-insets';

type MenuSection = { key: string; title: string; icon: string; data: Product[] };

export default function MenuScreen() {
  const insets = useTabInsets();
  // The selected category lives in the URL so the home screen can deep-link into it.
  const { category } = useLocalSearchParams<{ category?: string }>();
  const selectedId = category || null;
  const [search, setSearch] = useState('');
  const menu = useMenu();

  const sections = useMemo<MenuSection[]>(() => {
    if (!menu.data) return [];
    const term = search.trim().toLowerCase();
    const matches = (p: Product) =>
      !term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term);

    const categories = selectedId
      ? menu.data.categories.filter((c) => c.id === selectedId)
      : menu.data.categories;

    const result: MenuSection[] = categories.map((c) => ({
      key: c.id,
      title: `${c.icon}  ${c.name}`,
      icon: c.icon,
      data: menu.data.products.filter((p) => p.category_id === c.id && matches(p)),
    }));

    if (!selectedId) {
      const uncategorized = menu.data.products.filter((p) => !p.category_id && matches(p));
      result.push({ key: 'other', title: 'Бусад', icon: '☕', data: uncategorized });
    }

    return result.filter((section) => section.data.length > 0);
  }, [menu.data, search, selectedId]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Цэс</Text>
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Кофе, цай, амттан хайх"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {menu.data ? (
        <View style={styles.chips}>
          <CategoryChips
            categories={menu.data.categories}
            selectedId={selectedId}
            onSelect={(id) => router.setParams({ category: id ?? '' })}
          />
        </View>
      ) : null}

      {menu.isLoading ? (
        <LoadingState />
      ) : menu.error ? (
        <ErrorState onRetry={() => void menu.refetch()} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, section }) => <ProductRow product={item} icon={section.icon} />}
          renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
          ListEmptyComponent={
            <EmptyState
              emoji="🔍"
              title="Илэрц олдсонгүй"
              message="Өөр үгээр хайж эсвэл ангиллаа солиод үзээрэй."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={menu.isRefetching}
              onRefresh={() => void menu.refetch()}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  chips: { paddingVertical: spacing.md },
  list: { paddingHorizontal: spacing.lg, flexGrow: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});
