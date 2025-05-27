import { useEffect, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import type { Customer } from "@/app/_types/customer";
import type { Order } from "@/app/_types/order";
import type { OrderFormValues } from "@/app/_types/order";
import { OrderCompactPDF } from "./OrderCompactPdf";
import { api } from "@/app/_services/authService";
import { API_ROUTES } from "@/app/_constants/api-routes";
import { useUsers } from "@/hooks/useUsers";

interface OrderPdfExporterProps {
  formData?: OrderFormValues & { _id?: string };
  order?: Order;
  customer?: Customer | null;
  buttonText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
}

const { getUserById } = useUsers();

export default function OrderPdfExporter({
  formData,
  order,
  customer: initialCustomer,
  buttonText = "Baixar PDF",
  variant = "outline",
  size = "default",
  className = "",
  disabled = false,
}: OrderPdfExporterProps) {
  const [customerData, setCustomerData] = useState<Customer | null>(initialCustomer || null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalizar os dados do pedido para o formato esperado pelo PDF
  const normalizeOrderData = (sourceOrder: Order): OrderFormValues & { _id?: string } => {
    return {
      _id: sourceOrder._id,
      clientId: typeof sourceOrder.clientId === 'string' ? sourceOrder.clientId : (sourceOrder.clientId as { _id: string })?._id || '',
      employeeId: typeof sourceOrder.employeeId === 'string' ? sourceOrder.employeeId : (sourceOrder.employeeId as { _id: string })?._id || '',
      institutionId: sourceOrder.institutionId ? 
        (typeof sourceOrder.institutionId === 'string' ? sourceOrder.institutionId : (sourceOrder.institutionId as { _id: string })?._id) : 
        undefined,
      isInstitutionalOrder: sourceOrder.isInstitutionalOrder || false,
      products: Array.isArray(sourceOrder.products) ? sourceOrder.products : [sourceOrder.products],
      serviceOrder: typeof sourceOrder.serviceOrder === 'number' ? 
        sourceOrder.serviceOrder : 
        (sourceOrder.serviceOrder ? parseInt(sourceOrder.serviceOrder.toString(), 10) : 0),
      paymentMethod: sourceOrder.paymentMethod,
      paymentEntry: sourceOrder.paymentEntry || 0,
      installments: sourceOrder.installments,
      orderDate: typeof sourceOrder.orderDate === 'string' ? 
        sourceOrder.orderDate : 
        new Date(sourceOrder.orderDate).toISOString(),
      deliveryDate: sourceOrder.deliveryDate ? 
        (typeof sourceOrder.deliveryDate === 'string' ? 
          sourceOrder.deliveryDate : 
          new Date(sourceOrder.deliveryDate).toISOString()) : 
        undefined,
      status: sourceOrder.status,
      laboratoryId: sourceOrder.laboratoryId ? 
        (typeof sourceOrder.laboratoryId === 'string' ? sourceOrder.laboratoryId : (sourceOrder.laboratoryId as { _id: string })?._id) : 
        undefined,
      observations: sourceOrder.observations || "",
      totalPrice: sourceOrder.totalPrice,
      discount: sourceOrder.discount || 0,
      finalPrice: sourceOrder.finalPrice,
      prescriptionData: {
        doctorName: sourceOrder.prescriptionData?.doctorName || "",
        clinicName: sourceOrder.prescriptionData?.clinicName || "",
        appointmentDate: sourceOrder.prescriptionData?.appointmentDate ? 
          (typeof sourceOrder.prescriptionData.appointmentDate === 'string' ? 
            sourceOrder.prescriptionData.appointmentDate : 
            new Date(sourceOrder.prescriptionData.appointmentDate).toISOString()) : 
          "",
        leftEye: {
          sph: sourceOrder.prescriptionData?.leftEye?.sph?.toString() || "",
          cyl: sourceOrder.prescriptionData?.leftEye?.cyl?.toString() || "",
          axis: sourceOrder.prescriptionData?.leftEye?.axis || 0,
          pd: sourceOrder.prescriptionData?.leftEye?.pd || 0,
        },
        rightEye: {
          sph: sourceOrder.prescriptionData?.rightEye?.sph?.toString() || "",
          cyl: sourceOrder.prescriptionData?.rightEye?.cyl?.toString() || "",
          axis: sourceOrder.prescriptionData?.rightEye?.axis || 0,
          pd: sourceOrder.prescriptionData?.rightEye?.pd || 0,
        },
        nd: sourceOrder.prescriptionData?.nd || 0,
        oc: sourceOrder.prescriptionData?.oc || 0,
        addition: sourceOrder.prescriptionData?.addition || 0,
        bridge: sourceOrder.prescriptionData?.bridge || 0,
        rim: sourceOrder.prescriptionData?.rim || 0,
        vh: sourceOrder.prescriptionData?.vh || 0,
        sh: sourceOrder.prescriptionData?.sh || 0,
      }
    };
  };

  // Buscar dados do cliente se necessário
  const fetchCustomerData = async (clientId: string) => {
    try {
      const response = await api.get(API_ROUTES.USERS.BY_ID(clientId));
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar dados do cliente:", error);
      return null;
    }
  };

  // Effect para carregar dados quando necessário
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let finalOrderData: any = null;
        let finalCustomerData: Customer | null = initialCustomer || null;

        // Se temos formData (pedido recém-criado), usar diretamente
        if (formData) {
          finalOrderData = formData;
          
          // Buscar dados do cliente se não foram fornecidos
          if (!finalCustomerData && formData.clientId) {
            finalCustomerData = await fetchCustomerData(formData.clientId);
          }
        }
        // Se temos order (pedido existente), normalizar dados
        else if (order) {
          finalOrderData = normalizeOrderData(order);
          
          // Extrair cliente do order ou buscar se necessário
          if (!finalCustomerData) {
            if (typeof order.clientId === 'object' && 'name' in order.clientId) {
              finalCustomerData = order.clientId as Customer;
            } else if (typeof order.clientId === 'string') {
              finalCustomerData = await fetchCustomerData(order.clientId);
            }
          }
        }

        setOrderData(finalOrderData);
        setCustomerData(finalCustomerData);
        setEmployeeData(finalOrderData.employeeId ? await getUserById(finalOrderData.employeeId) : null);
      } catch (err) {
        console.error("Erro ao carregar dados para PDF:", err);
        setError("Erro ao carregar dados para exportação");
      } finally {
        setIsLoading(false);
      }
    };

    // Só carregar se não temos dados suficientes
    if ((formData || order) && !orderData) {
      loadData();
    }
  }, [formData, order, initialCustomer, orderData]);

  // Se não temos dados suficientes, não renderizar
  if (!formData && !order) {
    return null;
  }

  // Se ainda está carregando
  if (isLoading || !orderData) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled={true}
        className={className}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando...
      </Button>
    );
  }

  // Se houve erro
  if (error) {
    return (
      <Button
        variant="destructive"
        size={size}
        disabled={true}
        className={className}
      >
        <FileDown className="mr-2 h-4 w-4" />
        Erro ao carregar
      </Button>
    );
  }

  // Gerar nome do arquivo
  const fileName = `pedido-${orderData._id ? orderData._id.substring(0, 8) : new Date().toISOString().split("T")[0]}.pdf`;

  return (
    <PDFDownloadLink
      document={<OrderCompactPDF data={orderData} customer={customerData} employee={employeeData} />}
      fileName={fileName}
      className={`block ${className}`}
    >
      {({ loading, error: pdfError }) => (
        <Button
          variant={variant}
          size={size}
          disabled={loading || !!pdfError || disabled}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}