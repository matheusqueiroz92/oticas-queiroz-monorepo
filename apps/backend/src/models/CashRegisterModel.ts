import { CashRegister } from "../schemas/CashRegisterSchema";
import type { ICashRegister } from "../interfaces/ICashRegister";
import { type Document, Types } from "mongoose";

interface CashRegisterDocument extends Document {
  _id: Types.ObjectId;
  openingDate: Date;
  closingDate?: Date;
  openingBalance: number;
  currentBalance: number;
  closingBalance?: number;
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
  openedBy: Types.ObjectId;
  closedBy?: Types.ObjectId;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DateRangeQuery {
  $gte: Date;
  $lte: Date;
}

interface UpdateOperation {
  $inc: {
    currentBalance: number;
    "sales.total"?: number;
    "sales.cash"?: number;
    "sales.credit"?: number;
    "sales.debit"?: number;
    "sales.pix"?: number;
    "payments.received"?: number;
    "payments.made"?: number;
  };
}

export class CashRegisterModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(
    registerData: Omit<ICashRegister, "_id">
  ): Promise<ICashRegister> {
    const register = new CashRegister(registerData);
    const savedRegister =
      (await register.save()) as unknown as CashRegisterDocument;
    return this.convertToICashRegister(savedRegister);
  }

  async findOpenRegister(): Promise<ICashRegister | null> {
    const register = (await CashRegister.findOne({ status: "open" })
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec()) as CashRegisterDocument | null;

    return register ? this.convertToICashRegister(register) : null;
  }

  async findById(id: string): Promise<ICashRegister | null> {
    if (!this.isValidId(id)) return null;

    const register = (await CashRegister.findById(id)
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec()) as CashRegisterDocument | null;

    return register ? this.convertToICashRegister(register) : null;
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<ICashRegister[]> {
    const query: Record<string, DateRangeQuery> = {
      openingDate: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const registers = (await CashRegister.find(query)
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec()) as unknown as CashRegisterDocument[];

    return registers.map((register) => this.convertToICashRegister(register));
  }

  async updateSalesAndPayments(
    id: string,
    type: "sale" | "debt_payment" | "expense",
    amount: number,
    method?: "cash" | "credit" | "debit" | "pix"
  ): Promise<ICashRegister | null> {
    if (!this.isValidId(id)) return null;

    const updateData: UpdateOperation = {
      $inc: { currentBalance: amount },
    };

    if (type === "sale" && method) {
      updateData.$inc[`sales.${method}`] = amount;
      updateData.$inc["sales.total"] = amount;
    } else if (type === "debt_payment") {
      updateData.$inc["payments.received"] = amount;
    } else if (type === "expense") {
      updateData.$inc["payments.made"] = Math.abs(amount);
    }

    const register = (await CashRegister.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec()) as CashRegisterDocument | null;

    return register ? this.convertToICashRegister(register) : null;
  }

  async closeRegister(
    id: string,
    closeData: {
      closingBalance: number;
      closedBy: string;
      observations?: string;
    }
  ): Promise<ICashRegister | null> {
    if (!this.isValidId(id)) return null;

    const register = (await CashRegister.findByIdAndUpdate(
      id,
      {
        $set: {
          ...closeData,
          status: "closed",
          closingDate: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec()) as CashRegisterDocument | null;

    return register ? this.convertToICashRegister(register) : null;
  }

  private convertToICashRegister(doc: CashRegisterDocument): ICashRegister {
    const register = doc.toObject();
    return {
      ...register,
      _id: doc._id.toString(),
      openedBy: doc.openedBy.toString(),
      closedBy: doc.closedBy?.toString(),
    };
  }
}
