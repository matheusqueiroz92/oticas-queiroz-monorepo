import { Badge } from "@/components/ui/badge";

interface StatusConfig {
  label: string;
  className: string;
}

const statusConfigs: Record<string, StatusConfig> = {
  delivered: { 
    label: "Entregue", 
    className: "bg-green-50 text-green-700 border-green-200" 
  },
  ready: { 
    label: "Pronto", 
    className: "bg-blue-50 text-blue-700 border-blue-200" 
  },
  in_production: { 
    label: "Em Produção", 
    className: "bg-orange-50 text-orange-700 border-orange-200" 
  },
  pending: { 
    label: "Pendente", 
    className: "bg-yellow-50 text-yellow-700 border-yellow-200" 
  },
  cancelled: { 
    label: "Cancelado", 
    className: "bg-red-50 text-red-700 border-red-200" 
  }
};

export const getStatusBadge = (status: string) => {
  const config = statusConfigs[status] || statusConfigs.pending;
  return <Badge className={`${config.className} border`}>{config.label}</Badge>;
}; 