import { Payment } from "../schemas/PaymentSchema";
import type { IPayment } from "../interfaces/IPayment";
import { type Document, Types, type FilterQuery } from "mongoose";

interface PaymentDocument extends Document {
  _id: Types.ObjectId;
  amount: number;
  date: Date;
  type: "sale" | "debt_payment" | "expense";
  paymentMethod: "credit" | "debit" | "cash" | "pix" | "installment";
  status: "pending" | "completed" | "cancelled";
  installments?: {
    current: number;
    total: number;
    value: number;
  };
  orderId?: Types.ObjectId;
  userId?: Types.ObjectId;
  legacyClientId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  cashRegisterId: Types.ObjectId;
  description?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(paymentData: Omit<IPayment, "_id">): Promise<IPayment> {
    const payment = new Payment(paymentData);
    const savedPayment = (await payment.save()) as PaymentDocument;
    return this.convertToIPayment(savedPayment);
  }

  async findById(id: string, populate = false): Promise<IPayment | null> {
    if (!this.isValidId(id)) return null;

    let query = Payment.findById(id);

    if (populate) {
      query = query
        .populate("orderId")
        .populate("userId", "name email")
        .populate("legacyClientId")
        .populate("categoryId")
        .populate("cashRegisterId")
        .populate("createdBy", "name email");
    }

    const payment = (await query.exec()) as PaymentDocument | null;
    return payment ? this.convertToIPayment(payment) : null;
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: Partial<IPayment> = {},
    populate = false
  ): Promise<{ payments: IPayment[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as FilterQuery<PaymentDocument>);

    let paymentQuery = Payment.find(query).skip(skip).limit(limit);

    if (populate) {
      paymentQuery = paymentQuery
        .populate("orderId")
        .populate("userId", "name email")
        .populate("legacyClientId")
        .populate("categoryId")
        .populate("cashRegisterId")
        .populate("createdBy", "name email");
    }

    const [payments, total] = await Promise.all([
      paymentQuery.exec() as Promise<PaymentDocument[]>,
      Payment.countDocuments(query),
    ]);

    return {
      payments: payments.map((payment) => this.convertToIPayment(payment)),
      total,
    };
  }

  async findByCashRegister(
    cashRegisterId: string,
    type?: IPayment["type"]
  ): Promise<IPayment[]> {
    if (!this.isValidId(cashRegisterId)) return [];

    const query: FilterQuery<PaymentDocument> = { cashRegisterId };
    if (type) query.type = type;

    const payments = (await Payment.find(query)
      .populate("orderId")
      .populate("userId", "name email")
      .populate("legacyClientId")
      .exec()) as PaymentDocument[];

    return payments.map((payment) => this.convertToIPayment(payment));
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

  private convertToIPayment(doc: PaymentDocument): IPayment {
    const payment = doc.toObject();
    return {
      ...payment,
      _id: doc._id.toString(),
      orderId: doc.orderId?.toString(),
      userId: doc.userId?.toString(),
      legacyClientId: doc.legacyClientId?.toString(),
      categoryId: doc.categoryId?.toString(),
      cashRegisterId: doc.cashRegisterId.toString(),
      createdBy: doc.createdBy.toString(),
    };
  }
}
