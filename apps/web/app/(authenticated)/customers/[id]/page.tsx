"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { UserDetailsCard } from "@/components/Users/UserDetails";
import { useUsers } from "@/hooks/useUsers";
import { ErrorAlert } from "@/components/ErrorAlert";
import type { Customer } from "@/app/types/customer";

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const { useUserQuery, getUserImageUrl } = useUsers();

  const { data: customer, isLoading, error } = useUserQuery(id as string);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <ErrorAlert
        message={
          (error as Error)?.message || "Erro ao carregar dados do cliente"
        }
      />
    );
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
      user={{ ...customer, image: getUserImageUrl(customer.image) }}
      title="Detalhes do Cliente"
      fields={customerFields}
    />
  );
}
