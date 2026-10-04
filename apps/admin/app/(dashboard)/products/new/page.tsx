import type { Metadata } from "next";

import { ProductForm } from "@/components/product-form";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Шинэ бүтээгдэхүүн" };

export default async function NewProductPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: categories, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader title="Шинэ бүтээгдэхүүн" />
      <ProductForm categories={categories} />
    </>
  );
}
