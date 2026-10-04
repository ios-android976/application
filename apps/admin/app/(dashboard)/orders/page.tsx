import type { Metadata } from "next";
import Link from "next/link";

import { OrderBoard } from "@/components/order-board";
import { PageHeader, buttonClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { fetchBoardOrders } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Захиалга" };

export default async function OrdersPage() {
  await requireAdmin();
  const supabase = await createClient();
  const orders = await fetchBoardOrders(supabase);

  return (
    <>
      <PageHeader
        title="Захиалга"
        description="Шинэ захиалга хуудсыг шинэчлэхгүйгээр автоматаар гарч ирнэ."
        actions={
          <Link href="/orders/history" className={buttonClass("secondary")}>
            Түүх
          </Link>
        }
      />
      <OrderBoard initialOrders={orders} />
    </>
  );
}
