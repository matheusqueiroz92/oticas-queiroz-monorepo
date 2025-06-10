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

  private validateDocumentId(cpf?: string): void {
    if (!cpf) return; // CPF é opcional agora
    
    const cleanDocument = cpf.replace(/\D/g, "");

    // Valida CPF ou CNPJ
    if (cleanDocument.length !== 11 && cleanDocument.length !== 14) {
      throw new LegacyClientError("Documento inválido. Deve ser CPF ou CNPJ");
    }
  }

  private validateClient(clientData: CreateLegacyClientDTO): void {
    this.validateDocumentId(clientData.cpf);

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

    // Verificar documento apenas se CPF foi fornecido
    if (clientData.cpf) {
      const existingClient = await this.legacyClientModel.findByDocument(
        clientData.cpf
      );
      if (existingClient) {
        throw new LegacyClientError("Cliente já cadastrado com este documento");
      }
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

  async findByDocument(cpf: string): Promise<ILegacyClient> {
    const client = await this.legacyClientModel.findByDocument(cpf);
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
    if (clientData.cpf) {
      this.validateDocumentId(clientData.cpf);
      const existingClient = await this.legacyClientModel.findByDocument(
        clientData.cpf
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
  
    // MODIFICAÇÃO: Remover a verificação que impede inativação de clientes com dívidas
    // Apenas exibir um aviso, mas permitir a inativação
    if (client.totalDebt > 0 && client.status === "active") {
      console.warn(`Cliente ${id} possui dívidas pendentes (${client.totalDebt}) mas será inativado mesmo assim.`);
      // Não lançamos mais o erro que impedia a inativação
    }
  
    const updatedClient = await this.legacyClientModel.update(id, {
      status: client.status === "active" ? "inactive" : "active",
    });
  
    if (!updatedClient) {
      throw new LegacyClientError("Erro ao atualizar status do cliente");
    }
  
    return updatedClient;
  }

  async recalculateClientDebts(clientId?: string): Promise<{
    updated: number;
    clients: Array<{ id: string; oldDebt: number; newDebt: number; diff: number }>;
  }> {
    try {
      const result = {
        updated: 0,
        clients: [] as Array<{ id: string; oldDebt: number; newDebt: number; diff: number }>
      };
  
      // Se um clientId foi fornecido, recalcular apenas para esse cliente
      if (clientId) {
        const client = await this.legacyClientModel.findById(clientId);
        if (!client) {
          throw new LegacyClientError("Cliente não encontrado");
        }
  
        const oldDebt = client.totalDebt || 0;
        
        // Calcular o débito real com base no histórico de pagamentos
        let newDebt = 0;
        if (client.paymentHistory && client.paymentHistory.length > 0) {
          // Implementar lógica para calcular o débito real
          // Aqui precisamos da lógica específica para clientes legados
          // que pode depender da estrutura do sistema
          
          // Por enquanto, apenas usamos o valor existente
          newDebt = oldDebt;
        }
        
        // Se houver diferença, atualizar o débito do cliente
        if (newDebt !== oldDebt) {
          await this.legacyClientModel.update(clientId, {
            totalDebt: newDebt
          });
          
          result.updated = 1;
          result.clients.push({
            id: clientId,
            oldDebt,
            newDebt,
            diff: newDebt - oldDebt
          });
        }
        
        return result;
      }
      
      // Caso contrário, buscar todos os clientes
      const allClients = await this.legacyClientModel.findAll();
      
      // Para cada cliente, recalcular o débito total
      for (const client of allClients.clients) {
        const oldDebt = client.totalDebt || 0;
        
        // Calcular o débito real com base no histórico de pagamentos
        // Usamos a mesma lógica do caso individual
        let newDebt = oldDebt;
        
        // Se houver diferença, atualizar o débito do cliente
        if (newDebt !== oldDebt && client._id) {
          await this.legacyClientModel.update(client._id, {
            totalDebt: newDebt
          });
          
          result.updated++;
          result.clients.push({
            id: client._id,
            oldDebt,
            newDebt,
            diff: newDebt - oldDebt
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error("Erro ao recalcular débitos de clientes legados:", error);
      throw error;
    }
  }
}
