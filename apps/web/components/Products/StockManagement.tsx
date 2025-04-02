// apps/web/components/Products/StockManagement.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Loader2, 
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { api } from "../../app/services/authService";
import { formatDate } from "../../app/utils/formatters";
import { QUERY_KEYS } from "../../app/constants/query-keys";
import { useToast } from "@/hooks/useToast";

interface StockManagementProps {
  productId: string;
  currentStock: number;
  productName: string;
  onStockUpdate: (newStock: number) => Promise<void>;
  isUpdatingStock: boolean;
}

interface StockLog {
  _id: string;
  previousStock: number;
  newStock: number;
  quantity: number;
  operation: 'increase' | 'decrease';
  reason: string;
  performedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export function StockManagement({ 
  productId, 
  currentStock, 
  productName, 
  onStockUpdate,
  isUpdatingStock
}: StockManagementProps) {
  const [newStockValue, setNewStockValue] = useState<number>(currentStock);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  // Buscar histórico de estoque
  const { data: stockLogs, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.STOCK_HISTORY(productId),
    queryFn: async () => {
      try {
        const response = await api.get(`/api/products/${productId}/stock-history`);
        return response.data as StockLog[];
      } catch (error) {
        console.error("Erro ao buscar histórico de estoque:", error);
        return [] as StockLog[];
      }
    },
    enabled: showHistory,
  });

  // Função para aplicar o ajuste de estoque
  const handleStockAdjustment = async () => {
    if (newStockValue === currentStock) {
      setAdjustmentDialogOpen(false);
      return;
    }

    try {
      await onStockUpdate(newStockValue);
      setAdjustmentDialogOpen(false);
      
      toast({
        title: "Estoque atualizado",
        description: `O estoque foi atualizado para ${newStockValue} unidades.`
      });
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o estoque."
      });
    }
  };

  // Função para incrementar ou decrementar o estoque rapidamente
  const quickStockChange = async (change: number) => {
    const newValue = Math.max(0, currentStock + change);
    
    try {
      await onStockUpdate(newValue);
      
      toast({
        title: change > 0 ? "Estoque aumentado" : "Estoque reduzido",
        description: `${Math.abs(change)} unidade(s) ${change > 0 ? 'adicionada(s)' : 'removida(s)'} do estoque.`
      });
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o estoque."
      });
    }
  };

  // Renderizar o status do estoque com indicador visual
  const renderStockStatus = () => {
    if (currentStock === 0) {
      return (
        <div className="p-2 bg-red-50 text-red-800 rounded-md border border-red-200 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
          <span className="text-sm font-medium">Sem estoque</span>
        </div>
      );
    }
    
    if (currentStock <= 5) {
      return (
        <div className="p-2 bg-amber-50 text-amber-800 rounded-md border border-amber-200 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
          <span className="text-sm font-medium">Estoque baixo: {currentStock} unidades</span>
        </div>
      );
    }
    
    return (
      <div className="p-2 bg-green-50 text-green-800 rounded-md border border-green-200 flex items-center">
        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
        <span className="text-sm font-medium">Estoque adequado: {currentStock} unidades</span>
      </div>
    );
  };

  // Renderizar histórico de estoque
  const renderStockHistory = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!stockLogs || stockLogs.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>Não há histórico de movimentações de estoque para este produto.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3 max-h-64 overflow-y-auto p-2">
        {stockLogs.map((log) => (
          <div 
            key={log._id} 
            className="p-2 border rounded-md bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1">
                {log.operation === 'increase' ? (
                  <ArrowUp className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {log.operation === 'increase' ? 'Entrada' : 'Saída'} de {log.quantity} unidade(s)
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {formatDate(log.createdAt)}
              </Badge>
            </div>
            
            <div className="mt-1 text-xs text-gray-600">
              <p>Motivo: {log.reason}</p>
              <p>Estoque anterior: {log.previousStock} → Novo estoque: {log.newStock}</p>
              <p>Realizado por: {log.performedBy?.name || 'Sistema'}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm flex items-center gap-1">
            <Package className="h-4 w-4 text-primary" />
            Controle de Estoque
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Ocultar histórico' : 'Ver histórico'}
            </Button>
            
            <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                  Ajustar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Ajustar Estoque</DialogTitle>
                  <DialogDescription>
                    Altere a quantidade em estoque de {productName}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Estoque atual:</span>
                    <span className="font-medium">{currentStock} unidades</span>
                  </div>
                  
                  <div>
                    <label htmlFor="stock" className="text-sm font-medium">
                      Nova quantidade:
                    </label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={newStockValue}
                      onChange={(e) => setNewStockValue(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setAdjustmentDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleStockAdjustment}
                    disabled={isUpdatingStock || newStockValue === currentStock}
                  >
                    {isUpdatingStock ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-muted-foreground">Estoque Atual</label>
              <div className="text-3xl font-bold mt-1">{currentStock}</div>
              <span className="text-xs text-muted-foreground">unidades</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickStockChange(-1)}
                disabled={currentStock <= 0 || isUpdatingStock}
                className="h-8 w-8 p-0"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickStockChange(1)}
                disabled={isUpdatingStock}
                className="h-8 w-8 p-0"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {renderStockStatus()}
        </div>
        
        {showHistory && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Histórico de Movimentações</h4>
            {renderStockHistory()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}