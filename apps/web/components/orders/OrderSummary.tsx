import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/app/_utils/formatters";
import type { Product } from "@/app/_types/product";
import { useState, useEffect } from "react";

interface OrderSummaryProps {
  form: any;
  selectedProducts: Product[];
}

export default function OrderSummary({ form, selectedProducts }: OrderSummaryProps) {
  const totalPrice = form.getValues("totalPrice") || 0;
  const discount = form.getValues("discount") || 0;
  const finalPrice = form.getValues("finalPrice") || 0;
  const serviceOrder = form.getValues("serviceOrder") as string | undefined;

  // Estado para detectar tema dark
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Função para verificar o tema
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    // Verificar tema inicial
    checkTheme();

    // Observer para mudanças na classe dark
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
        <div 
     className="rounded-lg overflow-hidden shadow-sm"
     style={{ 
       backgroundColor: isDark ? '#1e293b' : '#ffffff',
       borderColor: isDark ? '#374151' : '#e5e7eb',
       border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
       color: isDark ? '#f1f5f9' : '#111827',
       transition: 'all 0.2s ease'
     }}
    >
      <div 
        className="p-2 border-b"
        style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
      >
        <h3 
          className="font-medium"
          style={{ color: isDark ? '#60a5fa' : '#2563eb' }}
        >
          Resumo do Pedido
        </h3>
        {serviceOrder && (
          <div 
            className="text-xs mt-1"
            style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
          >
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
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center mr-2"
                    style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}
                  >
                    <ShoppingBag 
                      className="w-4 h-4"
                      style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-medium truncate"
                      style={{ color: isDark ? '#f1f5f9' : '#111827' }}
                    >
                      {product.name}
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                    >
                      {product.productType}
                    </p>
                  </div>
                </div>
                <span 
                  className="text-sm font-medium"
                  style={{ color: isDark ? '#f1f5f9' : '#111827' }}
                >
                  {formatCurrency(product.sellPrice || 0)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div 
            className="text-center py-4"
            style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
          >
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p 
              className="text-sm"
              style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
            >
              Nenhum produto adicionado
            </p>
          </div>
        )}
        
        <div 
          className="pt-2 border-t"
          style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
        >
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span style={{ color: isDark ? '#f1f5f9' : '#111827' }}>Subtotal</span>
                              <span style={{ color: isDark ? '#f1f5f9' : '#111827' }}>{formatCurrency(totalPrice)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span style={{ color: isDark ? '#f1f5f9' : '#111827' }}>Desconto</span>
                              <span style={{ color: isDark ? '#f1f5f9' : '#111827' }}>{formatCurrency(discount || 0)}</span>
            </div>
            
            <div 
              className="flex justify-between font-medium pt-1 border-t mt-1"
              style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
            >
                              <span style={{ color: isDark ? '#f1f5f9' : '#111827' }}>Total</span>
              <span style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>{formatCurrency(finalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}