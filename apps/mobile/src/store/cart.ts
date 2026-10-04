import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartLine = {
  /** productId + size, so the same drink in two sizes is two lines */
  key: string;
  productId: string;
  name: string;
  size: string | null;
  /** Price when added; the cart screen re-prices from the live menu. */
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
  icon: string;
};

type NewCartLine = Omit<CartLine, 'key' | 'quantity'>;

type CartState = {
  lines: CartLine[];
  add: (line: NewCartLine, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const MAX_QUANTITY = 50;

export const cartLineKey = (productId: string, size: string | null) => `${productId}:${size ?? ''}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((state) => {
          const key = cartLineKey(line.productId, line.size);
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key
                  ? { ...l, ...line, quantity: Math.min(l.quantity + quantity, MAX_QUANTITY) }
                  : l,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, key, quantity: Math.min(quantity, MAX_QUANTITY) }] };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) =>
                  l.key === key ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY) } : l,
                ),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: 'coffee-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useCartCount = () => useCart((state) => state.lines.reduce((sum, l) => sum + l.quantity, 0));
