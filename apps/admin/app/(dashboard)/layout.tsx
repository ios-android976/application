import type { ReactNode } from "react";

import { Sidebar } from "@/components/sidebar";
import { requireAdmin } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar email={session.email} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
