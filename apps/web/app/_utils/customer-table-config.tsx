import { Badge } from "@/components/ui/badge";
import type { Column } from "@/app/_types/user";

export function getCustomerTableColumns(): Column[] {
  return [
    { 
      key: "name", 
      header: "Nome" 
    },
    { 
      key: "email", 
      header: "Email" 
    },
    { 
      key: "phone", 
      header: "Telefone" 
    },
    { 
      key: "cpf", 
      header: "CPF" 
    },
    {
      key: "purchases",
      header: "Total de Compras",
      render: (customer) => customer.purchases?.length || 0,
    },
    {
      key: "debts",
      header: "Débitos",
      render: (customer) => `R$ ${(customer.debts || 0).toFixed(2)}`,
    },
    {
      key: "customerCategory",
      header: "Categoria",
      render: (customer) => {
        if (customer.customerCategory === "vip") {
          return <Badge className="bg-yellow-500 text-white">VIP</Badge>;
        }
        if (customer.customerCategory === "regular") {
          return <Badge className="bg-blue-500 text-white">Regular</Badge>;
        }
        return <Badge className="bg-zinc-500 text-white">Novo</Badge>;
      },
    },
  ];
} 