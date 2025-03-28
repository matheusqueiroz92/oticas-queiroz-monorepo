"use client";

import UserDetailsPage from "@/components/Users/UserDetailsPage";
import type { Employee } from "@/app/types/employee";
import { Mail, Phone, MapPin, Briefcase, ShoppingCart } from "lucide-react";

export default function EmployeeDetailsPage() {
  const getEmployeeFields = (employee: Employee) => [
    { 
      key: "email", 
      label: "Email", 
      icon: <Mail className="h-4 w-4" /> 
    },
    { 
      key: "phone", 
      label: "Telefone", 
      icon: <Phone className="h-4 w-4" /> 
    },
    { 
      key: "address", 
      label: "Endereço", 
      icon: <MapPin className="h-4 w-4" /> 
    },
    { 
      key: "role", 
      label: "Função", 
      icon: <Briefcase className="h-4 w-4" /> 
    },
    {
      key: "sales",
      label: "Vendas Realizadas",
      icon: <ShoppingCart className="h-4 w-4" />,
      render: (employee: Employee) => employee.sales?.length || 0,
    },
  ];

  return (
    <UserDetailsPage
      userType="employee"
      title="Detalhes do Funcionário"
      getFields={getEmployeeFields}
      errorMessage="Erro ao carregar dados do funcionário"
    />
  );
}