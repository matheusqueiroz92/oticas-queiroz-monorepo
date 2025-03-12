import Excel from "exceljs";
import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import type { IPayment } from "../interfaces/IPayment";
import type { ICashRegister } from "src/interfaces/ICashRegister";

export interface ExportOptions {
  format: "excel" | "pdf" | "csv" | "json";
  filename?: string;
  title?: string;
}

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

interface RegisterSummary {
  register: ICashRegister;
  payments: {
    sales: {
      total: number;
      byMethod: Record<string, number>;
    };
    debts: {
      received: number;
      byMethod: Record<string, number>;
    };
    expenses: {
      total: number;
      byCategory: Record<string, number>;
    };
  };
}

export class ExportUtils {
  /**
   * Exporta pagamentos para diferentes formatos
   * @param payments Lista de pagamentos
   * @param options Opções de exportação
   * @returns Buffer com o conteúdo exportado
   */
  async exportPayments(
    payments: IPayment[],
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const filename = options.filename || `payments-export-${Date.now()}`;

    switch (options.format) {
      case "excel":
        return this.generateExcel(payments, filename, options.title);
      case "pdf":
        return this.generatePDF(payments, filename, options.title);
      case "csv":
        return this.generateCSV(payments, filename);
      default:
        return this.generateJSON(payments, filename);
    }
  }

  async exportFinancialReport(
    reportData: FinancialReportData,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const { format, filename, title } = options;
    const actualFilename = filename || `financial-report-${Date.now()}`;

    switch (format) {
      case "excel":
        return this.generateFinancialReportExcel(
          reportData,
          actualFilename,
          title
        );
      case "pdf":
        return this.generateFinancialReportPDF(
          reportData,
          actualFilename,
          title
        );
      case "csv":
        return this.generateFinancialReportCSV(reportData, actualFilename);
      default: {
        const buffer = Buffer.from(JSON.stringify(reportData, null, 2));
        return {
          buffer,
          contentType: "application/json",
          filename: `${actualFilename}.json`,
        };
      }
    }
  }

  async exportCashRegisterSummary(
    summary: RegisterSummary,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const {
      format,
      title = "Resumo de Caixa",
      filename = `caixa-${summary.register._id}`,
    } = options;

    switch (format) {
      case "excel":
        return this.generateCashRegisterExcel(summary, filename, title);
      case "pdf":
        return this.generateCashRegisterPDF(summary, filename, title);
      case "csv":
        return this.generateCashRegisterCSV(summary, filename);
      default: {
        const buffer = Buffer.from(JSON.stringify(summary, null, 2));
        return {
          buffer,
          contentType: "application/json",
          filename: `${filename}.json`,
        };
      }
    }
  }

  async exportDailySummary(
    summary: {
      openingBalance: number;
      currentBalance: number;
      totalSales: number;
      totalPaymentsReceived: number;
      totalExpenses: number;
      salesByMethod: Record<string, number>;
      expensesByCategory: Record<string, number>;
    },
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const {
      format,
      title = "Resumo Diário",
      filename = `resumo-diario-${new Date().toISOString().split("T")[0]}`,
    } = options;

    switch (format) {
      case "excel":
        return this.generateDailySummaryExcel(summary, filename, title);
      case "pdf":
        return this.generateDailySummaryPDF(summary, filename, title);
      case "csv":
        return this.generateDailySummaryCSV(summary, filename);
      default: {
        const buffer = Buffer.from(JSON.stringify(summary, null, 2));
        return {
          buffer,
          contentType: "application/json",
          filename: `${filename}.json`,
        };
      }
    }
  }

  private translatePaymentType(type: IPayment["type"]): string {
    const types: Record<IPayment["type"], string> = {
      sale: "Venda",
      debt_payment: "Pagamento de Dívida",
      expense: "Despesa",
    };
    return types[type] || type;
  }

  private translatePaymentMethod(method: IPayment["paymentMethod"]): string {
    const methods: Record<IPayment["paymentMethod"], string> = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
      pix: "PIX",
      installment: "Parcelado",
    };
    return methods[method] || method;
  }

  private translatePaymentStatus(status: IPayment["status"]): string {
    const statuses: Record<IPayment["status"], string> = {
      pending: "Pendente",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return statuses[status] || status;
  }

  private async generateFinancialReportExcel(
    reportData: FinancialReportData,
    filename: string,
    title?: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Relatório Financeiro");

    // Título do relatório
    const reportTitle = title || `Relatório Financeiro - ${reportData.date}`;
    worksheet.addRow([reportTitle]);
    worksheet.mergeCells("A1:F1");
    const titleCell = worksheet.getCell("A1");
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center" };
    worksheet.addRow([]);

    // Resumo financeiro
    worksheet.addRow(["Data", reportData.date]);
    worksheet.addRow([
      "Total de Vendas",
      `R$ ${reportData.totalSales.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Total de Recebimentos de Dívidas",
      `R$ ${reportData.totalDebtPayments.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Total de Despesas",
      `R$ ${reportData.totalExpenses.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Saldo do Dia",
      `R$ ${reportData.dailyBalance.toFixed(2)}`,
    ]);
    worksheet.addRow([]);

    // Totais por método de pagamento
    worksheet.addRow(["Totais por Método de Pagamento"]);
    worksheet.addRow([
      "Cartão de Crédito",
      `R$ ${reportData.totalByCreditCard.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Cartão de Débito",
      `R$ ${reportData.totalByDebitCard.toFixed(2)}`,
    ]);
    worksheet.addRow(["Dinheiro", `R$ ${reportData.totalByCash.toFixed(2)}`]);
    worksheet.addRow(["PIX", `R$ ${reportData.totalByPix.toFixed(2)}`]);
    worksheet.addRow([]);

    // Lista de pagamentos
    worksheet.addRow(["Lista de Pagamentos"]);
    worksheet.addRow(["ID", "Data/Hora", "Tipo", "Método", "Valor", "Status"]);

    // Formatação do cabeçalho
    const headerRow = worksheet.lastRow;
    headerRow?.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCCCCC" },
      };
    });

    // Adicionar dados dos pagamentos
    for (let i = 0; i < reportData.payments.length; i++) {
      const payment = reportData.payments[i];
      const paymentDate = new Date(payment.date).toLocaleString();
      const type = this.translatePaymentType(payment.type);
      const method = this.translatePaymentMethod(payment.paymentMethod);
      const status = this.translatePaymentStatus(payment.status);

      worksheet.addRow([
        payment._id,
        paymentDate,
        type,
        method,
        payment.amount,
        status,
      ]);
    }

    // Formatar colunas de valores
    const amountColumn = worksheet.getColumn(5);
    amountColumn.numFmt = "R$ #,##0.00";

    // Ajustar largura das colunas
    for (let i = 0; i < worksheet.columns.length; i++) {
      const column = worksheet.columns[i];
      column.width = 20;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: buffer as Buffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${filename}.xlsx`,
    };
  }

  private async generateFinancialReportPDF(
    reportData: FinancialReportData,
    filename: string,
    title?: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            contentType: "application/pdf",
            filename: `${filename}.pdf`,
          });
        });

        // Título
        const reportTitle =
          title || `Relatório Financeiro - ${reportData.date}`;
        doc.fontSize(20).text(reportTitle, { align: "center" });
        doc.moveDown();

        // Data de geração
        doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString()}`, {
          align: "right",
        });
        doc.moveDown(2);

        // Resumo financeiro
        doc.fontSize(16).text("Resumo Financeiro", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Data: ${reportData.date}`);
        doc.text(`Total de Vendas: R$ ${reportData.totalSales.toFixed(2)}`);
        doc.text(
          `Total de Recebimentos de Dívidas: R$ ${reportData.totalDebtPayments.toFixed(2)}`
        );
        doc.text(
          `Total de Despesas: R$ ${reportData.totalExpenses.toFixed(2)}`
        );
        doc.text(`Saldo do Dia: R$ ${reportData.dailyBalance.toFixed(2)}`);
        doc.moveDown(2);

        // Totais por método de pagamento
        doc
          .fontSize(16)
          .text("Totais por Método de Pagamento", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(
          `Cartão de Crédito: R$ ${reportData.totalByCreditCard.toFixed(2)}`
        );
        doc.text(
          `Cartão de Débito: R$ ${reportData.totalByDebitCard.toFixed(2)}`
        );
        doc.text(`Dinheiro: R$ ${reportData.totalByCash.toFixed(2)}`);
        doc.text(`PIX: R$ ${reportData.totalByPix.toFixed(2)}`);
        doc.moveDown(2);

        // Lista de pagamentos
        doc.fontSize(16).text("Lista de Pagamentos", { underline: true });
        doc.moveDown();

        // Cabeçalhos da tabela
        const tableTop = doc.y;
        const tableHeaders = ["Data/Hora", "Tipo", "Método", "Valor", "Status"];
        const columnWidth = 100;

        // Desenhar linha de cabeçalho
        doc.fontSize(12).font("Helvetica-Bold");
        tableHeaders.forEach((header, i) => {
          doc.text(header, 50 + i * columnWidth, tableTop, {
            width: columnWidth,
            align: "left",
          });
        });

        // Linha separadora
        doc
          .moveTo(50, tableTop + 20)
          .lineTo(50 + tableHeaders.length * columnWidth, tableTop + 20)
          .stroke();

        // Dados
        doc.font("Helvetica");
        let y = tableTop + 30;

        // Mostrar apenas os primeiros 25 pagamentos para não sobrecarregar o PDF
        const paymentsToShow = reportData.payments.slice(0, 25);

        for (let i = 0; paymentsToShow.length; i++) {
          const payment = paymentsToShow[i];
          const formattedDate = new Date(payment.date).toLocaleString();
          const type = this.translatePaymentType(payment.type);
          const method = this.translatePaymentMethod(payment.paymentMethod);
          const formattedAmount = `R$ ${payment.amount.toFixed(2)}`;
          const status = this.translatePaymentStatus(payment.status);

          doc.text(formattedDate, 50, y, { width: columnWidth, align: "left" });
          doc.text(type, 50 + columnWidth, y, {
            width: columnWidth,
            align: "left",
          });
          doc.text(method, 50 + columnWidth * 2, y, {
            width: columnWidth,
            align: "left",
          });
          doc.text(formattedAmount, 50 + columnWidth * 3, y, {
            width: columnWidth,
            align: "left",
          });
          doc.text(status, 50 + columnWidth * 4, y, {
            width: columnWidth,
            align: "left",
          });

          y += 20;

          // Adicionar nova página se necessário
          if (y > doc.page.height - 50) {
            doc.addPage();
            y = 50;
          }
        }

        // Nota sobre limitação
        if (reportData.payments.length > 25) {
          doc.moveDown();
          doc.text(
            `Nota: Mostrando apenas os primeiros 25 de ${reportData.payments.length} pagamentos.`
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generateFinancialReportCSV(
    reportData: FinancialReportData,
    filename: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    // Criar CSV com resumo
    let csv = `"Relatório Financeiro - ${reportData.date}"\n\n`;

    csv += '"Resumo Financeiro"\n';
    csv += `"Data","${reportData.date}"\n`;
    csv += `"Total de Vendas","R$ ${reportData.totalSales.toFixed(2)}"\n`;
    csv += `"Total de Recebimentos de Dívidas","R$ ${reportData.totalDebtPayments.toFixed(2)}"\n`;
    csv += `"Total de Despesas","R$ ${reportData.totalExpenses.toFixed(2)}"\n`;
    csv += `"Saldo do Dia","R$ ${reportData.dailyBalance.toFixed(2)}"\n\n`;

    csv += '"Totais por Método de Pagamento"\n';
    csv += `"Cartão de Crédito","R$ ${reportData.totalByCreditCard.toFixed(2)}"\n`;
    csv += `"Cartão de Débito","R$ ${reportData.totalByDebitCard.toFixed(2)}"\n`;
    csv += `"Dinheiro","R$ ${reportData.totalByCash.toFixed(2)}"\n`;
    csv += `"PIX","R$ ${reportData.totalByPix.toFixed(2)}"\n\n`;

    csv += '"Lista de Pagamentos"\n';
    csv += '"ID","Data/Hora","Tipo","Método","Valor","Status"\n';

    // Adicionar dados dos pagamentos
    for (let i = 0; i < reportData.payments.length; i++) {
      const payment = reportData.payments[i];
      const formattedDate = new Date(payment.date).toLocaleString();
      const type = this.translatePaymentType(payment.type);
      const method = this.translatePaymentMethod(payment.paymentMethod);
      const formattedAmount = `R$ ${payment.amount.toFixed(2)}`;
      const status = this.translatePaymentStatus(payment.status);

      csv += `"${payment._id}","${formattedDate}","${type}","${method}","${formattedAmount}","${status}"\n`;
    }

    const buffer = Buffer.from(csv);

    return {
      buffer,
      contentType: "text/csv",
      filename: `${filename}.csv`,
    };
  }

  private async generateCashRegisterExcel(
    summary: RegisterSummary,
    filename: string,
    title: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Resumo de Caixa");

    // Título
    worksheet.addRow([title]);
    worksheet.mergeCells("A1:E1");
    const titleCell = worksheet.getCell("A1");
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center" };
    worksheet.addRow([]);

    // Informações do caixa
    worksheet.addRow(["ID", summary.register._id]);
    worksheet.addRow([
      "Data de Abertura",
      new Date(summary.register.openingDate).toLocaleString(),
    ]);

    if (summary.register.closingDate) {
      worksheet.addRow([
        "Data de Fechamento",
        new Date(summary.register.closingDate).toLocaleString(),
      ]);
    }

    worksheet.addRow([
      "Status",
      summary.register.status === "open" ? "Aberto" : "Fechado",
    ]);
    worksheet.addRow([
      "Saldo Inicial",
      `R$ ${summary.register.openingBalance.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Saldo Atual",
      `R$ ${summary.register.currentBalance.toFixed(2)}`,
    ]);

    if (summary.register.closingBalance) {
      worksheet.addRow([
        "Saldo Final",
        `R$ ${summary.register.closingBalance.toFixed(2)}`,
      ]);

      const difference =
        summary.register.closingBalance - summary.register.currentBalance;
      worksheet.addRow(["Diferença de Caixa", `R$ ${difference.toFixed(2)}`]);
    }

    worksheet.addRow([]);

    // Resumo de vendas
    worksheet.addRow(["Resumo de Vendas"]);
    worksheet.mergeCells("A10:E10");
    worksheet.getCell("A10").font = { size: 14, bold: true };

    worksheet.addRow(["Método", "Valor"]);
    worksheet.addRow([
      "Dinheiro",
      `R$ ${summary.register.sales.cash.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Cartão de Crédito",
      `R$ ${summary.register.sales.credit.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Cartão de Débito",
      `R$ ${summary.register.sales.debit.toFixed(2)}`,
    ]);
    worksheet.addRow(["PIX", `R$ ${summary.register.sales.pix.toFixed(2)}`]);
    worksheet.addRow([
      "Total",
      `R$ ${summary.register.sales.total.toFixed(2)}`,
    ]);

    worksheet.addRow([]);

    // Resumo de pagamentos
    worksheet.addRow(["Resumo de Pagamentos"]);
    worksheet.mergeCells("A18:E18");
    worksheet.getCell("A18").font = { size: 14, bold: true };

    worksheet.addRow(["Tipo", "Valor"]);
    worksheet.addRow([
      "Recebimentos de Dívidas",
      `R$ ${summary.register.payments.received.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Despesas",
      `R$ ${summary.register.payments.made.toFixed(2)}`,
    ]);

    worksheet.addRow([]);

    // Formatação
    for (
      let i = 0;
      i < ["B12", "B13", "B14", "B15", "B16", "B20", "B21"].length;
      i++
    ) {
      const cell = ["B12", "B13", "B14", "B15", "B16", "B20", "B21"][i];
      worksheet.getCell(cell).numFmt = "R$ #,##0.00";
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: buffer as Buffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${filename}.xlsx`,
    };
  }

  private async generateCashRegisterPDF(
    summary: RegisterSummary,
    filename: string,
    title: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            contentType: "application/pdf",
            filename: `${filename}.pdf`,
          });
        });

        // Título do relatório
        doc.fontSize(20).text(title, { align: "center" });
        doc.moveDown();

        // Data de geração
        doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString()}`, {
          align: "right",
        });
        doc.moveDown(2);

        // Informações do caixa
        doc.fontSize(16).text("Informações do Caixa", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`ID: ${summary.register._id}`);
        doc.text(
          `Data de Abertura: ${new Date(summary.register.openingDate).toLocaleString()}`
        );

        if (summary.register.closingDate) {
          doc.text(
            `Data de Fechamento: ${new Date(summary.register.closingDate).toLocaleString()}`
          );
        }

        doc.text(
          `Status: ${summary.register.status === "open" ? "Aberto" : "Fechado"}`
        );
        doc.text(
          `Saldo Inicial: R$ ${summary.register.openingBalance.toFixed(2)}`
        );
        doc.text(
          `Saldo Atual: R$ ${summary.register.currentBalance.toFixed(2)}`
        );

        if (summary.register.closingBalance) {
          doc.text(
            `Saldo Final: R$ ${summary.register.closingBalance.toFixed(2)}`
          );

          const difference =
            summary.register.closingBalance - summary.register.currentBalance;
          doc.text(`Diferença de Caixa: R$ ${difference.toFixed(2)}`);
        }

        doc.moveDown(2);

        // Resumo de vendas
        doc.fontSize(16).text("Resumo de Vendas", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Dinheiro: R$ ${summary.register.sales.cash.toFixed(2)}`);
        doc.text(
          `Cartão de Crédito: R$ ${summary.register.sales.credit.toFixed(2)}`
        );
        doc.text(
          `Cartão de Débito: R$ ${summary.register.sales.debit.toFixed(2)}`
        );
        doc.text(`PIX: R$ ${summary.register.sales.pix.toFixed(2)}`);
        doc.text(`Total: R$ ${summary.register.sales.total.toFixed(2)}`);

        doc.moveDown(2);

        // Resumo de pagamentos
        doc.fontSize(16).text("Resumo de Pagamentos", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(
          `Recebimentos de Dívidas: R$ ${summary.register.payments.received.toFixed(2)}`
        );
        doc.text(`Despesas: R$ ${summary.register.payments.made.toFixed(2)}`);

        // Finalizar o documento
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generateCashRegisterCSV(
    summary: RegisterSummary,
    filename: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    let csv = `"${filename}"\n\n`;

    csv += `"Informações do Caixa"\n`;
    csv += `"ID","${summary.register._id}"\n`;
    csv += `"Data de Abertura","${new Date(summary.register.openingDate).toLocaleString()}"\n`;

    if (summary.register.closingDate) {
      csv += `"Data de Fechamento","${new Date(summary.register.closingDate).toLocaleString()}"\n`;
    }

    csv += `"Status","${summary.register.status === "open" ? "Aberto" : "Fechado"}"\n`;
    csv += `"Saldo Inicial","R$ ${summary.register.openingBalance.toFixed(2)}"\n`;
    csv += `"Saldo Atual","R$ ${summary.register.currentBalance.toFixed(2)}"\n`;

    if (summary.register.closingBalance) {
      csv += `"Saldo Final","R$ ${summary.register.closingBalance.toFixed(2)}"\n`;

      const difference =
        summary.register.closingBalance - summary.register.currentBalance;
      csv += `"Diferença de Caixa","R$ ${difference.toFixed(2)}"\n`;
    }

    csv += "\n";

    // Resumo de vendas
    csv += `"Resumo de Vendas"\n`;
    csv += `"Método","Valor"\n`;
    csv += `"Dinheiro","R$ ${summary.register.sales.cash.toFixed(2)}"\n`;
    csv += `"Cartão de Crédito","R$ ${summary.register.sales.credit.toFixed(2)}"\n`;
    csv += `"Cartão de Débito","R$ ${summary.register.sales.debit.toFixed(2)}"\n`;
    csv += `"PIX","R$ ${summary.register.sales.pix.toFixed(2)}"\n`;
    csv += `"Total","R$ ${summary.register.sales.total.toFixed(2)}"\n`;

    csv += "\n";

    // Resumo de pagamentos
    csv += `"Resumo de Pagamentos"\n`;
    csv += `"Tipo","Valor"\n`;
    csv += `"Recebimentos de Dívidas","R$ ${summary.register.payments.received.toFixed(2)}"\n`;
    csv += `"Despesas","R$ ${summary.register.payments.made.toFixed(2)}"\n`;

    return {
      buffer: Buffer.from(csv),
      contentType: "text/csv",
      filename: `${filename}.csv`,
    };
  }

  private async generateDailySummaryExcel(
    summary: {
      openingBalance: number;
      currentBalance: number;
      totalSales: number;
      totalPaymentsReceived: number;
      totalExpenses: number;
      salesByMethod: Record<string, number>;
      expensesByCategory: Record<string, number>;
    },
    filename: string,
    title: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Resumo Diário");

    // Título
    worksheet.addRow([title]);
    worksheet.mergeCells("A1:E1");
    const titleCell = worksheet.getCell("A1");
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center" };
    worksheet.addRow([]);

    // Data de geração
    worksheet.addRow(["Data de Geração", new Date().toLocaleString()]);
    worksheet.addRow([]);

    // Informações financeiras
    worksheet.addRow(["Resumo Financeiro"]);
    worksheet.mergeCells("A5:E5");
    worksheet.getCell("A5").font = { size: 14, bold: true };

    worksheet.addRow([
      "Saldo Inicial",
      `R$ ${summary.openingBalance.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Saldo Final",
      `R$ ${summary.currentBalance.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Total de Vendas",
      `R$ ${summary.totalSales.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Total de Recebimentos",
      `R$ ${summary.totalPaymentsReceived.toFixed(2)}`,
    ]);
    worksheet.addRow([
      "Total de Despesas",
      `R$ ${summary.totalExpenses.toFixed(2)}`,
    ]);

    worksheet.addRow([]);

    // Vendas por método
    worksheet.addRow(["Vendas por Método de Pagamento"]);
    worksheet.mergeCells("A12:E12");
    worksheet.getCell("A12").font = { size: 14, bold: true };

    worksheet.addRow(["Método", "Valor"]);

    for (const [method, value] of Object.entries(summary.salesByMethod)) {
      // Traduzir os métodos de pagamento
      let methodName = method;
      if (method === "cash") methodName = "Dinheiro";
      if (method === "credit") methodName = "Cartão de Crédito";
      if (method === "debit") methodName = "Cartão de Débito";
      if (method === "pix") methodName = "PIX";

      worksheet.addRow([methodName, `R$ ${value.toFixed(2)}`]);
    }

    worksheet.addRow([]);

    // Despesas por categoria
    worksheet.addRow(["Despesas por Categoria"]);
    worksheet.mergeCells("A18:E18");
    worksheet.getCell("A18").font = { size: 14, bold: true };

    worksheet.addRow(["Categoria", "Valor"]);

    if (Object.keys(summary.expensesByCategory).length > 0) {
      for (const [category, value] of Object.entries(
        summary.expensesByCategory
      )) {
        worksheet.addRow([category, `R$ ${value.toFixed(2)}`]);
      }
    } else {
      worksheet.addRow(["Sem despesas categorizadas", "R$ 0.00"]);
    }

    // Formatação
    for (let i = 0; i < ["B6", "B7", "B8", "B9", "B10"].length; i++) {
      const cell = ["B6", "B7", "B8", "B9", "B10"][i];
      worksheet.getCell(cell).numFmt = "R$ #,##0.00";
    }

    // Coluna B nas vendas por método
    for (let i = 0; i < Object.keys(summary.salesByMethod).length; i++) {
      worksheet.getCell(`B${14 + i}`).numFmt = "R$ #,##0.00";
    }

    // Coluna B nas despesas por categoria
    for (
      let i = 0;
      i < Math.max(1, Object.keys(summary.expensesByCategory).length);
      i++
    ) {
      worksheet.getCell(`B${20 + i}`).numFmt = "R$ #,##0.00";
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: buffer as Buffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${filename}.xlsx`,
    };
  }

  private async generateDailySummaryPDF(
    summary: {
      openingBalance: number;
      currentBalance: number;
      totalSales: number;
      totalPaymentsReceived: number;
      totalExpenses: number;
      salesByMethod: Record<string, number>;
      expensesByCategory: Record<string, number>;
    },
    filename: string,
    title: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            contentType: "application/pdf",
            filename: `${filename}.pdf`,
          });
        });

        // Título do relatório
        doc.fontSize(20).text(title, { align: "center" });
        doc.moveDown();

        // Data de geração
        doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString()}`, {
          align: "right",
        });
        doc.moveDown(2);

        // Resumo financeiro
        doc.fontSize(16).text("Resumo Financeiro", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Saldo Inicial: R$ ${summary.openingBalance.toFixed(2)}`);
        doc.text(`Saldo Final: R$ ${summary.currentBalance.toFixed(2)}`);
        doc.text(`Total de Vendas: R$ ${summary.totalSales.toFixed(2)}`);
        doc.text(
          `Total de Recebimentos: R$ ${summary.totalPaymentsReceived.toFixed(2)}`
        );
        doc.text(`Total de Despesas: R$ ${summary.totalExpenses.toFixed(2)}`);

        doc.moveDown(2);

        // Vendas por método
        doc
          .fontSize(16)
          .text("Vendas por Método de Pagamento", { underline: true });
        doc.moveDown();

        for (const [method, value] of Object.entries(summary.salesByMethod)) {
          // Traduzir os métodos de pagamento
          let methodName = method;
          if (method === "cash") methodName = "Dinheiro";
          if (method === "credit") methodName = "Cartão de Crédito";
          if (method === "debit") methodName = "Cartão de Débito";
          if (method === "pix") methodName = "PIX";

          doc.text(`${methodName}: R$ ${value.toFixed(2)}`);
        }

        doc.moveDown(2);

        // Despesas por categoria
        doc.fontSize(16).text("Despesas por Categoria", { underline: true });
        doc.moveDown();

        if (Object.keys(summary.expensesByCategory).length > 0) {
          for (const [category, value] of Object.entries(
            summary.expensesByCategory
          )) {
            doc.text(`${category}: R$ ${value.toFixed(2)}`);
          }
        } else {
          doc.text("Sem despesas categorizadas: R$ 0.00");
        }

        // Finalizar o documento
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generateDailySummaryCSV(
    summary: {
      openingBalance: number;
      currentBalance: number;
      totalSales: number;
      totalPaymentsReceived: number;
      totalExpenses: number;
      salesByMethod: Record<string, number>;
      expensesByCategory: Record<string, number>;
    },
    filename: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    let csv = `"Resumo Diário - ${new Date().toLocaleDateString()}"\n\n`;

    // Resumo financeiro
    csv += `"Resumo Financeiro"\n`;
    csv += `"Saldo Inicial","R$ ${summary.openingBalance.toFixed(2)}"\n`;
    csv += `"Saldo Final","R$ ${summary.currentBalance.toFixed(2)}"\n`;
    csv += `"Total de Vendas","R$ ${summary.totalSales.toFixed(2)}"\n`;
    csv += `"Total de Recebimentos","R$ ${summary.totalPaymentsReceived.toFixed(2)}"\n`;
    csv += `"Total de Despesas","R$ ${summary.totalExpenses.toFixed(2)}"\n\n`;

    // Vendas por método
    csv += `"Vendas por Método de Pagamento"\n`;
    csv += `"Método","Valor"\n`;

    for (const [method, value] of Object.entries(summary.salesByMethod)) {
      // Traduzir os métodos de pagamento
      let methodName = method;
      if (method === "cash") methodName = "Dinheiro";
      if (method === "credit") methodName = "Cartão de Crédito";
      if (method === "debit") methodName = "Cartão de Débito";
      if (method === "pix") methodName = "PIX";

      csv += `"${methodName}","R$ ${value.toFixed(2)}"\n`;
    }

    csv += "\n";

    // Despesas por categoria
    csv += `"Despesas por Categoria"\n`;
    csv += `"Categoria","Valor"\n`;

    if (Object.keys(summary.expensesByCategory).length > 0) {
      for (const [category, value] of Object.entries(
        summary.expensesByCategory
      )) {
        csv += `"${category}","R$ ${value.toFixed(2)}"\n`;
      }
    } else {
      csv += `"Sem despesas categorizadas","R$ 0.00"\n`;
    }

    return {
      buffer: Buffer.from(csv),
      contentType: "text/csv",
      filename: `${filename}.csv`,
    };
  }

  private async generateExcel(
    payments: IPayment[],
    filename: string,
    title?: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Pagamentos");

    // Adicionar título se fornecido
    if (title) {
      worksheet.addRow([title]);
      worksheet.mergeCells("A1:H1");
      const titleCell = worksheet.getCell("A1");
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: "center" };
      worksheet.addRow([]);
    }

    // Definir cabeçalhos
    worksheet.columns = [
      { header: "ID", key: "_id", width: 28 },
      { header: "Data", key: "date", width: 20 },
      { header: "Valor", key: "amount", width: 15 },
      { header: "Tipo", key: "type", width: 15 },
      { header: "Método", key: "paymentMethod", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Descrição", key: "description", width: 30 },
      { header: "Cliente", key: "client", width: 30 },
    ];

    // Formatação dos cabeçalhos
    worksheet.getRow(title ? 3 : 1).font = { bold: true };

    // Adicionar dados
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      const row = {
        _id: payment._id,
        date: new Date(payment.date).toLocaleString(),
        amount: payment.amount.toFixed(2),
        type: this.translatePaymentType(payment.type),
        paymentMethod: this.translatePaymentMethod(payment.paymentMethod),
        status: this.translatePaymentStatus(payment.status),
        description: payment.description || "",
        client: payment.customerId || payment.legacyClientId || "-",
      };
      worksheet.addRow(row);
    }

    // Formatação de células com valores monetários
    const amountColumn = worksheet.getColumn("amount");
    amountColumn.numFmt = "R$ #,##0.00";

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: buffer as Buffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${filename}.xlsx`,
    };
  }

  private async generatePDF(
    payments: IPayment[],
    filename: string,
    title?: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            contentType: "application/pdf",
            filename: `${filename}.pdf`,
          });
        });

        // Título
        const reportTitle = title || "Relatório de Pagamentos";
        doc.fontSize(20).text(reportTitle, { align: "center" });
        doc.moveDown();

        // Data de geração
        doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString()}`, {
          align: "right",
        });
        doc.moveDown(2);

        // Cabeçalhos da tabela
        const tableTop = 150;
        const tableHeaders = ["Data", "Valor", "Tipo", "Método", "Status"];
        const columnWidth = 100;

        // Desenhar linha de cabeçalho
        doc.fontSize(12).font("Helvetica-Bold");
        tableHeaders.forEach((header, i) => {
          doc.text(header, 50 + i * columnWidth, tableTop, {
            width: columnWidth,
            align: "left",
          });
        });

        // Linha separadora
        doc
          .moveTo(50, tableTop + 20)
          .lineTo(50 + tableHeaders.length * columnWidth, tableTop + 20)
          .stroke();

        // Dados
        doc.font("Helvetica");
        let y = tableTop + 30;

        for (let i = 0; i < payments.length; i++) {
          const payment = payments[i];
          const formattedDate = new Date(payment.date).toLocaleDateString();
          const formattedAmount = `R$ ${payment.amount.toFixed(2)}`;
          const type = this.translatePaymentType(payment.type);
          const method = this.translatePaymentMethod(payment.paymentMethod);
          const status = this.translatePaymentStatus(payment.status);

          doc.text(formattedDate, 50, y, { width: columnWidth, align: "left" });
          doc.text(formattedAmount, 50 + columnWidth, y, {
            width: columnWidth,
            align: "left",
          });
          doc.text(type, 50 + columnWidth * 2, y, {
            width: columnWidth,
            align: "left",
          });
          doc.text(method, 50 + columnWidth * 3, y, {
            width: columnWidth,
            align: "left",
          });
          doc.text(status, 50 + columnWidth * 4, y, {
            width: columnWidth,
            align: "left",
          });

          y += 20;

          // Adicionar nova página se necessário
          if (y > doc.page.height - 50) {
            doc.addPage();
            y = 50;
          }
        }

        // Resumo
        doc.moveDown(2);
        const totalAmount = payments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(`Total: R$ ${totalAmount.toFixed(2)}`, { align: "right" });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generateCSV(
    payments: IPayment[],
    filename: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const fields = [
      { label: "ID", value: "_id" },
      {
        label: "Data",
        value: (row: IPayment) => new Date(row.date).toLocaleString(),
      },
      { label: "Valor", value: "amount" },
      {
        label: "Tipo",
        value: (row: IPayment) => this.translatePaymentType(row.type),
      },
      {
        label: "Método",
        value: (row: IPayment) =>
          this.translatePaymentMethod(row.paymentMethod),
      },
      {
        label: "Status",
        value: (row: IPayment) => this.translatePaymentStatus(row.status),
      },
      { label: "Descrição", value: "description" },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(payments);
    const buffer = Buffer.from(csv);

    return {
      buffer,
      contentType: "text/csv",
      filename: `${filename}.csv`,
    };
  }

  private async generateJSON(
    payments: IPayment[],
    filename: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const buffer = Buffer.from(JSON.stringify(payments, null, 2));

    return {
      buffer,
      contentType: "application/json",
      filename: `${filename}.json`,
    };
  }
}
