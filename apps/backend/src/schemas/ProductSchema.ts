import { Schema, model, Model, Document } from "mongoose";
import { IProduct, ILens, ICleanLens, IPrescriptionFrame, ISunglassesFrame } from "../interfaces/IProduct";

// Definir interface para documentos do Mongoose
interface ProductDocument extends Document, Omit<IProduct, '_id'> { }
interface LensDocument extends Document, Omit<ILens, '_id'> { }
interface CleanLensDocument extends Document, Omit<ICleanLens, '_id'> { }
interface PrescriptionFrameDocument extends Document, Omit<IPrescriptionFrame, '_id'> { }
interface SunglassesFrameDocument extends Document, Omit<ISunglassesFrame, '_id'> { }

// Definir interfaces para os modelos
interface ProductModel extends Model<ProductDocument> {}
interface LensModel extends Model<LensDocument> {}
interface CleanLensModel extends Model<CleanLensDocument> {}
interface PrescriptionFrameModel extends Model<PrescriptionFrameDocument> {}
interface SunglassesFrameModel extends Model<SunglassesFrameDocument> {}

// Schema base com campos comuns
const baseProductSchema = {
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  sellPrice: {
    type: Number,
    required: true,
  },
  costPrice: {
    type: Number,
    required: false,
  },
  brand: {
    type: String,
    required: false,
  },
};

// Schema principal com discriminator
const productSchema = new Schema(
  {
    ...baseProductSchema,
    productType: {
      type: String, 
      required: true,
      enum: ["lenses", "clean_lenses", "prescription_frame", "sunglasses_frame"],
    }
  },
  { 
    timestamps: true,
    discriminatorKey: 'productType' 
  }
);

// Criar o modelo base
const ProductBase = model<ProductDocument, ProductModel>("Product", productSchema);

// Discriminator para lentes
const lensSchema = new Schema({
  lensType: {
    type: String,
    required: true,
  }
});

// Discriminator para limpa-lentes (sem campos adicionais)
const cleanLensSchema = new Schema({});

// Schema para armações (base para prescrição e solares)
const frameSchema = {
  typeFrame: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  shape: {
    type: String,
    required: true,
  },
  reference: {
    type: String,
    required: true,
  }
};

// Discriminator para armações de grau
const prescriptionFrameSchema = new Schema(frameSchema);

// Discriminator para armações solares
const sunglassesFrameSchema = new Schema({
  ...frameSchema,
  modelSunglasses: {
    type: String,
    required: true,
  }
});

// Criar os modelos com discriminators
const Lens = ProductBase.discriminator<LensDocument, LensModel>(
  "lenses", 
  lensSchema
);

const CleanLens = ProductBase.discriminator<CleanLensDocument, CleanLensModel>(
  "clean_lenses", 
  cleanLensSchema
);

const PrescriptionFrame = ProductBase.discriminator<PrescriptionFrameDocument, PrescriptionFrameModel>(
  "prescription_frame", 
  prescriptionFrameSchema
);

const SunglassesFrame = ProductBase.discriminator<SunglassesFrameDocument, SunglassesFrameModel>(
  "sunglasses_frame", 
  sunglassesFrameSchema
);

export { ProductBase as Product, Lens, CleanLens, PrescriptionFrame, SunglassesFrame };