import { z } from 'zod';

// Schema para dados de prescrição
const prescriptionDataSchema = z.object({
  doctorName: z.string().min(2, "Nome do médico deve ter no mínimo 2 caracteres"),
  clinicName: z.string().min(2, "Nome da clínica deve ter no mínimo 2 caracteres"),
  appointmentDate: z.coerce.date(),
  rightEye: z.object({
    sph: z.number(),
    cyl: z.number(),
    axis: z.number(),
    pd: z.number(),
  }),
  leftEye: z.object({
    sph: z.number(),
    cyl: z.number(),
    axis: z.number(),
    pd: z.number(),
  }),
  nd: z.number(),
  oc: z.number(),
  addition: z.number(),
}).optional();

// Schema para produtos no pedido
const orderProductSchema = z.object({
  _id: z.string().min(1, "ID do produto é obrigatório"),
  // Demais campos são opcionais pois podem ser populados do banco de dados
  name: z.string().optional(),
  productType: z.enum(["lenses", "clean_lenses", "prescription_frame", "sunglasses_frame"]).optional(),
  sellPrice: z.number().optional(),
  description: z.string().optional(),
  // Outros campos opcionais
});

// Schema base para pedidos
const baseOrderSchema = z.object({
  clientId: z.string().min(1, "ID do cliente é obrigatório"),
  employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
  products: z.array(orderProductSchema).min(1, "Pelo menos um produto é obrigatório"),
  serviceOrder: z.string().optional(),
  paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
  paymentStatus: z.enum(["pending", "partially_paid", "paid"]),
  paymentEntry: z.number().min(0).optional(),
  installments: z.number().min(1).optional(),
  orderDate: z.coerce.date(),
  deliveryDate: z.coerce.date().optional(),
  status: z.enum(["pending", "in_production", "ready", "delivered", "cancelled"]),
  laboratoryId: z.string().nullable().optional(),
  prescriptionData: prescriptionDataSchema,
  observations: z.string().optional(),
  totalPrice: z.number().positive("Preço total deve ser positivo"),
  discount: z.number().min(0, "Desconto não pode ser negativo").default(0),
  finalPrice: z.number().positive("Preço final deve ser positivo").default(0),
  isDeleted: z.boolean().optional(),
});

// Schema para validar parâmetros de consulta
export const orderQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .default(1),
  limit: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .default(10),
  status: z.string().optional(),
  employeeId: z.string().optional(),
  clientId: z.string().optional(),
  laboratoryId: z.string().optional(),
  serviceOrder: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  productId: z.string().optional(),
  minPrice: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .optional(),
  maxPrice: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .optional(),
  search: z.string().optional(),
  // Adicionar suporte para CPF
  cpf: z.string().optional(),
  // Adicionar suporte explícito para o campo sort
  sort: z.string().optional().default("-createdAt") // Definir ordenação padrão
});

// Schema para validar atualização de status
export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "in_production", "ready", "delivered", "cancelled"]),
});

// Schema para validar atualização de laboratório
export const updateOrderLaboratorySchema = z.object({
  laboratoryId: z.string().nullable().optional(),
});

// Schema para criação de pedidos (com validações adicionais)
export const createOrderSchema = baseOrderSchema
  .refine(
    (data) => {
      // Validar que o preço final, se fornecido, é menor ou igual ao preço total
      if (data.finalPrice !== undefined) {
        return data.finalPrice <= data.totalPrice;
      }
      return true;
    },
    {
      message: "Preço final não pode ser maior que o preço total",
      path: ["finalPrice"],
    }
  )
  .refine(
    (data) => {
      // Validar que desconto não é maior que preço total
      if (data.discount !== undefined) {
        return data.discount <= data.totalPrice;
      }
      return true;
    },
    {
      message: "Desconto não pode ser maior que o preço total",
      path: ["discount"],
    }
  );

// Schema para atualização de pedidos
export const updateOrderSchema = baseOrderSchema
  .partial() // Todos os campos são opcionais para atualizações
  .refine(
    (data) => {
      // Validar que preço final, se fornecido, não é maior que preço total
      if (data.finalPrice !== undefined && data.totalPrice !== undefined) {
        return data.finalPrice <= data.totalPrice;
      }
      return true;
    },
    {
      message: "Preço final não pode ser maior que o preço total",
      path: ["finalPrice"],
    }
  )
  .refine(
    (data) => {
      // Validar que desconto, se fornecido, não é maior que preço total
      if (data.discount !== undefined && data.totalPrice !== undefined) {
        return data.discount <= data.totalPrice;
      }
      return true;
    },
    {
      message: "Desconto não pode ser maior que o preço total",
      path: ["discount"],
    }
  );

// Tipos inferidos para uso com TypeScript
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdateOrderLaboratoryInput = z.infer<typeof updateOrderLaboratorySchema>;
export type OrderQueryParams = z.infer<typeof orderQuerySchema>;