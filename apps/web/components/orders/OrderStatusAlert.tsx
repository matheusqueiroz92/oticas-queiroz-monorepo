import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface OrderStatusAlertProps {
  status: string;
  className?: string;
}

export function OrderStatusAlert({ status, className = "" }: OrderStatusAlertProps) {
  const getStatusDetails = (): { icon: React.ReactNode; title: string; description: string; variant: 'default' | 'destructive' | null } => {
    switch (status) {
      case "pending":
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          title: "Pedido Pendente",
          description: "Este pedido está aguardando processamento e pode ser editado normalmente.",
          variant: "default"
        };
      case "in_production":
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: "Pedido em Produção",
          description: "Este pedido está em produção no laboratório. Algumas alterações podem afetar o processo produtivo.",
          variant: "default"
        };
      case "ready":
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          title: "Pedido Pronto",
          description: "Este pedido está pronto para ser entregue ao cliente. Alterações podem ser limitadas neste momento.",
          variant: "default"
        };
      case "delivered":
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          title: "Pedido Entregue",
          description: "Este pedido já foi entregue ao cliente. Apenas administradores podem fazer alterações limitadas.",
          variant: "destructive"
        };
      case "cancelled":
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          title: "Pedido Cancelado",
          description: "Este pedido foi cancelado. Apenas administradores podem fazer alterações limitadas.",
          variant: "destructive"
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          title: "Status Desconhecido",
          description: "O status deste pedido não é reconhecido.",
          variant: null
        };
    }
  };

  const { icon, title, description, variant } = getStatusDetails();
  
  if (!variant) return null;

  return (
    <Alert variant={variant} className={className}>
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}