export interface Order {
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
  orderDate: string | Date;
  deliveryDate?: string | Date;
  status: "pending" | "in_production" | "ready" | "delivered";
  laboratoryId?: string | null;
  prescriptionData?: {
    doctorName: string;
    clinicName: string;
    appointmentDate: string | Date;
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
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
