import { z } from "zod";

export const orderFormSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  customClientName: z.string().optional(),
  employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
  product: z.string().min(1, "O produto é obrigatório"),
  glassesType: z.string().min(1, "Tipo de óculos é obrigatório"),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  installments: z.number().optional(),
  paymentEntry: z.number().optional(),
  status: z.string().min(1, "Status é obrigatório"),
  deliveryDate: z.string().min(1, "Data de entrega é obrigatória"),
  prescriptionData: z.object({
    doctorName: z.string().min(1, "Nome do médico é obrigatório"),
    clinicName: z.string().min(1, "Nome da clínica é obrigatório"),
    appointmentDate: z.string().min(1, "Data da consulta é obrigatória"),
    leftEye: z.object({
      near: z.object({
        sph: z.number(),
        cyl: z.number(),
        axis: z.number(),
        pd: z.number(),
      }),
      far: z.object({
        sph: z.number(),
        cyl: z.number(),
        axis: z.number(),
        pd: z.number(),
      }),
    }),
    rightEye: z.object({
      near: z.object({
        sph: z.number(),
        cyl: z.number(),
        axis: z.number(),
        pd: z.number(),
      }),
      far: z.object({
        sph: z.number(),
        cyl: z.number(),
        axis: z.number(),
        pd: z.number(),
      }),
    }),
  }),
  lensType: z.string().min(1, "O nome da lente é obrigatório"),
  observations: z.string().optional(),
  totalPrice: z.number().min(0, "O preço total deve ser maior que zero"),
});
