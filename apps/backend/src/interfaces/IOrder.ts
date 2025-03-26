import { Types } from 'mongoose';
import { IProduct, ILens, ICleanLens, IPrescriptionFrame, ISunglassesFrame, ProductType } from "./IProduct";

export type ProductReference = string | Types.ObjectId;

export type OrderProduct = ProductReference | IProduct | ILens | ICleanLens | IPrescriptionFrame | ISunglassesFrame;

export interface IOrder {
  _id?: string;
  clientId: string | Types.ObjectId;
  employeeId: string | Types.ObjectId;
  products: OrderProduct[];
  serviceOrder?: number | null;
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  orderDate: Date;
  deliveryDate?: Date;
  status: "pending" | "in_production" | "ready" | "delivered" | "cancelled";
  laboratoryId?: Types.ObjectId | string | null;
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
  deletedBy?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateOrderDTO = Omit<IOrder, "_id" | "createdAt" | "updatedAt">;