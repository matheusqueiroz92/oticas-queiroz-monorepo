import { CashRegister } from "../../schemas/CashRegisterSchema";
import { User } from "../../schemas/UserSchema";
import { generateToken } from "../../utils/jwt";
import { generateValidCPF } from "../../utils/validators";
import bcrypt from "bcrypt";

export const createTestUser = async (
  role: "admin" | "employee" | "customer" | "institution"
) => {
  const password = "123456";
  const hashedPassword = await bcrypt.hash(password, 10);
  const email = `${role}${Date.now()}@test.com`;
  
  // Usar CPF válido ou undefined para institution
  const cpf = role === "institution" ? undefined : generateValidCPF();
  
  const rg = "987654321";
  const birthDate = new Date("1990-01-01");

  const user = await User.create({
    name: `Test ${role}`,
    email,
    password: hashedPassword,
    role,
    cpf,
    rg,
    birthDate,
  });

  const token = generateToken(user._id.toString(), role);
  return { user, token };
};

export const createTestCashRegister = async (userId: string) => {
  return await CashRegister.create({
    openingDate: new Date(),
    openingBalance: 1000,
    currentBalance: 1000,
    status: "open",
    sales: {
      total: 0,
      cash: 0,
      credit: 0,
      debit: 0,
      pix: 0,
      check: 0, // Adicionando campo check que estava faltando
    },
    payments: {
      received: 0,
      made: 0,
    },
    openedBy: userId,
  });
};
