// Formatting is done by hand instead of Intl so the output is identical on
// Hermes (iOS/Android), the browser and the Node server.

/** Shop time zone. Mongolia has been UTC+8 all year round since 2017. */
export const SHOP_UTC_OFFSET_HOURS = 8;

/** 12500 -> "12,500₮" */
export function formatPrice(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${digits}₮`;
}

/** 1042 -> "#1042" */
export function formatOrderNumber(orderNumber: number): string {
  return `#${orderNumber}`;
}

function shopTime(iso: string): Date {
  return new Date(new Date(iso).getTime() + SHOP_UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Start of the shop's current day (local midnight) as an ISO timestamp. */
export function shopDayStart(now: Date = new Date()): string {
  const local = shopTime(now.toISOString());
  const midnightLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(midnightLocal - SHOP_UTC_OFFSET_HOURS * 60 * 60 * 1000).toISOString();
}

/** "14:05" in shop time */
export function formatTime(iso: string): string {
  const d = shopTime(iso);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** "2026.10.04 14:05" in shop time */
export function formatDateTime(iso: string): string {
  const d = shopTime(iso);
  return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())} ${formatTime(iso)}`;
}

/** "10.04" in shop time */
export function formatShortDate(isoOrDate: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate) ? new Date(`${isoOrDate}T00:00:00Z`) : shopTime(isoOrDate);
  return `${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;
}

/** "Дөнгөж сая", "5 минутын өмнө", "2 цагийн өмнө", or the date for older values */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Дөнгөж сая';
  if (minutes < 60) return `${minutes} минутын өмнө`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} цагийн өмнө`;
  return formatDateTime(iso);
}

/** Strips spaces, dashes and brackets: "9911-2233" -> "99112233" */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s()-]/g, '');
}

/** Same rule as the database check constraint. */
export function isValidPhone(phone: string): boolean {
  return /^\+?[0-9]{8,15}$/.test(normalizePhone(phone));
}
