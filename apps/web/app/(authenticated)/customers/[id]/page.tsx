"use client";

import UserDetailsPage from "@/components/Users/UserDetailsPage";
import type { Customer } from "@/app/types/customer";
import { Mail, Phone, MapPin, CreditCard, ShoppingBag, Info, Activity } from "lucide-react";

export default function CustomerDetailsPage() {
  const getCustomerFields = (customer: Customer) => [
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
      icon: <CreditCard /> 
    }
  ];
  
  const getCustomerSections = (customer: Customer) => [
    {
      title: "Informações Pessoais",
      icon: <Info />,
      fields: getCustomerFields(customer)
    },
    {
      title: "Atividade da Conta",
      icon: <Activity />,
      fields: [
        {
          key: "debts",
          label: "Débitos",
          icon: <CreditCard />,
          render: (customer: Customer) =>
            `R$ ${(customer.debts || 0).toFixed(2)}`,
        },
        {
          key: "purchases",
          label: "Compras",
          icon: <ShoppingBag />,
          render: (customer: Customer) => 
            `${customer.purchases?.length || 0} compras realizadas`,
        }
      ]
    }
  ];

  return (
    <UserDetailsPage
      userType="customer"
      title="Detalhes do Cliente"
      description="Visualize todas as informações do cliente"
      getFields={getCustomerFields}
      getSections={getCustomerSections}
      errorMessage="Erro ao carregar dados do cliente"
    />
  );
}