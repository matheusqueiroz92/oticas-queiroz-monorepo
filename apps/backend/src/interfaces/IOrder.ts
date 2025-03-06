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
  deliveryDate?: Date;
  status: "pending" | "in_production" | "ready" | "delivered" | "cancelled";
  laboratoryId?: string;
  prescriptionData?: {
    doctorName: string;
    clinicName: string;
    appointmentDate: Date;
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
  description?: string;
  totalPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateOrderDTO {
  clientId: string;
  employeeId: string;
  productType: "glasses" | "lensCleaner";
  product: string;
  glassesType: "prescription" | "sunglasses";
  glassesFrame: "with" | "no";
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  deliveryDate: Date;
  status: "pending" | "in_production" | "ready" | "delivered";
  laboratoryId?: string;
  prescriptionData: {
    doctorName: string;
    clinicName: string;
    appointmentDate: Date;
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
  createdAt?: Date;
  updatedAt?: Date;
}
