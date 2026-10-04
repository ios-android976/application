"use client";

import { formatPrice, type Category, type Product, type ProductSize } from "@coffee/shared";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { saveProduct, type ProductFormState } from "@/app/(dashboard)/products/actions";
import { Alert, Button, Card, Field, Input, buttonClass, cn, inputClass } from "@/components/ui";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_SIZES: ProductSize[] = [
  { name: "S", price_delta: 0 },
  { name: "M", price_delta: 1500 },
  { name: "L", price_delta: 3000 },
];

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [sizes, setSizes] = useState<ProductSize[]>(product?.sizes ?? []);
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const errors = state.fieldErrors ?? {};
  const basePrice = Number.parseInt(price.replace(/[\s,]/g, ""), 10) || 0;

  const updateSize = (index: number, patch: Partial<ProductSize>) =>
    setSizes((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="sizes" value={JSON.stringify(sizes)} />
      <input type="hidden" name="image_url" value={imageUrl ?? ""} />

      <div className="space-y-6 lg:col-span-2">
        {state.error ? <Alert>{state.error}</Alert> : null}

        <Card className="space-y-4 p-5">
          <Field label="Нэр" htmlFor="name">
            <Input
              id="name"
              name="name"
              defaultValue={product?.name}
              required
              maxLength={80}
              placeholder="Латте"
            />
            {errors.name ? <p className="text-xs text-red-700">{errors.name}</p> : null}
          </Field>

          <Field label="Тайлбар" htmlFor="description">
            <textarea
              id="description"
              name="description"
              defaultValue={product?.description}
              maxLength={500}
              rows={3}
              className={inputClass}
              placeholder="Зөөлөн сүүтэй, бага зэрэг хөөстэй эспрессо."
            />
            {errors.description ? <p className="text-xs text-red-700">{errors.description}</p> : null}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Үндсэн үнэ (₮)" htmlFor="price">
              <Input
                id="price"
                name="price"
                inputMode="numeric"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="9500"
              />
              {errors.price ? <p className="text-xs text-red-700">{errors.price}</p> : null}
            </Field>
            <Field label="Ангилал" htmlFor="category_id">
              <select
                id="category_id"
                name="category_id"
                defaultValue={product?.category_id ?? categories[0]?.id ?? ""}
                className={inputClass}>
                <option value="">— Ангилалгүй —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Хэмжээ</h2>
              <p className="text-sm text-ink-muted">
                Хэмжээ бүрийн үнэ = үндсэн үнэ + нэмэлт үнэ. Хэмжээгүй бол хоосон үлдээнэ үү.
              </p>
            </div>
            {sizes.length === 0 ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => setSizes(DEFAULT_SIZES)}>
                S / M / L нэмэх
              </Button>
            ) : null}
          </div>

          {sizes.length > 0 ? (
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 text-xs font-medium text-ink-muted">
                <span>Нэр</span>
                <span>Нэмэлт үнэ (₮)</span>
                <span className="w-24 text-right">Нийт үнэ</span>
                <span className="w-8" />
              </div>
              {sizes.map((size, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2">
                  <Input
                    aria-label="Хэмжээний нэр"
                    value={size.name}
                    maxLength={20}
                    onChange={(e) => updateSize(index, { name: e.target.value })}
                  />
                  <Input
                    aria-label="Нэмэлт үнэ"
                    inputMode="numeric"
                    value={String(size.price_delta)}
                    onChange={(e) =>
                      updateSize(index, {
                        price_delta: Number.parseInt(e.target.value.replace(/\D/g, ""), 10) || 0,
                      })
                    }
                  />
                  <span className="w-24 text-right text-sm tabular-nums">
                    {formatPrice(basePrice + size.price_delta)}
                  </span>
                  <button
                    type="button"
                    aria-label="Хэмжээ устгах"
                    onClick={() => setSizes((prev) => prev.filter((_, i) => i !== index))}
                    className="flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-muted hover:text-red-700">
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSizes((prev) => [...prev, { name: "", price_delta: 0 }])}>
                <Plus className="size-4" aria-hidden />
                Хэмжээ нэмэх
              </Button>
            </div>
          ) : null}
          {errors.sizes ? <p className="mt-2 text-xs text-red-700">{errors.sizes}</p> : null}
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="mb-3 text-base font-semibold">Зураг</h2>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </Card>

        <Card className="space-y-4 p-5">
          <Toggle
            name="is_available"
            defaultChecked={product?.is_available ?? true}
            label="Зарагдаж байгаа"
            hint="Унтраавал апп дээр “Дууссан” гэж харагдана."
          />
          <Toggle
            name="is_featured"
            defaultChecked={product?.is_featured ?? false}
            label="Онцлох"
            hint="Апп-ын нүүр хуудсанд харагдана."
          />
          <Field label="Эрэмбэ" htmlFor="sort_order" hint="Бага тоо эхэнд харагдана.">
            <Input
              id="sort_order"
              name="sort_order"
              inputMode="numeric"
              defaultValue={product?.sort_order ?? 0}
            />
          </Field>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Хадгалж байна…" : "Хадгалах"}
          </Button>
          <Link href="/products" className={buttonClass("secondary")}>
            Болих
          </Link>
        </div>
      </div>
    </form>
  );
}

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 rounded border-line accent-brand"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-ink-muted">{hint}</span>
      </span>
    </label>
  );
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Uploads straight from the browser to Supabase Storage (admins only, enforced by storage RLS). */
function ImageUpload({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("JPG, PNG эсвэл WEBP зураг сонгоно уу.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Зургийн хэмжээ 5MB-аас ихгүй байна.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    setUploading(false);

    if (uploadError) {
      setError(`Зураг хуулж чадсангүй: ${uploadError.message}`);
      return;
    }
    onChange(supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl);
  };

  return (
    <div>
      <div
        className={cn(
          "relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-muted",
          uploading && "opacity-60",
        )}>
        {value ? (
          <Image src={value} alt="" fill unoptimized className="object-cover" />
        ) : (
          <div className="text-center text-sm text-ink-muted">
            <ImagePlus className="mx-auto mb-2 size-8" aria-hidden />
            Зураг байхгүй
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}>
          {uploading ? "Хуулж байна…" : value ? "Солих" : "Зураг сонгох"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            aria-label="Зураг хасах">
            <Trash2 className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
