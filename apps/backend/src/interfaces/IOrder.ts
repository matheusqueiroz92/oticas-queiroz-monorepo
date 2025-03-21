import { Types } from 'mongoose';
import { IProduct } from "./IProduct";

export interface IOrder {
  _id?: string;
  clientId: Types.ObjectId;
  employeeId: Types.ObjectId;
  products: IProduct[];
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  orderDate: Date;
  deliveryDate?: Date;
  status: "pending" | "in_production" | "ready" | "delivered" | "cancelled";
  laboratoryId?: Types.ObjectId | null;
  prescriptionData?: {
    doctorName: string;
    clinicName: string;
    appointmentDate: Date;
    rightEye: {
      sph: number;
      cyl: number;
      axis: number;
      pd: number;
    };
    leftEye: {
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
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateOrderDTO = Omit<IOrder, "_id" | "createdAt" | "updatedAt">;
