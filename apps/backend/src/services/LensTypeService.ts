import { LensTypeModel } from "../models/LensTypeModel";
import type { ILensType, ICreateLensTypeDTO } from "../interfaces/ILensType";

export class LensTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LensTypeError";
  }
}

export class LensTypeService {
  private lensTypeModel: LensTypeModel;

  constructor() {
    this.lensTypeModel = new LensTypeModel();
  }

  private validateLensTypeData(lensTypeData: ICreateLensTypeDTO): void {
    if (!lensTypeData.name?.trim()) {
      throw new LensTypeError("Nome do produto é obrigatório");
    }
    // Adicione mais validações conforme necessário
  }

  async createLensType(lensTypeData: ICreateLensTypeDTO): Promise<ILensType> {
    this.validateLensTypeData(lensTypeData);

    const existingLensType = await this.lensTypeModel.findByName(
      lensTypeData.name
    );
    if (existingLensType) {
      throw new LensTypeError("Tipo de lente já cadastrado com este nome");
    }

    return this.lensTypeModel.create(lensTypeData);
  }

  async getAllLensType(
    page?: number,
    limit?: number,
    filters?: Partial<ICreateLensTypeDTO>
  ): Promise<{ lensType: ILensType[]; total: number }> {
    const result = await this.lensTypeModel.findAll(page, limit, filters);
    if (result.total === 0) {
      throw new LensTypeError("Nenhum tipo de lente encontrado");
    }
    return result;
  }

  async getLensTypeById(id: string): Promise<ILensType> {
    const lensType = await this.lensTypeModel.findById(id);
    if (!lensType) {
      throw new LensTypeError("Tipo de lente não encontrado");
    }
    return lensType;
  }

  async updateLensType(
    id: string,
    lensTypeData: Partial<ICreateLensTypeDTO>
  ): Promise<ILensType> {
    if (lensTypeData.name) {
      const existingLensType = await this.lensTypeModel.findByName(
        lensTypeData.name
      );
      if (existingLensType && existingLensType._id !== id) {
        throw new LensTypeError("Já existe um tipo de lente com este nome");
      }
    }

    const lensType = await this.lensTypeModel.update(id, lensTypeData);
    if (!lensType) {
      throw new LensTypeError("Tipo de lente não encontrado");
    }

    return lensType;
  }

  async deleteLensType(id: string): Promise<ILensType> {
    const lensType = await this.lensTypeModel.delete(id);
    if (!lensType) {
      throw new LensTypeError("Tipo de lente não encontrado");
    }
    return lensType;
  }
}
