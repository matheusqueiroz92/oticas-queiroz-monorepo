// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock das dependências primeiro 
const mockProductRepository = {
  findById: jest.fn(),
  updateStock: jest.fn(),
  findLowStock: jest.fn(),
  find: jest.fn()
};

const mockStockLog = {
  create: jest.fn(),
  find: jest.fn()
};

const mockCreateStockLogWithSession = jest.fn();

// Mock do mongoose
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn()
};

const mockObjectId = jest.fn((id: string) => ({ toString: () => id, _id: id }));
mockObjectId.isValid = jest.fn((id: string) => true); // Por padrão, considerar IDs válidos

const mockMongoose = {
  connection: {
    startSession: jest.fn().mockResolvedValue(mockSession)
  },
  Types: {
    ObjectId: mockObjectId
  }
};

// Mocks dos módulos
jest.mock("../../../repositories/RepositoryFactory", () => ({
  getRepositories: () => ({
    productRepository: mockProductRepository
  })
}));

jest.mock("mongoose", () => mockMongoose);

jest.mock("../../../schemas/StockLogSchema", () => ({
  StockLog: mockStockLog,
  createStockLogWithSession: mockCreateStockLogWithSession
}));

// Agora importamos o serviço depois dos mocks
import { StockService, StockError } from "../../../services/StockService";

describe("StockService", () => {
  let stockService: StockService;

  const frameProduct = {
    _id: "frame123",
    name: "Armação Premium",
    productType: "prescription_frame",
    stock: 10,
    sellPrice: 299.99
  };

  const sunglassesProduct = {
    _id: "sun123",
    name: "Óculos de Sol",
    productType: "sunglasses_frame",
    stock: 5,
    sellPrice: 199.99
  };

  const lensProduct = {
    _id: "lens123",
    name: "Lente de Contato",
    productType: "lenses",
    sellPrice: 150
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mongoose mocks
    mockMongoose.connection.startSession.mockResolvedValue(mockSession);
    mockObjectId.isValid.mockImplementation((id: string) => true); // Por padrão, IDs válidos
    mockObjectId.mockImplementation((id: string) => ({ toString: () => id, _id: id }));

    // Configure StockLog mocks
    mockStockLog.create.mockResolvedValue({ _id: "log123" });
    mockCreateStockLogWithSession.mockResolvedValue({ _id: "log123" });

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([])
    };
    mockStockLog.find.mockReturnValue(mockQuery);

    stockService = new StockService();
  });

  describe("Constructor", () => {
    it("deve criar uma instância do StockService", () => {
      expect(stockService).toBeDefined();
      expect(stockService).toBeInstanceOf(StockService);
    });
  });

  describe("isFrameProduct (método privado testado indiretamente)", () => {
    it("deve identificar produtos de armação corretamente através de decreaseStock", async () => {
      mockProductRepository.findById.mockResolvedValue(lensProduct);

      const result = await stockService.decreaseStock("lens123", 1);

      expect(result).toEqual(lensProduct);
      expect(mockProductRepository.updateStock).not.toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });
  });

  describe("getProductById (método privado testado indiretamente)", () => {
    it("deve retornar null quando há erro na busca", async () => {
      mockProductRepository.findById.mockRejectedValue(new Error("DB Error"));

      const products = [{ productId: "frame123", quantity: 1 }];
      const result = await stockService.checkStockAvailability(products);

      expect(result).toHaveLength(1);
      expect(result[0].available).toBe(0);
    });
  });

  describe("validateAndConvertToObjectId (método privado testado indiretamente)", () => {
    it("deve lidar com valores 'system' e 'anonymous'", async () => {
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue({ ...frameProduct, stock: 9 });

      await stockService.decreaseStock("frame123", 1, "Teste", "system");

      expect(mockCreateStockLogWithSession).toHaveBeenCalledWith(
        expect.objectContaining({
          performedBy: expect.any(Object)
        }),
        mockSession
      );
    });

    it("deve lidar com ObjectIds inválidos", async () => {
      mockObjectId.isValid.mockReturnValueOnce(true).mockReturnValueOnce(false); // productId válido, performedBy inválido
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue({ ...frameProduct, stock: 9 });

      await stockService.decreaseStock("frame123", 1, "Teste", "invalid-id");

      expect(mockCreateStockLogWithSession).toHaveBeenCalledWith(
        expect.objectContaining({
          performedBy: expect.any(Object)
        }),
        mockSession
      );
    });

    it("deve usar defaultValue quando valor é undefined", async () => {
      const defaultObjectId = new mockObjectId("default123");
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue({ ...frameProduct, stock: 9 });

      await stockService.decreaseStock("frame123", 1, "Teste", undefined);

      expect(mockCreateStockLogWithSession).toHaveBeenCalledWith(
        expect.objectContaining({
          performedBy: expect.any(Object)
        }),
        mockSession
      );
    });
  });

  describe("decreaseStock", () => {
    it("deve reduzir estoque de produto de armação com sucesso", async () => {
      const updatedProduct = { ...frameProduct, stock: 8 };
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      const result = await stockService.decreaseStock("frame123", 2, "Venda", "user123");

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.findById).toHaveBeenCalledWith("frame123");
      expect(mockProductRepository.updateStock).toHaveBeenCalledWith("frame123", 2, "subtract", mockSession);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it("deve reduzir estoque de óculos de sol", async () => {
      const updatedProduct = { ...sunglassesProduct, stock: 3 };
      mockProductRepository.findById.mockResolvedValue(sunglassesProduct);
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      const result = await stockService.decreaseStock("sun123", 2);

      expect(result).toEqual(updatedProduct);
    });

    it("não deve alterar estoque de produtos que não são armações", async () => {
      mockProductRepository.findById.mockResolvedValue(lensProduct);

      const result = await stockService.decreaseStock("lens123", 1);

      expect(result).toEqual(lensProduct);
      expect(mockProductRepository.updateStock).not.toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it("deve usar valores padrão quando não informados", async () => {
      const updatedProduct = { ...frameProduct, stock: 9 };
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      const result = await stockService.decreaseStock("frame123");

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.updateStock).toHaveBeenCalledWith("frame123", 1, "subtract", mockSession);
    });

    it("deve lançar erro quando productId é inválido", async () => {
      mockObjectId.isValid.mockReturnValue(false);

      await expect(stockService.decreaseStock("invalid", 1))
        .rejects.toThrow(new StockError("ID do produto inválido: invalid"));

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it("deve lançar erro quando produto não é encontrado", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(stockService.decreaseStock("inexistente", 1))
        .rejects.toThrow(new StockError("Produto com ID inexistente não encontrado"));

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it("deve lançar erro quando estoque é insuficiente", async () => {
      const lowStockProduct = { ...frameProduct, stock: 1 };
      mockProductRepository.findById.mockResolvedValue(lowStockProduct);

      await expect(stockService.decreaseStock("frame123", 5))
        .rejects.toThrow(new StockError("Estoque insuficiente para o produto Armação Premium. Disponível: 1, Necessário: 5"));

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it("deve lançar erro quando falha ao atualizar estoque", async () => {
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(null);

      await expect(stockService.decreaseStock("frame123", 2))
        .rejects.toThrow(new StockError("Falha ao atualizar estoque do produto frame123"));

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it("deve tratar erros de database e relançar como StockError", async () => {
      mockProductRepository.findById.mockRejectedValue(new Error("Database error"));

      await expect(stockService.decreaseStock("frame123", 2))
        .rejects.toThrow(new StockError("Erro desconhecido ao processar estoque: Database error"));

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it("deve tratar erros não-Error e relançar como StockError", async () => {
      mockProductRepository.findById.mockRejectedValue("String error");

      await expect(stockService.decreaseStock("frame123", 2))
        .rejects.toThrow(new StockError("Erro desconhecido ao processar estoque: String error"));
    });

    it("deve propagar StockError sem modificar", async () => {
      const stockError = new StockError("Erro específico");
      mockProductRepository.findById.mockRejectedValue(stockError);

      await expect(stockService.decreaseStock("frame123", 2))
        .rejects.toThrow(stockError);
    });
  });

  describe("increaseStock", () => {
    it("deve aumentar estoque de produto de armação com sucesso", async () => {
      const updatedProduct = { ...frameProduct, stock: 12 };
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      const result = await stockService.increaseStock("frame123", 2, "Reposição", "user123");

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.updateStock).toHaveBeenCalledWith("frame123", 2, "add", mockSession);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it("não deve alterar estoque de produtos que não são armações", async () => {
      mockProductRepository.findById.mockResolvedValue(lensProduct);

      const result = await stockService.increaseStock("lens123", 1);

      expect(result).toEqual(lensProduct);
      expect(mockProductRepository.updateStock).not.toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it("deve usar valores padrão", async () => {
      const updatedProduct = { ...frameProduct, stock: 11 };
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      const result = await stockService.increaseStock("frame123");

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.updateStock).toHaveBeenCalledWith("frame123", 1, "add", mockSession);
    });

    it("deve lançar erro quando productId é inválido", async () => {
      mockObjectId.isValid.mockReturnValue(false);

      await expect(stockService.increaseStock("invalid", 1))
        .rejects.toThrow(new StockError("ID do produto inválido: invalid"));
    });

    it("deve lançar erro quando produto não é encontrado", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(stockService.increaseStock("inexistente", 1))
        .rejects.toThrow(new StockError("Produto com ID inexistente não encontrado"));
    });

    it("deve lançar erro quando falha ao atualizar estoque", async () => {
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(null);

      await expect(stockService.increaseStock("frame123", 2))
        .rejects.toThrow(new StockError("Falha ao atualizar estoque do produto frame123"));
    });

    it("deve tratar erros de database", async () => {
      mockProductRepository.findById.mockRejectedValue(new Error("Database error"));

      await expect(stockService.increaseStock("frame123", 2))
        .rejects.toThrow(new StockError("Erro desconhecido ao processar estoque: Database error"));
    });

    it("deve propagar StockError sem modificar", async () => {
      const stockError = new StockError("Erro específico");
      mockProductRepository.findById.mockRejectedValue(stockError);

      await expect(stockService.increaseStock("frame123", 2))
        .rejects.toThrow(stockError);
    });
  });

  describe("getLowStockProducts", () => {
    it("deve retornar produtos com estoque baixo", async () => {
      const lowStockProducts = [{ ...frameProduct, stock: 2 }];
      mockProductRepository.findLowStock.mockResolvedValue({ items: lowStockProducts });

      const result = await stockService.getLowStockProducts(5);

      expect(result).toEqual(lowStockProducts);
      expect(mockProductRepository.findLowStock).toHaveBeenCalledWith(5, 1, 100);
    });

    it("deve usar threshold padrão", async () => {
      mockProductRepository.findLowStock.mockResolvedValue({ items: [] });

      await stockService.getLowStockProducts();

      expect(mockProductRepository.findLowStock).toHaveBeenCalledWith(10, 1, 100);
    });

    it("deve retornar array vazio em caso de erro", async () => {
      mockProductRepository.findLowStock.mockRejectedValue(new Error("DB Error"));

      const result = await stockService.getLowStockProducts();

      expect(result).toEqual([]);
    });
  });

  describe("getOutOfStockProducts", () => {
    it("deve retornar produtos sem estoque", async () => {
      const outOfStockProducts = [{ ...frameProduct, stock: 0 }];
      mockProductRepository.findLowStock.mockResolvedValue({ items: outOfStockProducts });

      const result = await stockService.getOutOfStockProducts();

      expect(result).toEqual(outOfStockProducts);
      expect(mockProductRepository.findLowStock).toHaveBeenCalledWith(0, 1, 100);
    });

    it("deve filtrar apenas produtos de armação", async () => {
      const mixedProducts = [
        { ...frameProduct, stock: 0 },
        { ...lensProduct, stock: 0 }
      ];
      mockProductRepository.findLowStock.mockResolvedValue({ items: mixedProducts });

      const result = await stockService.getOutOfStockProducts();

      expect(result).toHaveLength(1);
      expect(result[0].productType).toBe("prescription_frame");
    });

    it("deve retornar array vazio em caso de erro", async () => {
      mockProductRepository.findLowStock.mockRejectedValue(new Error("DB Error"));

      const result = await stockService.getOutOfStockProducts();

      expect(result).toEqual([]);
    });
  });

  describe("checkStockAvailability", () => {
    it("deve verificar disponibilidade de estoque", async () => {
      const products = [
        { productId: "frame123", quantity: 15 },
        { productId: "sun123", quantity: 3 }
      ];

      mockProductRepository.findById
        .mockResolvedValueOnce(frameProduct)
        .mockResolvedValueOnce(sunglassesProduct);

      const result = await stockService.checkStockAvailability(products);

      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe("frame123");
      expect(result[0].available).toBe(10);
      expect(result[0].required).toBe(15);
    });

    it("deve retornar array vazio quando todos têm estoque suficiente", async () => {
      const products = [{ productId: "frame123", quantity: 5 }];
      mockProductRepository.findById.mockResolvedValue(frameProduct);

      const result = await stockService.checkStockAvailability(products);

      expect(result).toHaveLength(0);
    });

    it("deve tratar produtos não encontrados", async () => {
      const products = [{ productId: "inexistente", quantity: 1 }];
      mockProductRepository.findById.mockResolvedValue(null);

      const result = await stockService.checkStockAvailability(products);

      expect(result).toHaveLength(1);
      expect(result[0].available).toBe(0);
    });

    it("deve tratar produtos que não são armações", async () => {
      const products = [{ productId: "lens123", quantity: 1 }];
      mockProductRepository.findById.mockResolvedValue(lensProduct);

      const result = await stockService.checkStockAvailability(products);

      expect(result).toHaveLength(0);
    });

    it("deve tratar erros de database", async () => {
      const products = [{ productId: "frame123", quantity: 1 }];
      mockProductRepository.findById.mockRejectedValue(new Error("DB Error"));

      const result = await stockService.checkStockAvailability(products);

      expect(result).toHaveLength(1);
      expect(result[0].available).toBe(0);
    });

    it("deve lidar com produtos sem stock definido", async () => {
      const productWithoutStock = { ...frameProduct, stock: undefined };
      const products = [{ productId: "frame123", quantity: 1 }];
      mockProductRepository.findById.mockResolvedValue(productWithoutStock);

      const result = await stockService.checkStockAvailability(products);

      expect(result).toHaveLength(1);
      expect(result[0].available).toBe(0);
    });

    it("deve tratar erros ao verificar estoque individual", async () => {
      const products = [{ productId: "frame123", quantity: 5 }];
      
      // Simular erro no getProductById que será chamado dentro do try/catch
      const originalGetProductById = stockService['getProductById'];
      stockService['getProductById'] = jest.fn().mockRejectedValue(new Error("DB Error"));

      const result = await stockService.checkStockAvailability(products);

      expect(result).toEqual([{
        productId: "frame123",
        available: 0,
        required: 5
      }]);

      // Restaurar método original
      stockService['getProductById'] = originalGetProductById;
    });
  });

  describe("updateProductStock", () => {
    it("deve atualizar estoque manualmente", async () => {
      const updatedProduct = { ...frameProduct, stock: 20 };
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      const result = await stockService.updateProductStock("frame123", 20, "Ajuste manual", "user123");

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.updateStock).toHaveBeenCalledWith("frame123", 20, "set");
    });

    it("deve usar valores padrão", async () => {
      const updatedProduct = { ...frameProduct, stock: 20 };
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      const result = await stockService.updateProductStock("frame123", 20);

      expect(result).toEqual(updatedProduct);
    });

    it("deve lançar erro quando produto não é encontrado", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(stockService.updateProductStock("inexistente", 20))
        .rejects.toThrow(new StockError("Produto com ID inexistente não encontrado"));
    });

    it("deve lançar erro para produtos que não são armações", async () => {
      mockProductRepository.findById.mockResolvedValue(lensProduct);

      await expect(stockService.updateProductStock("lens123", 20))
        .rejects.toThrow(new StockError("Produto Lente de Contato não possui controle de estoque"));
    });

    it("deve retornar null quando falha ao atualizar", async () => {
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(null);

      const result = await stockService.updateProductStock("frame123", 20);

      expect(result).toBe(null);
    });

    it("deve criar log quando atualização é bem-sucedida", async () => {
      const updatedProduct = { ...frameProduct, stock: 20 };
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      await stockService.updateProductStock("frame123", 20);

      expect(mockStockLog.create).toHaveBeenCalled();
    });

    it("deve calcular operação de aumento corretamente", async () => {
      const updatedProduct = { ...frameProduct, stock: 20 };
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      await stockService.updateProductStock("frame123", 20);

      expect(mockStockLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: "increase",
          quantity: 10
        })
      );
    });

    it("deve calcular operação de diminuição corretamente", async () => {
      const updatedProduct = { ...frameProduct, stock: 5 };
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      await stockService.updateProductStock("frame123", 5);

      expect(mockStockLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: "decrease",
          quantity: 5
        })
      );
    });

    it("deve tratar erros de database", async () => {
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockRejectedValue(new Error("Database error"));

      await expect(stockService.updateProductStock("frame123", 20))
        .rejects.toThrow(new StockError("Erro ao atualizar estoque: Database error"));
    });

    it("deve propagar StockError sem modificar", async () => {
      const stockError = new StockError("Erro específico");
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockRejectedValue(stockError);

      await expect(stockService.updateProductStock("frame123", 20))
        .rejects.toThrow(stockError);
    });

    it("deve lidar com produtos sem stock definido", async () => {
      const productWithoutStock = { ...frameProduct, stock: undefined };
      const updatedProduct = { ...frameProduct, stock: 20 };
      mockProductRepository.findById.mockResolvedValue(productWithoutStock);
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      await stockService.updateProductStock("frame123", 20);

      expect(mockStockLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          previousStock: 0,
          newStock: 20
        })
      );
    });

    it("deve retornar null quando updateStock falha", async () => {
      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue(null);

      const result = await stockService.updateProductStock("frame123", 15);

      expect(result).toBeNull();
      expect(mockStockLog.create).not.toHaveBeenCalled();
    });
  });

  describe("processOrderProducts", () => {
    it("deve processar diminuição de estoque para múltiplos produtos", async () => {
      const products = [
        { productId: "frame123", quantity: 2 },
        { productId: "sun123", quantity: 1 }
      ];

      mockProductRepository.findById
        .mockResolvedValueOnce(frameProduct)
        .mockResolvedValueOnce(sunglassesProduct);
      
      mockProductRepository.updateStock
        .mockResolvedValueOnce({ ...frameProduct, stock: 8 })
        .mockResolvedValueOnce({ ...sunglassesProduct, stock: 4 });

      await stockService.processOrderProducts(products, "decrease", "user123", "order123");

      expect(mockProductRepository.updateStock).toHaveBeenCalledTimes(2);
    });

    it("deve processar aumento de estoque", async () => {
      const products = [{ productId: "frame123", quantity: 5 }];

      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue({ ...frameProduct, stock: 15 });

      await stockService.processOrderProducts(products, "increase", "user123", "order123");

      expect(mockProductRepository.updateStock).toHaveBeenCalledWith("frame123", 5, "add", mockSession);
    });

    it("deve usar valores padrão para performedBy", async () => {
      const products = [{ productId: "frame123", quantity: 1 }];

      mockProductRepository.findById.mockResolvedValue(frameProduct);
      mockProductRepository.updateStock.mockResolvedValue({ ...frameProduct, stock: 9 });

      await stockService.processOrderProducts(products, "decrease");

      expect(mockProductRepository.updateStock).toHaveBeenCalled();
    });

    it("deve coletar e lançar múltiplos erros", async () => {
      const products = [
        { productId: "frame123", quantity: 20 }, // Estoque insuficiente
        { productId: "sun123", quantity: 10 }    // Estoque insuficiente
      ];

      mockProductRepository.findById
        .mockResolvedValueOnce(frameProduct)
        .mockResolvedValueOnce(sunglassesProduct);

      await expect(stockService.processOrderProducts(products, "decrease", "user123"))
        .rejects.toThrow(StockError);
    });

    it("deve processar produtos mesmo com alguns erros", async () => {
      const products = [
        { productId: "frame123", quantity: 1 },  // Sucesso
        { productId: "invalid", quantity: 1 }    // Erro
      ];

      mockProductRepository.findById
        .mockResolvedValueOnce(frameProduct)
        .mockResolvedValueOnce(null);
      
      mockProductRepository.updateStock
        .mockResolvedValueOnce({ ...frameProduct, stock: 9 });

      await expect(stockService.processOrderProducts(products, "decrease"))
        .rejects.toThrow(StockError);

      expect(mockProductRepository.updateStock).toHaveBeenCalledTimes(1);
    });
  });

  describe("getProductStockHistory", () => {
    it("deve retornar histórico de estoque", async () => {
      const history = [{ productId: "frame123", action: "decrease", quantity: 2 }];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(history)
      };
      mockStockLog.find.mockReturnValue(mockQuery);

      const result = await stockService.getProductStockHistory("frame123");

      expect(result).toEqual(history);
      expect(mockStockLog.find).toHaveBeenCalledWith({ 
        productId: expect.objectContaining({ _id: "frame123" })
      });
    });

    it("deve retornar array vazio em caso de erro", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error("DB Error"))
      };
      mockStockLog.find.mockReturnValue(mockQuery);

      const result = await stockService.getProductStockHistory("frame123");

      expect(result).toEqual([]);
    });
  });

  describe("createStockLog", () => {
    it("deve criar log de estoque", async () => {
      const logData = {
        productId: "frame123",
        orderId: "order123",
        previousStock: 10,
        newStock: 8,
        quantity: 2,
        operation: "decrease",
        reason: "Venda",
        performedBy: "user123"
      };

      mockStockLog.create.mockResolvedValue({ _id: "log123", ...logData });

      await stockService.createStockLog(
        "frame123",
        10,
        8,
        2,
        "decrease",
        "Venda",
        "user123",
        "order123"
      );

      expect(mockStockLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: expect.objectContaining({ _id: "frame123" }),
          orderId: expect.objectContaining({ _id: "order123" }),
          performedBy: expect.objectContaining({ _id: "user123" }),
          previousStock: 10,
          newStock: 8,
          quantity: 2,
          operation: "decrease",
          reason: "Venda"
        })
      );
    });

    it("deve criar log sem orderId", async () => {
      await stockService.createStockLog(
        "frame123",
        10,
        8,
        2,
        "decrease",
        "Venda",
        "user123"
      );

      expect(mockStockLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: undefined
        })
      );
    });

    it("deve tratar erros graciosamente", async () => {
      mockStockLog.create.mockRejectedValue(new Error("DB Error"));

      // Não deve lançar erro, apenas logar
      await expect(stockService.createStockLog("frame123", 10, 8, 2, "decrease", "Test", "user123"))
        .resolves.not.toThrow();
    });
  });

  describe("createStockLogWithSession", () => {
    it("deve criar log com sessão", async () => {
      const logData = {
        productId: "frame123",
        orderId: "order123",
        previousStock: 10,
        newStock: 8,
        quantity: 2,
        operation: "decrease",
        reason: "Venda",
        performedBy: "user123"
      };

      mockCreateStockLogWithSession.mockResolvedValue({ _id: "log123" });

      await stockService.createStockLogWithSession(
        "frame123",
        10,
        8,
        2,
        "decrease",
        "Venda",
        "user123",
        "order123",
        mockSession
      );

      expect(mockCreateStockLogWithSession).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: expect.objectContaining({ _id: "frame123" }),
          orderId: expect.objectContaining({ _id: "order123" }),
          performedBy: expect.objectContaining({ _id: "user123" })
        }),
        mockSession
      );
    });

    it("deve criar log sem sessão quando não fornecida", async () => {
      mockStockLog.create.mockResolvedValue({ _id: "log123" });

      await stockService.createStockLogWithSession(
        "frame123",
        10,
        8,
        2,
        "decrease",
        "Venda",
        "user123"
      );

      expect(mockStockLog.create).toHaveBeenCalled();
    });

    it("deve lançar erro quando productId é inválido", async () => {
      mockObjectId.isValid.mockReturnValue(false);

      await expect(stockService.createStockLogWithSession(
        "invalid",
        10,
        8,
        2,
        "decrease",
        "Venda",
        "user123",
        "order123",
        mockSession
      )).rejects.toThrow("ID do produto inválido: invalid");
    });

    it("deve tratar erros e relançar", async () => {
      mockCreateStockLogWithSession.mockRejectedValue(new Error("DB Error"));

      await expect(stockService.createStockLogWithSession(
        "frame123",
        10,
        8,
        2,
        "decrease",
        "Venda",
        "user123",
        "order123",
        mockSession
      )).rejects.toThrow("DB Error");
    });
  });

  describe("StockError", () => {
    it("deve criar erro com nome e mensagem corretos", () => {
      const error = new StockError("Teste de erro");

      expect(error.name).toBe("StockError");
      expect(error.message).toBe("Teste de erro");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(StockError);
    });
  });
}); 