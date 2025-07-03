import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, User, Calendar, CreditCard, DollarSign, Receipt } from "lucide-react";
import type { Customer } from "@/app/_types/customer";
import type { IPayment } from "@/app/_types/payment";
import type { Order } from "@/app/_types/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";

interface PaymentSuccessScreenProps {
  submittedPayment: IPayment;
  associatedOrder?: Order | null;
  associatedCustomer?: Customer | null;
  onViewPaymentsList: () => void;
  onCreateNewPayment: () => void;
  onClose: () => void;
}

export default function PaymentSuccessScreen({
  submittedPayment,
  associatedOrder,
  associatedCustomer,
  onViewPaymentsList,
  onCreateNewPayment,
  onClose,
}: PaymentSuccessScreenProps) {
  
  console.log("PaymentSuccessScreen - submittedPayment:", submittedPayment);
  console.log("PaymentSuccessScreen - associatedOrder:", associatedOrder);
  console.log("PaymentSuccessScreen - associatedCustomer:", associatedCustomer);
  
  const getPaymentMethodText = () => {
    switch (submittedPayment.paymentMethod) {
      case "credit": return "Cartão de Crédito";
      case "debit": return "Cartão de Débito";
      case "cash": return "Dinheiro";
      case "pix": return "PIX";
      case "bank_slip": return "Boleto Bancário";
      case "promissory_note": return "Nota Promissória";
      case "check": return "Cheque";
      case "mercado_pago": return "Mercado Pago";
      default: return "Não especificado";
    }
  };

  const getPaymentTypeText = () => {
    switch (submittedPayment.type) {
      case "sale": return "Venda";
      case "debt_payment": return "Pagamento de Débito";
      case "expense": return "Despesa";
      default: return "Não especificado";
    }
  };

  const getPaymentStatusText = () => {
    switch (submittedPayment.status) {
      case "completed": return "Concluído";
      case "pending": return "Pendente";
      case "cancelled": return "Cancelado";
      default: return "Não especificado";
    }
  };

  const getPaymentStatusColor = () => {
    switch (submittedPayment.status) {
      case "completed": return "text-green-600 bg-green-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "cancelled": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  // Obter informações do cliente
  let clientName = 'Cliente não identificado';
  let clientPhone = null;
  let clientEmail = null;

  if (associatedCustomer) {
    clientName = associatedCustomer.name;
    clientPhone = associatedCustomer.phone;
    clientEmail = associatedCustomer.email;
  }

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
              Pagamento Registrado com Sucesso!
            </h2>
            <p className="text-green-600 mb-4">
              O pagamento foi processado e registrado no sistema
            </p>
            
            {/* Informações principais */}
            <div className="flex items-center gap-6 text-sm flex-wrap justify-center">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
                <Receipt className="h-4 w-4 text-blue-600" />
                <span className="font-medium">ID: {submittedPayment._id?.substring(0, 8) || 'N/A'}</span>
              </div>
              
              {associatedOrder?.serviceOrder && (
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">O.S. Nº {associatedOrder.serviceOrder}</span>
                </div>
              )}
              
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getPaymentStatusColor()}`}>
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">{getPaymentStatusText()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Pagamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações do Pagamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Detalhes do Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xl font-bold text-green-700 mb-2">
                {formatCurrency(submittedPayment.amount)}
              </p>
              <p className="text-sm">
                <span className="font-medium">Tipo:</span> {getPaymentTypeText()}
              </p>
              <p className="text-sm">
                <span className="font-medium">Método:</span> {getPaymentMethodText()}
              </p>
              <p className="text-sm">
                <span className="font-medium">Data:</span> {formatDate(submittedPayment.date)}
              </p>
              {submittedPayment.description && (
                <p className="text-sm">
                  <span className="font-medium">Descrição:</span> {submittedPayment.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Cliente */}
        {associatedCustomer && (
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
        )}

        {/* Informações do Pedido Associado */}
        {associatedOrder && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Pedido Associado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">
                  O.S. Nº {associatedOrder.serviceOrder}
                </p>
                <p className="text-sm text-gray-600">
                  Valor Total: {formatCurrency(associatedOrder.finalPrice || associatedOrder.totalPrice)}
                </p>
                <p className="text-sm text-gray-600">
                  Status: {associatedOrder.paymentStatus === 'paid' ? 'Pago' : 
                           associatedOrder.paymentStatus === 'partially_paid' ? 'Parcialmente Pago' : 'Pendente'}
                </p>
                <p className="text-sm text-gray-600">
                  Data: {formatDate(associatedOrder.orderDate)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações Adicionais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm">
                <span className="font-medium">Registrado em:</span> {formatDate(submittedPayment.createdAt || submittedPayment.date)}
              </p>
              {submittedPayment.installments && submittedPayment.installments.total > 1 && (
                <p className="text-sm">
                  <span className="font-medium">Parcelamento:</span> {submittedPayment.installments.current}/{submittedPayment.installments.total}
                </p>
              )}
              {submittedPayment.check && (
                <div className="text-sm">
                  <p><span className="font-medium">Banco:</span> {submittedPayment.check.bank}</p>
                  <p><span className="font-medium">Nº Cheque:</span> {submittedPayment.check.checkNumber}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onViewPaymentsList}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Receipt className="h-4 w-4" />
              Ver Lista de Pagamentos
            </Button>
            
            <Button
              onClick={onCreateNewPayment}
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Novo Pagamento
            </Button>
            
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex items-center gap-2"
            >
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 