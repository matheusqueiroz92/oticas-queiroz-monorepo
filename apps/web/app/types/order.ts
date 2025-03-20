import type { Product } from "./product";

export interface Order {
  _id: string;
  clientId: string;
  employeeId: string;
  product: Product[];
  paymentMethod: string;
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
      pd: number;
    };
    rightEye: {
      sph: number;
      cyl: number;
      axis: number;
      pd: number;
    };
    nd: number;
    oc: number;
    addition: number;
  };
  observations?: string;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  
  // Dados normalizados para uso no frontend
  _normalized?: {
    clientName: string;
    clientId: string | null;
    employeeName: string;
    employeeId: string | null;
    laboratoryName: string | null;
  };
}