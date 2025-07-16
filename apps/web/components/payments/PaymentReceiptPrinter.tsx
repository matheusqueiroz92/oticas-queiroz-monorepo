import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/app/_utils/formatters";
import type { IPayment } from "@/app/_types/payment";
import type { LegacyClient } from "@/app/_types/legacy-client";
import { useOrders } from '@/hooks/orders/useOrders';

interface PaymentReceiptPrinterProps {
  payment: IPayment;
  legacyClient?: LegacyClient | null;
  translatePaymentStatus: (status: string) => string;
  translatePaymentType: (type: string) => string;
  translatePaymentMethod: (method: string) => string;
  getUserName: (id: string) => string;
}

const PaymentReceiptPrinter: React.FC<PaymentReceiptPrinterProps> = ({
  payment,
  legacyClient,
  translatePaymentStatus,
  translatePaymentType,
  translatePaymentMethod,
  getUserName
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const { fetchOrderById } = useOrders();

  const { data: order } = fetchOrderById(payment?.orderId as string);

  const handlePrint = () => {
    setIsPrinting(true);
    
    // Criar o conteúdo do recibo
    const receiptContent = generateReceiptContent();
    
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Recibo de Pagamento</title>
          <style>
            body {
              font-family: monospace;
              font-size: 14px;
              line-height: 1.2;
              width: 300px;
              margin: 0 auto;
              padding: 10px;
            }
            pre {
              white-space: pre;
              margin: 0;
            }
            @media print {
              body {
                width: 80mm;
              }
              @page {
                size: 80mm 150mm;
                margin: 5mm;
              }
            }
          </style>
        </head>
        <body>
          <pre>${receiptContent}</pre>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
    } else {
      alert('Não foi possível abrir a janela de impressão. Verifique se os pop-ups estão permitidos.');
    }
    
    setIsPrinting(false);
  };

  // Função para gerar o conteúdo do recibo
  const generateReceiptContent = () => {
    // Formatação de linha separadora
    const separator = "---------------------------";
    
    // Formatar data para exibição
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();
    
    // Montar o conteúdo do recibo
    let content = '';
    
    // Cabeçalho
    content += "       ÓTICAS QUEIROZ\n";
    content += "   COMPROVANTE DE PAGAMENTO\n";
    content += `Pagamento #${payment._id.substring(0, 8)} - OS: ${order?.serviceOrder ?? 'N/A'}\n`;
    content += separator + "\n";
    
    // Informações principais
    const clientName = payment.customerId 
      ? getUserName(payment.customerId) 
      : (legacyClient ? legacyClient.name : "Cliente não identificado");
    
    content += `Cliente: ${clientName}\n`;
    content += `Tipo: ${translatePaymentType(payment.type)}\n`;
    content += `Método: ${translatePaymentMethod(payment.paymentMethod)}\n`;
    content += `Data: ${formatDate(payment.date)}\n`;
    content += `Status: ${translatePaymentStatus(payment.status)}\n`;
    
    // Informações adicionais específicas para cada método de pagamento
    if (payment.paymentMethod === "credit" && payment.installments) {
      content += `Parcelas: ${payment.installments.current || 1}/${payment.installments.total || 1}\n`;
    }
    
    if (payment.paymentMethod === "check" && payment.check) {
      content += `Banco: ${payment.check.bank}\n`;
      content += `Cheque: ${payment.check.checkNumber}\n`;
      content += `Titular: ${payment.check.accountHolder}\n`;
    }
    
    // Informações do Mercado Pago
    if (payment.paymentMethod === "mercado_pago" && payment.mercadoPagoId) {
      content += `ID Mercado Pago: ${payment.mercadoPagoId}\n`;
      
      if (payment.mercadoPagoData) {
        if (payment.mercadoPagoData.payment_method_id) {
          content += `Método MP: ${
            payment.mercadoPagoData.payment_method_id === "credit_card" ? "Cartão de Crédito" :
            payment.mercadoPagoData.payment_method_id === "debit_card" ? "Cartão de Débito" :
            payment.mercadoPagoData.payment_method_id === "pix" ? "PIX" :
            payment.mercadoPagoData.payment_method_id === "ticket" ? "Boleto" :
            payment.mercadoPagoData.payment_method_id
          }\n`;
        }
        
        if (payment.mercadoPagoData.installments && payment.mercadoPagoData.installments > 1) {
          content += `Parcelas MP: ${payment.mercadoPagoData.installments}x\n`;
        }
      }
    }
    
    content += separator + "\n";
    
    // Valor
    content += `Valor Total: ${formatCurrency(payment.amount)}\n`;
    
    if (payment.description) {
      content += separator + "\n";
      content += "Descrição:\n";
      content += `${payment.description}\n`;
    }
    
    content += separator + "\n";
    content += "Registrado por: " + getUserName(payment.createdBy) + "\n";
    content += "www.oticasqueiroz.com.br\n";
    content += `Impresso em ${formattedDate} ${formattedTime}`;
    
    return content;
  };

  return (
    <Button 
      variant="outline" 
      size="default"
      onClick={handlePrint} 
      className="text-sm gap-2"
      disabled={isPrinting}
    >
      {isPrinting ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Preparando...
        </>
      ) : (
        <>
          <Printer className="h-4 w-4" />
          Imprimir
        </>
      )}
    </Button>
  );
};

export default PaymentReceiptPrinter;