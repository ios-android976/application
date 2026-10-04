import {
  formatOrderNumber,
  formatPrice,
  formatTime,
  type DashboardSummary,
  type OrderStatus,
} from "@coffee/shared";
import Link from "next/link";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { RevenueChart } from "@/components/revenue-chart";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function OverviewPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [summaryResult, recentResult] = await Promise.all([
    supabase.rpc("dashboard_summary"),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (summaryResult.error) throw new Error(summaryResult.error.message);
  if (recentResult.error) throw new Error(recentResult.error.message);

  const summary = summaryResult.data as unknown as DashboardSummary;
  const recent = recentResult.data;
  const topMax = Math.max(...summary.top_products.map((p) => p.quantity), 1);

  return (
    <>
      <PageHeader title="Хянах самбар" description="Өнөөдрийн борлуулалт, идэвхтэй захиалгын тойм" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Өнөөдрийн орлого" value={formatPrice(summary.revenue_today)} />
        <StatTile label="Өнөөдрийн захиалга" value={String(summary.orders_today)} />
        <StatTile label="Дундаж чек" value={formatPrice(summary.average_order_today)} />
        <StatTile
          label="Идэвхтэй захиалга"
          value={String(summary.active_orders)}
          href="/orders"
          hint={summary.active_orders > 0 ? "Самбар руу очих →" : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <RevenueChart days={summary.daily} />
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Их зарагдсан</h2>
          <p className="text-sm text-ink-muted">Сүүлийн 7 хоног, ширхэгээр</p>
          {summary.top_products.length === 0 ? (
            <p className="mt-8 text-center text-sm text-ink-muted">Одоогоор борлуулалт алга.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {summary.top_products.map((p, i) => (
                <li key={p.product_name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="mr-2 text-ink-muted tabular-nums">{i + 1}.</span>
                      <span className="font-medium">{p.product_name}</span>
                    </span>
                    <span className="shrink-0 text-ink-muted tabular-nums">
                      <span className="font-semibold text-ink">{p.quantity}</span> ш ·{" "}
                      {formatPrice(p.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-chart"
                      style={{ width: `${(p.quantity / topMax) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">Сүүлийн захиалгууд</h2>
          <Link href="/orders" className="text-sm font-medium text-brand hover:underline">
            Бүгдийг харах
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">Захиалга хараахан ирээгүй байна.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((order) => (
              <li key={order.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                <span className="w-14 font-semibold tabular-nums">
                  {formatOrderNumber(order.order_number)}
                </span>
                <span className="min-w-0 flex-1 truncate">{order.customer_name}</span>
                <span className="hidden text-ink-muted tabular-nums sm:inline">
                  {formatTime(order.created_at)}
                </span>
                <OrderStatusBadge status={order.status as OrderStatus} />
                <span className="w-24 text-right font-medium tabular-nums">{formatPrice(order.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function StatTile({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: string;
  href?: string;
  hint?: string;
}) {
  const body = (
    <>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs font-medium text-brand">{hint}</p> : null}
    </>
  );

  return href ? (
    <Link
      href={href}
      className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-latte">
      {body}
    </Link>
  ) : (
    <Card className="p-4">{body}</Card>
  );
}
