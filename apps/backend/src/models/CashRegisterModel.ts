import { CashRegister } from "../schemas/CashRegisterSchema";
import type { ICashRegister } from "../interfaces/ICashRegister";
import { type Document, Types } from "mongoose";

interface CashRegisterBaseDocument {
  _id: Types.ObjectId;
  openingDate: Date;
  closingDate?: Date | null;
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
  openedBy:
    | Types.ObjectId
    | { _id: Types.ObjectId; name: string; email: string };
  closedBy?:
    | Types.ObjectId
    | { _id: Types.ObjectId; name: string; email: string }
    | null;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
}

type ReferenceField =
  | Types.ObjectId
  | { _id: Types.ObjectId; name: string; email: string }
  | string
  | undefined
  | null;

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
    const savedRegister = await register.save();
    return this.convertToICashRegister(savedRegister);
  }

  async findOpenRegister(): Promise<ICashRegister | null> {
    const register = await CashRegister.findOne({ status: "open" })
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec();

    return register ? this.convertToICashRegister(register) : null;
  }

  async findById(id: string): Promise<ICashRegister | null> {
    if (!this.isValidId(id)) return null;

    const register = await CashRegister.findById(id)
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec();

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

    const registers = await CashRegister.find(query)
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec();

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

    const register = await CashRegister.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec();

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

    const register = await CashRegister.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "closed",
          closingBalance: closeData.closingBalance,
          closedBy: closeData.closedBy,
          closingDate: new Date(),
          observations: closeData.observations,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec();

    if (!register) return null;

    const result = this.convertToICashRegister(register);
    return {
      ...result,
      closedBy: closeData.closedBy,
    };
  }

  private convertToICashRegister(
    doc: Document & { _id: Types.ObjectId }
  ): ICashRegister {
    const result = doc.toObject();

    const getIdString = (field: ReferenceField): string => {
      if (!field) return "";
      if (field instanceof Types.ObjectId) {
        return field.toString();
      }
      if (typeof field === "object" && "_id" in field) {
        return field._id.toString();
      }
      return field.toString();
    };

    return {
      ...result,
      _id: doc._id.toString(),
      openedBy: getIdString(doc.get("openedBy")),
      closedBy: doc.get("closedBy")
        ? getIdString(doc.get("closedBy"))
        : undefined,
    };
  }
}
