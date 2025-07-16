"use client";

import { useParams } from "next/navigation";
import { useOrders } from "@/hooks/orders/useOrders";
import { useToast } from "@/hooks/useToast";
import { OrderDetailsContent } from "@/components/orders/OrderDetailsContent";
import { OrderDetailsLoading } from "@/components/orders/OrderDetailsLoading";
import { OrderDetailsError } from "@/components/orders/OrderDetailsError";
import { useOrderDetailsState } from "@/hooks/orders/useOrderDetailsState";

export default function OrderDetailsPage() {
  const { id } = useParams() as { id: string };
  const { toast } = useToast();
  const { handleGoBack } = useOrderDetailsState();
  
  const { fetchOrderById } = useOrders();
  const { data: order, isLoading, error, refetch } = fetchOrderById(id);

  const handleRefreshData = () => {
    refetch();
    toast({
      title: "Atualizado",
      description: "Informações do pedido atualizadas com sucesso."
    });
  };

  if (isLoading) {
    return <OrderDetailsLoading />;
  }

  if (error || !order) {
    return <OrderDetailsError error={error} />;
  }

  return (
    <OrderDetailsContent
      order={order}
      onGoBack={handleGoBack}
      onRefresh={handleRefreshData}
    />
  );
}