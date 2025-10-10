import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";
import { MongoProductRepository } from "../../../repositories/implementations/MongoProductRepository";
import { Product, PrescriptionFrame, SunglassesFrame, Lens, CleanLens } from "../../../schemas/ProductSchema";
import type { IProduct } from "../../../interfaces/IProduct";
import mongoose from "mongoose";

describe("MongoProductRepository", () => {
  let repository: MongoProductRepository;

  beforeEach(async () => {
    repository = new MongoProductRepository();
    // Limpar todas as coleções de produtos
    await Product.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ==================== CRUD BÁSICO ====================

  describe("create()", () => {
    it("should create a lens product with correct discriminator", async () => {
      const lensData = {
        name: "Lente Transitions",
        productType: "lenses" as const,
        description: "Lente fotocromática",
        brand: "Transitions",
        sellPrice: 450.0,
        costPrice: 200.0,
        lensType: "Fotocromática",
      } as any;

      const created = await repository.create(lensData);

      expect(created).toBeDefined();
      expect(created._id).toBeDefined();
      expect(created.name).toBe(lensData.name);
      expect(created.productType).toBe("lenses");
      expect((created as any).lensType).toBe("Fotocromática");

      // Verificar que foi criado com o modelo Lens correto
      const doc = await Lens.findById(created._id);
      expect(doc).toBeDefined();
      expect(doc?.lensType).toBe("Fotocromática");
    });

    it("should create a clean lens product with correct discriminator", async () => {
      const cleanLensData = {
        name: "Lente de Limpeza Premium",
        productType: "clean_lenses" as const,
        description: "Lente de limpeza de alta qualidade",
        brand: "CleanVision",
        sellPrice: 50.0,
        costPrice: 20.0,
      } as any;

      const created = await repository.create(cleanLensData);

      expect(created).toBeDefined();
      expect(created.productType).toBe("clean_lenses");

      // Verificar modelo correto
      const doc = await CleanLens.findById(created._id);
      expect(doc).toBeDefined();
    });

    it("should create a prescription frame with correct discriminator", async () => {
      const frameData = {
        name: "Armação Retangular Preta",
        productType: "prescription_frame" as const,
        description: "Armação de grau elegante",
        brand: "Óticas Queiroz",
        sellPrice: 250.0,
        costPrice: 100.0,
        typeFrame: "Retangular",
        color: "Preto",
        shape: "Retangular",
        reference: "RET-001",
        stock: 10,
      } as any;

      const created = await repository.create(frameData);

      expect(created).toBeDefined();
      expect(created.productType).toBe("prescription_frame");
      expect((created as any).typeFrame).toBe("Retangular");

      // Verificar modelo correto
      const doc = await PrescriptionFrame.findById(created._id);
      expect(doc).toBeDefined();
      expect(doc?.typeFrame).toBe("Retangular");
    });

    it("should create a sunglasses frame with correct discriminator", async () => {
      const sunglassesData = {
        name: "Ray-Ban Aviador",
        productType: "sunglasses_frame" as const,
        description: "Óculos de sol clássico",
        brand: "Ray-Ban",
        sellPrice: 599.99,
        costPrice: 300.0,
        typeFrame: "Aviador",
        color: "Dourado",
        shape: "Aviador",
        reference: "RB3025",
        stock: 5,
        modelSunglasses: "Aviador Clássico",
      } as any;

      const created = await repository.create(sunglassesData);

      expect(created).toBeDefined();
      expect(created.productType).toBe("sunglasses_frame");
      expect((created as any).modelSunglasses).toBe("Aviador Clássico");

      // Verificar modelo correto
      const doc = await SunglassesFrame.findById(created._id);
      expect(doc).toBeDefined();
      expect(doc?.modelSunglasses).toBe("Aviador Clássico");
    });

    it("should throw error for invalid product type", async () => {
      const invalidData = {
        name: "Produto Inválido",
        productType: "invalid_type" as any,
        sellPrice: 100.0,
      };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });
  });

  describe("findById()", () => {
    it("should find existing product by id", async () => {
      const created = await repository.create({
        name: "Produto Teste",
        productType: "lenses",
        sellPrice: 100.0,
        lensType: "Monofocal",
      } as any);

      const found = await repository.findById(created._id);

      expect(found).toBeDefined();
      expect(found?._id).toBe(created._id);
      expect(found?.name).toBe("Produto Teste");
    });

    it("should return null for non-existent id", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const found = await repository.findById(fakeId);

      expect(found).toBeNull();
    });

    it("should return null for invalid id format", async () => {
      const found = await repository.findById("invalid-id");

      expect(found).toBeNull();
    });
  });

  describe("findAll()", () => {
    it("should return all products", async () => {
      await repository.create({
        name: "Produto 1",
        productType: "lenses",
        sellPrice: 100.0,
        lensType: "Monofocal",
      } as any);

      await repository.create({
        name: "Produto 2",
        productType: "prescription_frame",
        sellPrice: 200.0,
        typeFrame: "Redondo",
        color: "Preto",
        shape: "Redondo",
        reference: "REF-001",
        stock: 5,
      } as any);

      const all = await repository.findAll();

      expect(all).toHaveLength(2);
      expect(all[0].name).toBeDefined();
      expect(all[1].name).toBeDefined();
    });

    it("should return empty array when no products", async () => {
      const all = await repository.findAll();

      expect(all).toEqual([]);
    });
  });

  // ==================== UPDATE ====================

  describe("update() - Same Type", () => {
    it("should update product without changing type", async () => {
      const created = await repository.create({
        name: "Armação Original",
        productType: "prescription_frame",
        sellPrice: 200.0,
        typeFrame: "Redondo",
        color: "Preto",
        shape: "Redondo",
        reference: "REF-001",
        stock: 10,
      } as any);

      const updated = await repository.update(created._id, {
        name: "Armação Atualizada",
        sellPrice: 250.0,
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe("Armação Atualizada");
      expect(updated?.sellPrice).toBe(250.0);
      expect(updated?.productType).toBe("prescription_frame");
      expect(updated?._id).toBe(created._id);
    });

    it("should update stock of frame product", async () => {
      const created = await repository.create({
        name: "Armação",
        productType: "sunglasses_frame",
        sellPrice: 300.0,
        typeFrame: "Aviador",
        color: "Dourado",
        shape: "Aviador",
        reference: "AV-001",
        stock: 10,
        modelSunglasses: "Aviador",
      } as any);

      const updated = await repository.update(created._id, {
        stock: 5,
      });

      expect(updated?.stock).toBe(5);
    });
  });

  describe("update() - Change Type (Discriminator)", () => {
    it("should change from prescription_frame to sunglasses_frame", async () => {
      // Criar armação de grau
      const created = await repository.create({
        name: "Armação Versátil",
        productType: "prescription_frame",
        sellPrice: 300.0,
        typeFrame: "Retangular",
        color: "Preto",
        shape: "Retangular",
        reference: "VER-001",
        stock: 5,
      } as any);

      const originalId = created._id;

      // Mudar para armação de sol
      const updated = await repository.update(originalId, {
        productType: "sunglasses_frame",
        modelSunglasses: "Esportivo",
      } as any);

      expect(updated).toBeDefined();
      expect(updated?._id).toBe(originalId); // Mesmo ID
      expect(updated?.productType).toBe("sunglasses_frame");
      expect((updated as any).modelSunglasses).toBe("Esportivo");

      // Verificar que documento antigo foi deletado
      const oldDoc = await PrescriptionFrame.findById(originalId);
      expect(oldDoc).toBeNull();

      // Verificar que novo documento existe
      const newDoc = await SunglassesFrame.findById(originalId);
      expect(newDoc).toBeDefined();
      expect(newDoc?.modelSunglasses).toBe("Esportivo");
    });

    it("should change from sunglasses_frame to prescription_frame", async () => {
      // Criar armação de sol
      const created = await repository.create({
        name: "Armação Sol",
        productType: "sunglasses_frame",
        sellPrice: 400.0,
        typeFrame: "Aviador",
        color: "Dourado",
        shape: "Aviador",
        reference: "SOL-001",
        stock: 3,
        modelSunglasses: "Aviador Premium",
      } as any);

      const originalId = created._id;

      // Mudar para armação de grau
      const updated = await repository.update(originalId, {
        productType: "prescription_frame",
      });

      expect(updated).toBeDefined();
      expect(updated?._id).toBe(originalId);
      expect(updated?.productType).toBe("prescription_frame");
      expect((updated as any).modelSunglasses).toBeUndefined(); // Campo removido

      // Verificar discriminators
      const oldDoc = await SunglassesFrame.findById(originalId);
      expect(oldDoc).toBeNull();

      const newDoc = await PrescriptionFrame.findById(originalId);
      expect(newDoc).toBeDefined();
    });

    it("should preserve all data when changing type", async () => {
      const created = await repository.create({
        name: "Armação Original",
        productType: "prescription_frame",
        description: "Descrição original",
        brand: "Marca Original",
        sellPrice: 250.0,
        costPrice: 100.0,
        typeFrame: "Redondo",
        color: "Preto",
        shape: "Redondo",
        reference: "REF-001",
        stock: 10,
      } as any);

      const updated = await repository.update(created._id, {
        productType: "sunglasses_frame",
        modelSunglasses: "Clássico",
      } as any);

      // Verificar que dados foram preservados
      expect(updated?.name).toBe("Armação Original");
      expect(updated?.description).toBe("Descrição original");
      expect(updated?.brand).toBe("Marca Original");
      expect(updated?.sellPrice).toBe(250.0);
      expect(updated?.costPrice).toBe(100.0);
      expect((updated as any).stock).toBe(10);
    });

    it("should add default values for required fields when changing to sunglasses_frame", async () => {
      // Criar lente (sem campos de armação)
      const created = await repository.create({
        name: "Lente",
        productType: "lenses",
        sellPrice: 200.0,
        lensType: "Monofocal",
      } as any);

      // Mudar para armação de sol
      const updated = await repository.update(created._id, {
        productType: "sunglasses_frame",
      });

      expect(updated).toBeDefined();
      expect(updated?.productType).toBe("sunglasses_frame");
      // Verificar valores padrão
      expect((updated as any).modelSunglasses).toBeDefined();
      expect((updated as any).typeFrame).toBeDefined();
      expect((updated as any).color).toBeDefined();
      expect((updated as any).shape).toBeDefined();
      expect((updated as any).reference).toBeDefined();
      expect((updated as any).stock).toBeDefined();
    });
  });

  describe("delete()", () => {
    it("should delete existing product", async () => {
      const created = await repository.create({
        name: "Produto para Deletar",
        productType: "lenses",
        sellPrice: 100.0,
        lensType: "Monofocal",
      } as any);

      const deleted = await repository.delete(created._id);

      expect(deleted).toBe(true);

      const found = await repository.findById(created._id);
      expect(found).toBeNull();
    });

    it("should return false for non-existent product", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const deleted = await repository.delete(fakeId);

      expect(deleted).toBe(false);
    });

    it("should return false for invalid id", async () => {
      const deleted = await repository.delete("invalid-id");

      expect(deleted).toBe(false);
    });
  });

  // ==================== MÉTODOS ESPECÍFICOS ====================

  describe("findByType()", () => {
    beforeEach(async () => {
      await repository.create({
        name: "Lente 1",
        productType: "lenses",
        sellPrice: 100.0,
        lensType: "Monofocal",
      } as any);

      await repository.create({
        name: "Lente 2",
        productType: "lenses",
        sellPrice: 150.0,
        lensType: "Multifocal",
      } as any);

      await repository.create({
        name: "Armação",
        productType: "prescription_frame",
        sellPrice: 200.0,
        typeFrame: "Redondo",
        color: "Preto",
        shape: "Redondo",
        reference: "REF-001",
        stock: 5,
      } as any);
    });

    it("should find products by type", async () => {
      const lenses = await repository.findByType("lenses");

      expect(lenses).toHaveLength(2);
      expect(lenses[0].productType).toBe("lenses");
      expect(lenses[1].productType).toBe("lenses");
    });

    it("should return empty array for type with no products", async () => {
      const cleanLenses = await repository.findByType("clean_lenses");

      expect(cleanLenses).toEqual([]);
    });
  });

  describe("search()", () => {
    beforeEach(async () => {
      await repository.create({
        name: "Ray-Ban Aviador",
        productType: "sunglasses_frame",
        brand: "Ray-Ban",
        sellPrice: 500.0,
        typeFrame: "Aviador",
        color: "Dourado",
        shape: "Aviador",
        reference: "RB-001",
        stock: 5,
        modelSunglasses: "Aviador",
      } as any);

      await repository.create({
        name: "Oakley Esportivo",
        productType: "sunglasses_frame",
        brand: "Oakley",
        sellPrice: 700.0,
        typeFrame: "Esportivo",
        color: "Preto",
        shape: "Retangular",
        reference: "OK-001",
        stock: 3,
        modelSunglasses: "Esportivo",
      } as any);
    });

    it("should search products by name", async () => {
      const result = await repository.search("Ray-Ban");

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toContain("Ray-Ban");
      expect(result.total).toBe(1);
    });

    it("should search products case-insensitive", async () => {
      const result = await repository.search("oakley");

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toContain("Oakley");
    });

    it("should return empty result for non-matching search", async () => {
      const result = await repository.search("Nike");

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should paginate search results", async () => {
      const result = await repository.search("", 1, 1);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(2);
    });
  });

  describe("updateStock()", () => {
    it("should update stock of frame product", async () => {
      const created = await repository.create({
        name: "Armação com Estoque",
        productType: "prescription_frame",
        sellPrice: 200.0,
        typeFrame: "Redondo",
        color: "Preto",
        shape: "Redondo",
        reference: "REF-001",
        stock: 10,
      } as any);

      const updated = await repository.updateStock(created._id, 15);

      expect(updated).toBeDefined();
      expect((updated as any).stock).toBe(15);
    });

    it("should handle stock update for non-frame products gracefully", async () => {
      const created = await repository.create({
        name: "Lente",
        productType: "lenses",
        sellPrice: 100.0,
        lensType: "Monofocal",
      } as any);

      // Lentes não têm estoque, mas não deve dar erro
      const updated = await repository.updateStock(created._id, 5);

      expect(updated).toBeDefined();
    });
  });

  describe("findInsufficientStock()", () => {
    beforeEach(async () => {
      await repository.create({
        name: "Armação Estoque Baixo",
        productType: "prescription_frame",
        sellPrice: 200.0,
        typeFrame: "Redondo",
        color: "Preto",
        shape: "Redondo",
        reference: "LOW-001",
        stock: 2,
      } as any);

      await repository.create({
        name: "Armação Estoque OK",
        productType: "prescription_frame",
        sellPrice: 250.0,
        typeFrame: "Retangular",
        color: "Azul",
        shape: "Retangular",
        reference: "OK-001",
        stock: 15,
      } as any);
    });

    it("should find products with insufficient stock", async () => {
      const product1 = await Product.findOne({ name: "Armação Estoque Baixo" });
      const product2 = await Product.findOne({ name: "Armação Estoque OK" });
      
      const productIds = [
        (product1?._id as any)?.toString() || '', 
        (product2?._id as any)?.toString() || ''
      ];
      const insufficient = await repository.findInsufficientStock(productIds, [5, 5]);

      expect(insufficient).toHaveLength(1);
      expect(insufficient[0].productId).toBe((product1?._id as any)?.toString());
      expect(insufficient[0].available).toBe(2);
      expect(insufficient[0].required).toBe(5);
    });

    it("should return empty array when all products have sufficient stock", async () => {
      const product1 = await Product.findOne({ name: "Armação Estoque Baixo" });
      const product2 = await Product.findOne({ name: "Armação Estoque OK" });
      
      const productIds = [
        (product1?._id as any)?.toString() || '', 
        (product2?._id as any)?.toString() || ''
      ];
      const insufficient = await repository.findInsufficientStock(productIds, [1, 1]);

      expect(insufficient).toEqual([]);
    });
  });

  // ==================== EDGE CASES ====================

  describe("Edge Cases", () => {
    it("should handle update of non-existent product", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updated = await repository.update(fakeId, {
        name: "Nome Atualizado",
      });

      expect(updated).toBeNull();
    });

    it("should handle creating product with minimal data", async () => {
      const minimal = await repository.create({
        name: "Produto Mínimo",
        productType: "lenses",
        sellPrice: 50.0,
        lensType: "Básica",
      } as any);

      expect(minimal).toBeDefined();
      expect(minimal.name).toBe("Produto Mínimo");
    });

    it("should handle very long product names", async () => {
      const longName = "A".repeat(500);
      const created = await repository.create({
        name: longName,
        productType: "lenses",
        sellPrice: 100.0,
        lensType: "Teste",
      } as any);

      expect(created.name).toBe(longName);
    });

    it("should handle zero and negative prices appropriately", async () => {
      // Mongoose schema deve validar, mas vamos testar o comportamento
      const created = await repository.create({
        name: "Produto Preço Zero",
        productType: "lenses",
        sellPrice: 0,
        lensType: "Grátis",
      } as any);

      expect(created.sellPrice).toBe(0);
    });

    it("should handle special characters in product name", async () => {
      const created = await repository.create({
        name: "Óculos & Lentes - 50% OFF! (Promoção)",
        productType: "lenses",
        sellPrice: 100.0,
        lensType: "Promoção",
      } as any);

      expect(created.name).toContain("&");
      expect(created.name).toContain("%");
    });
  });
});

