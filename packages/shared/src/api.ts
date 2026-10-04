import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Json } from './database.types';
import { normalizePhone } from './format';
import { toProduct } from './products';
import type { Menu, PlaceOrderInput, PlaceOrderResult, PublicOrder } from './types';

export type CoffeeClient = SupabaseClient<Database>;

/** Categories and products, both sorted for display. */
export async function fetchMenu(client: CoffeeClient): Promise<Menu> {
  const [categories, products] = await Promise.all([
    client.from('categories').select('*').order('sort_order').order('name'),
    client.from('products').select('*').order('sort_order').order('name'),
  ]);
  if (categories.error) throw new Error(categories.error.message);
  if (products.error) throw new Error(products.error.message);
  return { categories: categories.data, products: products.data.map(toProduct) };
}

/** Creates an order without login. The database computes all prices. */
export async function placeOrder(client: CoffeeClient, input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const { data, error } = await client.rpc('place_order', {
    p_customer_name: input.customerName.trim(),
    p_customer_phone: normalizePhone(input.customerPhone),
    p_order_type: input.orderType,
    p_note: input.note?.trim() ?? '',
    p_items: input.items as unknown as Json,
  });
  if (error) throw new Error(error.message);
  return data as unknown as PlaceOrderResult;
}

/** Looks up orders by the UUIDs a device stored after placing them. */
export async function getOrders(client: CoffeeClient, orderIds: string[]): Promise<PublicOrder[]> {
  if (orderIds.length === 0) return [];
  const { data, error } = await client.rpc('get_orders', { p_order_ids: orderIds });
  if (error) throw new Error(error.message);
  return data as unknown as PublicOrder[];
}
