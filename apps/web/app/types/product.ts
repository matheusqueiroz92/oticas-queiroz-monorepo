export interface BaseProduct {
  _id: string;
  name: string;
  productType: "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame";
  description?: string;
  image?: string;
  brand?: string;
  sellPrice: number;
  costPrice?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Lens extends BaseProduct {
  productType: "lenses";
  lensType: string;
}

export interface CleanLens extends BaseProduct {
  productType: "clean_lenses";
}

export interface PrescriptionFrame extends BaseProduct {
  productType: "prescription_frame";
  typeFrame: string;
  color: string;
  shape: string;
  reference: string;
}

export interface SunglassesFrame extends BaseProduct {
  productType: "sunglasses_frame";
  modelSunglasses: string;
  typeFrame: string;
  color: string;
  shape: string;
  reference: string;
}

export type Product = Lens | CleanLens | PrescriptionFrame | SunglassesFrame;

// Tipo de utilidade para criar um novo produto
export type CreateProductDTO = Omit<Product, "_id" | "createdAt" | "updatedAt">;