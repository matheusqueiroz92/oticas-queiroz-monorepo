"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { UserDetailsCard } from "@/components/Users/UserDetails";
import { useUsers } from "@/hooks/useUsers";
import { ErrorAlert } from "@/components/ErrorAlert";
import type { Employee } from "@/app/types/employee";

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const { useUserQuery, getUserImageUrl } = useUsers();

  const { data: employee, isLoading, error } = useUserQuery(id as string);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <ErrorAlert
        message={
          (error as Error)?.message || "Erro ao carregar dados do funcionário"
        }
      />
    );
  }

  // Defina os campos específicos para funcionários
  const employeeFields = [
    { key: "email", label: "Email" },
    { key: "phone", label: "Telefone" },
    { key: "address", label: "Endereço" },
    { key: "role", label: "Função" },
    {
      key: "sales",
      label: "Vendas Realizadas",
      render: (employee: Employee) => employee.sales?.length || 0,
    },
  ];

  return (
    <UserDetailsCard
      user={{ ...employee, image: getUserImageUrl(employee.image) }}
      title="Detalhes do Funcionário"
      fields={employeeFields}
    />
  );
}
