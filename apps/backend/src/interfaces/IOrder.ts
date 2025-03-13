export interface IOrder {
  _id: string;
  clientId: string;
  employeeId: string;
  productType: "glasses" | "lensCleaner";
  product: string;
  glassesType: "prescription" | "sunglasses";
  glassesFrame: "with" | "no";
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  orderDate: Date;
  deliveryDate?: Date;
  status: "pending" | "in_production" | "ready" | "delivered" | "cancelled";
  laboratoryId?: string | null;
  prescriptionData?: {
    doctorName: string;
    clinicName: string;
    appointmentDate: Date;
    leftEye: {
      sph: number;
      cyl: number;
      axis: number;
    };
    rightEye: {
      sph: number;
      cyl: number;
      axis: number;
    };
    nd: number;
    oc: number;
    addition: number;
  };
  lensType?: string;
  observations?: string;
  totalPrice: number;
  // Campos para soft delete
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateOrderDTO = Omit<IOrder, "_id" | "createdAt" | "updatedAt">;
