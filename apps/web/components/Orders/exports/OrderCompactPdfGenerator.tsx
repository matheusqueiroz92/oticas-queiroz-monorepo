// import { useEffect, useState } from "react";
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import { Button } from "@/components/ui/button";
// import { FileDown } from "lucide-react";
// import type { Customer } from "@/app/_types/customer";
// import type { OrderFormValues } from "@/app/_types/order";
// import { OrderCompactPDF } from "./OrderCompactPdf";
// import { api } from "@/app/_services/authService";
// import { API_ROUTES } from "@/app/_constants/api-routes";

// interface OrderCompactPdfGeneratorProps {
//   formData: OrderFormValues & { _id?: string };
//   customer: Customer | null;
// }

// export default function OrderCompactPdfGenerator({
//   formData,
//   customer,
// }: OrderCompactPdfGeneratorProps) {
//   const [customerData, setCustomerData] = useState<Customer | null>(customer);
//   const [isLoading, setIsLoading] = useState(false);
  
//   useEffect(() => {
//     const fetchCustomer = async () => {
//       if (!customer && formData.clientId) {
//         try {
//           setIsLoading(true);
          
//           const response = await api.get(API_ROUTES.USERS.BY_ID(formData.clientId));
          
//           if (response.data) {
//             setCustomerData(response.data);
//           }
//         } catch (error) {
//           console.error("Erro ao buscar dados do cliente:", error);
//         } finally {
//           setIsLoading(false);
//         }
//       }
//     };
    
//     fetchCustomer();
//   }, [customer, formData.clientId]);
  
//   return (
//     <PDFDownloadLink
//       document={<OrderCompactPDF data={formData} customer={customerData} employee={employee} />}
//       fileName={`pedido-compacto-${formData._id || new Date().toISOString().split("T")[0]}.pdf`}
//       className="block w-full"
//     >
//       {({ loading, error }) => (
//         <Button
//           type="button"
//           className="w-full"
//           disabled={loading || !!error || isLoading}
//           variant="outline"
//         >
//           <FileDown className="mr-2 h-4 w-4" />
//           {loading || isLoading ? "Carregando dados..." : "Baixar PDF (2 vias)"}
//         </Button>
//       )}
//     </PDFDownloadLink>
//   );
// }