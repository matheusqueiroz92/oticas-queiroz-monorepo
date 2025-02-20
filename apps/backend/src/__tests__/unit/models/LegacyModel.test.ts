import { LegacyClientModel } from "../../../models/LegacyClientModel";
import { LegacyClient } from "../../../schemas/LegacyClientSchema";
import { Types } from "mongoose";
import type { ILegacyClient } from "../../../interfaces/ILegacyClient";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("LegacyClientModel", () => {
  let legacyClientModel: LegacyClientModel;

  beforeEach(async () => {
    await LegacyClient.deleteMany({});
    legacyClientModel = new LegacyClientModel();
  });

  const mockLegacyClient: Omit<
    ILegacyClient,
    "_id" | "createdAt" | "updatedAt"
  > = {
    name: "Test Client",
    documentId: "123.456.789-00",
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
      expect(client.documentId).toBe(mockLegacyClient.documentId);
      expect(client.status).toBe("active");
      expect(client.totalDebt).toBe(1000);
      expect(client.paymentHistory).toEqual([]);
    });

    it("should clean document id formatting", async () => {
      const clientWithFormattedDoc = {
        ...mockLegacyClient,
        documentId: "123.456.789-00",
      };

      const client = await legacyClientModel.create(clientWithFormattedDoc);

      expect(client?.documentId).toBe("12345678900");
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

      expect(found?.documentId).toBe("12345678900");
      expect(found?.name).toBe(mockLegacyClient.name);
    });

    it("should find client regardless of document formatting", async () => {
      await legacyClientModel.create(mockLegacyClient);

      const found = await legacyClientModel.findByDocument("12345678900");

      expect(found?.documentId).toBe("12345678900");
    });
  });

  describe("findAll", () => {
    it("should return clients with pagination", async () => {
      await legacyClientModel.create(mockLegacyClient);
      await legacyClientModel.create({
        ...mockLegacyClient,
        documentId: "987.654.321-00",
      });

      const result = await legacyClientModel.findAll(1, 10);

      expect(result.clients).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should apply filters correctly", async () => {
      await legacyClientModel.create(mockLegacyClient);
      await legacyClientModel.create({
        ...mockLegacyClient,
        documentId: "987.654.321-00",
        status: "inactive",
      });

      const result = await legacyClientModel.findAll(1, 10, {
        status: "active",
      });

      expect(result.clients).toHaveLength(1);
      expect(result.clients[0]?.status).toBe("active");
    });
  });

  describe("findDebtors", () => {
    it("should find active clients with debt", async () => {
      await legacyClientModel.create(mockLegacyClient);
      await legacyClientModel.create({
        ...mockLegacyClient,
        documentId: "987.654.321-00",
        totalDebt: 0,
      });

      const debtors = await legacyClientModel.findDebtors();

      expect(debtors).toHaveLength(1);
      expect(debtors[0]?.totalDebt).toBe(1000);
    });

    it("should filter by debt range", async () => {
      await legacyClientModel.create(mockLegacyClient); // 1000
      await legacyClientModel.create({
        ...mockLegacyClient,
        documentId: "987.654.321-00",
        totalDebt: 2000,
      });

      const debtors = await legacyClientModel.findDebtors(1500);

      expect(debtors).toHaveLength(1);
      expect(debtors[0]?.totalDebt).toBe(2000);
    });
  });

  describe("updateDebt", () => {
    it("should update client debt and add payment history", async () => {
      const created = await legacyClientModel.create(mockLegacyClient);

      if (!created?._id) {
        throw new Error("Failed to create legacy client");
      }

      const paymentId = new Types.ObjectId().toString();
      const updated = await legacyClientModel.updateDebt(
        created._id,
        -500, // reducing debt
        paymentId
      );

      expect(updated?.totalDebt).toBe(500);
      expect(updated?.lastPayment?.amount).toBe(500);
      expect(updated?.paymentHistory).toHaveLength(1);
      expect(updated?.paymentHistory[0]?.paymentId).toBe(paymentId);
    });

    it("should not add to payment history when increasing debt", async () => {
      const created = await legacyClientModel.create(mockLegacyClient);

      if (!created?._id) {
        throw new Error("Failed to create legacy client");
      }

      const updated = await legacyClientModel.updateDebt(created._id, 500);

      expect(updated?.totalDebt).toBe(1500);
      expect(updated?.paymentHistory).toHaveLength(0);
    });
  });

  describe("getPaymentHistory", () => {
    it("should get payment history with date range", async () => {
      const created = await legacyClientModel.create(mockLegacyClient);
      const paymentId = new Types.ObjectId().toString();

      if (!created?._id) {
        throw new Error("Failed to create legacy client");
      }

      await legacyClientModel.updateDebt(created._id, -500, paymentId);

      const history = await legacyClientModel.getPaymentHistory(
        created._id,
        new Date(Date.now() - 86400000), // 1 day ago
        new Date()
      );

      expect(history).toHaveLength(1);
      expect(history[0]?.amount).toBe(500);
      expect(history[0]?.paymentId).toBe(paymentId);
    });
  });
});
