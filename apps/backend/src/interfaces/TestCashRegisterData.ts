import { CashRegister } from "../schemas/CashRegisterSchema";

interface TestCashRegisterData {
  openingDate: Date;
  openingBalance: number;
  currentBalance: number;
  status: "open" | "closed";
  sales: {
    total: number;
    cash: number;
    credit: number;
    debit: number;
    pix: number;
  };
  payments: {
    received: number;
    made: number;
  };
  openedBy: string;
}

const defaultTestCashRegisterData: Omit<TestCashRegisterData, "openedBy"> = {
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
};

export const createTestCashRegister = async (
  userId: string,
  overrides: Partial<TestCashRegisterData> = {}
) => {
  return await CashRegister.create({
    ...defaultTestCashRegisterData,
    openedBy: userId,
    ...overrides,
  });
};
