import { Laboratory } from "../schemas/LaboratorySchema";
import type { ILaboratory } from "../interfaces/ILaboratory";
import { type Document, Types, type FilterQuery } from "mongoose";

interface LaboratoryDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  email: string;
  contactName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LaboratoryModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(laboratoryData: Omit<ILaboratory, "_id">): Promise<ILaboratory> {
    const laboratory = new Laboratory(laboratoryData);
    const savedLaboratory =
      (await laboratory.save()) as unknown as LaboratoryDocument;
    return this.convertToILaboratory(savedLaboratory);
  }

  async findByEmail(email: string): Promise<ILaboratory | null> {
    const laboratory = (await Laboratory.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    })) as LaboratoryDocument | null;
    return laboratory ? this.convertToILaboratory(laboratory) : null;
  }

  async findById(id: string): Promise<ILaboratory | null> {
    if (!this.isValidId(id)) return null;
    const laboratory = (await Laboratory.findById(
      id
    )) as LaboratoryDocument | null;
    return laboratory ? this.convertToILaboratory(laboratory) : null;
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: Partial<ILaboratory> = {}
  ): Promise<{ laboratories: ILaboratory[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as FilterQuery<LaboratoryDocument>);

    const [laboratories, total] = await Promise.all([
      Laboratory.find(query).skip(skip).limit(limit) as unknown as Promise<
        LaboratoryDocument[]
      >,
      Laboratory.countDocuments(query),
    ]);

    return {
      laboratories: laboratories.map((lab) => this.convertToILaboratory(lab)),
      total,
    };
  }

  async update(
    id: string,
    laboratoryData: Partial<ILaboratory>
  ): Promise<ILaboratory | null> {
    if (!this.isValidId(id)) return null;

    const laboratory = await Laboratory.findByIdAndUpdate(
      id,
      { $set: laboratoryData },
      { new: true, runValidators: true }
    );

    if (!laboratory) return null;
    return this.convertToILaboratory(
      laboratory as unknown as LaboratoryDocument
    );
  }

  async delete(id: string): Promise<ILaboratory | null> {
    if (!this.isValidId(id)) return null;

    const laboratory = await Laboratory.findByIdAndDelete(id);
    if (!laboratory) return null;
    return this.convertToILaboratory(
      laboratory as unknown as LaboratoryDocument
    );
  }

  async toggleActive(id: string): Promise<ILaboratory | null> {
    if (!this.isValidId(id)) return null;

    const laboratory = await Laboratory.findById(id);
    if (!laboratory) return null;

    laboratory.isActive = !laboratory.isActive;
    await laboratory.save();

    return this.convertToILaboratory(
      laboratory as unknown as LaboratoryDocument
    );
  }

  private convertToILaboratory(doc: LaboratoryDocument): ILaboratory {
    const laboratory = doc.toObject();
    return {
      ...laboratory,
      _id: doc._id.toString(),
    };
  }
}
