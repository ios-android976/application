"use client";

import {
  formatOrderNumber,
  formatPrice,
  formatTime,
  nextOrderStatus,
  ORDER_NEXT_ACTION_LABELS,
  ORDER_TYPE_LABELS,
  SHOP,
  type OrderStatus,
  type OrderWithItems,
} from "@coffee/shared";
import { ArrowRight, Bell, BellOff, Phone, RefreshCw, StickyNote } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { Alert, Button, Card, cn } from "@/components/ui";
import { fetchBoardOrders } from "@/lib/orders";
import { createClient } from "@/lib/supabase/client";

type Connection = "connecting" | "live" | "offline";

const COLUMNS: { status: OrderStatus; title: string; empty: string }[] = [
  { status: "pending", title: "Шинэ", empty: "Шинэ захиалга алга" },
  { status: "preparing", title: "Бэлтгэж байна", empty: "Бэлтгэж буй захиалга алга" },
  { status: "ready", title: "Бэлэн", empty: "Бэлэн захиалга алга" },
];

const FALLBACK_POLL_MS = 30_000;
const FRESH_HIGHLIGHT_MS = 15_000;

export function OrderBoard({ initialOrders }: { initialOrders: OrderWithItems[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState(initialOrders);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  const [soundOn, setSoundOn] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const now = useNow(30_000);

  const knownIds = useRef(new Set(initialOrders.map((o) => o.id)));
  const soundRef = useRef(soundOn);
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchBoardOrders(supabase);
      const added = next.filter((o) => !knownIds.current.has(o.id)).map((o) => o.id);
      next.forEach((o) => knownIds.current.add(o.id));

      if (added.length > 0) {
        if (soundRef.current) playChime();
        setFreshIds((prev) => new Set([...prev, ...added]));
        setTimeout(() => {
          setFreshIds((prev) => new Set([...prev].filter((id) => !added.includes(id))));
        }, FRESH_HIGHLIGHT_MS);
      }

      setOrders(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Захиалга татаж чадсангүй.");
    }
  }, [supabase]);

  // Live updates: any change to the orders table triggers a refetch.
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const channel = supabase.channel("orders-board");

    void (async () => {
      // postgres_changes respects RLS, so realtime needs the admin's token.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);

      channel
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
          clearTimeout(debounce);
          debounce = setTimeout(() => void refresh(), 300);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnection("live");
            void refresh(); // catch anything missed while connecting
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setConnection("offline");
          }
        });
    })();

    const poll = setInterval(() => void refresh(), FALLBACK_POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [supabase, refresh]);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  useEffect(() => {
    document.title =
      pendingCount > 0 ? `(${pendingCount}) Захиалга · ${SHOP.name}` : `Захиалга · ${SHOP.name}`;
  }, [pendingCount]);

  const setStatus = async (order: OrderWithItems, status: OrderStatus) => {
    setBusyIds((prev) => new Set(prev).add(order.id));
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));

    const { error: updateError } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (updateError) {
      setError(
        `${formatOrderNumber(order.order_number)} захиалгын төлөвийг өөрчилж чадсангүй: ${updateError.message}`,
      );
      await refresh();
    }

    setBusyIds((prev) => {
      const next = new Set(prev);
      next.delete(order.id);
      return next;
    });
  };

  const cancel = (order: OrderWithItems) => {
    if (window.confirm(`${formatOrderNumber(order.order_number)} захиалгыг цуцлах уу?`)) {
      void setStatus(order, "cancelled");
    }
  };

  const finished = orders
    .filter((o) => o.status === "completed" || o.status === "cancelled")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <ConnectionBadge connection={connection} />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSoundOn((v) => !v)}
            aria-pressed={soundOn}
            title={soundOn ? "Шинэ захиалгын дуу асаалттай" : "Дуу унтраалттай"}>
            {soundOn ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
            {soundOn ? "Дуу асаалттай" : "Дуу унтраалттай"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}>
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} aria-hidden />
            Шинэчлэх
          </Button>
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((column) => {
          const items = orders.filter((o) => o.status === column.status);
          return (
            <section key={column.status} className="flex flex-col rounded-xl bg-muted/60 p-3">
              <header className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">{column.title}</h2>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {items.length}
                </span>
              </header>
              <div className="flex flex-col gap-3">
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line py-8 text-center text-sm text-ink-muted">
                    {column.empty}
                  </p>
                ) : (
                  items.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      now={now}
                      fresh={freshIds.has(order.id)}
                      busy={busyIds.has(order.id)}
                      onAdvance={(status) => void setStatus(order, status)}
                      onCancel={() => cancel(order)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <Card>
        <h2 className="border-b border-line px-5 py-4 text-base font-semibold">Өнөөдөр дууссан</h2>
        {finished.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-muted">Одоогоор алга.</p>
        ) : (
          <ul className="divide-y divide-line">
            {finished.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <span className="w-14 font-semibold tabular-nums">
                  {formatOrderNumber(order.order_number)}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {order.customer_name} ·{" "}
                  <span className="text-ink-muted">
                    {order.order_items.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}
                  </span>
                </span>
                <span className="text-ink-muted tabular-nums">{formatTime(order.created_at)}</span>
                <OrderStatusBadge status={order.status} />
                <span className="w-24 text-right font-medium tabular-nums">{formatPrice(order.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function OrderCard({
  order,
  now,
  fresh,
  busy,
  onAdvance,
  onCancel,
}: {
  order: OrderWithItems;
  now: number;
  fresh: boolean;
  busy: boolean;
  onAdvance: (status: OrderStatus) => void;
  onCancel: () => void;
}) {
  const next = nextOrderStatus(order.status);
  const minutes = Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 60_000));
  const late = order.status !== "ready" && minutes >= 15;

  return (
    <article
      className={cn(
        "rounded-lg border bg-surface p-4 shadow-sm transition-shadow",
        fresh ? "border-latte ring-2 ring-latte/60" : "border-line",
      )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold tabular-nums">{formatOrderNumber(order.order_number)}</p>
          <p className={cn("text-xs tabular-nums", late ? "font-semibold text-red-700" : "text-ink-muted")}>
            {formatTime(order.created_at)} · {minutes} мин
          </p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
          {ORDER_TYPE_LABELS[order.order_type]}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm">
        <span className="font-medium">{order.customer_name}</span>
        <a
          href={`tel:${order.customer_phone}`}
          className="inline-flex items-center gap-1 text-ink-muted hover:text-brand">
          <Phone className="size-3" aria-hidden />
          {order.customer_phone}
        </a>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex gap-2">
            <span className="w-6 shrink-0 font-semibold tabular-nums">{item.quantity}×</span>
            <span>
              {item.product_name}
              {item.size ? <span className="text-ink-muted"> ({item.size})</span> : null}
            </span>
          </li>
        ))}
      </ul>

      {order.note ? (
        <p className="mt-3 flex gap-2 rounded-md bg-amber-50 px-2.5 py-2 text-sm text-amber-900">
          <StickyNote className="mt-0.5 size-4 shrink-0" aria-hidden />
          {order.note}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">{formatPrice(order.total)}</span>
        {order.status !== "ready" ? (
          <Button variant="ghost" size="sm" disabled={busy} onClick={onCancel}>
            Цуцлах
          </Button>
        ) : null}
      </div>
      {next ? (
        <Button className="mt-2 w-full whitespace-nowrap" disabled={busy} onClick={() => onAdvance(next)}>
          {ORDER_NEXT_ACTION_LABELS[order.status]}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      ) : null}
    </article>
  );
}

function ConnectionBadge({ connection }: { connection: Connection }) {
  const config = {
    connecting: { dot: "bg-amber-500", label: "Холбогдож байна…" },
    live: { dot: "bg-emerald-500", label: "Шууд шинэчлэгдэж байна" },
    offline: { dot: "bg-red-500", label: "Холболт тасарсан — 30 секунд тутам шинэчилнэ" },
  }[connection];

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium">
      <span className={cn("size-2 rounded-full", config.dot, connection === "live" && "animate-pulse")} />
      {config.label}
    </span>
  );
}

/** Current time that re-renders the board periodically (for "N мин" counters). */
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** Two short tones; browsers allow it once the page has had a user interaction. */
function playChime() {
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [880, 1320].forEach((frequency, i) => {
      const start = ctx.currentTime + i * 0.18;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.4);
    });
    setTimeout(() => void ctx.close(), 1000);
  } catch {
    // Audio is a nice-to-have; ignore browsers that block it.
  }
}
