import { OrderFormValues } from "@/app/types/order";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const orderFormSchema = z
  .object({
    clientId: z.string().min(1, "Cliente é obrigatório"),
    employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
    isInstitutionalOrder: z.boolean().default(false),
    institutionId: z.string().optional(),
    products: z.array(z.any()).min(1, "Pelo menos um produto é obrigatório"),
    serviceOerder: z.string().min(4, "Nº da Ordem de Serviço é obrigatório"),
    paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
    paymentEntry: z.number().min(0).optional(),
    installments: z.number().min(1).optional(),
    orderDate: z.string().optional(),
    deliveryDate: z.string().optional(),
    status: z.string().min(1, "Status é obrigatório"),
    laboratoryId: z.string().optional(),
    observations: z.string().optional(),
    totalPrice: z.number().min(0, "O preço total deve ser maior ou igual a zero"),
    discount: z.number().min(0, "O desconto deve ser maior ou igual a zero"),
    finalPrice: z.number().min(0, "O preço final deve ser maior ou igual a zero"),
    prescriptionData: z.object({
      doctorName: z.string().optional(),
      clinicName: z.string().optional(),
      appointmentDate: z.string().optional(),
      leftEye: z.object({
        sph: z.string(),
        cyl: z.string(),
        axis: z.number(),
        pd: z.number(),
      }),
      rightEye: z.object({
        sph: z.string(),
        cyl: z.string(),
        axis: z.number(),
        pd: z.number(),
      }),
      nd: z.number(),
      oc: z.number(),
      addition: z.number(),
      bridge: z.number(),
      rim: z.number(),
      vh: z.number(),
      sh: z.number(),
    }),
  })
  .passthrough()
  .refine(
    (data) => {
      if (data.isInstitutionalOrder && !data.institutionId) {
        return false;
      }
      return true;
    },
    {
      message: "Instituição é obrigatória para pedidos institucionais",
      path: ["institutionId"],
    }
  );

export type OrderFormData = z.infer<typeof orderFormSchema>;

export const createOrderform = () => {
  return useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema) as any,
    defaultValues: {
      employeeId: "",
      clientId: "",
      products: [],
      serviceOrder: 0,
      paymentMethod: "",
      paymentEntry: 0,
      installments: undefined,
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: new Date().toISOString().split("T")[0],
      status: "pending",
      laboratoryId: "",
      observations: "",
      totalPrice: 0,
      discount: 0,
      finalPrice: 0,
      prescriptionData: {
        doctorName: "",
        clinicName: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        leftEye: { sph: '', cyl: '', axis: 0, pd: 0 },
        rightEye: { sph: '', cyl: '', axis: 0, pd: 0 },
        nd: 0,
        oc: 0,
        addition: 0,
        bridge: 0,
        rim: 0,
        vh: 0,
        sh: 0,
      },
    }
  })
};
