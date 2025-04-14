import type { Product } from "./product";

export interface Order {
  _id: string;
  clientId: string;
  employeeId: string;
  institutionId?: string | null;
  isInstitutionalOrder?: boolean;
  products: Product[];
  serviceOrder?: string | null;
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
    bridge: number;
    rim: number;
    vh: number;
    sh: number;
  };
  observations?: string;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  
  _normalized?: {
    clientName: string;
    clientId: string | null;
    employeeName: string;
    employeeId: string | null;
    laboratoryName: string | null;
  };
}

export interface OrderColumn {
  key: keyof Order | string;
  header: string;
  render?: (data: Order) => React.ReactNode;
}