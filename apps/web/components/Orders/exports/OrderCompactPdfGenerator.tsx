import {
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import type { Customer } from "../../../app/types/customer";
import type { OrderFormValues } from "@/app/types/order";
import OrderPDF from "./OrderCompactPdf";

interface OrderCompactPdfGeneratorProps {
  formData: OrderFormValues & { _id?: string };
  customer: Customer | null;
}

export default function OrderCompactPdfGenerator({
  formData,
  customer,
}: OrderCompactPdfGeneratorProps) {
  return (
    <PDFDownloadLink
      document={<OrderPDF data={formData} customer={customer} />}
      fileName={`pedido-compacto-${formData._id || new Date().toISOString().split("T")[0]}.pdf`}
      className="block w-full"
    >
      {({ loading, error }) => (
        <Button
          type="button"
          className="w-full"
          disabled={loading || !!error}
          variant="outline"
        >
          <FileDown className="mr-2 h-4 w-4" />
          {loading ? "Gerando PDF..." : "Baixar PDF (2 vias)"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}