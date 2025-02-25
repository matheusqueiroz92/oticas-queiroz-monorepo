"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "../../services/auth";
import type { Order } from "../../types/order";

type OrderStatus = "pending" | "in_production" | "ready" | "delivered";

// Função auxiliar para extrair nomes de strings de objetos MongoDB
const extractName = (objectString: string) => {
  try {
    // Usa regex para extrair o nome entre aspas simples após 'name:'
    const nameMatch = objectString.match(/name: '([^']+)'/);
    if (nameMatch?.[1]) {
      return nameMatch[1];
    }
    return "Nome não disponível";
  } catch (error) {
    console.error("Erro ao extrair nome:", error);
    return "Nome não disponível";
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/orders", { params: { search } });
        console.log("API response:", response.data.orders);
        setOrders(
          Array.isArray(response.data.orders) ? response.data.orders : []
        );
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [search]);

  // Função para determinar a classe de status
  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100 px-2 py-1 rounded";
      case "in_production":
        return "text-blue-600 bg-blue-100 px-2 py-1 rounded";
      case "ready":
        return "text-green-600 bg-green-100 px-2 py-1 rounded";
      case "delivered":
        return "text-purple-600 bg-purple-100 px-2 py-1 rounded";
      default:
        return "text-gray-600 bg-gray-100 px-2 py-1 rounded";
    }
  };

  // Tradução de status
  const translateStatus = (status: string): string => {
    const statusMap: Record<OrderStatus, string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
    };

    return statusMap[status as OrderStatus] || status;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <div className="flex justify-between">
        <Input
          placeholder="Buscar pedido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => router.push("/orders/new")}>Novo Pedido</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Funcionário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                Carregando...
              </TableCell>
            </TableRow>
          ) : Array.isArray(orders) && orders.length > 0 ? (
            orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>
                  {typeof order.clientId === "string"
                    ? extractName(order.clientId)
                    : "Cliente não identificado"}
                </TableCell>
                <TableCell>
                  {typeof order.employeeId === "string"
                    ? extractName(order.employeeId)
                    : "Funcionário não identificado"}
                </TableCell>
                <TableCell>
                  <span className={getStatusClass(order.status)}>
                    {translateStatus(order.status)}
                  </span>
                </TableCell>
                <TableCell>R$ {Number(order.totalPrice).toFixed(2)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/orders/${order._id}`)}
                  >
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                Nenhum pedido encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
