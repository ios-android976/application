import { ORDER_STATUS_LABELS, type OrderStatus } from "@coffee/shared";
import { CheckCheck, ChefHat, CircleCheck, Clock, XCircle } from "lucide-react";

import { cn } from "@/components/ui";

const STYLES: Record<OrderStatus, { className: string; icon: typeof Clock }> = {
  pending: { className: "bg-amber-100 text-amber-900", icon: Clock },
  preparing: { className: "bg-indigo-100 text-indigo-900", icon: ChefHat },
  ready: { className: "bg-emerald-100 text-emerald-900", icon: CircleCheck },
  completed: { className: "bg-stone-100 text-stone-700", icon: CheckCheck },
  cancelled: { className: "bg-red-100 text-red-800", icon: XCircle },
};

/** Status always shows an icon and a label, never color alone. */
export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { className: tone, icon: Icon } = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tone,
        className,
      )}>
      <Icon className="size-3.5" aria-hidden />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
