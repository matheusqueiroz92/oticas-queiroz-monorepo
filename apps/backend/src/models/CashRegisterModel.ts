import { CashRegister } from "../schemas/CashRegisterSchema";
import type { ICashRegister } from "../interfaces/ICashRegister";
import type mongoose from "mongoose";
import { type Document, Types } from "mongoose";
import type { IPayment } from "../interfaces/IPayment";

// Corrigir a interface para representar o documento do Mongoose
interface CashRegisterDocument extends Document {
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

// Para a atualização com sessão, usamos um tipo diferente
interface UpdateData {
  currentBalance: number;
  "sales.total"?: number;
  "sales.cash"?: number;
  "sales.credit"?: number;
  "sales.debit"?: number;
  "sales.pix"?: number;
  "payments.received"?: number;
  "payments.made"?: number;
}

export class CashRegisterModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  private convertToICashRegister(doc: CashRegisterDocument): ICashRegister {
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

  async findAll(
    page = 1,
    limit = 10,
    filters: Record<string, unknown> = {}
  ): Promise<{ registers: ICashRegister[]; total: number }> {
    const skip = (page - 1) * limit;

    // Criar objeto de consulta
    const query: Record<string, unknown> = { isDeleted: { $ne: true } };

    // Adicionar filtros extras se fornecidos
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      query.openingDate = {
        $gte: new Date(filters.startDate as string),
        $lte: new Date(filters.endDate as string),
      };
    } else if (filters.startDate) {
      query.openingDate = { $gte: new Date(filters.startDate as string) };
    } else if (filters.endDate) {
      query.openingDate = { $lte: new Date(filters.endDate as string) };
    }

    if (filters.search) {
      // Se for uma busca por ID
      if (this.isValidId(filters.search as string)) {
        query._id = new Types.ObjectId(filters.search as string);
      } else {
        // Tentativa de busca por observações
        query.observations = { $regex: filters.search, $options: "i" };
      }
    }

    const [registers, total] = await Promise.all([
      CashRegister.find(query)
        .sort({ openingDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate("openedBy", "name email")
        .populate("closedBy", "name email")
        .exec() as Promise<CashRegisterDocument[]>,
      CashRegister.countDocuments(query),
    ]);

    return {
      registers: registers.map((register) =>
        this.convertToICashRegister(register)
      ),
      total,
    };
  }

  async create(
    registerData: Omit<ICashRegister, "_id">
  ): Promise<ICashRegister> {
    const register = new CashRegister(registerData);
    const savedRegister = (await register.save()) as CashRegisterDocument;
    return this.convertToICashRegister(savedRegister);
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
      .exec()) as CashRegisterDocument | null;

    if (!register) return null;

    const result = this.convertToICashRegister(register);
    return {
      ...result,
      closedBy: closeData.closedBy,
    };
  }

  async findOpenRegister(): Promise<ICashRegister | null> {
    const register = (await CashRegister.findOne({ status: "open" })
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec()) as CashRegisterDocument | null;

    return register ? this.convertToICashRegister(register) : null;
  }

  async findById(
    id: string,
    includeDeleted = false
  ): Promise<ICashRegister | null> {
    if (!this.isValidId(id)) return null;

    let query = CashRegister.findById(id);

    // Se não devemos incluir registros excluídos, adicionar a condição
    if (!includeDeleted) {
      query = query.where({ isDeleted: { $ne: true } });
    }

    query = query
      .populate("openedBy", "name email")
      .populate("closedBy", "name email");

    if (includeDeleted) {
      query = query.populate("deletedBy", "name email");
    }

    const register = (await query.exec()) as CashRegisterDocument | null;
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
      .exec()) as CashRegisterDocument[];

    return registers.map((register) => this.convertToICashRegister(register));
  }

  async findDeletedRegisters(
    page = 1,
    limit = 10
  ): Promise<{ registers: ICashRegister[]; total: number }> {
    const skip = (page - 1) * limit;

    const [registers, total] = await Promise.all([
      CashRegister.find({ isDeleted: true })
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("openedBy", "name email")
        .populate("closedBy", "name email")
        .populate("deletedBy", "name email")
        .exec() as Promise<CashRegisterDocument[]>,
      CashRegister.countDocuments({ isDeleted: true }),
    ]);

    return {
      registers: registers.map((register) =>
        this.convertToICashRegister(register)
      ),
      total,
    };
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

  async updateSalesAndPaymentsWithSession(
    id: string,
    type: IPayment["type"],
    amount: number,
    paymentMethod: string,
    session?: mongoose.ClientSession
  ): Promise<ICashRegister | null> {
    if (!this.isValidId(id)) return null;

    // Buscar com tipagem adequada
    const register = (await CashRegister.findById(
      id
    )) as CashRegisterDocument | null;
    if (!register) return null;

    // Usar um objeto para construir as atualizações
    const updateData: Record<string, unknown> = {};

    // Atualizar currentBalance
    updateData.currentBalance =
      register.currentBalance + (type === "expense" ? -amount : amount);

    // Configurar vendas
    if (type === "sale") {
      // Verificar se o objeto sales existe
      if (!register.sales) {
        register.sales = {
          credit: 0,
          debit: 0,
          cash: 0,
          pix: 0,
          total: 0,
        };
      }

      // Atualizar os valores específicos por método de pagamento
      if (paymentMethod === "credit") {
        updateData["sales.credit"] = (register.sales.credit || 0) + amount;
      } else if (paymentMethod === "debit") {
        updateData["sales.debit"] = (register.sales.debit || 0) + amount;
      } else if (paymentMethod === "cash") {
        updateData["sales.cash"] = (register.sales.cash || 0) + amount;
      } else if (paymentMethod === "pix") {
        updateData["sales.pix"] = (register.sales.pix || 0) + amount;
      }

      // Atualizar o total de vendas
      updateData["sales.total"] = (register.sales.total || 0) + amount;
    }
    // Configurar recebimentos
    else if (type === "debt_payment") {
      // Verificar se o objeto payments existe
      if (!register.payments) {
        register.payments = {
          received: 0,
          made: 0,
        };
      }

      // Atualizar recebimentos
      updateData["payments.received"] =
        (register.payments.received || 0) + amount;
    }
    // Configurar despesas
    else if (type === "expense") {
      // Verificar se o objeto payments existe
      if (!register.payments) {
        register.payments = {
          received: 0,
          made: 0,
        };
      }

      // Atualizar despesas
      updateData["payments.made"] = (register.payments.made || 0) + amount;
    }

    const options = {
      new: true,
      runValidators: true,
      ...(session ? { session } : {}),
    };

    // Garantir que o objeto retornado seja do tipo correto
    const updatedRegister = (await CashRegister.findByIdAndUpdate(
      id,
      { $set: updateData },
      options
    )
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .exec()) as CashRegisterDocument | null;

    return updatedRegister
      ? this.convertToICashRegister(updatedRegister)
      : null;
  }

  async softDelete(id: string, userId: string): Promise<ICashRegister | null> {
    if (!this.isValidId(id)) return null;

    const register = (await CashRegister.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate("openedBy", "name email")
      .populate("closedBy", "name email")
      .populate("deletedBy", "name email")
      .exec()) as CashRegisterDocument | null;

    return register ? this.convertToICashRegister(register) : null;
  }
}
