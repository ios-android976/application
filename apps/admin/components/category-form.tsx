"use client";

import type { Category } from "@coffee/shared";
import { useActionState, useEffect, useRef } from "react";

import { saveCategory, type CategoryFormState } from "@/app/(dashboard)/categories/actions";
import { Button, Input } from "@/components/ui";

/** One row: create a new category, or edit an existing one in place. */
export function CategoryForm({ category }: { category?: Category }) {
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(saveCategory, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !category) formRef.current?.reset();
  }, [state, category]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-1 flex-wrap items-center gap-2">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <Input
        name="icon"
        aria-label="Дүрс"
        defaultValue={category?.icon ?? "☕"}
        className="w-14 text-center text-lg"
        maxLength={8}
      />
      <Input
        name="name"
        aria-label="Нэр"
        defaultValue={category?.name}
        placeholder="Ангиллын нэр"
        required
        maxLength={60}
        className="min-w-40 flex-1"
      />
      <Input
        name="sort_order"
        aria-label="Эрэмбэ"
        title="Эрэмбэ"
        inputMode="numeric"
        defaultValue={category?.sort_order ?? 0}
        className="w-16 text-center"
      />
      <Button type="submit" variant={category ? "secondary" : "primary"} size="sm" disabled={pending}>
        {pending ? "…" : category ? "Хадгалах" : "Нэмэх"}
      </Button>
      {state.error ? <p className="w-full text-xs text-red-700">{state.error}</p> : null}
    </form>
  );
}
