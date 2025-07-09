import { useQuery } from "@tanstack/react-query";
import { getUserById } from "@/app/_services/userService";
import { getOrdersByClient } from "@/app/_services/orderService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";

export function useCustomerDetailsData(customerId: string) {
  const {
    data: customer,
    isLoading: isLoadingCustomer,
    error: customerError,
    refetch: refetchCustomer,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.DETAIL(customerId),
    queryFn: () => getUserById(customerId),
    enabled: !!customerId,
  });

  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery({
    queryKey: QUERY_KEYS.ORDERS.CLIENT(customerId),
    queryFn: () => getOrdersByClient(customerId),
    enabled: !!customerId,
  });

  const isLoading = isLoadingCustomer || isLoadingOrders;
  const error = customerError || ordersError;

  return {
    customer,
    orders: orders || [],
    isLoading,
    error,
    refetchCustomer,
  };
} 