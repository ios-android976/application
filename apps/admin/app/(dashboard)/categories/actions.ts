"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CategoryFormState = {
  error?: string;
  ok?: boolean;
};

export async function saveCategory(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "☕";
  const sortOrder = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10);

  if (!name) return { error: "Нэрээ оруулна уу." };
  if (name.length > 60) return { error: "Нэр 60 тэмдэгтээс хэтрэхгүй." };
  if ([...icon].length > 4) return { error: "Дүрс тэмдэгт (emoji) нэг л байна." };

  const values = { name, icon, sort_order: Number.isInteger(sortOrder) ? sortOrder : 0 };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("categories").update(values).eq("id", id)
    : await supabase.from("categories").insert(values);

  if (error) return { error: `Хадгалж чадсангүй: ${error.message}` };

  revalidatePath("/categories");
  revalidatePath("/products");
  return { ok: true };
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
  revalidatePath("/products");
}
