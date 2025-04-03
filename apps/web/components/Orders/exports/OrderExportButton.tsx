// apps/web/components/Orders/exports/OrderExportButton.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { exportService } from '@/app/services/exportService';
import type { Order } from "@/app/types/order";

interface OrderExportButtonProps {
  orderId?: string;
  orderData?: Order;
  filters?: Record<string, any>;
  variant?: "outline" | "default" | "destructive" | "secondary" | "ghost" | "link";
  buttonText?: string;
  fullWidth?: boolean;
}

export const OrderExportButton = ({ 
  orderId, 
  orderData, 
  filters,
  variant = "outline",
  buttonText = "Exportar",
  fullWidth = false
}: OrderExportButtonProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Validar que temos ou ID ou dados completos ou filtros
  if (!orderId && !orderData && !filters) {
    console.error("OrderExportButton precisa receber orderId, orderData ou filters");
    return null;
  }

  const handleExport = async (format: "excel" | "pdf" | "csv" | "json") => {
    try {
      setIsExporting(true);
      let blob: Blob;
      let filename: string;

      // Exportar baseado em ID do pedido
      if (orderId) {
        blob = await exportService.exportOrderDetails(orderId, { format });
        filename = exportService.generateFilename(`pedido-${orderId}`, format);
      } 
      // Exportar múltiplos pedidos com filtros
      else if (filters) {
        blob = await exportService.exportOrders(filters, { 
          format,
          title: "Relatório de Pedidos"
        });
        filename = exportService.generateFilename("pedidos", format);
      } 
      // Erro - não deveria chegar aqui com as validações acima
      else {
        throw new Error("Dados insuficientes para exportação");
      }

      // Download do arquivo
      exportService.downloadBlob(blob, filename);
      
      toast({
        title: "Exportação concluída",
        description: `Seu arquivo foi baixado com sucesso no formato ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Erro ao exportar pedido:", error);
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Não foi possível exportar o pedido. Tente novamente."
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          disabled={isExporting} 
          className={fullWidth ? "w-full" : ""}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}