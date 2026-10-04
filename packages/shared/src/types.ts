import type { Enums, Tables } from './database.types';

export type Category = Tables<'categories'>;
export type ProductRow = Tables<'products'>;
export type OrderRow = Tables<'orders'>;
export type OrderItemRow = Tables<'order_items'>;

export type OrderStatus = Enums<'order_status'>;
export type OrderType = Enums<'order_type'>;

/** One entry of products.sizes */
export type ProductSize = {
  name: string;
  price_delta: number;
};

/** A product with its `sizes` JSON parsed */
export type Product = Omit<ProductRow, 'sizes'> & {
  sizes: ProductSize[];
};

export type Menu = {
  categories: Category[];
  products: Product[];
};

export type OrderWithItems = OrderRow & {
  order_items: OrderItemRow[];
};

// ---------- place_order ----------

export type PlaceOrderItem = {
  product_id: string;
  size: string | null;
  quantity: number;
};

export type PlaceOrderInput = {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  note?: string;
  items: PlaceOrderItem[];
};

export type PlaceOrderResult = {
  id: string;
  order_number: number;
  total: number;
};

// ---------- get_orders (what the mobile app can see about its own orders) ----------

export type PublicOrderItem = {
  id: string;
  product_name: string;
  size: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type PublicOrder = {
  id: string;
  order_number: number;
  status: OrderStatus;
  order_type: OrderType;
  customer_name: string;
  note: string | null;
  total: number;
  created_at: string;
  updated_at: string;
  items: PublicOrderItem[];
};

// ---------- dashboard_summary ----------

export type DashboardSummary = {
  orders_today: number;
  revenue_today: number;
  average_order_today: number;
  active_orders: number;
  top_products: { product_name: string; quantity: number; revenue: number }[];
  daily: { day: string; orders: number; revenue: number }[];
};
