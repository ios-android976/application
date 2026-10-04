import type { OrderStatus, OrderType } from './types';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

/** The happy path an order moves through, used for progress indicators. */
export const ORDER_PROGRESS: readonly OrderStatus[] = ['pending', 'preparing', 'ready', 'completed'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Хүлээн авсан',
  preparing: 'Бэлтгэж байна',
  ready: 'Бэлэн боллоо',
  completed: 'Олгосон',
  cancelled: 'Цуцалсан',
};

/** Customer-facing explanation shown on the order tracking screen. */
export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'Таны захиалгыг хүлээн авлаа. Удахгүй бэлтгэж эхэлнэ.',
  preparing: 'Бариста таны захиалгыг бэлтгэж байна.',
  ready: 'Захиалга бэлэн боллоо! Касс дээрээс аваарай.',
  completed: 'Захиалгыг олгосон. Сайхан амраарай!',
  cancelled: 'Уучлаарай, захиалга цуцлагдсан байна.',
};

/** Label of the button that moves an order to its next status (admin). */
export const ORDER_NEXT_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  pending: 'Бэлтгэж эхлэх',
  preparing: 'Бэлэн болсон',
  ready: 'Олгосон',
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  takeaway: 'Авч явах',
  dine_in: 'Энд уух',
};

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case 'pending':
      return 'preparing';
    case 'preparing':
      return 'ready';
    case 'ready':
      return 'completed';
    default:
      return null;
  }
}

/** Orders that still need the barista's attention. */
export function isActiveOrder(status: OrderStatus): boolean {
  return status === 'pending' || status === 'preparing' || status === 'ready';
}
