import { Product } from "./product";

export interface Order {
  _id: string;
  clientId: string;
  employeeId: string;
  product: Product[]; // Agora é um array de produtos, pois um pedido pode ter mais de um produto
  paymentMethod: string; // 
  paymentEntry?: number;
  installments?: number;
  orderDate: string | Date;
  deliveryDate?: string | Date;
  status: "pending" | "in_production" | "ready" | "delivered" | "cancelled";
  laboratoryId?: string | null;
  prescriptionData?: {
    doctorName: string;
    clinicName: string;
    appointmentDate: string | Date;
    leftEye: {
      sph: number;
      cyl: number;
      axis: number;
      pd: number; // Novo campo
    };
    rightEye: {
      sph: number;
      cyl: number;
      axis: number;
      pd: number; // Novo campo
    };
    nd: number;
    oc: number;
    addition: number;
  };
  observations?: string;
  totalPrice: number; // soma dos preços dos produtos
  discount: number;
  finalPrice: number; // totalprice - discount
  createdAt?: string | Date;
  updatedAt?: string | Date;
}