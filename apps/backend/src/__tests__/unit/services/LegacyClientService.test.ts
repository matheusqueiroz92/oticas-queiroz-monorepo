import {
  LegacyClientService,
  LegacyClientError,
} from "../../../services/LegacyClientService";
import { LegacyClientModel } from "../../../models/LegacyClientModel";
import { Types } from "mongoose";
import type {
  ILegacyClient,
  CreateLegacyClientDTO,
} from "../../../interfaces/ILegacyClient";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.mock("../../../models/LegacyClientModel");

interface LegacyClientServiceWithModel {
  legacyClientModel: jest.Mocked<LegacyClientModel>;
}

describe("LegacyClientService", () => {
  let legacyClientService: LegacyClientService;
  let legacyClientModel: jest.Mocked<LegacyClientModel>;

  beforeEach(() => {
    legacyClientModel =
      new LegacyClientModel() as jest.Mocked<LegacyClientModel>;
    legacyClientService = new LegacyClientService();
    (
      legacyClientService as unknown as LegacyClientServiceWithModel
    ).legacyClientModel = legacyClientModel;
  });

  const testId = new Types.ObjectId().toString();

  const mockLegacyClient = {
    _id: testId,
    name: "Test Client",
    documentId: "123.456.789-00",
    email: "test@example.com",
    phone: "11999999999",
    totalDebt: 1000,
    status: "active" as const,
    paymentHistory: [],
  };

  const mockCreateDTO: CreateLegacyClientDTO = {
    name: "Test Client",
    documentId: "123.456.789-00",
    email: "test@example.com",
    phone: "11999999999",
    totalDebt: 1000,
    status: "active",
  };

  describe("createLegacyClient", () => {
    it("should create a legacy client", async () => {
      legacyClientModel.findByDocument.mockResolvedValue(null);
      legacyClientModel.create.mockResolvedValue(mockLegacyClient);

      const result =
        await legacyClientService.createLegacyClient(mockCreateDTO);

      expect(result._id).toBe(testId);
      expect(result.documentId).toBe(mockLegacyClient.documentId);
    });

    it("should throw error for invalid document", async () => {
      await expect(
        legacyClientService.createLegacyClient({
          ...mockCreateDTO,
          documentId: "123",
        })
      ).rejects.toThrow("Documento inválido");
    });

    it("should throw error for existing document", async () => {
      legacyClientModel.findByDocument.mockResolvedValue(mockLegacyClient);

      await expect(
        legacyClientService.createLegacyClient({
          ...mockCreateDTO,
          name: "Another Client",
        })
      ).rejects.toThrow("Cliente já cadastrado");
    });
  });

  describe("getLegacyClientById", () => {
    it("should return client by id", async () => {
      legacyClientModel.findById.mockResolvedValue(mockLegacyClient);

      const result = await legacyClientService.getLegacyClientById(testId);

      expect(result._id).toBe(testId);
    });

    it("should throw error if client not found", async () => {
      legacyClientModel.findById.mockResolvedValue(null);

      await expect(
        legacyClientService.getLegacyClientById("non-existent-id")
      ).rejects.toThrow("Cliente não encontrado");
    });
  });

  describe("findByDocument", () => {
    it("should find client by document", async () => {
      legacyClientModel.findByDocument.mockResolvedValue(mockLegacyClient);

      const result = await legacyClientService.findByDocument("123.456.789-00");

      expect(result.documentId).toBe(mockLegacyClient.documentId);
    });
  });

  describe("updateLegacyClient", () => {
    it("should update client data", async () => {
      const updatedClient = {
        ...mockLegacyClient,
        name: "Updated Name",
      };

      legacyClientModel.findByDocument.mockResolvedValue(null);
      legacyClientModel.update.mockResolvedValue(updatedClient);

      const result = await legacyClientService.updateLegacyClient(testId, {
        name: "Updated Name",
      });

      expect(result.name).toBe("Updated Name");
    });
  });

  describe("toggleClientStatus", () => {
    it("should toggle client status from active to inactive", async () => {
      const clientWithNoDebt = {
        ...mockLegacyClient,
        totalDebt: 0,
      };

      const inactiveClient = {
        ...clientWithNoDebt,
        status: "inactive" as const,
      };

      legacyClientModel.findById.mockResolvedValue(clientWithNoDebt);
      legacyClientModel.update.mockResolvedValue(inactiveClient);

      const result = await legacyClientService.toggleClientStatus(testId);

      expect(result.status).toBe("inactive");
    });
  });

  describe("getPaymentHistory", () => {
    const mockPaymentHistory = [
      {
        date: new Date(),
        amount: 100,
        paymentId: new Types.ObjectId().toString(),
      },
    ];

    it("should return payment history", async () => {
      legacyClientModel.getPaymentHistory.mockResolvedValue(mockPaymentHistory);

      const result = await legacyClientService.getPaymentHistory(testId);

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(100);
    });
  });
});
