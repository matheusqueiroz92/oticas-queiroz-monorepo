import { RepositoryFactory } from "../repositories/RepositoryFactory";
import type { ILaboratory } from "../interfaces/ILaboratory";
import type { ILaboratoryRepository } from "../repositories/interfaces/ILaboratoryRepository";

export class LaboratoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LaboratoryError";
  }
}

export class LaboratoryService {
  private laboratoryRepository: ILaboratoryRepository;

  constructor() {
    this.laboratoryRepository = RepositoryFactory.getInstance().getLaboratoryRepository();
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

    const existingLaboratory = await this.laboratoryRepository.findByEmail(
      laboratoryData.email
    );
    if (existingLaboratory) {
      throw new LaboratoryError(
        "Já existe um laboratório cadastrado com este email"
      );
    }

    return this.laboratoryRepository.create(laboratoryData);
  }

  async getAllLaboratories(
    page: number = 1,
    limit: number = 10,
    filters: Partial<ILaboratory> = {}
  ): Promise<{ laboratories: ILaboratory[]; total: number }> {
    const result = await this.laboratoryRepository.findAll(page, limit, filters);
    
    if (!result.items.length) {
      throw new LaboratoryError("Nenhum laboratório encontrado");
    }
    
    return {
      laboratories: result.items,
      total: result.total
    };
  }

  async getLaboratoryById(id: string): Promise<ILaboratory> {
    const laboratory = await this.laboratoryRepository.findById(id);
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
      const emailExists = await this.laboratoryRepository.emailExists(
        laboratoryData.email, 
        id
      );
      if (emailExists) {
        throw new LaboratoryError("Já existe um laboratório com este email");
      }
    }

    const laboratory = await this.laboratoryRepository.update(id, laboratoryData);
    if (!laboratory) {
      throw new LaboratoryError("Laboratório não encontrado");
    }

    return laboratory;
  }

  async deleteLaboratory(id: string): Promise<ILaboratory> {
    const laboratory = await this.laboratoryRepository.delete(id);
    if (!laboratory) {
      throw new LaboratoryError("Laboratório não encontrado");
    }
    return laboratory;
  }

  async toggleLaboratoryStatus(id: string): Promise<ILaboratory> {
    const laboratory = await this.laboratoryRepository.toggleActive(id);
    if (!laboratory) {
      throw new LaboratoryError("Laboratório não encontrado");
    }
    return laboratory;
  }

  // Novos métodos usando funcionalidades do repository
  async getActiveLaboratories(
    page: number = 1,
    limit: number = 10
  ): Promise<{ laboratories: ILaboratory[]; total: number }> {
    const result = await this.laboratoryRepository.findActive(page, limit);
    return {
      laboratories: result.items,
      total: result.total
    };
  }

  async getInactiveLaboratories(
    page: number = 1,
    limit: number = 10
  ): Promise<{ laboratories: ILaboratory[]; total: number }> {
    const result = await this.laboratoryRepository.findInactive(page, limit);
    return {
      laboratories: result.items,
      total: result.total
    };
  }

  async searchLaboratories(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ laboratories: ILaboratory[]; total: number }> {
    const result = await this.laboratoryRepository.search(searchTerm, page, limit);
    return {
      laboratories: result.items,
      total: result.total
    };
  }

  async getLaboratoriesByCity(
    city: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ laboratories: ILaboratory[]; total: number }> {
    const result = await this.laboratoryRepository.findByCity(city, page, limit);
    return {
      laboratories: result.items,
      total: result.total
    };
  }

  async getLaboratoriesByState(
    state: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ laboratories: ILaboratory[]; total: number }> {
    const result = await this.laboratoryRepository.findByState(state, page, limit);
    return {
      laboratories: result.items,
      total: result.total
    };
  }

  async getLaboratoriesByContactName(
    contactName: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ laboratories: ILaboratory[]; total: number }> {
    const result = await this.laboratoryRepository.findByContactName(contactName, page, limit);
    return {
      laboratories: result.items,
      total: result.total
    };
  }
}
