import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/app/utils/formatters";

interface OrderReceiptPrinterProps {
  order: any;
  client: any;
  employee: any;
  getStatusBadge: (status: string) => { label: string; className: string };
}

const OrderReceiptPrinter: React.FC<OrderReceiptPrinterProps> = ({
  order,
  client,
  employee,
  getStatusBadge
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

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
          <title>Recibo de Pedido</title>
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
    
    // Produtos do pedido
    const products = Array.isArray(order.products) 
      ? order.products 
      : (order.products ? [order.products] : []);
      
    // Formatar data para exibição
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();
    
    // Montar o conteúdo do recibo
    let content = '';
    
    // Cabeçalho
    content += "       ÓTICAS QUEIROZ\n";
    content += "   COMPROVANTE DE PEDIDO\n";
    content += `Pedido #${order._id.substring(0, 8)} - OS: ${order.serviceOrder || 'N/A'}\n`;
    content += separator + "\n";
    
    // Informações principais
    content += `Cliente: ${client ? client.name : "Cliente não encontrado"}\n`;
    content += `Vendedor: ${employee ? employee.name : "Vendedor não encontrado"}\n`;
    content += `Data: ${formatDate(order.orderDate)}\n`;
    content += `Entrega: ${formatDate(order.deliveryDate)}\n`;
    content += `Status: ${getStatusBadge(order.status).label}\n`;
    content += separator + "\n";
    
    // Produtos
    content += "Produtos:\n";
    
    // Adicionar produtos com alinhamento à direita
    products.forEach((product: { name: string; sellPrice: any; }) => {
      const name = product.name || "Produto";
      const price = formatCurrency(product.sellPrice || 0);
      
      // Limitar tamanho do nome
      const nameMaxLength = 18;
      const truncatedName = name.length > nameMaxLength ? 
        name.substring(0, nameMaxLength - 3) + "..." : 
        name;
      
      // Calcular espaços para alinhar
      const spaces = " ".repeat(Math.max(1, 30 - truncatedName.length - price.length));
      
      content += truncatedName + spaces + price + "\n";
    });
    
    content += separator + "\n";
    content += `Subtotal: ${formatCurrency(order.totalPrice)}\n`;
    content += `Desconto: -${formatCurrency(order.discount || 0)}\n`;
    content += `Total: ${formatCurrency(order.finalPrice || order.totalPrice)}\n`;
    content += separator + "\n";
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

export default OrderReceiptPrinter;