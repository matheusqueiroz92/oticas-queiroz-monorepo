export interface OrderDetail {
  _id: string;
  clientId: string;
  employeeId: string;
  customClientName?: string;
  product?: string;
  glassesType?: "prescription" | "sunglasses";
  description?: string;
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  deliveryDate?: string | Date;
  status: string;
  laboratoryId?: string;
  prescriptionData?: {
    doctorName?: string;
    clinicName?: string;
    appointmentDate?: string | Date;
    leftEye?: {
      sph: number;
      cyl: number;
      axis: number;
    };
    rightEye?: {
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

// export interface OrderDetails {
//   _id: string;
//   clientId: string;
//   employeeId: string;
//   customClientName?: string;
//   product?: string;
//   glassesType?: "prescription" | "sunglasses";
//   description?: string;
//   paymentMethod: string;
//   paymentEntry?: number;
//   installments?: number;
//   deliveryDate?: string | Date;
//   status: string;
//   lensType?: string;
//   observations?: string;
//   totalPrice: number;
//   createdAt?: string | Date;
//   updatedAt?: string | Date;
//   prescriptionData?: {
//     doctorName?: string; // Mudado para opcional
//     clinicName?: string; // Mudado para opcional
//     appointmentDate?: string; // Mudado para opcional
//     leftEye: {
//       near: { sph: number; cyl: number; axis: number; pd: number };
//       far: { sph: number; cyl: number; axis: number; pd: number };
//     };
//     rightEye: {
//       near: { sph: number; cyl: number; axis: number; pd: number };
//       far: { sph: number; cyl: number; axis: number; pd: number };
//     };
//   };
// }
