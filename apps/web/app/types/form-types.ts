import type { UseFormReturn } from "react-hook-form";
import type { Product } from "./product";
import { z } from "zod";

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

// Schema do Zod para validação
export const orderFormSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
  products: z.array(z.any()).min(1, "Pelo menos um produto é obrigatório"),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  paymentEntry: z.number().min(0).default(0),
  installments: z.number().min(1).optional(),
  orderDate: z.string().default(() => new Date().toISOString().split("T")[0]),
  deliveryDate: z.string().optional(),
  status: z.string().min(1, "Status é obrigatório").default("pending"),
  laboratoryId: z.string().optional(),
  observations: z.string().optional(),
  totalPrice: z.number().min(0, "O preço total deve ser maior ou igual a zero"),
  discount: z.number().min(0, "O desconto deve ser maior ou igual a zero").default(0),
  finalPrice: z.number().min(0, "O preço final deve ser maior ou igual a zero"),
  prescriptionData: z.object({
    doctorName: z.string().optional(),
    clinicName: z.string().optional(),
    appointmentDate: z.string().optional(),
    leftEye: z.object({
      sph: z.number().default(0),
      cyl: z.number().default(0),
      axis: z.number().default(0),
      pd: z.number().default(0),
    }),
    rightEye: z.object({
      sph: z.number().default(0),
      cyl: z.number().default(0),
      axis: z.number().default(0),
      pd: z.number().default(0),
    }),
    nd: z.number().default(0),
    oc: z.number().default(0),
    addition: z.number().default(0),
  }),
});

// Interface para o formulário de pedido
export interface OrderFormValues {
  clientId: string;
  employeeId: string;
  products: Product[]; // Array de produtos
  paymentMethod: string;
  paymentEntry: number;
  installments?: number;
  orderDate: string;
  deliveryDate?: string;
  status: string;
  laboratoryId?: string;
  observations?: string;
  totalPrice: number;
  discount: number; // Campo de desconto
  finalPrice: number; // Campo de preço final
  prescriptionData: {
    doctorName: string;
    clinicName: string;
    appointmentDate: string;
    leftEye: EyeData;
    rightEye: EyeData;
    nd: number;
    oc: number;
    addition: number;
  };
  [key: string]: unknown; // Permite propriedades adicionais
}

// Tipo para inferir os valores do schema do Zod
export type OrderFormSchemaValues = z.infer<typeof orderFormSchema>;

// Tipo para o hook useForm do React Hook Form para o formulário de pedido
export type OrderFormReturn = UseFormReturn<OrderFormValues, any, undefined>;