import { Trash2 } from "lucide-react";
import type { Metadata } from "next";

import { CategoryForm } from "@/components/category-form";
import { ConfirmButton } from "@/components/confirm-button";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { deleteCategory } from "./actions";

export const metadata: Metadata = { title: "Ангилал" };

export default async function CategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader title="Ангилал" description="Апп-ын цэсэнд харагдах ангиллууд. Эрэмбэ бага нь эхэнд." />

      <Card className="mb-6 p-5">
        <h2 className="mb-3 text-base font-semibold">Шинэ ангилал</h2>
        <CategoryForm />
      </Card>

      <Card>
        {categories.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">Ангилал алга.</p>
        ) : (
          <ul className="divide-y divide-line">
            {categories.map(({ products, ...category }) => {
              const productCount = products[0]?.count ?? 0;
              return (
                <li key={category.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <CategoryForm category={category} />
                  <span className="w-24 text-right text-sm text-ink-muted tabular-nums">
                    {productCount} бараа
                  </span>
                  <ConfirmButton
                    action={deleteCategory.bind(null, category.id)}
                    message={
                      productCount > 0
                        ? `"${category.name}"-г устгах уу? Доторх ${productCount} бараа "Ангилалгүй" болно.`
                        : `"${category.name}"-г устгах уу?`
                    }
                    variant="ghost"
                    label={`${category.name} устгах`}>
                    <Trash2 className="size-4" aria-hidden />
                  </ConfirmButton>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
