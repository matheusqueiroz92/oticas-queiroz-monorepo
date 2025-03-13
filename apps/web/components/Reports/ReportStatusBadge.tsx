import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { type ReportStatus, reportStatusMap } from "@/app/types/report";

interface ReportStatusBadgeProps {
  status: ReportStatus;
}

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  // Determinar a variante do badge com base no status
  const getStatusVariant = () => {
    switch (status) {
      case "completed":
        return "secondary" as const;
      case "pending":
        return "default" as const;
      case "processing":
        return "outline" as const;
      case "error":
        return "destructive" as const;
      default:
        return "default" as const;
    }
  };

  // Renderização especial para status em processamento com animação
  if (status === "processing") {
    return (
      <div className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Processando</span>
      </div>
    );
  }

  return <Badge variant={getStatusVariant()}>{reportStatusMap[status]}</Badge>;
}
