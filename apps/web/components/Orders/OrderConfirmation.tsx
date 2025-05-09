import { CheckCircle2 } from "lucide-react";
import type { Customer } from "@/app/types/customer";
import type { Product } from "@/app/types/product";
import { formatCurrency } from "@/app/utils/formatters";
import OrderSummary from "./OrderSummary";

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
  
  const getPaymentMethodText = () => {
    const method = form.getValues("paymentMethod");
    switch (method) {
      case "credit": return "Cartão de Crédito";
      case "debit": return "Cartão de Débito";
      case "cash": return "Dinheiro";
      case "pix": return "PIX";
      case "installment": return "Parcelado";
      default: return "Não especificado";
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium border-b pb-1">Confirmação do Pedido</h3>
          
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <h4 className="font-medium text-sm mb-2">Resumo das Informações</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-600">Cliente</h5>
                <p>{selectedCustomer?.name || "Não selecionado"}</p>
                {selectedCustomer?.phone && <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>}
              </div>

              {form.getValues("isInstitutionalOrder") && (
                <div className="mt-3">
                  <h5 className="font-medium text-gray-600">Pedido Institucional</h5>
                  <p className="text-sm mt-1">
                    Instituição: APAE {/* Aqui poderia mostrar o nome da instituição buscado pelo ID */}
                  </p>
                </div>
              )}
              
              <div>
                <h5 className="font-medium text-gray-600">Pagamento</h5>
                <p>{getPaymentMethodText()}</p>
                {showInstallments && (form?.getValues("installments") || 0) > 0 && (
                  <p className="text-xs text-gray-500">
                    {form.getValues("installments")}x de {formatCurrency(calculateInstallmentValue())}
                  </p>
                )}
              </div>
              
              <div>
                <h5 className="font-medium text-gray-600">Data do Pedido</h5>
                <p>{form.getValues("orderDate")}</p>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-600">Data de Entrega</h5>
                <p>{form.getValues("deliveryDate")}</p>
              </div>

              {form && (form.getValues("serviceOrder") as string | undefined) && (
                <div>
                  <h5 className="font-medium text-gray-600">Ordem de Serviço</h5>
                  <p>{form.getValues("serviceOrder") as string}</p>
                </div>
              )}
            </div>
            
            <div className="mt-3">
              <h5 className="font-medium text-gray-600">Produtos</h5>
              <ul className="text-sm space-y-1 mt-1">
                {selectedProducts.map((product) => (
                  <li key={product._id} className="flex justify-between">
                    <span>{product.name}</span>
                    <span>{formatCurrency(product.sellPrice || 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {form && form.getValues("observations") && (
              <div className="mt-3">
                <h5 className="font-medium text-gray-600">Observações</h5>
                <p className="text-sm mt-1">{form.getValues("observations")}</p>
              </div>
            )}
          </div>
          
          <div className="p-3 bg-green-50 rounded border border-green-100">
            <div className="flex">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">
                Todas as informações foram preenchidas. Você pode revisar o pedido e clicar em "Finalizar Pedido" para concluir.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-1">
        <OrderSummary 
          form={form}
          selectedProducts={selectedProducts}
        />
      </div>
    </div>
  );
}