import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

interface ProductStockManagementProps {
  productId: string;
  productName: string;
  currentStock: number;
  isUpdatingStock: boolean;
  onStockUpdate: (newStock: number) => Promise<void>;
}

export function ProductStockManagement({
  productId,
  productName,
  currentStock,
  isUpdatingStock,
  onStockUpdate
}: ProductStockManagementProps) {
  const [newStockValue, setNewStockValue] = useState<number>(currentStock);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);

  // Função para aplicar o ajuste de estoque
  const handleStockAdjustment = async () => {
    if (newStockValue === currentStock) {
      setAdjustmentDialogOpen(false);
      return;
    }

    try {
      await onStockUpdate(newStockValue);
      setAdjustmentDialogOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
    }
  };

  // Função para incrementar ou decrementar o estoque rapidamente
  const quickStockChange = async (change: number) => {
    const newValue = Math.max(0, currentStock + change);
    try {
      await onStockUpdate(newValue);
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
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

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm flex items-center gap-1">
            <Package className="h-4 w-4 text-primary" />
            Controle de Estoque
          </CardTitle>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={() => setAdjustmentDialogOpen(true)}
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
            Ajustar
          </Button>
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
      </CardContent>

      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
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
    </Card>
  );
}