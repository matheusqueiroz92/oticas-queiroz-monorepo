import { Badge } from "@/components/ui/badge";
import type { Column } from "@/app/_types/user";

export function getEmployeeTableColumns(): Column[] {
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
      key: "role",
      header: "Função",
      render: (employee) => {
        if (employee.role === "admin") {
          return <Badge className="bg-purple-500 text-white">Administrador</Badge>;
        }
        return <Badge className="bg-blue-500 text-white">Funcionário</Badge>;
      },
    },
    {
      key: "sales",
      header: "Total de Vendas",
      render: (employee) => employee.sales?.length || 0,
    },
    {
      key: "totalSales",
      header: "Valor Total",
      render: (employee) => {
        const salesCount = employee.sales?.length || 0;
        const totalValue = salesCount * 450; // Valor médio simulado
        return `R$ ${totalValue.toFixed(2)}`;
      },
    },
  ];
}

