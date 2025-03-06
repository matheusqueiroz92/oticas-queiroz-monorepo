"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../services/auth";
import { UserDetailsCard } from "../../../../components/UserDetails";
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

  // Defina os campos específicos para clientes
  const customerFields = [
    { key: "email", label: "Email" },
    { key: "phone", label: "Telefone" },
    { key: "address", label: "Endereço" },
    {
      key: "debts",
      label: "Débitos",
      render: (customer: Customer) =>
        `R$ ${customer.debts?.toFixed(2) || "0.00"}`,
    },
    {
      key: "purchases",
      label: "Compras",
      render: (customer: Customer) => customer.purchases?.length || 0,
    },
  ];

  return (
    <UserDetailsCard
      user={customer}
      title="Detalhes do Cliente"
      fields={customerFields}
    />
  );
}
