"use client";

import { SHOP } from "@coffee/shared";
import { Coffee, LayoutDashboard, LogOut, ReceiptText, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/login/actions";
import { cn } from "@/components/ui";

const NAV = [
  { href: "/", label: "Хянах самбар", icon: LayoutDashboard },
  { href: "/orders", label: "Захиалга", icon: ReceiptText },
  { href: "/products", label: "Бүтээгдэхүүн", icon: Coffee },
  { href: "/categories", label: "Ангилал", icon: Tags },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ email }: { email: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-20 flex shrink-0 flex-col bg-espresso text-white md:h-screen md:w-60">
      <div className="flex items-center gap-3 px-4 py-4 md:px-5 md:py-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-latte text-lg">☕</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{SHOP.name}</p>
          <p className="text-xs text-white/60">Админ самбар</p>
        </div>
        <form action={signOut} className="ml-auto md:hidden">
          <button
            type="submit"
            aria-label="Гарах"
            className="flex size-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10">
            <LogOut className="size-4" aria-hidden />
          </button>
        </form>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/6 hover:text-white",
              )}>
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-white/10 p-4 md:block">
        <p className="truncate text-xs text-white/60" title={email ?? undefined}>
          {email}
        </p>
        <form action={signOut} className="mt-2">
          <button
            type="submit"
            className="flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white">
            <LogOut className="size-4" aria-hidden />
            Гарах
          </button>
        </form>
      </div>
    </aside>
  );
}
