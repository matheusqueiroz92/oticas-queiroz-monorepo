import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const baseProductSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  productType: z.enum(["lenses", "clean_lenses", "prescription_frame", "sunglasses_frame"], {
    required_error: "Selecione um tipo de produto",
  }),
  description: z.string().optional(),
  brand: z.string().optional(),
  sellPrice: z.number().min(0, "Preço de venda inválido"),
  costPrice: z.number().min(0, "Preço de custo inválido").optional(),
});

const lensSchema = baseProductSchema.extend({
  productType: z.literal("lenses"),
  lensType: z.string().min(2, "Tipo de lente é obrigatório"),
});

const cleanLensSchema = baseProductSchema.extend({
  productType: z.literal("clean_lenses"),
});

const frameBaseSchema = {
  typeFrame: z.string().min(2, "Tipo de armação é obrigatório"),
  color: z.string().min(2, "Cor é obrigatória"),
  shape: z.string().min(2, "Formato é obrigatório"),
  reference: z.string().min(2, "Referência é obrigatória"),
  stock: z.number().optional(),
};

const prescriptionFrameSchema = baseProductSchema.extend({
  productType: z.literal("prescription_frame"),
  ...frameBaseSchema,
});

const sunglassesFrameSchema = baseProductSchema.extend({
  productType: z.literal("sunglasses_frame"),
  modelSunglasses: z.string().min(2, "Modelo é obrigatório"),
  ...frameBaseSchema,
});

const productFormSchema = z.discriminatedUnion("productType", [
    lensSchema,
    cleanLensSchema,
    prescriptionFrameSchema,
    sunglassesFrameSchema
]);

export type ProductFormData = z.infer<typeof productFormSchema>;

export const createProductForm = () => {
    return useForm<ProductFormData>({
        resolver: zodResolver(productFormSchema),
            defaultValues: {
            name: "",
            productType: "lenses",
            description: "",
            brand: "",
            sellPrice: 0,
            costPrice: 0,
        } as any,
    });
}