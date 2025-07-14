import { useEffect, useState } from 'react';
import { api } from '@/app/_services/authService';
import { IPayment } from '@/app/_types/payment';

interface EntitiesMaps {
  customerIdToName: Record<string, string>;
  orderIdToServiceOrder: Record<string, string>;
  loading: boolean;
}

export function usePaymentsEntitiesMaps(payments: IPayment[]): EntitiesMaps {
  const [customerIdToName, setCustomerIdToName] = useState<Record<string, string>>({});
  const [orderIdToServiceOrder, setOrderIdToServiceOrder] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchEntities() {
      setLoading(true);
      try {
        // IDs únicos
        const customerIds = Array.from(new Set(payments.map(p => p.customerId).filter(Boolean)));
        const orderIds = Array.from(new Set(payments.map(p => p.orderId).filter(Boolean)));

        // Buscar clientes
        const customerResults = await Promise.all(
          customerIds.map(async (id) => {
            try {
              const res = await api.get(`/api/users/${id}`);
              return { id, name: res.data?.name || 'Cliente não encontrado' };
            } catch {
              return { id, name: 'Cliente não encontrado' };
            }
          })
        );
        const customerMap: Record<string, string> = {};
        customerResults.forEach(({ id, name }) => {
          if (id && name) {
            customerMap[id] = name;
          }
        });

        // Buscar pedidos
        const orderResults = await Promise.all(
          orderIds.map(async (id) => {
            try {
              const res = await api.get(`/api/orders/${id}`);
              return { id, serviceOrder: res.data?.serviceOrder || id };
            } catch {
              return { id, serviceOrder: id };
            }
          })
        );
        const orderMap: Record<string, string> = {};
        orderResults.forEach((result) => {
          if (result && typeof result.id === 'string' && typeof result.serviceOrder === 'string') {
            orderMap[result.id] = result.serviceOrder;
          }
        });

        setCustomerIdToName(customerMap);
        setOrderIdToServiceOrder(orderMap);
      } finally {
        setLoading(false);
      }
    }
    if (payments.length > 0) fetchEntities();
  }, [payments]);

  return { customerIdToName, orderIdToServiceOrder, loading };
} 