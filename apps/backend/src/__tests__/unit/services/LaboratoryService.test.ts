import {
  LaboratoryService,
  LaboratoryError,
} from "../../../services/LaboratoryService";
import { RepositoryFactory } from "../../../repositories/RepositoryFactory";
import type { ILaboratory } from "../../../interfaces/ILaboratory";
import type { ILaboratoryRepository } from "../../../repositories/interfaces/ILaboratoryRepository";
import {
  describe,
  it,
  expect,
  beforeEach,
  // beforeAll,
  // afterEach,
  // afterAll,
  jest,
} from "@jest/globals";

// Mock do RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory");

describe("LaboratoryService", () => {
  let laboratoryService: LaboratoryService;
  let mockLaboratoryRepository: jest.Mocked<ILaboratoryRepository>;
  let mockRepositoryFactory: jest.Mocked<RepositoryFactory>;

  beforeEach(() => {
    // Setup dos mocks
    mockLaboratoryRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findByEmail: jest.fn(),
      emailExists: jest.fn(),
      toggleActive: jest.fn(),
      findActive: jest.fn(),
      findInactive: jest.fn(),
      search: jest.fn(),
      findByCity: jest.fn(),
      findByState: jest.fn(),
      findByContactName: jest.fn(),
    };

    mockRepositoryFactory = {
      getLaboratoryRepository: jest.fn().mockReturnValue(mockLaboratoryRepository),
    } as any;

    (RepositoryFactory.getInstance as jest.Mock).mockReturnValue(mockRepositoryFactory);

    laboratoryService = new LaboratoryService();
  });

  const mockLaboratory: Omit<ILaboratory, "_id"> = {
    name: "Test Laboratory",
    address: {
      street: "Test Street",
      number: "123",
      neighborhood: "Test Neighborhood",
      city: "Test City",
      state: "ST",
      zipCode: "12345678",
      complement: "Test Complement",
    },
    phone: "11999999999",
    email: "test@laboratory.com",
    contactName: "Test Contact",
    isActive: true,
  };

  const mockCreatedLaboratory: ILaboratory = {
    _id: "lab-id",
    ...mockLaboratory,
  };

  describe("createLaboratory", () => {
    it("should create a laboratory successfully", async () => {
      mockLaboratoryRepository.findByEmail.mockResolvedValue(null);
      mockLaboratoryRepository.create.mockResolvedValue(mockCreatedLaboratory);

      const result = await laboratoryService.createLaboratory(mockLaboratory);

      expect(result).toEqual(mockCreatedLaboratory);
      expect(mockLaboratoryRepository.findByEmail).toHaveBeenCalledWith(mockLaboratory.email);
      expect(mockLaboratoryRepository.create).toHaveBeenCalledWith(mockLaboratory);
    });

    it("should throw error if laboratory already exists", async () => {
      mockLaboratoryRepository.findByEmail.mockResolvedValue(mockCreatedLaboratory);

      await expect(
        laboratoryService.createLaboratory(mockLaboratory)
      ).rejects.toThrow(
        new LaboratoryError("Já existe um laboratório cadastrado com este email")
      );

      expect(mockLaboratoryRepository.findByEmail).toHaveBeenCalledWith(mockLaboratory.email);
      expect(mockLaboratoryRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error for invalid email", async () => {
      const invalidLaboratory = {
        ...mockLaboratory,
        email: "invalid-email",
      };

      await expect(
        laboratoryService.createLaboratory(invalidLaboratory)
      ).rejects.toThrow(new LaboratoryError("Email inválido"));

      expect(mockLaboratoryRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockLaboratoryRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error for invalid phone", async () => {
      const invalidLaboratory = {
        ...mockLaboratory,
        phone: "123",
      };

      await expect(
        laboratoryService.createLaboratory(invalidLaboratory)
      ).rejects.toThrow(new LaboratoryError("Telefone inválido"));

      expect(mockLaboratoryRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockLaboratoryRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error for invalid ZIP code", async () => {
      const invalidLaboratory = {
        ...mockLaboratory,
        address: {
          ...mockLaboratory.address,
          zipCode: "123",
        },
      };

      await expect(
        laboratoryService.createLaboratory(invalidLaboratory)
      ).rejects.toThrow(new LaboratoryError("CEP inválido"));
    });
  });

  describe("getAllLaboratories", () => {
    it("should return all laboratories with pagination", async () => {
      const mockResponse = {
        items: [mockCreatedLaboratory],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLaboratoryRepository.findAll.mockResolvedValue(mockResponse);

      const result = await laboratoryService.getAllLaboratories(1, 10);

      expect(result).toEqual({
        laboratories: [mockCreatedLaboratory],
        total: 1,
      });
      expect(mockLaboratoryRepository.findAll).toHaveBeenCalledWith(1, 10, {});
    });

    it("should return laboratories with filters", async () => {
      const filters = { isActive: true };
      const mockResponse = {
        items: [mockCreatedLaboratory],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLaboratoryRepository.findAll.mockResolvedValue(mockResponse);

      const result = await laboratoryService.getAllLaboratories(1, 10, filters);

      expect(result).toEqual({
        laboratories: [mockCreatedLaboratory],
        total: 1,
      });
      expect(mockLaboratoryRepository.findAll).toHaveBeenCalledWith(1, 10, filters);
    });

    it("should use default pagination", async () => {
      const mockResponse = {
        items: [mockCreatedLaboratory],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLaboratoryRepository.findAll.mockResolvedValue(mockResponse);

      await laboratoryService.getAllLaboratories();

      expect(mockLaboratoryRepository.findAll).toHaveBeenCalledWith(1, 10, {});
    });

    it("should throw error when no laboratories found", async () => {
      mockLaboratoryRepository.findAll.mockResolvedValue({ 
        items: [], 
        total: 0, 
        page: 1, 
        limit: 10 
      });

      await expect(laboratoryService.getAllLaboratories()).rejects.toThrow(
        new LaboratoryError("Nenhum laboratório encontrado")
      );
    });
  });

  describe("getLaboratoryById", () => {
    it("should return laboratory by id", async () => {
      mockLaboratoryRepository.findById.mockResolvedValue(mockCreatedLaboratory);

      const result = await laboratoryService.getLaboratoryById("lab-id");

      expect(result).toEqual(mockCreatedLaboratory);
      expect(mockLaboratoryRepository.findById).toHaveBeenCalledWith("lab-id");
    });

    it("should throw error if laboratory not found", async () => {
      mockLaboratoryRepository.findById.mockResolvedValue(null);

      await expect(
        laboratoryService.getLaboratoryById("non-existent")
      ).rejects.toThrow(new LaboratoryError("Laboratório não encontrado"));
    });
  });

  describe("updateLaboratory", () => {
    it("should update laboratory successfully", async () => {
      const updateData = { name: "Updated Laboratory" };
      const mockUpdatedLaboratory = {
        ...mockCreatedLaboratory,
        ...updateData,
      };

      mockLaboratoryRepository.update.mockResolvedValue(mockUpdatedLaboratory);

      const result = await laboratoryService.updateLaboratory("lab-id", updateData);

      expect(result).toEqual(mockUpdatedLaboratory);
      expect(mockLaboratoryRepository.update).toHaveBeenCalledWith("lab-id", updateData);
    });

    it("should throw error when updating with existing email", async () => {
      const updateData = { email: "existing@laboratory.com" };
      
      mockLaboratoryRepository.emailExists.mockResolvedValue(true);

      await expect(
        laboratoryService.updateLaboratory("lab-id", updateData)
      ).rejects.toThrow(
        new LaboratoryError("Já existe um laboratório com este email")
      );

      expect(mockLaboratoryRepository.emailExists).toHaveBeenCalledWith(updateData.email, "lab-id");
      expect(mockLaboratoryRepository.update).not.toHaveBeenCalled();
    });

    it("should allow updating with same email", async () => {
      const updateData = { email: mockLaboratory.email };
      const mockUpdatedLaboratory = {
        ...mockCreatedLaboratory,
        ...updateData,
      };

      mockLaboratoryRepository.emailExists.mockResolvedValue(false);
      mockLaboratoryRepository.update.mockResolvedValue(mockUpdatedLaboratory);

      const result = await laboratoryService.updateLaboratory("lab-id", updateData);

      expect(result).toEqual(mockUpdatedLaboratory);
      expect(mockLaboratoryRepository.emailExists).toHaveBeenCalledWith(updateData.email, "lab-id");
      expect(mockLaboratoryRepository.update).toHaveBeenCalledWith("lab-id", updateData);
    });

    it("should throw error when laboratory not found", async () => {
      mockLaboratoryRepository.update.mockResolvedValue(null);

      await expect(
        laboratoryService.updateLaboratory("non-existent", { name: "Updated" })
      ).rejects.toThrow(new LaboratoryError("Laboratório não encontrado"));
    });

    it("should validate data before updating", async () => {
      const invalidUpdateData = { email: "invalid-email" };

      await expect(
        laboratoryService.updateLaboratory("lab-id", invalidUpdateData)
      ).rejects.toThrow(new LaboratoryError("Email inválido"));

      expect(mockLaboratoryRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteLaboratory", () => {
    it("should delete laboratory successfully", async () => {
      mockLaboratoryRepository.delete.mockResolvedValue(mockCreatedLaboratory);

      const result = await laboratoryService.deleteLaboratory("lab-id");

      expect(result).toEqual(mockCreatedLaboratory);
      expect(mockLaboratoryRepository.delete).toHaveBeenCalledWith("lab-id");
    });

    it("should throw error when laboratory not found", async () => {
      mockLaboratoryRepository.delete.mockResolvedValue(null);

      await expect(
        laboratoryService.deleteLaboratory("non-existent")
      ).rejects.toThrow(new LaboratoryError("Laboratório não encontrado"));
    });
  });

  describe("toggleLaboratoryStatus", () => {
    it("should toggle laboratory status successfully", async () => {
      const mockToggledLaboratory = {
        ...mockCreatedLaboratory,
        isActive: false,
      };

      mockLaboratoryRepository.toggleActive.mockResolvedValue(mockToggledLaboratory);

      const result = await laboratoryService.toggleLaboratoryStatus("lab-id");

      expect(result).toEqual(mockToggledLaboratory);
      expect(result.isActive).toBe(false);
      expect(mockLaboratoryRepository.toggleActive).toHaveBeenCalledWith("lab-id");
    });

    it("should throw error when laboratory not found", async () => {
      mockLaboratoryRepository.toggleActive.mockResolvedValue(null);

      await expect(
        laboratoryService.toggleLaboratoryStatus("non-existent")
      ).rejects.toThrow(new LaboratoryError("Laboratório não encontrado"));
    });
  });

  describe("getActiveLaboratories", () => {
    it("should return active laboratories", async () => {
      const mockResponse = {
        items: [mockCreatedLaboratory],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLaboratoryRepository.findActive.mockResolvedValue(mockResponse);

      const result = await laboratoryService.getActiveLaboratories(1, 10);

      expect(result).toEqual({
        laboratories: [mockCreatedLaboratory],
        total: 1,
      });
      expect(mockLaboratoryRepository.findActive).toHaveBeenCalledWith(1, 10);
    });

    it("should use default pagination", async () => {
      const mockResponse = { 
        items: [], 
        total: 0, 
        page: 1, 
        limit: 10 
      };
      mockLaboratoryRepository.findActive.mockResolvedValue(mockResponse);

      await laboratoryService.getActiveLaboratories();

      expect(mockLaboratoryRepository.findActive).toHaveBeenCalledWith(1, 10);
    });
  });

  describe("getInactiveLaboratories", () => {
    it("should return inactive laboratories", async () => {
      const inactiveLab = { ...mockCreatedLaboratory, isActive: false };
      const mockResponse = {
        items: [inactiveLab],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLaboratoryRepository.findInactive.mockResolvedValue(mockResponse);

      const result = await laboratoryService.getInactiveLaboratories(1, 10);

      expect(result).toEqual({
        laboratories: [inactiveLab],
        total: 1,
      });
      expect(mockLaboratoryRepository.findInactive).toHaveBeenCalledWith(1, 10);
    });
  });

  describe("searchLaboratories", () => {
    it("should search laboratories by term", async () => {
      const mockResponse = {
        items: [mockCreatedLaboratory],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLaboratoryRepository.search.mockResolvedValue(mockResponse);

      const result = await laboratoryService.searchLaboratories("Test", 1, 10);

      expect(result).toEqual({
        laboratories: [mockCreatedLaboratory],
        total: 1,
      });
      expect(mockLaboratoryRepository.search).toHaveBeenCalledWith("Test", 1, 10);
    });
  });

  describe("getLaboratoriesByCity", () => {
    it("should return laboratories by city", async () => {
      const mockResponse = {
        items: [mockCreatedLaboratory],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLaboratoryRepository.findByCity.mockResolvedValue(mockResponse);

      const result = await laboratoryService.getLaboratoriesByCity("Test City", 1, 10);

      expect(result).toEqual({
        laboratories: [mockCreatedLaboratory],
        total: 1,
      });
      expect(mockLaboratoryRepository.findByCity).toHaveBeenCalledWith("Test City", 1, 10);
    });
  });

  describe("getLaboratoriesByState", () => {
    it("should return laboratories by state", async () => {
      const mockResponse = {
        items: [mockCreatedLaboratory],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLaboratoryRepository.findByState.mockResolvedValue(mockResponse);

      const result = await laboratoryService.getLaboratoriesByState("ST", 1, 10);

      expect(result).toEqual({
        laboratories: [mockCreatedLaboratory],
        total: 1,
      });
      expect(mockLaboratoryRepository.findByState).toHaveBeenCalledWith("ST", 1, 10);
    });
  });

  describe("getLaboratoriesByContactName", () => {
    it("should return laboratories by contact name", async () => {
      const mockResponse = {
        items: [mockCreatedLaboratory],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLaboratoryRepository.findByContactName.mockResolvedValue(mockResponse);

      const result = await laboratoryService.getLaboratoriesByContactName("Test Contact", 1, 10);

      expect(result).toEqual({
        laboratories: [mockCreatedLaboratory],
        total: 1,
      });
      expect(mockLaboratoryRepository.findByContactName).toHaveBeenCalledWith("Test Contact", 1, 10);
    });
  });
});
