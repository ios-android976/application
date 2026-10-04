import { fetchMenu, getUnitPrice, type Category, type Product } from '@coffee/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { supabase } from '@/lib/supabase';
import { useCart, type CartLine } from '@/store/cart';

export const menuQueryKey = ['menu'] as const;

export function useMenu() {
  return useQuery({
    queryKey: menuQueryKey,
    queryFn: () => fetchMenu(supabase),
  });
}

export function useProduct(id: string | undefined) {
  const menu = useMenu();
  const product = menu.data?.products.find((p) => p.id === id);
  const category = menu.data?.categories.find((c) => c.id === product?.category_id);
  return { ...menu, product, category };
}

/** Emoji shown when a product has no photo. */
export function productIcon(
  product: Pick<Product, 'category_id'>,
  categories: Category[] | undefined,
): string {
  return categories?.find((c) => c.id === product.category_id)?.icon ?? '☕';
}

export type PricedCartLine = CartLine & {
  /** false when the product was removed or marked sold out */
  available: boolean;
  lineTotal: number;
};

/**
 * Cart lines re-priced against the live menu, so the customer sees the same
 * total the database will charge.
 */
export function usePricedCart() {
  const lines = useCart((state) => state.lines);
  const menu = useMenu();

  return useMemo(() => {
    const products = menu.data?.products;
    const priced: PricedCartLine[] = lines.map((line) => {
      const product = products?.find((p) => p.id === line.productId);
      // Until the menu loads, trust the stored price and assume it is available.
      const available = products ? Boolean(product?.is_available) : true;
      const unitPrice = product ? getUnitPrice(product, line.size) : line.unitPrice;
      return { ...line, unitPrice, available, lineTotal: unitPrice * line.quantity };
    });
    const total = priced.reduce((sum, l) => (l.available ? sum + l.lineTotal : sum), 0);
    const count = priced.reduce((sum, l) => sum + l.quantity, 0);
    const hasUnavailable = priced.some((l) => !l.available);
    return { lines: priced, total, count, hasUnavailable, isMenuLoading: menu.isLoading };
  }, [lines, menu.data, menu.isLoading]);
}
