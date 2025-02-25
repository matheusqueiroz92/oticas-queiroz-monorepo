"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../../services/auth";
import type { Customer } from "../../../types/customer";

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await api.get(`/api/users/${id}`);
        setCustomer(response.data);
      } catch (error) {
        console.error("Erro ao buscar cliente:", error);
      }
    };

    fetchCustomer();
  }, [id]);

  if (!customer) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Detalhes do Cliente</h1>
      <Card>
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Email: {customer.email}</p>
          <p>Telefone: {customer.phone}</p>
          <p>Endereço: {customer.address}</p>
          <p>Débitos: R$ {customer.debts}</p>
          <p>Compras: {customer.purchases?.length || 0}</p>
        </CardContent>
      </Card>
    </div>
  );
}
