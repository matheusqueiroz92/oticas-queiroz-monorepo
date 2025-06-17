import { Types } from "mongoose";
import type { IUser } from "../../interfaces/IUser";
import type { IOrder } from "../../interfaces/IOrder";
import type { IPayment } from "../../interfaces/IPayment";
import type { IProduct } from "../../interfaces/IProduct";
import type { ILaboratory } from "../../interfaces/ILaboratory";
import type { ILegacyClient } from "../../interfaces/ILegacyClient";
import type { ICashRegister } from "../../interfaces/ICashRegister";
import { generateToken } from "../../utils/jwt";

// CPFs válidos para testes
export const validCPFs = {
  admin: "12345678901",
  employee: "98765432100", 
  customer: "11122233344",
  newUser: "55566677788",
  anotherUser: "99988877766"
};

// CNPJs válidos para testes
export const validCNPJs = {
  institution: "12345678000195",
  laboratory: "98765432000181"
};

// Mock de usuário admin
export const mockAdminUser: Partial<IUser> = {
  _id: new Types.ObjectId().toString(),
  name: "Admin Test",
  email: "admin@test.com",
  cpf: validCPFs.admin,
  role: "admin",
  password: "$2b$10$hashedpassword",
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock de usuário employee
export const mockEmployeeUser: Partial<IUser> = {
  _id: new Types.ObjectId().toString(),
  name: "Employee Test", 
  email: "employee@test.com",
  cpf: validCPFs.employee,
  role: "employee",
  password: "$2b$10$hashedpassword",
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock de usuário customer
export const mockCustomerUser: Partial<IUser> = {
  _id: new Types.ObjectId().toString(),
  name: "Customer Test",
  email: "customer@test.com", 
  cpf: validCPFs.customer,
  role: "customer",
  password: "$2b$10$hashedpassword",
  address: "Test Address",
  phone: "11999999999",
  birthDate: new Date("1990-01-01"),
  purchases: [],
  debts: 0,
  sales: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock de instituição
export const mockInstitutionUser: Partial<IUser> = {
  _id: new Types.ObjectId().toString(),
  name: "Institution Test",
  email: "institution@test.com",
  cnpj: validCNPJs.institution,
  role: "institution",
  password: "$2b$10$hashedpassword",
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock de produto básico
export const mockProduct: Partial<IProduct> = {
  _id: new Types.ObjectId().toString(),
  name: "Test Product",
  description: "Test Description",
  brand: "Test Brand",
  productType: "lenses",
  sellPrice: 100.00,
  costPrice: 50.00,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock de laboratório
export const mockLaboratory: Partial<ILaboratory> = {
  _id: new Types.ObjectId().toString(),
  name: "Test Laboratory",
  email: "test@laboratory.com",
  phone: "11999999999",
  contactName: "Test Contact",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock de cliente legado
export const mockLegacyClient: Partial<ILegacyClient> = {
  _id: new Types.ObjectId().toString(),
  name: "Legacy Client Test",
  cpf: validCPFs.customer,
  email: "legacy@test.com",
  phone: "11999999999",
  totalDebt: 0,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock de pedido básico
export const mockOrder: Partial<IOrder> = {
  _id: new Types.ObjectId().toString(),
  serviceOrder: "OS001",
  clientId: mockCustomerUser._id!,
  employeeId: mockEmployeeUser._id!,
  products: [],
  status: "pending",
  totalPrice: 100.00,
  finalPrice: 100.00,
  discount: 0,
  paymentMethod: "cash",
  paymentStatus: "pending",
  orderDate: new Date(),
  deliveryDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock de pagamento
export const mockPayment: Partial<IPayment> = {
  _id: new Types.ObjectId().toString(),
  orderId: mockOrder._id,
  amount: 100.00,
  paymentMethod: "cash",
  type: "sale",
  status: "completed",
  description: "Test Payment",
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock de caixa
export const mockCashRegister: Partial<ICashRegister> = {
  _id: new Types.ObjectId().toString(),
  openedBy: mockAdminUser._id!,
  openingBalance: 100.00,
  currentBalance: 100.00,
  status: "open",
  openingDate: new Date(),
  sales: {
    total: 0,
    cash: 0,
    credit: 0,
    debit: 0,
    pix: 0,
    check: 0
  },
  payments: {
    received: 0,
    made: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

// Função para gerar tokens
export const generateTestTokens = () => ({
  adminToken: generateToken(mockAdminUser._id!, mockAdminUser.role!),
  employeeToken: generateToken(mockEmployeeUser._id!, mockEmployeeUser.role!),
  customerToken: generateToken(mockCustomerUser._id!, mockCustomerUser.role!)
});

// Função para criar mock de comparePassword
export const createComparePasswordMock = (expectedPassword: string = "123456"): any => 
  (password: string) => Promise.resolve(password === expectedPassword);

// Função para criar mock de usuário com comparePassword
export const createUserWithComparePassword = (user: Partial<IUser>, expectedPassword: string = "123456") => ({
  ...user,
  comparePassword: createComparePasswordMock(expectedPassword)
});

// Função para limpar mocks (usar no setup dos testes)
export const clearAllMocks = () => {
  // Esta função será implementada nos arquivos de teste individuais
  console.log("Clearing mocks - implement jest.clearAllMocks() in test files");
}; 