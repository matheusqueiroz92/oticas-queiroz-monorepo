"use client";

import UserDetailsPage from "@/components/profile/UserDetailsPage";
import type { Employee } from "@/app/_types/employee";
import { Mail, Phone, MapPin, Briefcase, ShoppingCart, Info, Activity } from "lucide-react";

export default function EmployeeDetailsPage() {
  const getEmployeeFields = (_employee: Employee) => [
    { 
      key: "email", 
      label: "Email", 
      icon: <Mail /> 
    },
    { 
      key: "phone", 
      label: "Telefone", 
      icon: <Phone /> 
    },
    { 
      key: "address", 
      label: "Endereço", 
      icon: <MapPin /> 
    },
    { 
      key: "cpf", 
      label: "CPF", 
      icon: <Briefcase /> 
    }
  ];
  
  const getEmployeeSections = (employee: Employee) => [
    {
      title: "Informações Pessoais",
      icon: <Info />,
      fields: getEmployeeFields(employee)
    },
    {
      title: "Desempenho Profissional",
      icon: <Activity />,
      fields: [
        {
          key: "role",
          label: "Função",
          icon: <Briefcase />,
          render: (employee: Employee) =>
            employee.role === "admin" ? "Administrador" : "Vendedor",
        },
        {
          key: "sales",
          label: "Vendas Realizadas",
          icon: <ShoppingCart />,
          render: (employee: Employee) => 
            `${employee.sales?.length || 0} vendas finalizadas`,
        }
      ]
    }
  ];

  return (
    <UserDetailsPage
      userType="employee"
      title="Detalhes do Funcionário"
      description="Visualize todas as informações do funcionário"
      getFields={getEmployeeFields}
      getSections={getEmployeeSections}
      errorMessage="Erro ao carregar dados do funcionário"
    />
  );
}