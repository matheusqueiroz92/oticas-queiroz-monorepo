import { CheckCircle2, Info } from "lucide-react";
import type { Customer } from "@/app/_types/customer";
import type { Product } from "@/app/_types/product";
import { formatCurrency } from "@/app/_utils/formatters";
import OrderSummary from "./OrderSummary";
import { useOrders } from "@/hooks/useOrders";

interface OrderConfirmationProps {
  form: any;
  selectedProducts: Product[];
  selectedCustomer: Customer | null;
  showInstallments: boolean;
  calculateInstallmentValue: () => number;
}

export default function OrderConfirmation({
  form,
  selectedProducts,
  selectedCustomer,
  showInstallments,
  calculateInstallmentValue,
}: OrderConfirmationProps) {
  
  const { getServiceOrderDisplayValue } = useOrders({ enableQueries: false });
  
  const getPaymentMethodText = () => {
    const method = form.getValues("paymentMethod");
    switch (method) {
      case "credit": return "Cartão de Crédito";
      case "debit": return "Cartão de Débito";
      case "cash": return "Dinheiro";
      case "pix": return "PIX";
      case "bank_slip": return "Boleto Bancário";
      case "promissory_note": return "Nota Promissória";
      case "check": return "Cheque";
      default: return "Não especificado";
    }
  };
  
  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      <div className="col-span-9 space-y-4">
        <h3 className="text-sm font-medium text-[var(--primary-blue)] border-b pb-1">
          Confirmação do Pedido
        </h3>
        
        {/* Informação sobre número de O.S. */}
        <div className="p-3 bg-blue-100/10 rounded border border-blue-100">
          <div className="flex">
            <Info className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Número da Ordem de Serviço</p>
              <p className="mt-1">
                O próximo número da O.S. será: <span className="font-bold text-blue-800">{getServiceOrderDisplayValue()}</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Resumo das informações em grid compacto */}
        <div className="bg-background p-4 rounded border border-input">
          <h4 className="font-medium text-sm mb-3 text-foreground">Resumo das Informações</h4>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Cliente</h5>
                <p className="text-sm">{selectedCustomer?.name || "Não selecionado"}</p>
                {selectedCustomer?.phone && (
                  <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                )}
              </div>

              <div>
                <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Pagamento</h5>
                <p className="text-sm">{getPaymentMethodText()}</p>
                {showInstallments && (form?.getValues("installments") || 0) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {form.getValues("installments")}x de {formatCurrency(calculateInstallmentValue())}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Datas</h5>
                <p className="text-sm">Pedido: {form.getValues("orderDate")}</p>
                <p className="text-sm">Entrega: {form.getValues("deliveryDate")}</p>
              </div>

              {form.getValues("isInstitutionalOrder") && (
                <div>
                  <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Pedido Institucional</h5>
                  <p className="text-sm">Sim - Instituição vinculada</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Produtos em lista compacta */}
          <div className="mt-4 pt-3 border-t">
            <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Produtos</h5>
            <div className="space-y-1">
              {selectedProducts.map((product) => (
                <div key={product._id} className="flex justify-between text-sm">
                  <span>{product.name}</span>
                  <span className="font-medium">{formatCurrency(product.sellPrice || 0)}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Observações */}
          {form && form.getValues("observations") && (
            <div className="mt-3 pt-3 border-t">
              <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Observações</h5>
              <p className="text-sm mt-1">{form.getValues("observations")}</p>
            </div>
          )}
        </div>
        
        {/* Confirmação final */}
        <div className="p-3 bg-green-100/10 rounded border border-green-100">
          <div className="flex">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-400">
              Todas as informações foram preenchidas. Clique em "Finalizar Pedido" para concluir.
              O número da O.S. será gerado automaticamente.
            </p>
          </div>
        </div>
      </div>
      
      {/* Resumo do pedido */}
      <div className="col-span-3">
        <OrderSummary 
          form={form}
          selectedProducts={selectedProducts}
        />
      </div>
    </div>
  );
}