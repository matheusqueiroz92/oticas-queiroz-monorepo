import { CashRegister } from "../../schemas/CashRegisterSchema";
import { User } from "../../schemas/UserSchema";
import { generateToken } from "../../utils/jwt";
import bcrypt from "bcrypt";

export const createTestUser = async (
  role: "admin" | "employee" | "customer"
) => {
  const password = "123456";
  const hashedPassword = await bcrypt.hash(password, 10);
  const email = `${role}${Date.now()}@test.com`;

  const user = await User.create({
    name: `Test ${role}`,
    email,
    password: hashedPassword,
    role,
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
    },
    payments: {
      received: 0,
      made: 0,
    },
    openedBy: userId,
  });
};
