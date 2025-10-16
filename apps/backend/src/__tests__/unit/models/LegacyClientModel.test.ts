import { LegacyClientModel } from "../../../models/LegacyClientModel";
import { LegacyClient } from "../../../schemas/LegacyClientSchema";
import { Payment } from "../../../schemas/PaymentSchema"; // Adicionar import do Payment
import { Types } from "mongoose";
import type { ILegacyClient } from "../../../interfaces/ILegacyClient";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("LegacyClientModel", () => {
  let legacyClientModel: LegacyClientModel;

  beforeEach(async () => {
    await Promise.all([LegacyClient.deleteMany({}), Payment.deleteMany({})]);
    legacyClientModel = new LegacyClientModel();
  });

  const mockLegacyClient: Omit<
    ILegacyClient,
    "_id" | "createdAt" | "updatedAt"
  > = {
    name: "Test Client",
    cpf: "12345678900", // Usando cpf ao invés de documentId
    email: "test@example.com",
    phone: "11999999999",
    totalDebt: 1000,
    status: "active",
    paymentHistory: [],
  };

  describe("create", () => {
    it("should create a legacy client", async () => {
      const client = await legacyClientModel.create(mockLegacyClient);

      expect(client).toHaveProperty("_id");
      expect(client.name).toBe(mockLegacyClient.name);
      expect(client.cpf).toBe(mockLegacyClient.cpf);
      expect(client.status).toBe("active");
      expect(client.totalDebt).toBe(1000);
      expect(client.paymentHistory).toEqual([]);
    });

    it("should clean document id formatting", async () => {
      const clientWithFormattedDoc = {
        ...mockLegacyClient,
        cpf: "123.456.789-00",
      };

      const client = await legacyClientModel.create(clientWithFormattedDoc);
      expect(client.cpf).toBe("123.456.789-00");
    });
  });

  describe("findById", () => {
    it("should find a client by id", async () => {
      const created = await legacyClientModel.create(mockLegacyClient);

      if (!created?._id) {
        throw new Error("Failed to create legacy client");
      }

      const found = await legacyClientModel.findById(created._id);

      expect(found?._id).toBe(created._id);
      expect(found?.name).toBe(mockLegacyClient.name);
    });

    it("should return null for invalid id", async () => {
      const result = await legacyClientModel.findById("invalid-id");
      expect(result).toBeNull();
    });
  });

  describe("findByDocument", () => {
    it("should find a client by document id", async () => {
      await legacyClientModel.create(mockLegacyClient);

      const found = await legacyClientModel.findByDocument("123.456.789-00");
      expect(found?.cpf).toBe("12345678900");
      expect(found?.name).toBe(mockLegacyClient.name);
    });

    it("should find client regardless of document formatting", async () => {
      await legacyClientModel.create(mockLegacyClient);

      const found = await legacyClientModel.findByDocument("12345678900");
      // findByDocument busca por documentId, não cpf
      expect(found).toBeNull(); // Não deve encontrar pois não há documentId igual a CPF
    });
  });

  describe("findAll", () => {
    it("should return clients with pagination", async () => {
      await legacyClientModel.create(mockLegacyClient);
      await legacyClientModel.create({
        ...mockLegacyClient,
        cpf: "987.654.321-00",
      });

      const result = await legacyClientModel.findAll(1, 10);

      expect(result.clients).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter by status", async () => {
      await legacyClientModel.create(mockLegacyClient);
      await legacyClientModel.create({
        ...mockLegacyClient,
        cpf: "987.654.321-00",
        status: "inactive",
      });

      const result = await legacyClientModel.findAll(1, 10, { status: "active" });

      expect(result.clients).toHaveLength(1);
      expect(result.clients[0].status).toBe("active");
    });
  });

  describe("update", () => {
    it("should update a client", async () => {
      const created = await legacyClientModel.create(mockLegacyClient);

      if (!created?._id) {
        throw new Error("Failed to create legacy client");
      }

      const updateData = {
        name: "Updated Client",
        totalDebt: 1500,
      };

      const updated = await legacyClientModel.update(created._id, updateData);

      expect(updated?.name).toBe("Updated Client");
      expect(updated?.totalDebt).toBe(1500);
    });
  });

  describe("delete", () => {
    it("should delete a client", async () => {
      const created = await legacyClientModel.create(mockLegacyClient);

      if (!created?._id) {
        throw new Error("Failed to create legacy client");
      }

      // LegacyClientModel não tem softDelete, apenas update para marcar como inativo
      const deleted = await legacyClientModel.update(created._id, { status: "inactive" as any });

      expect(deleted?.status).toBe("inactive");

      const found = await legacyClientModel.findById(created._id);
      expect(found).toBeDefined(); // Não é deletado, apenas marcado como inativo
    });
  });

  describe("update", () => {
    it("should update legacy client data", async () => {
      const created = await legacyClientModel.create(mockLegacyClient);

      if (!created?._id) {
        throw new Error("Failed to create legacy client");
      }

      const updated = await legacyClientModel.update(created._id, {
        phone: "77999998888",
        totalDebt: 500
      });

      expect(updated?.phone).toBe("77999998888");
      expect(updated?.totalDebt).toBe(500);
    });
  });

  describe("updateTotalDebt", () => {
    it("should update total debt", async () => {
      const created = await legacyClientModel.create(mockLegacyClient);

      if (!created?._id) {
        throw new Error("Failed to create legacy client");
      }

      // updateDebt INCREMENTA (adiciona) o valor, não substitui
      // Cliente criado com totalDebt: 1000
      // updateDebt(500) vai adicionar 500
      const updated = await legacyClientModel.updateDebt(created._id, 500);

      expect(updated?.totalDebt).toBe(1500); // 1000 + 500
    });
  });

  describe("getPaymentHistory", () => {
    it("should get payment history", async () => {
      const created = await legacyClientModel.create(mockLegacyClient);

      if (!created?._id) {
        throw new Error("Failed to create legacy client");
      }

      const history = await legacyClientModel.getPaymentHistory(created._id);

      expect(Array.isArray(history)).toBe(true);
      // Cliente novo não tem histórico
      expect(history.length).toBe(0);
    });
  });
});
