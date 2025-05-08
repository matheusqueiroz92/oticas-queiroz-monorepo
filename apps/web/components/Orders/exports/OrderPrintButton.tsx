import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import type { Customer } from "@/app/types/customer";
import type { OrderFormValues } from "@/app/types/order";
import { PDFViewer } from '@react-pdf/renderer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Importamos o componente de PDF compacto e sua interface
import OrderPDF, { OrderPDFProps } from './OrderCompactPdf';

interface OrderPrintButtonProps {
  formData: OrderFormValues & { _id?: string };
  customer: Customer | null;
}

const OrderPrintButton: React.FC<OrderPrintButtonProps> = ({
  formData,
  customer,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const handlePrint = () => {
    setShowPdfPreview(true);
  };

  // Função para imprimir o PDF diretamente da visualização
  const printPdf = () => {
    // No React, podemos acessar a janela atual e chamar o método de impressão
    if (typeof window !== 'undefined') {
      setIsPrinting(true);
      try {
        window.print();
      } catch (err) {
        console.error('Erro ao imprimir:', err);
      } finally {
        setIsPrinting(false);
      }
    }
  };

  return (
    <>
      <Button
        type="button"
        className="w-full"
        variant="default"
        onClick={handlePrint}
        disabled={isPrinting}
      >
        {isPrinting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Printer className="mr-2 h-4 w-4" />
        )}
        {isPrinting ? "Preparando impressão..." : "Visualizar e Imprimir"}
      </Button>

      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Visualização do Pedido</DialogTitle>
          </DialogHeader>
          <div className="h-full w-full">
            <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
              <OrderPDF data={formData} customer={customer} />
            </PDFViewer>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowPdfPreview(false)}
            >
              Fechar
            </Button>
            <PDFDownloadLink
              document={<OrderPDF data={formData} customer={customer} />}
              fileName={`pedido-${formData._id || new Date().toISOString().split("T")[0]}.pdf`}
            >
              {({ loading, error }) => (
                <Button
                  type="button"
                  disabled={loading || !!error}
                  onClick={printPdf}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {loading ? "Preparando..." : "Imprimir"}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderPrintButton;