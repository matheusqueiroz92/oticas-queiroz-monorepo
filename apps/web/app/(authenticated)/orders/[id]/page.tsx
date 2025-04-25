"use client";

import { useParams, useRouter } from "next/navigation";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/useToast";
import OrderDetails from "@/components/Orders/OrderDetails";
import { customBadgeStyles } from "@/app/utils/custom-badge-styles";

export default function OrderDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { toast } = useToast();
  
  const { fetchOrderById } = useOrders();

  const { data: order, isLoading, error, refetch } = fetchOrderById(id);

  const handleGoBack = () => {
    router.push('/orders');
  };

  const handleRefreshData = () => {
    refetch();
    toast({
      title: "Atualizado",
      description: "Informações do pedido atualizadas com sucesso."
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-3">
        <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
          {error instanceof Error ? error.message : error || "Pedido não encontrado ou ocorreu um erro ao carregar os dados."}
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{customBadgeStyles}</style>
      <OrderDetails
        order={order}
        onGoBack={handleGoBack}
        onRefresh={handleRefreshData}
      />
    </>
  );
}