import type { UseFormReturn } from "react-hook-form";

// Define a interface padrão para os dados de receita (prescrição)
export interface PrescriptionData {
  doctorName?: string;
  clinicName?: string;
  appointmentDate?: string;
  leftEye: {
    sph: number;
    cyl: number;
    axis: number;
  };
  rightEye: {
    sph: number;
    cyl: number;
    axis: number;
  };
  nd: number;
  oc: number;
  addition: number;
}

// Tipo para o formulário de pedido
export interface OrderFormValues {
  clientId: string;
  employeeId: string;
  productType: "glasses" | "lensCleaner";
  product: string;
  glassesType: "prescription" | "sunglasses";
  glassesFrame: "with" | "no";
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  orderDate?: string;
  deliveryDate?: string;
  status: string;
  laboratoryId?: string;
  lensType?: string;
  observations?: string;
  totalPrice: number;
  prescriptionData: PrescriptionData;
  [key: string]: unknown; // Permite propriedades adicionais
}

// Tipo padrão para o UseFormReturn usado em todos os componentes
export type OrderFormReturn = UseFormReturn<
  OrderFormValues,
  unknown,
  undefined
>;
