import { Types } from 'mongoose';
import { IProduct, ILens, ICleanLens, IPrescriptionFrame, ISunglassesFrame, ProductType } from "./IProduct";

export type ProductReference = string | Types.ObjectId;

export type OrderProduct = ProductReference | IProduct | ILens | ICleanLens | IPrescriptionFrame | ISunglassesFrame;

export interface IPaymentHistoryEntry {
  paymentId: string | Types.ObjectId;
  amount: number;
  date: Date;
  method: string;
}

export interface IOrder {
  _id?: string;
  clientId: string | Types.ObjectId;
  employeeId: string | Types.ObjectId;
  institutionId?: Types.ObjectId | string | null;
  isInstitutionalOrder?: boolean;
  responsibleClientId?: string | Types.ObjectId;
  hasResponsible?: boolean;
  products: OrderProduct[];
  serviceOrder?: string;
  paymentMethod: string;
  paymentStatus: "pending" | "partially_paid" | "paid";
  paymentHistory?: Array<IPaymentHistoryEntry>;
  paymentEntry?: number;
  installments?: number;
  orderDate: Date;
  deliveryDate?: Date;
  status: "pending" | "in_production" | "ready" | "delivered" | "cancelled";
  laboratoryId?: Types.ObjectId | string | null;
  prescriptionData?: {
    doctorName?: string;
    clinicName?: string;
    appointmentDate?: Date;
    rightEye: {
      sph: string;
      cyl: string;
      axis: number;
      pd?: number;
    };
    leftEye: {
      sph: string;
      cyl: string;
      axis: number;
      pd: number;
    };
    nd: number;
    oc: number;
    addition: string;
    bridge: number;
    rim: number;
    vh: number;
    sh: number;
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

export type CreateOrderDTO = Omit<IOrder, "_id" | "createdAt" | "updatedAt" | "serviceOrder"> & {
  serviceOrder?: string;
};