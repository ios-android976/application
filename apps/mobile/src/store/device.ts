import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Everything the app remembers about the customer lives on the device:
 * there is no account, so past orders are tracked by the order UUIDs the
 * server returned, and contact details are pre-filled for the next order.
 */
type DeviceState = {
  orderIds: string[];
  customerName: string;
  customerPhone: string;
  rememberOrder: (orderId: string) => void;
  forgetOrder: (orderId: string) => void;
  saveCustomer: (name: string, phone: string) => void;
};

const MAX_REMEMBERED_ORDERS = 50;

export const useDevice = create<DeviceState>()(
  persist(
    (set) => ({
      orderIds: [],
      customerName: '',
      customerPhone: '',
      rememberOrder: (orderId) =>
        set((state) => ({
          orderIds: [orderId, ...state.orderIds.filter((id) => id !== orderId)].slice(
            0,
            MAX_REMEMBERED_ORDERS,
          ),
        })),
      forgetOrder: (orderId) => set((state) => ({ orderIds: state.orderIds.filter((id) => id !== orderId) })),
      saveCustomer: (customerName, customerPhone) => set({ customerName, customerPhone }),
    }),
    {
      name: 'coffee-device',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
