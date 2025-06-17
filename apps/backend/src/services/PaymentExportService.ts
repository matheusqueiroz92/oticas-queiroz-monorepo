import { getRepositories } from "../repositories/RepositoryFactory";
import { ExportUtils, type ExportOptions } from "../utils/exportUtils";
import type { IPayment } from "../interfaces/IPayment";
import type { IPaymentRepository } from "../repositories/interfaces/IPaymentRepository";

interface FinancialReportData {
  date: string;
  totalSales: number;
  totalDebtPayments: number;
  totalExpenses: number;
  dailyBalance: number;
  totalByCreditCard: number;
  totalByDebitCard: number;
  totalByCash: number;
  totalByPix: number;
  payments: IPayment[];
}

export class PaymentExportService {
  private paymentRepository: IPaymentRepository;
  private exportUtils: ExportUtils;

  constructor() {
    const { paymentRepository } = getRepositories();
    this.paymentRepository = paymentRepository;
    this.exportUtils = new ExportUtils();
  }

  /**
   * Exporta pagamentos com filtros
   * @param options Opções de exportação
   * @param filters Filtros para busca
   * @returns Buffer do arquivo exportado
   */
  async exportPayments(
    options: ExportOptions,
    filters: Partial<IPayment> = {}
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    // Buscar todos os pagamentos que atendem aos filtros
    const { items: payments } = await this.paymentRepository.findAll(1, 10000, filters);

    // Gerar arquivo baseado no formato solicitado
    return await this.exportUtils.exportPayments(payments, options);
  }

  /**
   * Exporta relatório financeiro
   * @param reportData Dados do relatório
   * @param options Opções de exportação
   * @returns Buffer do arquivo exportado
   */
  async exportFinancialReport(
    reportData: FinancialReportData,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    return await this.exportUtils.exportFinancialReport(reportData, options);
  }

  /**
   * Exporta pagamentos por período
   * @param startDate Data de início
   * @param endDate Data de fim
   * @param options Opções de exportação
   * @returns Buffer do arquivo exportado
   */
  async exportPaymentsByPeriod(
    startDate: Date,
    endDate: Date,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    // Usar o método específico para buscar por período
    const payments = await this.paymentRepository.findByDateRange(startDate, endDate);

    return await this.exportUtils.exportPayments(payments, options);
  }

  /**
   * Exporta cheques por status
   * @param status Status dos cheques
   * @param options Opções de exportação
   * @returns Buffer do arquivo exportado
   */
  async exportChecksByStatus(
    status: "pending" | "compensated" | "rejected",
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const checks = await this.paymentRepository.findChecksByStatus(status);

    return await this.exportUtils.exportPayments(checks, options);
  }

  /**
   * Formata o tipo de pagamento para exibição
   * @param type Tipo do pagamento
   * @returns Tipo formatado
   */
  private formatPaymentType(type: string): string {
    const types: Record<string, string> = {
      sale: "Venda",
      debt_payment: "Pagamento de Débito",
      expense: "Despesa"
    };
    return types[type] || type;
  }

  /**
   * Formata o método de pagamento para exibição
   * @param method Método de pagamento
   * @returns Método formatado
   */
  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
      pix: "PIX",
      bank_slip: "Boleto",
      promissory_note: "Promissória",
      check: "Cheque",
      mercado_pago: "Mercado Pago"
    };
    return methods[method] || method;
  }

  /**
   * Formata o status do pagamento para exibição
   * @param status Status do pagamento
   * @returns Status formatado
   */
  private formatPaymentStatus(status: string): string {
    const statuses: Record<string, string> = {
      pending: "Pendente",
      completed: "Concluído",
      cancelled: "Cancelado"
    };
    return statuses[status] || status;
  }

  /**
   * Formata o status do cheque para exibição
   * @param status Status do cheque
   * @returns Status formatado
   */
  private formatCheckStatus(status: string): string {
    const statuses: Record<string, string> = {
      pending: "Pendente",
      compensated: "Compensado",
      rejected: "Rejeitado"
    };
    return statuses[status] || status;
  }

  /**
   * Agrupa pagamentos por dia
   * @param payments Lista de pagamentos
   * @returns Dados agrupados por dia
   */
  private groupPaymentsByDay(payments: IPayment[]): Array<{
    data: string;
    totalVendas: string;
    totalDebitos: string;
    totalDespesas: string;
    saldoDiario: string;
    quantidadePagamentos: number;
  }> {
    const dailyGroups = payments.reduce((groups, payment) => {
      const dateKey = new Date(payment.date).toLocaleDateString('pt-BR');
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          sales: 0,
          debts: 0,
          expenses: 0,
          count: 0
        };
      }

      switch (payment.type) {
        case "sale":
          groups[dateKey].sales += payment.amount;
          break;
        case "debt_payment":
          groups[dateKey].debts += payment.amount;
          break;
        case "expense":
          groups[dateKey].expenses += payment.amount;
          break;
      }
      
      groups[dateKey].count++;
      return groups;
    }, {} as Record<string, { sales: number; debts: number; expenses: number; count: number }>);

    return Object.entries(dailyGroups).map(([date, data]) => ({
      data: date,
      totalVendas: data.sales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      totalDebitos: data.debts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      totalDespesas: data.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      saldoDiario: (data.sales + data.debts - data.expenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      quantidadePagamentos: data.count
    }));
  }
} 