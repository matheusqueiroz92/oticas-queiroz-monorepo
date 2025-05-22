import type { UseFormReturn } from "react-hook-form";
import type { Product } from "./product";
import { z } from "zod";

// Interface para os dados de olho da receita
export interface EyeData {
  sph: string;
  cyl: string;
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
  bridge: number;
  rim: number;
  vh: number;
  sh: number;
}

// Schema do Zod para validação
export const orderFormSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
  institutionId: z.string().optional(),
  isInstitutionalOrder: z.boolean(),
  products: z.array(z.any()).min(1, "Pelo menos um produto é obrigatório"),
  serviceOerder: z.string().min(4, "Nº da Ordem de Serviço é obrigatório"),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  paymentStatus: z.enum(["pending", "paid", "partially_paid"]).default("pending"),
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
    bridge: z.number().default(0),
    rim: z.number().default(0),
    vh: z.number().default(0),
    sh: z.number().default(0),
  }),
});

export interface OrderFormValues {
  clientId: string;
  employeeId: string;
  institutionId: string;
  isInstitutionalOrder: boolean;
  products: Product[];
  serviceOrder: number;
  paymentMethod: string;
  paymentEntry: number;
  installments?: number;
  orderDate: string;
  deliveryDate?: string;
  status: string;
  laboratoryId?: string;
  observations?: string;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  prescriptionData: {
    doctorName: string;
    clinicName: string;
    appointmentDate: string;
    leftEye: EyeData;
    rightEye: EyeData;
    nd: number;
    oc: number;
    addition: number;
    bridge: number;
    rim: number;
    vh: number;
    sh: number;
  };
  [key: string]: unknown;
}

export type OrderFormSchemaValues = z.infer<typeof orderFormSchema>;

export type OrderFormReturn = UseFormReturn<OrderFormValues, any, undefined>;