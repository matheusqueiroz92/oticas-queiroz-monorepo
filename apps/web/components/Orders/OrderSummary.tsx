import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/app/_utils/formatters";
import type { Product } from "@/app/_types/product";

interface OrderSummaryProps {
  form: any;
  selectedProducts: Product[];
}

export default function OrderSummary({ form, selectedProducts }: OrderSummaryProps) {
  const totalPrice = form.getValues("totalPrice") || 0;
  const discount = form.getValues("discount") || 0;
  const finalPrice = form.getValues("finalPrice") || 0;
  const serviceOrder = form.getValues("serviceOrder") as string | undefined;

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 p-3">
        <h3 className="font-medium">Resumo do Pedido</h3>
        {serviceOrder && (
          <div className="text-xs text-gray-500 mt-1">
           O.S.: {serviceOrder}
          </div>
        )}
      </div>
      
      <div className="p-3 space-y-3">
        {selectedProducts.length > 0 ? (
          <div className="space-y-2">
            {selectedProducts.map((product) => (
              <div key={product._id} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mr-2">
                    <ShoppingBag className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.productType}</p>
                  </div>
                </div>
                <span className="text-sm font-medium">{formatCurrency(product.sellPrice || 0)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum produto adicionado</p>
          </div>
        )}
        
        <div className="pt-2 border-t border-gray-200">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Desconto</span>
              <span>{formatCurrency(discount || 0)}</span>
            </div>
            
            <div className="flex justify-between font-medium pt-1 border-t border-gray-200 mt-1">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(finalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}