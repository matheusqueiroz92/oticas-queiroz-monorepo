import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import type { Order } from "@/app/_types/order";

interface MyOrdersTableColumn {
  key: string;
  header: string;
  render: (order: Order) => React.ReactNode;
}

interface MyOrdersTableConfigProps {
  isCustomer: boolean;
  isEmployee: boolean;
  getClientName: (clientId: any) => string;
  getEmployeeName: (order: Order) => string;
  getLaboratoryName: (laboratoryId: any) => string;
  getStatusBadge: (status: string) => { label: string; className: string };
  getPaymentStatusBadge: (paymentStatus: string) => { label: string; className: string };
}

export function getMyOrdersTableColumns({
  isCustomer,
  isEmployee,
  getClientName,
  getEmployeeName,
  getLaboratoryName,
  getStatusBadge,
  getPaymentStatusBadge,
}: MyOrdersTableConfigProps): MyOrdersTableColumn[] {
  const baseColumns: MyOrdersTableColumn[] = [
    { 
      key: "serviceOrder", 
      header: "O.S.",
      render: (order: Order) => (order.serviceOrder ? order.serviceOrder : "Sem O.S.")
    },
    { 
      key: "date", 
      header: "Data",
      render: (order: Order) => formatDate(order.createdAt)
    },
    { 
      key: "status", 
      header: "Status Pedido",
      render: (order: Order) => {
        const statusInfo = getStatusBadge(order.status);
        return (
          <Badge className={`status-badge ${statusInfo.className}`}>
            {statusInfo.label}
          </Badge>
        );
      }
    },
    { 
      key: "total", 
      header: "Total",
      render: (order: Order) => formatCurrency(order.finalPrice || order.totalPrice)
    },
    { 
      key: "paymentStatus",
      header: "Status Pagamento", 
      render: (order: Order) => {
        const statusInfo = getPaymentStatusBadge(order.paymentStatus);
        return (
          <Badge className={`status-badge ${statusInfo.className}`}>
            {statusInfo.label}
          </Badge>
        );
      }
    },
  ];

  // Para funcionários, adicionar coluna de cliente e laboratório
  if (isEmployee) {
    baseColumns.splice(1, 0, {
      key: "client",
      header: "Cliente",
      render: (order: Order) => getClientName(order.clientId)
    });
    baseColumns.splice(4, 0, { 
      key: "laboratory", 
      header: "Laboratório",
      render: (order: Order) => order.laboratoryId 
        ? getLaboratoryName(order.laboratoryId) 
        : "N/A"
    });
  } 
  // Para clientes, adicionar apenas coluna de vendedor
  else if (isCustomer) {
    baseColumns.splice(1, 0, {
      key: "employee",
      header: "Vendedor",
      render: (order: Order) => getEmployeeName(order)
    });
  }

  return baseColumns;
} 