import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import type { Order } from "@/app/_types/order";

interface OrderTableColumn {
  key: string;
  header: string;
  render: (order: Order) => React.ReactNode;
}

interface OrderTableConfigProps {
  getClientName: (clientId: any) => string;
  getEmployeeName: (order: Order) => string;
  getLaboratoryName: (laboratoryId: any) => string;
  getStatusBadge: (status: string) => { label: string; className: string };
  getPaymentStatusBadge: (paymentStatus: string) => { label: string; className: string };
}

export function getOrderTableColumns({
  getClientName,
  getEmployeeName,
  getLaboratoryName,
  getStatusBadge,
  getPaymentStatusBadge,
}: OrderTableConfigProps): OrderTableColumn[] {
  return [
    { 
      key: "serviceOrder", 
      header: "O.S.",
      render: (order: Order) => (order.serviceOrder ? order.serviceOrder : "Sem O.S.")
    },
    { 
      key: "client", 
      header: "Cliente",
      render: (order: Order) => getClientName(order.clientId)
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
      key: "employee", 
      header: "Vendedor",
      render: (order: Order) => getEmployeeName(order)
    },
    { 
      key: "laboratory", 
      header: "Laboratório",
      render: (order: Order) => order.laboratoryId 
        ? getLaboratoryName(order.laboratoryId) 
        : "N/A"
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
} 