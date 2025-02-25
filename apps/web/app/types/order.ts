export interface Order {
  _id: string;
  clientId: string;
  employeeId: string;
  product: string;
  description?: string;
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  deliveryDate: Date;
  status: "pending" | "in_production" | "ready" | "delivered";
  laboratoryId?: string;
  lensType: string;
  prescriptionData: {
    doctorName: string;
    clinicName: string;
    appointmentdate: Date;
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
  totalPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}
