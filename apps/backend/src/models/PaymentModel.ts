
import { Payment } from "../schemas/PaymentSchema";
import type { IPayment } from "../interfaces/IPayment";
import { type Document, Types, type FilterQuery } from "mongoose";
import type mongoose from "mongoose";

interface PaymentDocument extends Document {
  _id: Types.ObjectId;
  createdBy: Types.ObjectId;
  customerId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  institutionId: Types.ObjectId;
  isInstitutionalPayment: boolean;
  legacyClientId?: Types.ObjectId;
  cashRegisterId: Types.ObjectId;
  amount: number;
  date: Date;
  type: "sale" | "debt_payment" | "expense";
  paymentMethod: "credit" | "debit" | "cash" | "pix" | "bank_slip" | "promissory_note" | "check";
  status: "pending" | "completed" | "cancelled";
  installments?: {
    current: number;
    total: number;
    value: number;
  };
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PopulatedDocument {
  _id: Types.ObjectId;
}

interface PopulatedUser extends PopulatedDocument {
  name: string;
  email: string;
}

interface PopulatedCashRegister extends PopulatedDocument {
  date: Date;
  openingBalance: number;
  currentBalance: number;
  closingBalance?: number;
  status: "open" | "closed";
  openedBy: Types.ObjectId;
  closedBy?: Types.ObjectId;
  totalSales: number;
  totalPayments: number;
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
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  private convertToIPayment(doc: PaymentDocument): IPayment {
    if (!doc) {
      console.error("Recebido documento nulo em convertToIPayment");
      return {
        _id: "",
        createdBy: "",
        cashRegisterId: "",
        amount: 0,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "pending"
      } as IPayment;
    }
  
    const payment = doc.toObject();
    
    return {
      ...payment,
      _id: doc._id ? doc._id.toString() : "",
      orderId: doc.orderId ? doc.orderId.toString() : undefined,
      customerId: doc.customerId ? doc.customerId.toString() : undefined,
      legacyClientId: doc.legacyClientId ? doc.legacyClientId.toString() : undefined,
      cashRegisterId: doc.cashRegisterId instanceof Types.ObjectId 
        ? doc.cashRegisterId.toString() 
        : (doc.cashRegisterId && (doc.cashRegisterId as PopulatedCashRegister)._id) 
          ? (doc.cashRegisterId as PopulatedCashRegister)._id.toString() 
          : "",
      createdBy: doc.createdBy instanceof Types.ObjectId 
        ? doc.createdBy.toString() 
        : (doc.createdBy && (doc.createdBy as PopulatedUser)._id) 
          ? (doc.createdBy as PopulatedUser)._id.toString() 
          : "",
    };
  }

  async create(paymentData: Omit<IPayment, "_id">): Promise<IPayment> {
    const payment = new Payment(paymentData);
    const savedPayment = (await payment.save()) as PaymentDocument;
    return this.convertToIPayment(savedPayment);
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: Partial<IPayment> = {},
    populate = false,
    includeDeleted = false
  ): Promise<{ payments: IPayment[]; total: number }> {
    const skip = (page - 1) * limit;
  
    const query = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as FilterQuery<PaymentDocument>);
  
    // Se não devemos incluir documentos excluídos, adicionar a condição isDeleted: false (ou isDeleted inexistente)
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
  
    try {
      let paymentQuery = Payment.find(query).skip(skip).limit(limit);
  
      if (populate) {
        paymentQuery = paymentQuery
          .populate("orderId")
          .populate("customerId", "name email")
          .populate("legacyClientId")
          .populate("cashRegisterId")
          .populate("createdBy", "name email")
          .populate("deletedBy", "name email");
      }
  
      const [payments, total] = await Promise.all([
        paymentQuery.exec() as Promise<PaymentDocument[]>,
        Payment.countDocuments(query),
      ]);
  
      // Filtrando documentos nulos ou inválidos antes de convertê-los
      const validPayments = payments.filter(payment => payment && payment._id);
      
      return {
        payments: validPayments.map((payment) => this.convertToIPayment(payment)),
        total,
      };
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
      return { payments: [], total: 0 };
    }
  }

  async findById(
    id: string,
    populate = false,
    includeDeleted = false
  ): Promise<IPayment | null> {
    if (!this.isValidId(id)) return null;

    let query = Payment.findById(id);

    // Se não devemos incluir documentos excluídos, adicionar a condição isDeleted: false
    if (!includeDeleted) {
      query = query.where({ isDeleted: { $ne: true } });
    }

    if (populate) {
      query = query
        .populate("orderId")
        .populate("customerId", "name email")
        .populate("legacyClientId")
        .populate("cashRegisterId")
        .populate("createdBy", "name email")
        .populate("deletedBy", "name email"); // Adicionar populate para deletedBy
    }

    const payment = (await query.exec()) as PaymentDocument | null;
    return payment ? this.convertToIPayment(payment) : null;
  }

  async findByIds(ids: string[]): Promise<IPayment[]> {
    if (!ids || ids.length === 0) return [];
    
    const objectIds = ids
      .filter(id => this.isValidId(id))
      .map(id => new Types.ObjectId(id));
    
    if (objectIds.length === 0) return [];
    
    try {
      const payments = await Payment.find({
        _id: { $in: objectIds },
        isDeleted: { $ne: true }
      })
        .populate("orderId")
        .populate("customerId", "name email")
        .populate("legacyClientId")
        .populate("cashRegisterId")
        .populate("createdBy", "name email")
        .exec();
      
      const validPayments = payments
        .filter(payment => payment && payment._id)
        .map(payment => this.convertToIPayment(payment as PaymentDocument));
        
      return validPayments;
    } catch (error) {
      console.error(`Erro ao buscar pagamentos por IDs: ${error}`);
      return [];
    }
  }

  async findByCashRegister(
    cashRegisterId: string,
    type?: IPayment["type"]
  ): Promise<IPayment[]> {
    try {
      if (!this.isValidId(cashRegisterId)) return [];
  
      const query: FilterQuery<PaymentDocument> = { 
        cashRegisterId,
        isDeleted: { $ne: true } // Ignorar registros excluídos
      };
      
      if (type) query.type = type;
  
      const payments = (await Payment.find(query)
        .populate("orderId")
        .populate("createdBy", "name email")
        .populate("customerId", "name email")
        .populate("legacyClientId")
        .exec()) as PaymentDocument[];
  
      // Filtra documentos nulos ou inválidos antes de convertê-los
      const validPayments = payments
        .filter(payment => payment && payment._id)
        .map(payment => this.convertToIPayment(payment));
        
      return validPayments;
    } catch (error) {
      console.error(`Erro ao buscar pagamentos para o caixa ${cashRegisterId}:`, error);
      return []; // Retorna array vazio em caso de erro ao invés de propagar
    }
  }

  async updateStatus(
    id: string,
    status: IPayment["status"]
  ): Promise<IPayment | null> {
    if (!this.isValidId(id)) return null;

    const payment = (await Payment.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    )) as PaymentDocument | null;

    return payment ? this.convertToIPayment(payment) : null;
  }

  async softDelete(id: string, userId: string): Promise<IPayment | null> {
    if (!this.isValidId(id)) return null;

    const payment = (await Payment.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )) as PaymentDocument | null;

    return payment ? this.convertToIPayment(payment) : null;
  }

  async createWithSession(
    paymentData: Omit<IPayment, "_id">,
    session: mongoose.ClientSession
  ): Promise<IPayment> {
    const payment = new Payment(paymentData);
    const savedPayment = (await payment.save({ session })) as PaymentDocument;
    return this.convertToIPayment(savedPayment);
  }

  async updateStatusWithSession(
    id: string,
    status: IPayment["status"],
    session: mongoose.ClientSession
  ): Promise<IPayment | null> {
    if (!this.isValidId(id)) return null;

    const payment = (await Payment.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true, session }
    )) as PaymentDocument | null;

    return payment ? this.convertToIPayment(payment) : null;
  }

  async updateCheckStatus(
    id: string,
    updateData: Record<string, any>
  ): Promise<IPayment | null> {
    if (!this.isValidId(id)) return null;
    
    const payment = (await Payment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("orderId")
     .populate("customerId", "name email")
     .populate("cashRegisterId")
     .exec()) as PaymentDocument | null;
    
    return payment ? this.convertToIPayment(payment) : null;
  }

  async findAllWithMongoFilters(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {},
    populate = false,
    includeDeleted = false
  ): Promise<{ payments: IPayment[]; total: number }> {
    const skip = (page - 1) * limit;
  
    // Se não devemos incluir documentos excluídos, adicionar a condição isDeleted: false
    if (!includeDeleted) {
      filters.isDeleted = { $ne: true };
    }
  
    try {
      let paymentQuery = Payment.find(filters).skip(skip).limit(limit);
  
      if (populate) {
        paymentQuery = paymentQuery
          .populate("orderId")
          .populate("customerId", "name email")
          .populate("legacyClientId")
          .populate("cashRegisterId")
          .populate("createdBy", "name email");
  
        if (includeDeleted) {
          paymentQuery = paymentQuery.populate("deletedBy", "name email");
        }
      }
  
      const [payments, total] = await Promise.all([
        paymentQuery.exec() as Promise<PaymentDocument[]>,
        Payment.countDocuments(filters),
      ]);
  
      // Filtrando documentos nulos ou inválidos antes de convertê-los
      const validPayments = payments.filter(payment => payment && payment._id);
      
      return {
        payments: validPayments.map((payment) => this.convertToIPayment(payment)),
        total,
      };
    } catch (error) {
      console.error("Erro ao buscar pagamentos com filtros MongoDB:", error);
      return { payments: [], total: 0 };
    }
  }

  async findChecksByStatus(
    status: "pending" | "compensated" | "rejected",
    startDate?: Date,
    endDate?: Date
  ): Promise<IPayment[]> {
    const filters: Record<string, any> = {
      paymentMethod: "check",
      "check.compensationStatus": status,
      isDeleted: { $ne: true }
    };
    
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;
      
      if (status === "pending") {
        // Para cheques pendentes, filtramos pela data de apresentação, se disponível
        filters["check.presentationDate"] = dateFilter;
      } else {
        // Para outros status, filtramos pela data do pagamento
        filters.date = dateFilter;
      }
    }
    
    const payments = await Payment.find(filters)
      .populate("orderId")
      .populate("customerId", "name email")
      .populate("legacyClientId")
      .populate("cashRegisterId")
      .populate("createdBy", "name email")
      .exec() as PaymentDocument[];
    
    return payments.map(payment => this.convertToIPayment(payment));
  }
}
