export interface IProduct {
  _id: string;
  productType: "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame";
  image?: string;
  sellPrice: number;
  description?: string;
  brand?: string;
  name: string;
  costPrice?: number;
  stock?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILens extends IProduct {
  productType: "lenses";
  lensType: string;
}

export interface ICleanLens extends IProduct {
  productType: "clean_lenses";
}

export interface IPrescriptionFrame extends IProduct {
  productType: "prescription_frame";
  typeFrame: string;
  color: string;
  shape: string;
  reference: string;
  stock: number;
}

export interface ISunglassesFrame extends IProduct {
  productType: "sunglasses_frame";
  modelSunglasses: string;
  typeFrame: string;
  color: string;
  shape: string;
  reference: string;
  stock: number;
}

export type ProductType = ILens | ICleanLens | IPrescriptionFrame | ISunglassesFrame;

export type CreateProductDTO<T extends ProductType['productType']> = 
  T extends "lenses" ? Omit<ILens, "_id" | "createdAt" | "updatedAt"> :
  T extends "clean_lenses" ? Omit<ICleanLens, "_id" | "createdAt" | "updatedAt"> :
  T extends "prescription_frame" ? Omit<IPrescriptionFrame, "_id" | "createdAt" | "updatedAt"> :
  T extends "sunglasses_frame" ? Omit<ISunglassesFrame, "_id" | "createdAt" | "updatedAt"> :
  never;