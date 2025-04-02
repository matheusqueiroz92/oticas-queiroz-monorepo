import { Schema, model, Model, Document } from "mongoose";
import { IProduct, ILens, ICleanLens, IPrescriptionFrame, ISunglassesFrame } from "../interfaces/IProduct";

interface ProductDocument extends Document, Omit<IProduct, '_id'> { }
interface LensDocument extends Document, Omit<ILens, '_id'> { }
interface CleanLensDocument extends Document, Omit<ICleanLens, '_id'> { }
interface PrescriptionFrameDocument extends Document, Omit<IPrescriptionFrame, '_id'> { }
interface SunglassesFrameDocument extends Document, Omit<ISunglassesFrame, '_id'> { }

interface ProductModel extends Model<ProductDocument> {}
interface LensModel extends Model<LensDocument> {}
interface CleanLensModel extends Model<CleanLensDocument> {}
interface PrescriptionFrameModel extends Model<PrescriptionFrameDocument> {}
interface SunglassesFrameModel extends Model<SunglassesFrameDocument> {}

const baseProductSchema = {
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
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

const ProductBase = model<ProductDocument, ProductModel>("Product", productSchema);

const lensSchema = new Schema({
  lensType: {
    type: String,
    required: true,
  }
});

const cleanLensSchema = new Schema({});

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
  },
  stock: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  }
};

const prescriptionFrameSchema = new Schema(frameSchema);

const sunglassesFrameSchema = new Schema({
  ...frameSchema,
  modelSunglasses: {
    type: String,
    required: true,
  }
});

// Logging para verificar alterações no estoque
const addStockLogging = (schema: Schema) => {
  schema.pre('findOneAndUpdate', function(this: any) {
    const update = this.getUpdate();
    if (update && update.$inc && update.$inc.stock !== undefined) {
      console.log(`[MongooseMiddleware] Atualizando estoque: ${update.$inc.stock}`);
    } else if (update && update.$set && update.$set.stock !== undefined) {
      console.log(`[MongooseMiddleware] Definindo estoque: ${update.$set.stock}`);
    }
  });

  schema.post('findOneAndUpdate', function(doc: Document) {
    if (doc) {
      console.log(`[MongooseMiddleware] Estoque após atualização: ${(doc as any).stock}`);
    }
  });
};

// Aplicar middleware de logging
addStockLogging(prescriptionFrameSchema);
addStockLogging(sunglassesFrameSchema);

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

const discriminatorOptions = {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
  id: false,
  versionKey: false,
  timestamps: true,
  strict: 'throw',
  optimisticConcurrency: true // Adicionar controle de concorrência
}

export { ProductBase as Product, Lens, CleanLens, PrescriptionFrame, SunglassesFrame };