import {
  formatDateTime,
  formatOrderNumber,
  formatPrice,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  ORDER_TYPE_LABELS,
  type OrderStatus,
} from "@coffee/shared";
import type { Metadata } from "next";
import Link from "next/link";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { Card, PageHeader, buttonClass, cn } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Захиалгын түүх" };

const PAGE_SIZE = 50;

export default async function OrderHistoryPage(props: PageProps<"/orders/history">) {
  await requireAdmin();
  const params = await props.searchParams;
  const status = ORDER_STATUSES.find((s) => s === params.status) ?? null;
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*, order_items(product_name, size, quantity, position)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);

  const { data: orders, count, error } = await query;
  if (error) throw new Error(error.message);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (next: { status?: OrderStatus | null; page?: number }) => {
    const search = new URLSearchParams();
    const s = next.status === undefined ? status : next.status;
    if (s) search.set("status", s);
    if (next.page && next.page > 1) search.set("page", String(next.page));
    const qs = search.toString();
    return qs ? `/orders/history?${qs}` : "/orders/history";
  };

  return (
    <>
      <PageHeader
        title="Захиалгын түүх"
        description={`Нийт ${count ?? 0} захиалга`}
        actions={
          <Link href="/orders" className={buttonClass("secondary")}>
            Самбар руу буцах
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip href={href({ status: null, page: 1 })} active={!status} label="Бүгд" />
        {ORDER_STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={href({ status: s, page: 1 })}
            active={status === s}
            label={ORDER_STATUS_LABELS[s]}
          />
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-muted">
              <th className="px-4 py-3 font-medium">Дугаар</th>
              <th className="px-4 py-3 font-medium">Огноо</th>
              <th className="px-4 py-3 font-medium">Үйлчлүүлэгч</th>
              <th className="px-4 py-3 font-medium">Бараа</th>
              <th className="px-4 py-3 font-medium">Төлөв</th>
              <th className="px-4 py-3 text-right font-medium">Дүн</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                  Захиалга олдсонгүй.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="align-top">
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {formatOrderNumber(order.order_number)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted tabular-nums">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-xs text-ink-muted">
                      {order.customer_phone} · {ORDER_TYPE_LABELS[order.order_type]}
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-ink-muted">
                    {[...order.order_items]
                      .sort((a, b) => a.position - b.position)
                      .map((i) => `${i.quantity}× ${i.product_name}${i.size ? ` (${i.size})` : ""}`)
                      .join(", ")}
                    {order.note ? <div className="mt-1 text-xs text-amber-800">“{order.note}”</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatPrice(order.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Хуудаслалт">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className={buttonClass("secondary", "sm")}>
              ← Өмнөх
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-muted tabular-nums">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={href({ page: page + 1 })} className={buttonClass("secondary", "sm")}>
              Дараах →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
        active ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink hover:bg-muted",
      )}>
      {label}
    </Link>
  );
}
