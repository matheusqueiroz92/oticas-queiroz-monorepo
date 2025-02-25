import { z } from "zod";

export const orderFormSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  customClientName: z.string().optional(),
  employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
  products: z
    .array(
      z.object({
        _id: z.string().optional(),
        name: z.string().min(1, "Nome do produto é obrigatório"),
        price: z.number().min(0, "Preço deve ser maior que zero"),
      })
    )
    .min(1, "Selecione pelo menos um produto"),
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
  totalPrice: z.number().min(0, "O preço total deve ser maior que zero"),
  lensType: z.string().min(1, "O nome da lente é obrigatório"),
  observations: z.string().optional(),
});
