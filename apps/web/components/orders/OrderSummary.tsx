import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/app/_utils/formatters";
import type { Product } from "@/app/_types/product";
import { useState, useEffect } from "react";

interface OrderSummaryProps {
  form: any;
  selectedProducts: Product[];
}

// Mapeamento de tipos de produtos para português
const productTypeTranslations: { [key: string]: string } = {
  'lenses': 'Lentes',
  'prescription_frame': 'Armação com Grau',
  'sunglasses': 'Óculos de Sol',
  'frame': 'Armação',
  'contact_lenses': 'Lentes de Contato',
  'accessories': 'Acessórios',
  'cleaning_products': 'Produtos de Limpeza',
  'cases': 'Estojo',
  'others': 'Outros'
};

const translateProductType = (type: string): string => {
  return productTypeTranslations[type] || type;
};

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
        className="px-3 py-2 border-b"
        style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
      >
        <div className="flex items-center justify-between">
          <h3 
            className="font-semibold text-sm"
            style={{ color: isDark ? '#60a5fa' : '#2563eb' }}
          >
            Resumo do Pedido
          </h3>
          {serviceOrder && (
            <span 
              className="text-xs font-medium px-2 py-1 rounded"
              style={{ 
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                color: isDark ? '#9ca3af' : '#6b7280' 
              }}
            >
              O.S.: {serviceOrder}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-3 space-y-3">
        {selectedProducts.length > 0 ? (
          <div className="space-y-3">
            {selectedProducts.map((product) => (
              <div key={product._id} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}
                    >
                      <ShoppingBag 
                        className="w-3 h-3"
                        style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p 
                        className="text-sm font-medium leading-tight"
                        style={{ 
                          color: isDark ? '#f1f5f9' : '#111827',
                          wordBreak: 'break-word',
                          lineHeight: '1.3'
                        }}
                        title={product.name}
                      >
                        {product.name}
                      </p>
                      <p 
                        className="text-xs mt-0.5"
                        style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                      >
                        {translateProductType(product.productType)}
                      </p>
                    </div>
                  </div>
                  <span 
                    className="text-sm font-semibold flex-shrink-0"
                    style={{ 
                      color: isDark ? '#60a5fa' : '#2563eb',
                      minWidth: 'fit-content'
                    }}
                  >
                    {formatCurrency(product.sellPrice || 0)}
                  </span>
                </div>
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
          className="pt-3 border-t"
          style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span 
                className="font-medium"
                style={{ color: isDark ? '#f1f5f9' : '#111827' }}
              >
                Subtotal
              </span>
              <span 
                className="font-medium"
                style={{ color: isDark ? '#f1f5f9' : '#111827' }}
              >
                {formatCurrency(totalPrice)}
              </span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span 
                  className="font-medium"
                  style={{ color: isDark ? '#f87171' : '#dc2626' }}
                >
                  Desconto
                </span>
                <span 
                  className="font-medium"
                  style={{ color: isDark ? '#f87171' : '#dc2626' }}
                >
                  -{formatCurrency(discount)}
                </span>
              </div>
            )}
            
            <div 
              className="flex justify-between items-center font-semibold pt-2 border-t text-base"
              style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
            >
              <span style={{ color: isDark ? '#f1f5f9' : '#111827' }}>Total</span>
              <span 
                className="text-lg"
                style={{ color: isDark ? '#60a5fa' : '#2563eb' }}
              >
                {formatCurrency(finalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}