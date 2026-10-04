import type { Json } from './database.types';
import type { Product, ProductRow, ProductSize } from './types';

/** Reads products.sizes defensively; malformed entries are dropped. */
export function parseSizes(value: Json): ProductSize[] {
  if (!Array.isArray(value)) return [];
  const sizes: ProductSize[] = [];
  for (const entry of value) {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const { name, price_delta } = entry;
      if (typeof name === 'string' && name.trim() !== '') {
        sizes.push({ name, price_delta: typeof price_delta === 'number' ? price_delta : 0 });
      }
    }
  }
  return sizes;
}

export function toProduct(row: ProductRow): Product {
  return { ...row, sizes: parseSizes(row.sizes) };
}

/** Mirrors the price calculation in the place_order() database function. */
export function getUnitPrice(product: Pick<Product, 'price' | 'sizes'>, sizeName: string | null): number {
  const size = product.sizes.find((s) => s.name === sizeName);
  return product.price + (size?.price_delta ?? 0);
}

export function getDefaultSize(product: Pick<Product, 'sizes'>): string | null {
  return product.sizes[0]?.name ?? null;
}
