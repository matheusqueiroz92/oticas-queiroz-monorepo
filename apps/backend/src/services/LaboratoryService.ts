import { LaboratoryModel } from "../models/LaboratoryModel";
import type { ILaboratory } from "../interfaces/ILaboratory";

export class LaboratoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LaboratoryError";
  }
}

export class LaboratoryService {
  private laboratoryModel: LaboratoryModel;

  constructor() {
    this.laboratoryModel = new LaboratoryModel();
  }

  private validateLaboratoryData(laboratoryData: Partial<ILaboratory>): void {
    if (laboratoryData.email && !laboratoryData.email.includes("@")) {
      throw new LaboratoryError("Email inválido");
    }

    if (laboratoryData.phone) {
      const phoneRegex = /^\d{10,11}$/;
      if (!phoneRegex.test(laboratoryData.phone.replace(/\D/g, ""))) {
        throw new LaboratoryError("Telefone inválido");
      }
    }

    if (laboratoryData.address?.zipCode) {
      const zipCodeRegex = /^\d{8}$/;
      if (
        !zipCodeRegex.test(laboratoryData.address.zipCode.replace(/\D/g, ""))
      ) {
        throw new LaboratoryError("CEP inválido");
      }
    }
  }

  async createLaboratory(
    laboratoryData: Omit<ILaboratory, "_id">
  ): Promise<ILaboratory> {
    this.validateLaboratoryData(laboratoryData);

    const existingLaboratory = await this.laboratoryModel.findByEmail(
      laboratoryData.email
    );
    if (existingLaboratory) {
      throw new LaboratoryError(
        "Já existe um laboratório cadastrado com este email"
      );
    }

    return this.laboratoryModel.create(laboratoryData);
  }

  async getAllLaboratories(
    page?: number,
    limit?: number,
    filters: Partial<ILaboratory> = {}
  ): Promise<{ laboratories: ILaboratory[]; total: number }> {
    const result = await this.laboratoryModel.findAll(page, limit, filters);
    if (!result.laboratories.length) {
      throw new LaboratoryError("Nenhum laboratório encontrado");
    }
    return result;
  }

  async getLaboratoryById(id: string): Promise<ILaboratory> {
    const laboratory = await this.laboratoryModel.findById(id);
    if (!laboratory) {
      throw new LaboratoryError("Laboratório não encontrado");
    }
    return laboratory;
  }

  async updateLaboratory(
    id: string,
    laboratoryData: Partial<ILaboratory>
  ): Promise<ILaboratory> {
    this.validateLaboratoryData(laboratoryData);

    if (laboratoryData.email) {
      const existingLaboratory = await this.laboratoryModel.findByEmail(
        laboratoryData.email
      );
      if (existingLaboratory && existingLaboratory._id !== id) {
        throw new LaboratoryError("Já existe um laboratório com este email");
      }
    }

    const laboratory = await this.laboratoryModel.update(id, laboratoryData);
    if (!laboratory) {
      throw new LaboratoryError("Laboratório não encontrado");
    }

    return laboratory;
  }

  async deleteLaboratory(id: string): Promise<ILaboratory> {
    const laboratory = await this.laboratoryModel.delete(id);
    if (!laboratory) {
      throw new LaboratoryError("Laboratório não encontrado");
    }
    return laboratory;
  }

  async toggleLaboratoryStatus(id: string): Promise<ILaboratory> {
    const laboratory = await this.laboratoryModel.toggleActive(id);
    if (!laboratory) {
      throw new LaboratoryError("Laboratório não encontrado");
    }
    return laboratory;
  }
}
