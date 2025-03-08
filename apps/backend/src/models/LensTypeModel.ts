import { LensType } from "../schemas/LensTypeSchema";
import type { ILensType, ICreateLensTypeDTO } from "../interfaces/ILensType";
import { type Document, Types, type FilterQuery } from "mongoose";

interface LensTypeDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string | null;
  brand?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LensTypeModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(lensTypeDate: ICreateLensTypeDTO): Promise<ILensType> {
    const lensType = new LensType(lensTypeDate);
    const savedLensType = (await lensType.save()) as LensTypeDocument;
    return this.convertToLensType(savedLensType);
  }

  async findByName(name: string): Promise<ILensType | null> {
    const lensType = (await LensType.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    })) as LensTypeDocument | null;
    return lensType ? this.convertToLensType(lensType) : null;
  }

  async findById(id: string): Promise<ILensType | null> {
    if (!this.isValidId(id)) return null;
    const lensType = (await LensType.findById(id)) as LensTypeDocument | null;
    return lensType ? this.convertToLensType(lensType) : null;
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: Partial<ICreateLensTypeDTO> = {}
  ): Promise<{ lensType: ILensType[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as FilterQuery<LensTypeDocument>);

    const [lensType, total] = await Promise.all([
      LensType.find(query).skip(skip).limit(limit) as Promise<
        LensTypeDocument[]
      >,
      LensType.countDocuments(query),
    ]);

    return {
      lensType: lensType.map((lensType) => this.convertToLensType(lensType)),
      total,
    };
  }

  async update(
    id: string,
    lensTypeDate: Partial<ICreateLensTypeDTO>
  ): Promise<ILensType | null> {
    if (!this.isValidId(id)) return null;

    const lensType = await LensType.findByIdAndUpdate(
      id,
      { $set: lensTypeDate },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lensType) return null;
    return this.convertToLensType(lensType);
  }

  async delete(id: string): Promise<ILensType | null> {
    if (!this.isValidId(id)) return null;

    const lensType = await LensType.findByIdAndDelete(id);
    if (!lensType) return null;
    return this.convertToLensType(lensType);
  }

  async updateStock(id: string, quantity: number): Promise<ILensType | null> {
    if (!this.isValidId(id)) return null;

    const lensType = (await LensType.findByIdAndUpdate(
      id,
      { $inc: { stock: quantity } },
      { new: true, runValidators: true }
    )) as LensTypeDocument | null;

    return lensType ? this.convertToLensType(lensType) : null;
  }

  private convertToLensType(doc: LensTypeDocument): ILensType {
    return {
      _id: doc._id.toString(),
      name: doc.name,
      description: doc.description || undefined,
      brand: doc.brand || undefined,
    };
  }
}
