import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, User, Calendar, CreditCard, Package } from "lucide-react";
import OrderPdfExporter from "@/components/orders/exports/OrderPdfExporter";
import type { Customer } from "@/app/_types/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/app/_utils/formatters";

interface OrderSuccessScreenProps {
  form?: any;
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
  
  console.log("OrderSuccessScreen - submittedOrder:", submittedOrder);
  console.log("OrderSuccessScreen - selectedCustomer:", selectedCustomer);
  console.log("OrderSuccessScreen - form data:", form?.getValues?.());
  
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

  // Obter informações do cliente
  const clientInfo = selectedCustomer || submittedOrder?.clientId || null;
  const clientName = clientInfo?.name || 
                    (typeof submittedOrder?.clientId === 'object' ? submittedOrder?.clientId?.name : null) ||
                    'Cliente não identificado';
  
  const clientPhone = clientInfo?.phone || 
                     (typeof submittedOrder?.clientId === 'object' ? submittedOrder?.clientId?.phone : null);
  
  const clientEmail = clientInfo?.email || 
                     (typeof submittedOrder?.clientId === 'object' ? submittedOrder?.clientId?.email : null);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header de Sucesso */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Pedido Criado com Sucesso!
            </h2>
            <p className="text-green-600 mb-4">
              Seu pedido foi processado e está sendo preparado
            </p>
            
            {/* Informações principais */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium">O.S. Nº {submittedOrder?.serviceOrder || submittedOrder?.serviceNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
                <Package className="h-4 w-4 text-purple-600" />
                <span className="font-medium">ID: {submittedOrder?._id?.substring(0, 8) || 'N/A'}</span>
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
              <User className="h-5 w-5 text-blue-600" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-gray-900">{clientName}</p>
              {clientPhone && (
                <p className="text-sm text-gray-600">Tel: {clientPhone}</p>
              )}
              {clientEmail && (
                <p className="text-sm text-gray-600">Email: {clientEmail}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações de Pagamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-gray-900">{getPaymentMethodText()}</p>
              {formData.paymentEntry > 0 && (
                <p className="text-sm text-gray-600">Entrada: {formatCurrency(formData.paymentEntry)}</p>
              )}
              {formData.installments > 1 && (
                <p className="text-sm text-gray-600">{formData.installments}x parcelas</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm">
                <span className="font-medium">Pedido:</span> {formData.orderDate ? new Date(formData.orderDate).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
              {formData.deliveryDate && (
                <p className="text-sm">
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
              <Package className="h-5 w-5 text-purple-600" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(Number(formData.totalPrice) || 0)}</span>
              </div>
              {Number(formData.discount) > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(Number(formData.discount))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(Number(formData.finalPrice) || Number(formData.totalPrice) || 0)}</span>
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