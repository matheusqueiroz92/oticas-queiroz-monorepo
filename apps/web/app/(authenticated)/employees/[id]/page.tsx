"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../services/authService";
import { UserDetailsCard } from "../../../../components/Users/UserDetails";
import type { Employee } from "../../../types/employee";

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await api.get(`/api/users/${id}`);
        setEmployee(response.data);
      } catch (error) {
        console.error("Erro ao buscar funcionário:", error);
      }
    };

    fetchEmployee();
  }, [id]);

  if (!employee) {
    return <div>Carregando...</div>;
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
      user={employee}
      title="Detalhes do Funcionário"
      fields={employeeFields}
    />
  );
}
