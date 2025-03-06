export interface Order {
  _id: string;
  clientId: string;
  employeeId: string;
  product: string;
  glassesType: string;
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  deliveryDate?: string | Date;
  status: "pending" | "in_production" | "ready" | "delivered";
  laboratoryId?: string;
  prescriptionData?: {
    doctorName: string;
    clinicName: string;
    appointmentDate: string | Date;
    leftEye: {
      near: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
      far: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
    };
    rightEye: {
      near: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
      far: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
    };
  };
  lensType?: string;
  observations?: string;
  totalPrice: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
