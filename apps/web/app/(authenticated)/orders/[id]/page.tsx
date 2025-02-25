"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../../services/auth";
import type { Order } from "../../../types/order";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/api/orders/${id}`);
        setOrder(response.data);
      } catch (error) {
        console.error("Erro ao buscar pedido:", error);
      }
    };

    fetchOrder();
  }, [id]);

  if (!order) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Detalhes do Pedido</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pedido #{order._id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cliente: {order.clientId}</p>
          <p>Funcionário: {order.employeeId}</p>
          <p>Status: {order.status}</p>
          <p>Total: R$ {order.totalPrice}</p>
          <p>Produtos: {order.product}</p>
        </CardContent>
      </Card>
    </div>
  );
}
