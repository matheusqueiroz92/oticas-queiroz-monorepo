import { OrderFormValues } from "@/app/types/form-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const orderFormSchema = z
  .object({
    clientId: z.string().min(1, "Cliente é obrigatório"),
    employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
    product: z.array(z.any()).min(1, "Pelo menos um produto é obrigatório"),
    serviceOerder: z.string().optional(),
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
        sph: z.number(),
        cyl: z.number(),
        axis: z.number(),
        pd: z.number(),
      }),
      rightEye: z.object({
        sph: z.number(),
        cyl: z.number(),
        axis: z.number(),
        pd: z.number(),
      }),
      nd: z.number(),
      oc: z.number(),
      addition: z.number(),
    }),
  })
  .passthrough();

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
        leftEye: { sph: 0, cyl: 0, axis: 0, pd: 0 },
        rightEye: { sph: 0, cyl: 0, axis: 0, pd: 0 },
        nd: 0,
        oc: 0,
        addition: 0,
      },
    }
  })
};
