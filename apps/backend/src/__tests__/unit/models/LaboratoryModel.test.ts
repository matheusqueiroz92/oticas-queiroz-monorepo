import { LaboratoryModel } from "../../../models/LaboratoryModel";
import { Laboratory } from "../../../schemas/LaboratorySchema";
import { Types } from "mongoose";
import type { ILaboratory } from "../../../interfaces/ILaboratory";
import {
  describe,
  it,
  expect,
  beforeEach,
  // beforeAll,
  // afterEach,
  // afterAll,
} from "@jest/globals";

describe("LaboratoryModel", () => {
  let laboratoryModel: LaboratoryModel;

  beforeEach(async () => {
    await Laboratory.deleteMany({});
    laboratoryModel = new LaboratoryModel();
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

  describe("create", () => {
    it("should create a laboratory", async () => {
      const laboratory = await laboratoryModel.create(mockLaboratory);

      expect(laboratory).toHaveProperty("_id");
      expect(laboratory.name).toBe(mockLaboratory.name);
      expect(laboratory.email).toBe(mockLaboratory.email);
      expect(laboratory.isActive).toBe(true);
    });
  });

  describe("findByEmail", () => {
    it("should find a laboratory by email case insensitive", async () => {
      await laboratoryModel.create(mockLaboratory);
      const laboratory = await laboratoryModel.findByEmail(
        mockLaboratory.email.toUpperCase()
      );

      expect(laboratory?.email.toLowerCase()).toBe(
        mockLaboratory.email.toLowerCase()
      );
    });

    it("should return null for non-existent email", async () => {
      const laboratory = await laboratoryModel.findByEmail(
        "nonexistent@laboratory.com"
      );
      expect(laboratory).toBeNull();
    });
  });

  describe("findById", () => {
    it("should find a laboratory by id", async () => {
      const created = await laboratoryModel.create(mockLaboratory);
      const found = await laboratoryModel.findById(created._id as string);

      expect(found?._id).toBe(created._id);
    });

    it("should return null for invalid id", async () => {
      const result = await laboratoryModel.findById("invalid-id");
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return laboratories with pagination", async () => {
      await laboratoryModel.create(mockLaboratory);
      await laboratoryModel.create({
        ...mockLaboratory,
        email: "another@laboratory.com",
      });

      const result = await laboratoryModel.findAll(1, 10);

      expect(result.laboratories).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should apply filters correctly", async () => {
      await laboratoryModel.create(mockLaboratory);
      await laboratoryModel.create({
        ...mockLaboratory,
        email: "inactive@laboratory.com",
        isActive: false,
      });

      const result = await laboratoryModel.findAll(1, 10, { isActive: true });

      expect(result.laboratories).toHaveLength(1);
      expect(result.laboratories[0].isActive).toBe(true);
    });

    it("should respect pagination limits", async () => {
      const laboratories = Array.from({ length: 15 }, (_, i) => ({
        ...mockLaboratory,
        email: `lab${i}@laboratory.com`,
      }));

      await Promise.all(laboratories.map((lab) => laboratoryModel.create(lab)));

      const result = await laboratoryModel.findAll(1, 10);

      expect(result.laboratories).toHaveLength(10);
      expect(result.total).toBe(15);
    });
  });

  describe("update", () => {
    it("should update a laboratory", async () => {
      const created = await laboratoryModel.create(mockLaboratory);
      const updateData = {
        name: "Updated Laboratory",
        phone: "11988888888",
      };

      const updated = await laboratoryModel.update(
        created._id as string,
        updateData
      );

      expect(updated?.name).toBe(updateData.name);
      expect(updated?.phone).toBe(updateData.phone);
    });

    it("should return null for non-existent laboratory", async () => {
      const result = await laboratoryModel.update(
        new Types.ObjectId().toString(),
        { name: "Updated" }
      );
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete a laboratory", async () => {
      const created = await laboratoryModel.create(mockLaboratory);
      const deleted = await laboratoryModel.delete(created._id as string);

      expect(deleted?._id).toBe(created._id);

      const found = await laboratoryModel.findById(created._id as string);
      expect(found).toBeNull();
    });
  });

  describe("toggleActive", () => {
    it("should toggle laboratory active status", async () => {
      const created = await laboratoryModel.create(mockLaboratory);
      const toggled = await laboratoryModel.toggleActive(created._id as string);

      expect(toggled?.isActive).toBe(false);

      const toggledAgain = await laboratoryModel.toggleActive(
        created._id as string
      );
      expect(toggledAgain?.isActive).toBe(true);
    });

    it("should return null for non-existent laboratory", async () => {
      const result = await laboratoryModel.toggleActive(
        new Types.ObjectId().toString()
      );
      expect(result).toBeNull();
    });
  });
});
