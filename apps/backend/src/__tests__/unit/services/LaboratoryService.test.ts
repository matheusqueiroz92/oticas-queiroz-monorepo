import {
  LaboratoryService,
  LaboratoryError,
} from "../../../services/LaboratoryService";
import { LaboratoryModel } from "../../../models/LaboratoryModel";
import type { ILaboratory } from "../../../interfaces/ILaboratory";
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

jest.mock("../../../models/LaboratoryModel");

type LaboratoryServiceWithModel = {
  laboratoryModel: jest.Mocked<LaboratoryModel>;
};

describe("LaboratoryService", () => {
  let laboratoryService: LaboratoryService;
  let laboratoryModel: jest.Mocked<LaboratoryModel>;

  beforeEach(() => {
    laboratoryModel = new LaboratoryModel() as jest.Mocked<LaboratoryModel>;
    laboratoryService = new LaboratoryService();
    (
      laboratoryService as unknown as LaboratoryServiceWithModel
    ).laboratoryModel = laboratoryModel;
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

  describe("createLaboratory", () => {
    it("should create a laboratory successfully", async () => {
      const mockCreatedLaboratory: ILaboratory = {
        _id: "lab-id",
        ...mockLaboratory,
      };

      laboratoryModel.findByEmail.mockResolvedValue(null);
      laboratoryModel.create.mockResolvedValue(mockCreatedLaboratory);

      const result = await laboratoryService.createLaboratory(mockLaboratory);

      expect(result).toEqual(mockCreatedLaboratory);
      expect(laboratoryModel.create).toHaveBeenCalledWith(mockLaboratory);
    });

    it("should throw error if laboratory already exists", async () => {
      laboratoryModel.findByEmail.mockResolvedValue({
        _id: "existing-id",
        ...mockLaboratory,
      });

      await expect(
        laboratoryService.createLaboratory(mockLaboratory)
      ).rejects.toThrow(
        new LaboratoryError(
          "Já existe um laboratório cadastrado com este email"
        )
      );
    });

    it("should throw error for invalid email", async () => {
      const invalidLaboratory = {
        ...mockLaboratory,
        email: "invalid-email",
      };

      await expect(
        laboratoryService.createLaboratory(invalidLaboratory)
      ).rejects.toThrow(new LaboratoryError("Email inválido"));
    });

    it("should throw error for invalid phone", async () => {
      const invalidLaboratory = {
        ...mockLaboratory,
        phone: "123",
      };

      await expect(
        laboratoryService.createLaboratory(invalidLaboratory)
      ).rejects.toThrow(new LaboratoryError("Telefone inválido"));
    });
  });

  describe("getAllLaboratories", () => {
    it("should return all laboratories with pagination", async () => {
      const mockResponse = {
        laboratories: [{ _id: "1", ...mockLaboratory }],
        total: 1,
      };

      laboratoryModel.findAll.mockResolvedValue(mockResponse);

      const result = await laboratoryService.getAllLaboratories(1, 10);

      expect(result).toEqual(mockResponse);
      expect(laboratoryModel.findAll).toHaveBeenCalledWith(
        1,
        10,
        expect.any(Object)
      );
    });

    it("should throw error when no laboratories found", async () => {
      laboratoryModel.findAll.mockResolvedValue({ laboratories: [], total: 0 });

      await expect(laboratoryService.getAllLaboratories()).rejects.toThrow(
        new LaboratoryError("Nenhum laboratório encontrado")
      );
    });
  });

  describe("getLaboratoryById", () => {
    it("should return laboratory by id", async () => {
      const mockFoundLaboratory = { _id: "lab-id", ...mockLaboratory };
      laboratoryModel.findById.mockResolvedValue(mockFoundLaboratory);

      const result = await laboratoryService.getLaboratoryById("lab-id");

      expect(result).toEqual(mockFoundLaboratory);
    });

    it("should throw error if laboratory not found", async () => {
      laboratoryModel.findById.mockResolvedValue(null);

      await expect(
        laboratoryService.getLaboratoryById("non-existent")
      ).rejects.toThrow(new LaboratoryError("Laboratório não encontrado"));
    });
  });

  describe("updateLaboratory", () => {
    it("should update laboratory successfully", async () => {
      const updateData = { name: "Updated Laboratory" };
      const mockUpdatedLaboratory = {
        _id: "lab-id",
        ...mockLaboratory,
        ...updateData,
      };

      laboratoryModel.update.mockResolvedValue(mockUpdatedLaboratory);

      const result = await laboratoryService.updateLaboratory(
        "lab-id",
        updateData
      );

      expect(result).toEqual(mockUpdatedLaboratory);
    });

    it("should throw error when updating with existing email", async () => {
      laboratoryModel.findByEmail.mockResolvedValue({
        _id: "other-id",
        ...mockLaboratory,
      });

      await expect(
        laboratoryService.updateLaboratory("lab-id", {
          email: mockLaboratory.email,
        })
      ).rejects.toThrow(
        new LaboratoryError("Já existe um laboratório com este email")
      );
    });

    it("should throw error when laboratory not found", async () => {
      laboratoryModel.update.mockResolvedValue(null);

      await expect(
        laboratoryService.updateLaboratory("non-existent", { name: "Updated" })
      ).rejects.toThrow(new LaboratoryError("Laboratório não encontrado"));
    });
  });

  describe("toggleLaboratoryStatus", () => {
    it("should toggle laboratory status successfully", async () => {
      const mockToggledLaboratory = {
        _id: "lab-id",
        ...mockLaboratory,
        isActive: false,
      };

      laboratoryModel.toggleActive.mockResolvedValue(mockToggledLaboratory);

      const result = await laboratoryService.toggleLaboratoryStatus("lab-id");

      expect(result.isActive).toBe(false);
    });

    it("should throw error when laboratory not found", async () => {
      laboratoryModel.toggleActive.mockResolvedValue(null);

      await expect(
        laboratoryService.toggleLaboratoryStatus("non-existent")
      ).rejects.toThrow(new LaboratoryError("Laboratório não encontrado"));
    });
  });
});
