import { MongoUserRepository } from "./implementations/MongoUserRepository";
import { MongoOrderRepository } from "./implementations/MongoOrderRepository";
import { MongoPaymentRepository } from "./implementations/MongoPaymentRepository";
import { MongoProductRepository } from "./implementations/MongoProductRepository";
import { MongoLaboratoryRepository } from "./implementations/MongoLaboratoryRepository";
import { MongoCashRegisterRepository } from "./implementations/MongoCashRegisterRepository";
import { MongoCounterRepository } from "./implementations/MongoCounterRepository";
import { MongoLegacyClientRepository } from "./implementations/MongoLegacyClientRepository";
import { MongoPasswordResetRepository } from "./implementations/MongoPasswordResetRepository";
import { IUserRepository } from "./interfaces/IUserRepository";
import { IOrderRepository } from "./interfaces/IOrderRepository";
import { IPaymentRepository } from "./interfaces/IPaymentRepository";
import { IProductRepository } from "./interfaces/IProductRepository";
import { ILaboratoryRepository } from "./interfaces/ILaboratoryRepository";
import { ICashRegisterRepository } from "./interfaces/ICashRegisterRepository";
import { ICounterRepository } from "./interfaces/ICounterRepository";
import { ILegacyClientRepository } from "./interfaces/ILegacyClientRepository";
import { IPasswordResetRepository } from "./interfaces/IPasswordResetRepository";

/**
 * Factory para criação e gerenciamento de repositories
 * Implementa padrão Singleton para garantir uma única instância de cada repository
 */
export class RepositoryFactory {
  private static instance: RepositoryFactory;
  
  // Cache das instâncias dos repositories
  private userRepository?: IUserRepository;
  private orderRepository?: IOrderRepository;
  private paymentRepository?: IPaymentRepository;
  private productRepository?: IProductRepository;
  private laboratoryRepository?: ILaboratoryRepository;
  private cashRegisterRepository?: ICashRegisterRepository;
  private counterRepository?: ICounterRepository;
  private legacyClientRepository?: ILegacyClientRepository;
  private passwordResetRepository?: IPasswordResetRepository;

  private constructor() {
    // Constructor privado para Singleton
  }

  /**
   * Obtém a instância única do factory
   */
  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  /**
   * Obtém instância do UserRepository
   */
  public getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new MongoUserRepository();
    }
    return this.userRepository;
  }

  /**
   * Obtém instância do OrderRepository
   */
  public getOrderRepository(): IOrderRepository {
    if (!this.orderRepository) {
      this.orderRepository = new MongoOrderRepository();
    }
    return this.orderRepository;
  }

  /**
   * Obtém instância do PaymentRepository
   */
  public getPaymentRepository(): IPaymentRepository {
    if (!this.paymentRepository) {
      this.paymentRepository = new MongoPaymentRepository();
    }
    return this.paymentRepository;
  }

  /**
   * Obtém instância do ProductRepository
   */
  public getProductRepository(): IProductRepository {
    if (!this.productRepository) {
      this.productRepository = new MongoProductRepository();
    }
    return this.productRepository;
  }

  /**
   * Obtém instância do LaboratoryRepository
   */
  public getLaboratoryRepository(): ILaboratoryRepository {
    if (!this.laboratoryRepository) {
      this.laboratoryRepository = new MongoLaboratoryRepository();
    }
    return this.laboratoryRepository;
  }

  /**
   * Obtém instância do CashRegisterRepository
   */
  public getCashRegisterRepository(): ICashRegisterRepository {
    if (!this.cashRegisterRepository) {
      this.cashRegisterRepository = new MongoCashRegisterRepository();
    }
    return this.cashRegisterRepository;
  }

  /**
   * Obtém instância do CounterRepository
   */
  public getCounterRepository(): ICounterRepository {
    if (!this.counterRepository) {
      this.counterRepository = new MongoCounterRepository();
    }
    return this.counterRepository;
  }

  /**
   * Obtém instância do LegacyClientRepository
   */
  public getLegacyClientRepository(): ILegacyClientRepository {
    if (!this.legacyClientRepository) {
      this.legacyClientRepository = new MongoLegacyClientRepository();
    }
    return this.legacyClientRepository;
  }

  /**
   * Obtém instância do PasswordResetRepository
   */
  public getPasswordResetRepository(): IPasswordResetRepository {
    if (!this.passwordResetRepository) {
      this.passwordResetRepository = new MongoPasswordResetRepository();
    }
    return this.passwordResetRepository;
  }

  /**
   * Limpa cache de repositories (útil para testes)
   */
  public clearCache(): void {
    this.userRepository = undefined;
    this.orderRepository = undefined;
    this.paymentRepository = undefined;
    this.productRepository = undefined;
    this.laboratoryRepository = undefined;
    this.cashRegisterRepository = undefined;
    this.counterRepository = undefined;
    this.legacyClientRepository = undefined;
    this.passwordResetRepository = undefined;
  }

  /**
   * Reinicia factory (útil para testes)
   */
  public static reset(): void {
    RepositoryFactory.instance = undefined as any;
  }
}

/**
 * Helper function para acesso rápido aos repositories
 */
export const getRepositories = () => {
  const factory = RepositoryFactory.getInstance();
  
  return {
    userRepository: factory.getUserRepository(),
    orderRepository: factory.getOrderRepository(),
    paymentRepository: factory.getPaymentRepository(),
    productRepository: factory.getProductRepository(),
    laboratoryRepository: factory.getLaboratoryRepository(),
    cashRegisterRepository: factory.getCashRegisterRepository(),
    counterRepository: factory.getCounterRepository(),
    legacyClientRepository: factory.getLegacyClientRepository(),
    passwordResetRepository: factory.getPasswordResetRepository(),
  };
}; 