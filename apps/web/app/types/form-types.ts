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

// Define a interface padrão para valores do formulário de pedido
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
  deliveryDate?: string;
  status: string;
  laboratoryId?: string;
  lensType?: string;
  observations?: string;
  totalPrice: number;
  prescriptionData: PrescriptionData;
  // Permitir propriedades adicionais de string
  [key: string]: unknown;
}

// Tipo padrão para o UseFormReturn usado em todos os componentes
export type OrderFormReturn = UseFormReturn<
  OrderFormValues,
  unknown,
  undefined
>;
