import { LegacyClientModel } from "../models/LegacyClientModel";
import type {
  ILegacyClient,
  CreateLegacyClientDTO,
} from "../interfaces/ILegacyClient";

export class LegacyClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LegacyClientError";
  }
}

export class LegacyClientService {
  private legacyClientModel: LegacyClientModel;

  constructor() {
    this.legacyClientModel = new LegacyClientModel();
  }

  private validateDocumentId(documentId: string): void {
    const cleanDocument = documentId.replace(/\D/g, "");

    // Valida CPF ou CNPJ
    if (cleanDocument.length !== 11 && cleanDocument.length !== 14) {
      throw new LegacyClientError("Documento inválido. Deve ser CPF ou CNPJ");
    }
  }

  private validateClient(clientData: CreateLegacyClientDTO): void {
    this.validateDocumentId(clientData.documentId);

    if (clientData.email && !clientData.email.includes("@")) {
      throw new LegacyClientError("Email inválido");
    }

    if (clientData.phone) {
      const cleanPhone = clientData.phone.replace(/\D/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        throw new LegacyClientError("Telefone inválido");
      }
    }

    if (clientData.totalDebt < 0) {
      throw new LegacyClientError("Valor da dívida não pode ser negativo");
    }
  }

  async createLegacyClient(
    clientData: CreateLegacyClientDTO
  ): Promise<ILegacyClient> {
    this.validateClient(clientData);

    const existingClient = await this.legacyClientModel.findByDocument(
      clientData.documentId
    );
    if (existingClient) {
      throw new LegacyClientError("Cliente já cadastrado com este documento");
    }

    const client = await this.legacyClientModel.create({
      ...clientData,
      status: clientData.status || "active",
      paymentHistory: [],
    });

    return client;
  }

  async getLegacyClientById(id: string): Promise<ILegacyClient> {
    const client = await this.legacyClientModel.findById(id);
    if (!client) {
      throw new LegacyClientError("Cliente não encontrado");
    }
    return client;
  }

  async findByDocument(documentId: string): Promise<ILegacyClient> {
    const client = await this.legacyClientModel.findByDocument(documentId);
    if (!client) {
      throw new LegacyClientError("Cliente não encontrado");
    }
    return client;
  }

  async getAllLegacyClients(
    page?: number,
    limit?: number,
    filters: Partial<ILegacyClient> = {}
  ): Promise<{ clients: ILegacyClient[]; total: number }> {
    const result = await this.legacyClientModel.findAll(page, limit, filters);
    if (!result.clients.length) {
      throw new LegacyClientError("Nenhum cliente encontrado");
    }
    return result;
  }

  async updateLegacyClient(
    id: string,
    clientData: Partial<CreateLegacyClientDTO>
  ): Promise<ILegacyClient> {
    if (clientData.documentId) {
      this.validateDocumentId(clientData.documentId);
      const existingClient = await this.legacyClientModel.findByDocument(
        clientData.documentId
      );
      if (existingClient && existingClient._id !== id) {
        throw new LegacyClientError("Já existe um cliente com este documento");
      }
    }

    if (clientData.email) {
      if (!clientData.email.includes("@")) {
        throw new LegacyClientError("Email inválido");
      }
    }

    const client = await this.legacyClientModel.update(id, clientData);
    if (!client) {
      throw new LegacyClientError("Cliente não encontrado");
    }

    return client;
  }

  async getDebtors(
    minDebt?: number,
    maxDebt?: number
  ): Promise<ILegacyClient[]> {
    return this.legacyClientModel.findDebtors(minDebt, maxDebt);
  }

  async getPaymentHistory(
    id: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ILegacyClient["paymentHistory"]> {
    const history = await this.legacyClientModel.getPaymentHistory(
      id,
      startDate,
      endDate
    );
    if (!history.length) {
      throw new LegacyClientError("Nenhum pagamento encontrado para o período");
    }
    return history;
  }

  async toggleClientStatus(id: string): Promise<ILegacyClient> {
    const client = await this.legacyClientModel.findById(id);
    if (!client) {
      throw new LegacyClientError("Cliente não encontrado");
    }

    if (client.totalDebt > 0 && client.status === "active") {
      throw new LegacyClientError(
        "Não é possível inativar cliente com dívidas pendentes"
      );
    }

    const updatedClient = await this.legacyClientModel.update(id, {
      status: client.status === "active" ? "inactive" : "active",
    });

    if (!updatedClient) {
      throw new LegacyClientError("Erro ao atualizar status do cliente");
    }

    return updatedClient;
  }
}
