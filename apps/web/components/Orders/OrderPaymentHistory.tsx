import { useEffect, useState } from "react";
import { api } from "@/app/services/authService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { CreditCard, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { IPayment } from "@/app/types/payment";

interface OrderPaymentHistoryProps {
  orderId: string;
  finalPrice: number;
}

export default function OrderPaymentHistory({ 
  orderId, 
  finalPrice,
}: OrderPaymentHistoryProps) {
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  
  const fetchPaymentHistory = async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/api/orders/${orderId}/payments`);
      
      let paymentData: IPayment[] = [];
      
      if (Array.isArray(response.data)) {
        paymentData = response.data;
      } else if (response.data?.payments && Array.isArray(response.data.payments)) {
        paymentData = response.data.payments;
      }
      
      // Filtrar apenas pagamentos concluídos (não cancelados)
      const completedPayments = paymentData.filter(p => p.status === "completed");
      
      setPayments(completedPayments);
      
      // Calcular total pago
      const total = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      setTotalPaid(total);
      
    } catch (err) {
      console.error("Erro ao buscar histórico de pagamentos:", err);
      setError("Não foi possível carregar o histórico de pagamentos");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPaymentHistory();
  }, [orderId]);
  
  const getRemainingAmount = () => {
    return Math.max(0, finalPrice - totalPaid);
  };
  
  if (isLoading) {
    return (
      <Card className="shadow-none border mt-4">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-none border mt-4">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm flex items-center gap-1">
          <CreditCard className="h-3.5 w-3.5 text-primary" />
          Histórico de Pagamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-3">
          <div className="flex justify-between text-sm border-b pb-2">
            <span className="text-gray-600">Valor Total:</span>
            <span className="font-medium">{formatCurrency(finalPrice)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Pago:</span>
            <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Valor Restante:</span>
            <span className="font-medium text-blue-600">{formatCurrency(getRemainingAmount())}</span>
          </div>
          
          <div className="mt-4">
            <h4 className="text-xs font-medium border-b pb-1 mb-2">Pagamentos Registrados</h4>
            
            {error && (
              <div className="flex items-center text-red-600 text-xs p-2 bg-red-50 rounded">
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                {error}
              </div>
            )}
            
            {!error && payments.length === 0 && (
              <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded">
                Não há registros de pagamentos
              </div>
            )}
            
            {payments.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {payments.map((payment) => (
                  <div 
                    key={payment._id} 
                    className="text-xs p-2 bg-gray-50 rounded border flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">
                        {formatCurrency(payment.amount)}
                        {payment.installments && payment.installments.total > 1 && (
                          <span className="text-gray-500 ml-1">
                            ({payment.installments.total}x de {formatCurrency(payment.installments.value)})
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 flex flex-col">
                        <span>{formatDate(payment.date)}</span>
                        <span className="capitalize">
                          {payment.paymentMethod === "credit" ? "Cartão de Crédito" :
                           payment.paymentMethod === "debit" ? "Cartão de Débito" :
                           payment.paymentMethod === "cash" ? "Dinheiro" :
                           payment.paymentMethod === "pix" ? "PIX" :
                           payment.paymentMethod === "check" ? "Cheque" : 
                           payment.paymentMethod}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize" style={{ pointerEvents: 'none' }} >
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}