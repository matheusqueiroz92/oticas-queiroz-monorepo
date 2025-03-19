import type { UseFormReturn } from "react-hook-form";
import type { Product } from "./product";

// Interface para os dados de olho da receita
export interface EyeData {
  sph: number;
  cyl: number;
  axis: number;
  pd: number;
}

// Interface para os dados de prescrição
export interface PrescriptionData {
  doctorName: string;
  clinicName: string;
  appointmentDate: string;
  leftEye: EyeData;
  rightEye: EyeData;
  nd: number;
  oc: number;
  addition: number;
}

// Interface para o formulário de pedido
export interface OrderFormValues {
  clientId: string;
  employeeId: string;
  products: Product[]; // Array de produtos
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  orderDate: string;
  deliveryDate?: string;
  status: string;
  laboratoryId?: string;
  observations?: string;
  totalPrice: number;
  discount: number; // Campo de desconto
  finalPrice: number; // Campo de preço final
  prescriptionData: PrescriptionData;
  [key: string]: unknown; // Permite propriedades adicionais
}

// Tipo para o hook useForm do React Hook Form para o formulário de pedido
export type OrderFormReturn = UseFormReturn<OrderFormValues, unknown, undefined>;