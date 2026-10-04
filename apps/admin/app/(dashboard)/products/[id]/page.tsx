import { toProduct } from "@coffee/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/product-form";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Бүтээгдэхүүн засах" };

export default async function EditProductPage(props: PageProps<"/products/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const supabase = await createClient();

  const [productResult, categoriesResult] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order"),
  ]);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);
  if (!productResult.data) notFound();

  const product = toProduct(productResult.data);

  return (
    <>
      <PageHeader title={product.name} description="Бүтээгдэхүүн засах" />
      <ProductForm product={product} categories={categoriesResult.data} />
    </>
  );
}
