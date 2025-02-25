"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../../services/auth";
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Detalhes do Funcionário</h1>
      <Card>
        <CardHeader>
          <CardTitle>{employee.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Email: {employee.email}</p>
          <p>Telefone: {employee.phone}</p>
          <p>Endereço: {employee.address}</p>
          <p>Função: {employee.role}</p>
          <p>Vendas Realizadas: {employee.sales?.length || 0}</p>
        </CardContent>
      </Card>
    </div>
  );
}
