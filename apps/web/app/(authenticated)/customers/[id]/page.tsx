"use client";

import UserDetailsPage from "@/components/Users/UserDetailsPage";
import type { Customer } from "@/app/types/customer";
import { Mail, Phone, MapPin, CreditCard, ShoppingBag } from "lucide-react";

export default function CustomerDetailsPage() {
  const getCustomerFields = (customer: Customer) => [
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
      key: "debts",
      label: "Débitos",
      icon: <CreditCard className="h-4 w-4" />,
      render: (customer: Customer) =>
        `R$ ${customer.debts?.toFixed(2) || "0.00"}`,
    },
    {
      key: "purchases",
      label: "Compras",
      icon: <ShoppingBag className="h-4 w-4" />,
      render: (customer: Customer) => customer.purchases?.length || 0,
    },
  ];

  return (
    <UserDetailsPage
      userType="customer"
      title="Detalhes do Cliente"
      getFields={getCustomerFields}
      errorMessage="Erro ao carregar dados do cliente"
    />
  );
}