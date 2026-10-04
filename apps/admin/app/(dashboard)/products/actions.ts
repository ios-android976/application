"use server";

import type { ProductSize } from "@coffee/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { PRODUCT_IMAGES_BUCKET, storagePathFromPublicUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export type ProductFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "price" | "sizes" | "description", string>>;
};

function toInt(value: FormDataEntryValue | null): number {
  return Number.parseInt(String(value ?? "").replace(/[\s,₮]/g, ""), 10);
}

function parseSizes(raw: FormDataEntryValue | null): ProductSize[] | string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw ?? "[]"));
  } catch {
    return "Хэмжээний мэдээлэл буруу байна.";
  }
  if (!Array.isArray(parsed)) return "Хэмжээний мэдээлэл буруу байна.";

  const sizes: ProductSize[] = [];
  for (const entry of parsed) {
    const name = String(entry?.name ?? "").trim();
    const delta = Number(entry?.price_delta ?? 0);
    if (!name) return "Хэмжээ бүрт нэр өгнө үү.";
    if (name.length > 20) return "Хэмжээний нэр 20 тэмдэгтээс хэтрэхгүй.";
    if (!Number.isInteger(delta) || delta < 0) return "Нэмэлт үнэ 0 эсвэл эерэг бүхэл тоо байна.";
    if (sizes.some((s) => s.name === name)) return `"${name}" хэмжээ давхардсан байна.`;
    sizes.push({ name, price_delta: delta });
  }
  return sizes;
}

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = toInt(formData.get("price"));
  const sortOrder = toInt(formData.get("sort_order"));
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const imageUrl = String(formData.get("image_url") ?? "").trim() || null;
  const sizes = parseSizes(formData.get("sizes"));

  const fieldErrors: ProductFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Нэрээ оруулна уу.";
  else if (name.length > 80) fieldErrors.name = "Нэр 80 тэмдэгтээс хэтрэхгүй.";
  if (description.length > 500) fieldErrors.description = "Тайлбар 500 тэмдэгтээс хэтрэхгүй.";
  if (!Number.isInteger(price) || price < 0) fieldErrors.price = "Үнээ зөв оруулна уу.";
  if (typeof sizes === "string") fieldErrors.sizes = sizes;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  if (imageUrl && !/^https?:\/\//.test(imageUrl)) return { error: "Зургийн холбоос буруу байна." };

  const values = {
    name,
    description,
    price,
    category_id: categoryId,
    image_url: imageUrl,
    sizes: sizes as ProductSize[],
    is_available: formData.get("is_available") === "on",
    is_featured: formData.get("is_featured") === "on",
    sort_order: Number.isInteger(sortOrder) ? sortOrder : 0,
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("products").update(values).eq("id", id)
    : await supabase.from("products").insert(values);

  if (error) return { error: `Хадгалж чадсангүй: ${error.message}` };

  revalidatePath("/products");
  redirect("/products");
}

export async function setProductAvailability(id: string, isAvailable: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_available: isAvailable }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: product } = await supabase.from("products").select("image_url").eq("id", id).maybeSingle();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  // Past orders keep their own copy of the name and price, so the photo can go too.
  const imagePath = storagePathFromPublicUrl(product?.image_url ?? null);
  if (imagePath) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([imagePath]);

  revalidatePath("/products");
}
