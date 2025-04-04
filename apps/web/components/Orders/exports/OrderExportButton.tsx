import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useOrders } from "@/hooks/useOrders";
import { getAllOrdersForExport } from "@/app/services/orderService"; // Importar o novo serviço
import { 
  exportOrdersToExcel, 
  exportOrdersToPDF, 
  exportOrdersToCSV, 
  exportOrdersToJSON 
} from "@/app/utils/clientExport";

interface OrderExportButtonProps {
  filters?: Record<string, any>;
  buttonText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export function OrderExportButton({
  filters = {},
  buttonText = "Exportar",
  variant = "default",
  size = "default",
  disabled = false,
}: OrderExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Obter funções do hook useOrders
  const { 
    getClientName, 
    getEmployeeName, 
    getOrderStatusClass, 
    translateOrderStatus 
  } = useOrders();

  // Função auxiliar para obter informações de status
  const getOrderStatus = (status: string) => {
    return {
      label: translateOrderStatus(status),
      className: getOrderStatusClass(status)
    };
  };

  const handleExport = async (format: "excel" | "pdf" | "csv" | "json") => {
    setIsLoading(true);
    
    try {
      toast({
        title: "Iniciando exportação",
        description: `Buscando dados para exportação em formato ${format.toUpperCase()}...`,
      });

      // Buscar todos os pedidos com os filtros aplicados
      const allOrders = await getAllOrdersForExport(filters);
      
      // Verificar se há dados para exportar
      if (!allOrders || allOrders.length === 0) {
        toast({
          variant: "warning",
          title: "Sem dados para exportar",
          description: "Não há pedidos que correspondam aos filtros aplicados.",
        });
        return;
      }
      
      toast({
        title: "Processando exportação",
        description: `Preparando arquivo com ${allOrders.length} pedidos...`,
      });
      
      const title = `Relatório de Pedidos (${allOrders.length} itens)`;
      
      // Chamar função de exportação específica baseada no formato
      switch (format) {
        case "excel":
          exportOrdersToExcel(allOrders, title, getClientName, getEmployeeName, getOrderStatus);
          break;
        case "pdf":
          exportOrdersToPDF(allOrders, title, getClientName, getEmployeeName, getOrderStatus);
          break;
        case "csv":
          exportOrdersToCSV(allOrders, getClientName, getEmployeeName, getOrderStatus);
          break;
        case "json":
          exportOrdersToJSON(allOrders);
          break;
      }
      
      toast({
        title: "Exportação concluída",
        description: `${allOrders.length} pedidos exportados com sucesso em formato ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Erro ao exportar pedidos:", error);
      
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os pedidos. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <Download className="mr-2 h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <Download className="mr-2 h-4 w-4" />
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <Download className="mr-2 h-4 w-4" />
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <Download className="mr-2 h-4 w-4" />
          JSON (.json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}