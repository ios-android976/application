import { getOrders, isActiveOrder, placeOrder, type PlaceOrderInput, type PublicOrder } from '@coffee/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useDevice } from '@/store/device';

const ACTIVE_POLL_MS = 5_000;

const hasActive = (orders: PublicOrder[] | undefined) =>
  Boolean(orders?.some((o) => isActiveOrder(o.status)));

/** Orders placed from this device, newest first. Polls while any is in progress. */
export function useMyOrders() {
  const orderIds = useDevice((state) => state.orderIds);
  return useQuery({
    queryKey: ['orders', orderIds],
    queryFn: () => getOrders(supabase, orderIds),
    refetchInterval: (query) => (hasActive(query.state.data) ? ACTIVE_POLL_MS : false),
    staleTime: 0,
  });
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => (await getOrders(supabase, [orderId!]))[0] ?? null,
    enabled: Boolean(orderId),
    refetchInterval: (query) =>
      query.state.data && isActiveOrder(query.state.data.status) ? ACTIVE_POLL_MS : false,
    staleTime: 0,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const rememberOrder = useDevice((state) => state.rememberOrder);

  return useMutation({
    mutationFn: (input: PlaceOrderInput) => placeOrder(supabase, input),
    onSuccess: (result) => {
      rememberOrder(result.id);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => {
      // A sold-out item is the most common failure; refresh availability.
      void queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}
