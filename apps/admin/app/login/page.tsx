import { SHOP } from "@coffee/shared";
import type { Metadata } from "next";

import { Card } from "@/components/ui";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Нэвтрэх" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand text-3xl">
            ☕
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{SHOP.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">Админ самбарт нэвтрэх</p>
        </div>
        <Card className="p-6 shadow-sm">
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </Card>
        <p className="mt-6 text-center text-xs text-ink-muted">
          Зөвхөн ажилтнуудад зориулсан. Бүртгэлийг Supabase дээр админ үүсгэнэ.
        </p>
      </div>
    </main>
  );
}
