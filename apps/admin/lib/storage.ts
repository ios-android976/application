export const PRODUCT_IMAGES_BUCKET = "product-images";

const PUBLIC_PREFIX = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;

/** "https://x.supabase.co/storage/v1/object/public/product-images/a.jpg" -> "a.jpg" */
export function storagePathFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  const index = url.indexOf(PUBLIC_PREFIX);
  return index === -1 ? null : decodeURIComponent(url.slice(index + PUBLIC_PREFIX.length));
}
