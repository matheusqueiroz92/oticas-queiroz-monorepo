import { AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ReportStatus } from "@/app/types/report";

interface ReportStatusBadgeProps {
  status: ReportStatus;
}

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" =
    "secondary";
  let label = "";
  let icon = null;

  switch (status) {
    case "pending":
      variant = "secondary";
      label = "Pendente";
      icon = <Clock className="h-3 w-3 mr-1" />;
      break;
    case "processing":
      variant = "secondary";
      label = "Processando";
      icon = <Loader2 className="h-3 w-3 mr-1 animate-spin" />;
      break;
    case "completed":
      variant = "default";
      label = "Concluído";
      icon = <CheckCircle className="h-3 w-3 mr-1" />;
      break;
    case "error":
      variant = "destructive";
      label = "Erro";
      icon = <AlertTriangle className="h-3 w-3 mr-1" />;
      break;
  }

  return (
    <Badge variant={variant} className="flex items-center w-fit">
      {icon}
      {label}
    </Badge>
  );
}
