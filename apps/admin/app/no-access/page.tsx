import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, buttonClass } from "@/components/ui";
import { getSession } from "@/lib/auth";

import { signOut } from "../login/actions";

export const metadata: Metadata = { title: "Эрх байхгүй" };

export default async function NoAccessPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.isAdmin) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="mt-4 text-xl font-bold">Админ эрх байхгүй байна</h1>
        <p className="mt-2 text-sm text-ink-muted">
          <span className="font-medium text-ink">{session.email}</span> хаягаар нэвтэрсэн боловч энэ бүртгэл
          админ биш байна. Эзэмшигчээс <code className="rounded bg-muted px-1">admins</code> хүснэгтэд
          нэмүүлнэ үү.
        </p>
        <form action={signOut} className="mt-6">
          <button type="submit" className={buttonClass("secondary")}>
            Гарах
          </button>
        </form>
      </Card>
    </main>
  );
}
