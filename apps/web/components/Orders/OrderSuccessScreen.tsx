import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import OrderPdfGenerator from "@/components/Orders/exports/OrderPdfGenerator";
import OrderCompactPdfGenerator from "@/components/Orders/exports/OrderCompactPdfGenerator";
import OrderPrintButton from "@/components/Orders/exports/OrderPrintButton";
import { Separator } from "@/components/ui/separator";
import type { Customer } from "@/app/types/customer";

interface OrderSuccessScreenProps {
  form: any;
  submittedOrder: any;
  selectedCustomer: Customer | null;
  onViewOrdersList: () => void;
  onViewOrderDetails: (id: string) => void;
  onCreateNewOrder: () => void;
}

export default function OrderSuccessScreen({
  form,
  submittedOrder,
  selectedCustomer,
  onViewOrdersList,
  onViewOrderDetails,
  onCreateNewOrder,
}: OrderSuccessScreenProps) {
  return (
    <div className="bg-green-50 rounded-lg border border-green-100 p-4">
      <div className="flex flex-col items-center text-center mb-4">
        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-800 mb-1">
          Pedido criado com sucesso!
        </h3>
        <p className="text-green-600 text-sm">
          ID do pedido: {submittedOrder?._id.substring(0, 8)}
        </p>
        
        {submittedOrder?.status === 'ready' ? (
          <div className="mt-2 px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
            Status: Pronto para entrega
          </div>
        ) : (
          <div className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
            Status: Em processamento
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Opções de exportação e impressão */}
        <div className="bg-white p-3 rounded border shadow-sm">
          <h4 className="text-sm font-medium mb-3">Exportar/Imprimir Pedido</h4>
          
          <div className="grid grid-cols-1 gap-3 mb-3">
            {/* Novo botão de PDF compacto (2 vias) */}
            <OrderCompactPdfGenerator
              formData={{
                ...form.getValues(),
                _id: submittedOrder?._id
              }}
              customer={selectedCustomer}
            />
            
            {/* Botão de impressão direta */}
            <OrderPrintButton
              formData={{
                ...form.getValues(),
                _id: submittedOrder?._id
              }}
              customer={selectedCustomer}
            />
          </div>
          
          <Separator className="my-3" />
          
          <div className="grid grid-cols-1">
            {/* PDF completo original */}
            <div className="text-xs text-gray-500 mb-2">Versão completa detalhada:</div>
            <OrderPdfGenerator
              formData={{
                ...form.getValues(),
                _id: submittedOrder?._id
              }}
              customer={selectedCustomer}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={onViewOrdersList}
            size="sm"
            className="text-sm h-9"
          >
            Ver Lista de Pedidos
          </Button>
          
          <Button 
            type="button"
            variant="outline"
            onClick={() => onViewOrderDetails(submittedOrder?._id)}
            size="sm"
            className="text-sm h-9"
          >
            Ver Detalhes
          </Button>
          
          <Button 
            type="button"
            onClick={onCreateNewOrder}
            size="sm"
            className="text-sm h-9"
                      >
            Criar Novo Pedido
          </Button>
        </div>
      </div>
    </div>
  );
}