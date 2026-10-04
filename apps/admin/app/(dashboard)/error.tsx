"use client";

import { Button, Card } from "@/components/ui";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="mx-auto mt-12 max-w-md p-8 text-center">
      <div className="text-4xl">⚠️</div>
      <h1 className="mt-4 text-lg font-bold">Алдаа гарлаа</h1>
      <p className="mt-2 text-sm text-ink-muted">{error.message || "Мэдээлэл ачаалж чадсангүй."}</p>
      <Button className="mt-6" onClick={reset}>
        Дахин оролдох
      </Button>
    </Card>
  );
}
