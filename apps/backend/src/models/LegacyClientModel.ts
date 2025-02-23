import { LegacyClient } from "../schemas/LegacyClientSchema";
import type { ILegacyClient } from "../interfaces/ILegacyClient";
import { type Document, Types, type FilterQuery } from "mongoose";

interface LegacyClientDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  documentId: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  totalDebt: number;
  lastPayment?: {
    date: Date;
    amount: number;
  };
  paymentHistory: Array<{
    date: Date;
    amount: number;
    paymentId: Types.ObjectId;
  }>;
  status: "active" | "inactive";
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentHistoryEntry {
  date: Date;
  amount: number;
  paymentId: string;
}

interface PaymentHistoryDocument {
  date: Date | null;
  amount: number | null;
  paymentId: Types.ObjectId | null;
}

interface UpdateDebtOperation {
  $inc: { totalDebt: number };
  $set?: {
    lastPayment: {
      date: Date;
      amount: number;
    };
  };
  $push?: {
    paymentHistory: {
      date: Date;
      amount: number;
      paymentId: Types.ObjectId;
    };
  };
}

export class LegacyClientModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(clientData: Omit<ILegacyClient, "_id">): Promise<ILegacyClient> {
    const client = new LegacyClient(clientData);
    const savedClient = (await client.save()) as LegacyClientDocument;
    return this.convertToILegacyClient(savedClient);
  }

  async findById(id: string): Promise<ILegacyClient | null> {
    if (!this.isValidId(id)) return null;
    const client = (await LegacyClient.findById(
      id
    )) as LegacyClientDocument | null;
    return client ? this.convertToILegacyClient(client) : null;
  }

  async findByDocument(documentId: string): Promise<ILegacyClient | null> {
    const client = (await LegacyClient.findOne({
      documentId: documentId.replace(/\D/g, ""),
    })) as LegacyClientDocument | null;
    return client ? this.convertToILegacyClient(client) : null;
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: Partial<ILegacyClient> = {}
  ): Promise<{ clients: ILegacyClient[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as FilterQuery<LegacyClientDocument>);

    const [clients, total] = await Promise.all([
      LegacyClient.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 }) as Promise<LegacyClientDocument[]>,
      LegacyClient.countDocuments(query),
    ]);

    return {
      clients: clients.map((client) => this.convertToILegacyClient(client)),
      total,
    };
  }

  async update(
    id: string,
    clientData: Partial<ILegacyClient>
  ): Promise<ILegacyClient | null> {
    if (!this.isValidId(id)) return null;

    const client = (await LegacyClient.findByIdAndUpdate(
      id,
      { $set: clientData },
      { new: true, runValidators: true }
    )) as LegacyClientDocument | null;

    return client ? this.convertToILegacyClient(client) : null;
  }

  async updateDebt(
    id: string,
    amount: number,
    paymentId?: string
  ): Promise<ILegacyClient | null> {
    if (!this.isValidId(id)) return null;

    const updateData: UpdateDebtOperation = {
      $inc: { totalDebt: amount },
    };

    if (amount < 0 && paymentId) {
      // Se for um pagamento (redução da dívida)
      const paymentAmount = Math.abs(amount);
      updateData.$set = {
        lastPayment: {
          date: new Date(),
          amount: paymentAmount,
        },
      };
      updateData.$push = {
        paymentHistory: {
          date: new Date(),
          amount: paymentAmount,
          paymentId: new Types.ObjectId(paymentId),
        },
      };
    }

    const client = (await LegacyClient.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })) as LegacyClientDocument | null;

    return client ? this.convertToILegacyClient(client) : null;
  }

  async findDebtors(
    minDebt?: number,
    maxDebt?: number
  ): Promise<ILegacyClient[]> {
    const query: FilterQuery<LegacyClientDocument> = {
      totalDebt: { $gt: 0 },
      status: "active",
    };

    if (minDebt) query.totalDebt.$gte = minDebt;
    if (maxDebt) query.totalDebt.$lte = maxDebt;

    const clients = (await LegacyClient.find(query).sort({
      totalDebt: -1,
    })) as LegacyClientDocument[];

    return clients.map((client) => this.convertToILegacyClient(client));
  }

  async getPaymentHistory(
    id: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PaymentHistoryEntry[]> {
    if (!this.isValidId(id)) return [];

    const client = await LegacyClient.findById(id).lean();

    if (!client || !client.paymentHistory) return [];

    const history =
      client.paymentHistory as unknown as PaymentHistoryDocument[];

    const filteredHistory = history.filter(
      (payment): payment is PaymentHistoryDocument & { date: Date } => {
        if (!payment.date) return false;

        const paymentDate = new Date(payment.date);

        if (startDate && paymentDate < startDate) return false;
        if (endDate && paymentDate > endDate) return false;

        return true;
      }
    );

    return filteredHistory.map(
      (payment): PaymentHistoryEntry => ({
        date: new Date(payment.date), // Type guard garante que date existe
        amount: payment.amount || 0,
        paymentId: payment.paymentId?.toString() || "",
      })
    );
  }

  private convertToILegacyClient(doc: LegacyClientDocument): ILegacyClient {
    const client = doc.toObject();
    const paymentHistory = client.paymentHistory || [];

    return {
      ...client,
      _id: doc._id.toString(),
      paymentHistory: paymentHistory.map((payment: PaymentHistoryEntry) => ({
        date: new Date(payment.date || new Date()),
        amount: payment.amount || 0,
        paymentId: payment.paymentId?.toString() || "",
      })),
    };
  }
}
