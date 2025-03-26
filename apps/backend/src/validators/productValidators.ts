import { z } from 'zod';

// Schema base para todos os produtos
const baseProductSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  sellPrice: z.number().positive("Preço de venda deve ser positivo"),
  costPrice: z.number().min(0).optional(),
  brand: z.string().optional(),
  image: z.string().optional(),
});

// Schemas específicos para cada tipo
export const lensSchema = baseProductSchema.extend({
  productType: z.literal("lenses"),
  lensType: z.string().min(2, "Tipo de lente é obrigatório"),
});

export const cleanLensSchema = baseProductSchema.extend({
  productType: z.literal("clean_lenses"),
});

export const prescriptionFrameSchema = baseProductSchema.extend({
  productType: z.literal("prescription_frame"),
  typeFrame: z.string().min(2, "Tipo de armação é obrigatório"),
  color: z.string().min(2, "Cor é obrigatória"),
  shape: z.string().min(2, "Formato é obrigatório"),
  reference: z.string().min(2, "Referência é obrigatória"),
});

export const sunglassesFrameSchema = baseProductSchema.extend({
  productType: z.literal("sunglasses_frame"),
  modelSunglasses: z.string().min(2, "Modelo é obrigatório"),
  typeFrame: z.string().min(2, "Tipo de armação é obrigatório"),
  color: z.string().min(2, "Cor é obrigatória"),
  shape: z.string().min(2, "Formato é obrigatório"),
  reference: z.string().min(2, "Referência é obrigatória"),
});

// Discriminating union para validação
export const productSchema = z.discriminatedUnion("productType", [
  lensSchema,
  cleanLensSchema,
  prescriptionFrameSchema,
  sunglassesFrameSchema
]);

// Exporta tipos inferidos
export type LensType = z.infer<typeof lensSchema>;
export type CleanLensType = z.infer<typeof cleanLensSchema>;
export type PrescriptionFrameType = z.infer<typeof prescriptionFrameSchema>;
export type SunglassesFrameType = z.infer<typeof sunglassesFrameSchema>;
export type ProductType = z.infer<typeof productSchema>;