import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, User, Calendar, CreditCard, Package } from "lucide-react";
import OrderPdfExporter from "@/components/orders/exports/OrderPdfExporter";
import type { Customer } from "@/app/_types/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/app/_utils/formatters";
import { useState, useEffect } from "react";

interface OrderSuccessScreenProps {
  form?: any;
  submittedOrder: any;
  selectedCustomer: Customer | null;
  customersData?: Customer[];
  onViewOrdersList: () => void;
  onViewOrderDetails: (id: string) => void;
  onCreateNewOrder: () => void;
}

export default function OrderSuccessScreen({
  form,
  submittedOrder,
  selectedCustomer,
  customersData = [],
  onViewOrdersList,
  // onViewOrderDetails,
  onCreateNewOrder,
}: OrderSuccessScreenProps) {
  
  console.log("OrderSuccessScreen - submittedOrder:", submittedOrder);
  console.log("OrderSuccessScreen - selectedCustomer:", selectedCustomer);
  console.log("OrderSuccessScreen - form data:", form?.getValues?.());

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
  
  const getPaymentMethodText = () => {
    // Usar dados do pedido criado se form não estiver disponível
    const method = form?.getValues?.("paymentMethod") || submittedOrder?.paymentMethod;
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

  // Usar dados do form se disponível, senão usar dados do pedido criado
  const formData = form?.getValues?.() || {
    paymentMethod: submittedOrder?.paymentMethod || '',
    paymentEntry: submittedOrder?.paymentEntry || 0,
    installments: submittedOrder?.installments || 1,
    orderDate: submittedOrder?.orderDate || new Date().toISOString(),
    deliveryDate: submittedOrder?.deliveryDate || '',
    totalPrice: submittedOrder?.totalPrice || 0,
    discount: submittedOrder?.discount || 0,
    finalPrice: submittedOrder?.finalPrice || submittedOrder?.totalPrice || 0,
  };

  // Obter informações do cliente - melhorar a lógica
  let clientInfo = null;
  let clientName = 'Cliente não identificado';
  let clientPhone = null;
  let clientEmail = null;

  // Prioridade: selectedCustomer > submittedOrder.client > submittedOrder.clientId (se for objeto) > buscar na lista
  if (selectedCustomer) {
    clientInfo = selectedCustomer;
    clientName = selectedCustomer.name;
    clientPhone = selectedCustomer.phone;
    clientEmail = selectedCustomer.email;
  } else if (submittedOrder?.client) {
    clientInfo = submittedOrder.client;
    clientName = submittedOrder.client.name || clientName;
    clientPhone = submittedOrder.client.phone;
    clientEmail = submittedOrder.client.email;
  } else if (typeof submittedOrder?.clientId === 'object' && submittedOrder.clientId?.name) {
    clientInfo = submittedOrder.clientId;
    clientName = submittedOrder.clientId.name || clientName;
    clientPhone = submittedOrder.clientId.phone;
    clientEmail = submittedOrder.clientId.email;
  } else if (submittedOrder?.clientId && customersData.length > 0) {
    // Buscar na lista de clientes pelo clientId
    const found = customersData.find(c => c._id === submittedOrder.clientId);
    if (found) {
      clientInfo = found;
      clientName = found.name;
      clientPhone = found.phone;
      clientEmail = found.email;
    }
  }


  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header de Sucesso */}
      <Card 
        className="border-green-200 dark:border-green-800"
        style={{ 
          background: isDark 
            ? 'linear-gradient(to right, #0f2a1a, #1f3a2f)' 
            : 'linear-gradient(to right, #f0fdf4, #ecfdf5)',
          borderColor: isDark ? '#166534' : '#bbf7d0'
        }}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div 
              className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
              style={{ 
                backgroundColor: isDark ? '#166534' : '#dcfce7'
              }}
            >
              <CheckCircle2 
                className="h-8 w-8"
                style={{ color: isDark ? '#22c55e' : '#16a34a' }}
              />
            </div>
            <h2 
              className="text-2xl font-bold mb-2"
              style={{ color: isDark ? '#22c55e' : '#15803d' }}
            >
              Pedido Criado com Sucesso!
            </h2>
            <p 
              className="mb-4"
              style={{ color: isDark ? '#86efac' : '#16a34a' }}
            >
              Seu pedido foi processado e está sendo preparado
            </p>
            
            {/* Informações principais */}
            <div className="flex items-center gap-6 text-sm">
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#d1d5db'
                }}
              >
                <FileText 
                  className="h-4 w-4"
                  style={{ color: isDark ? '#60a5fa' : '#2563eb' }}
                />
                <span 
                  className="font-medium"
                  style={{ color: isDark ? '#f9fafb' : '#111827' }}
                >
                  O.S. Nº {submittedOrder?.serviceOrder || submittedOrder?.serviceNumber || 'N/A'}
                </span>
              </div>
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#d1d5db'
                }}
              >
                <Package 
                  className="h-4 w-4"
                  style={{ color: isDark ? '#a855f7' : '#7c3aed' }}
                />
                <span 
                  className="font-medium"
                  style={{ color: isDark ? '#f9fafb' : '#111827' }}
                >
                  ID: {submittedOrder?._id?.substring(0, 8) || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Pedido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações do Cliente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User 
                className="h-5 w-5" 
                style={{ color: isDark ? '#60a5fa' : '#2563eb' }}
              />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p 
                className="font-medium"
                style={{ color: isDark ? '#f9fafb' : '#111827' }}
              >
                {clientName}
              </p>
              {clientPhone && (
                <p 
                  className="text-sm"
                  style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
                >
                  Tel: {clientPhone}
                </p>
              )}
              {clientEmail && (
                <p 
                  className="text-sm"
                  style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
                >
                  Email: {clientEmail}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações de Pagamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard 
                className="h-5 w-5" 
                style={{ color: isDark ? '#22c55e' : '#16a34a' }}
              />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p 
                className="font-medium"
                style={{ color: isDark ? '#f9fafb' : '#111827' }}
              >
                {getPaymentMethodText()}
              </p>
              {formData.paymentEntry > 0 && (
                <p 
                  className="text-sm"
                  style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
                >
                  Entrada: {formatCurrency(formData.paymentEntry)}
                </p>
              )}
              {formData.installments > 1 && (
                <p 
                  className="text-sm"
                  style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
                >
                  {formData.installments}x parcelas
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar 
                className="h-5 w-5" 
                style={{ color: isDark ? '#f97316' : '#ea580c' }}
              />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p 
                className="text-sm"
                style={{ color: isDark ? '#f9fafb' : '#111827' }}
              >
                <span className="font-medium">Pedido:</span> {formData.orderDate ? new Date(formData.orderDate).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
              {formData.deliveryDate && (
                <p 
                  className="text-sm"
                  style={{ color: isDark ? '#f9fafb' : '#111827' }}
                >
                  <span className="font-medium">Entrega:</span> {new Date(formData.deliveryDate).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package 
                className="h-5 w-5" 
                style={{ color: isDark ? '#a855f7' : '#7c3aed' }}
              />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: isDark ? '#f9fafb' : '#111827' }}>Subtotal:</span>
                <span style={{ color: isDark ? '#f9fafb' : '#111827' }}>{formatCurrency(Number(formData.totalPrice) || 0)}</span>
              </div>
              {Number(formData.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>Desconto:</span>
                  <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>-{formatCurrency(Number(formData.discount))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span style={{ color: isDark ? '#f9fafb' : '#111827' }}>Total:</span>
                <span style={{ color: isDark ? '#22c55e' : '#16a34a' }}>{formatCurrency(Number(formData.finalPrice) || Number(formData.totalPrice) || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exportar PDF */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Exportar Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderPdfExporter
              formData={{
                ...formData,
                _id: submittedOrder?._id,
                serviceOrder: submittedOrder?.serviceOrder || submittedOrder?.serviceNumber
              }}
              customer={clientInfo}
              buttonText="📄 Baixar PDF Completo"
              variant="outline"
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Navegação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={onViewOrdersList}
              variant="outline"
              className="w-full"
            >
              📋 Ver Lista de Pedidos
            </Button>
            <Button 
              onClick={onCreateNewOrder}
              className="w-full"
            >
              ➕ Criar Novo Pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}