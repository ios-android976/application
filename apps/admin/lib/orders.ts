import { shopDayStart, type CoffeeClient, type OrderWithItems } from "@coffee/shared";

/**
 * Orders shown on the live board: everything still in progress, plus
 * everything placed today. Works with both the server and browser client.
 */
export async function fetchBoardOrders(client: CoffeeClient): Promise<OrderWithItems[]> {
  const { data, error } = await client
    .from("orders")
    .select("*, order_items(*)")
    .or(`status.in.(pending,preparing,ready),created_at.gte.${shopDayStart()}`)
    .order("created_at", { ascending: true })
    .order("position", { referencedTable: "order_items", ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
