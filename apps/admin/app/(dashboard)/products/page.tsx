import { formatPrice, toProduct } from "@coffee/shared";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ConfirmButton } from "@/components/confirm-button";
import { Card, PageHeader, buttonClass, cn } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { deleteProduct, setProductAvailability } from "./actions";

export const metadata: Metadata = { title: "Бүтээгдэхүүн" };

export default async function ProductsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [categoriesResult, productsResult] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("products").select("*").order("sort_order").order("name"),
  ]);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);
  if (productsResult.error) throw new Error(productsResult.error.message);

  const categories = categoriesResult.data;
  const products = productsResult.data.map(toProduct);
  const groups = [
    ...categories.map((c) => ({
      key: c.id,
      title: `${c.icon} ${c.name}`,
      icon: c.icon,
      items: products.filter((p) => p.category_id === c.id),
    })),
    { key: "none", title: "Ангилалгүй", icon: "☕", items: products.filter((p) => !p.category_id) },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader
        title="Бүтээгдэхүүн"
        description={`${products.length} бүтээгдэхүүн · ${products.filter((p) => !p.is_available).length} дууссан`}
        actions={
          <Link href="/products/new" className={buttonClass()}>
            <Plus className="size-4" aria-hidden />
            Шинэ бүтээгдэхүүн
          </Link>
        }
      />

      {groups.length === 0 ? (
        <Card className="p-12 text-center text-sm text-ink-muted">
          Бүтээгдэхүүн алга. Эхний бүтээгдэхүүнээ нэмээрэй.
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <Card key={group.key} className="overflow-hidden">
              <h2 className="border-b border-line bg-muted/50 px-5 py-3 text-sm font-semibold">
                {group.title} <span className="font-normal text-ink-muted">· {group.items.length}</span>
              </h2>
              <ul className="divide-y divide-line">
                {group.items.map((product) => (
                  <li key={product.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-xl">
                      {product.image_url ? (
                        <Image src={product.image_url} alt="" fill unoptimized className="object-cover" />
                      ) : (
                        group.icon
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-medium">
                        <span className="truncate">{product.name}</span>
                        {product.is_featured ? (
                          <Star className="size-3.5 shrink-0 fill-latte text-latte" aria-label="Онцлох" />
                        ) : null}
                      </p>
                      <p className="text-sm text-ink-muted tabular-nums">
                        {formatPrice(product.price)}
                        {product.sizes.length > 0 ? ` · ${product.sizes.map((s) => s.name).join(" / ")}` : ""}
                      </p>
                    </div>

                    <form action={setProductAvailability.bind(null, product.id, !product.is_available)}>
                      <button
                        type="submit"
                        aria-label={`${product.name}: ${product.is_available ? "зарагдаж байна" : "дууссан"}. Дарж солих`}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                          product.is_available
                            ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                            : "bg-stone-200 text-stone-700 hover:bg-stone-300",
                        )}>
                        {product.is_available ? "● Зарагдаж байна" : "○ Дууссан"}
                      </button>
                    </form>

                    <div className="flex gap-1">
                      <Link
                        href={`/products/${product.id}`}
                        className={buttonClass("ghost", "sm")}
                        aria-label={`${product.name} засах`}>
                        <Pencil className="size-4" aria-hidden />
                      </Link>
                      <ConfirmButton
                        action={deleteProduct.bind(null, product.id)}
                        message={`"${product.name}"-г устгах уу? Өмнөх захиалгууд хэвээр үлдэнэ.`}
                        variant="ghost"
                        label={`${product.name} устгах`}>
                        <Trash2 className="size-4" aria-hidden />
                      </ConfirmButton>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
