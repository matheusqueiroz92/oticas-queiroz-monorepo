import { OrderFormValues } from "@/app/_types/order";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const orderFormSchema = z
  .object({
    clientId: z.string().min(1, "Cliente é obrigatório"),
    employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
    isInstitutionalOrder: z.boolean().default(false),
    institutionId: z.string().optional(),
    hasResponsible: z.boolean().default(false),
    responsibleClientId: z.string().optional(),
    products: z.array(z.any()).min(1, "Pelo menos um produto é obrigatório"),
    serviceOrder: z.number().optional(),
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
      rightEye: z.object({
        sph: z.string(),
        cyl: z.string(),
        axis: z.number(),
        pd: z.number(),
      }),
      leftEye: z.object({
        sph: z.string(),
        cyl: z.string(),
        axis: z.number(),
        pd: z.number(),
      }),
      nd: z.number(),
      oc: z.number(),
      addition: z.string(),
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
  )
  .refine(
    (data) => {
      if (data.hasResponsible && !data.responsibleClientId) {
        return false;
      }
      return true;
    },
    {
      message: "Cliente responsável é obrigatório quando há responsável",
      path: ["responsibleClientId"],
    }
  )
;

export type OrderFormData = z.infer<typeof orderFormSchema>;

export const createOrderform = () => {
  return useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema) as any,
    defaultValues: {
      employeeId: "",
      clientId: "",
      hasResponsible: false,
      responsibleClientId: "",
      products: [],
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
        rightEye: { sph: '', cyl: '', axis: 0, pd: 0 },
        leftEye: { sph: '', cyl: '', axis: 0, pd: 0 },
        nd: 0,
        oc: 0,
        addition: "",
        bridge: 0,
        rim: 0,
        vh: 0,
        sh: 0,
      },
    }
  })
};

export { orderFormSchema };