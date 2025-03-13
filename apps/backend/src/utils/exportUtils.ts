import Excel from "exceljs";
import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import type { IPayment } from "../interfaces/IPayment";
import type { ICashRegister } from "src/interfaces/ICashRegister";
import type { IOrder } from "../interfaces/IOrder";

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
  async exportOrders(
    orders: IOrder[],
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const filename = options.filename || `orders-export-${Date.now()}`;

    switch (options.format) {
      case "excel":
        return this.generateOrdersExcel(orders, filename, options.title);
      case "pdf":
        return this.generateOrdersPDF(orders, filename, options.title);
      case "csv":
        return this.generateOrdersCSV(orders, filename);
      default:
        return this.generateOrdersJSON(orders, filename);
    }
  }

  async exportOrdersSummary(
    summary: {
      date: string;
      totalOrders: number;
      ordersByStatus: {
        pending: number;
        in_production: number;
        ready: number;
        delivered: number;
        cancelled: number;
      };
      totalValue: number;
      ordersByType: {
        glasses: number;
        lensCleaner: number;
      };
      orders: IOrder[];
    },
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const filename = options.filename || `orders-summary-${summary.date}`;

    switch (options.format) {
      case "excel":
        return this.generateOrdersSummaryExcel(
          summary,
          filename,
          options.title
        );
      case "pdf":
        return this.generateOrdersSummaryPDF(summary, filename, options.title);
      case "csv":
        return this.generateOrdersSummaryCSV(summary, filename);
      default:
        return {
          buffer: Buffer.from(JSON.stringify(summary, null, 2)),
          contentType: "application/json",
          filename: `${filename}.json`,
        };
    }
  }

  async exportOrderDetails(
    order: IOrder,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const filename = options.filename || `order-details-${order._id}`;

    switch (options.format) {
      case "excel":
        return this.generateOrderDetailsExcel(order, filename, options.title);
      case "pdf":
        return this.generateOrderDetailsPDF(order, filename, options.title);
      case "csv":
        return this.generateOrderDetailsCSV(order, filename);
      default:
        return {
          buffer: Buffer.from(JSON.stringify(order, null, 2)),
          contentType: "application/json",
          filename: `${filename}.json`,
        };
    }
  }

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

  private async generateOrdersExcel(
    orders: IOrder[],
    filename: string,
    title?: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Pedidos");

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
      { header: "Cliente", key: "client", width: 25 },
      { header: "Funcionário", key: "employee", width: 25 },
      { header: "Tipo", key: "productType", width: 15 },
      { header: "Pagamento", key: "paymentMethod", width: 15 },
      { header: "Valor Total", key: "totalPrice", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Data de Entrega", key: "deliveryDate", width: 20 },
    ];

    // Formatação dos cabeçalhos
    worksheet.getRow(title ? 3 : 1).font = { bold: true };

    // Adicionar dados
    for (const order of orders) {
      const row = {
        _id: order._id,
        client: order.clientId || "",
        employee: order.employeeId || "",
        productType: this.translateProductType(order.productType),
        paymentMethod: order.paymentMethod,
        totalPrice: order.totalPrice,
        status: this.translateOrderStatus(order.status),
        deliveryDate: order.deliveryDate
          ? new Date(order.deliveryDate).toLocaleDateString()
          : "N/A",
      };
      worksheet.addRow(row);
    }

    // Formatação de células com valores monetários
    const priceColumn = worksheet.getColumn("totalPrice");
    priceColumn.numFmt = "R$ #,##0.00";

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: buffer as Buffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${filename}.xlsx`,
    };
  }

  private async generateOrdersSummaryExcel(
    summary: {
      date: string;
      totalOrders: number;
      ordersByStatus: {
        pending: number;
        in_production: number;
        ready: number;
        delivered: number;
        cancelled: number;
      };
      totalValue: number;
      ordersByType: {
        glasses: number;
        lensCleaner: number;
      };
      orders: IOrder[];
    },
    filename: string,
    title?: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Resumo de Pedidos");

    // Título do relatório
    const reportTitle = title || `Resumo de Pedidos - ${summary.date}`;
    worksheet.addRow([reportTitle]);
    worksheet.mergeCells("A1:F1");
    const titleCell = worksheet.getCell("A1");
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center" };
    worksheet.addRow([]);

    // Resumo geral
    worksheet.addRow(["Data", summary.date]);
    worksheet.addRow(["Total de Pedidos", summary.totalOrders]);
    worksheet.addRow(["Valor Total", `R$ ${summary.totalValue.toFixed(2)}`]);
    worksheet.addRow([]);

    // Pedidos por status
    worksheet.addRow(["Pedidos por Status"]);
    worksheet.mergeCells("A7:B7");
    worksheet.getCell("A7").font = { bold: true };

    worksheet.addRow(["Pendentes", summary.ordersByStatus.pending]);
    worksheet.addRow(["Em Produção", summary.ordersByStatus.in_production]);
    worksheet.addRow(["Prontos", summary.ordersByStatus.ready]);
    worksheet.addRow(["Entregues", summary.ordersByStatus.delivered]);
    worksheet.addRow(["Cancelados", summary.ordersByStatus.cancelled]);
    worksheet.addRow([]);

    // Pedidos por tipo
    worksheet.addRow(["Pedidos por Tipo"]);
    worksheet.mergeCells("A14:B14");
    worksheet.getCell("A14").font = { bold: true };

    worksheet.addRow(["Óculos", summary.ordersByType.glasses]);
    worksheet.addRow(["Limpa Lentes", summary.ordersByType.lensCleaner]);
    worksheet.addRow([]);

    // Lista de pedidos
    worksheet.addRow(["Lista de Pedidos"]);
    worksheet.mergeCells("A18:G18");
    worksheet.getCell("A18").font = { bold: true };

    worksheet.addRow([
      "ID",
      "Cliente",
      "Tipo",
      "Valor Total",
      "Status",
      "Data de Entrega",
      "Método de Pagamento",
    ]);

    for (const order of summary.orders) {
      worksheet.addRow([
        order._id,
        order.clientId || "",
        this.translateProductType(order.productType),
        order.totalPrice,
        this.translateOrderStatus(order.status),
        order.deliveryDate
          ? new Date(order.deliveryDate).toLocaleDateString()
          : "N/A",
        order.paymentMethod,
      ]);
    }

    // Formatação
    worksheet.getCell("C5").numFmt = "R$ #,##0.00";
    const priceColumn = worksheet.getColumn(4);
    priceColumn.numFmt = "R$ #,##0.00";

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: buffer as Buffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${filename}.xlsx`,
    };
  }

  private async generateOrderDetailsExcel(
    order: IOrder,
    filename: string,
    title?: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Detalhes do Pedido");

    // Título do relatório
    const reportTitle = title || `Detalhes do Pedido - ${order._id}`;
    worksheet.addRow([reportTitle]);
    worksheet.mergeCells("A1:C1");
    const titleCell = worksheet.getCell("A1");
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center" };
    worksheet.addRow([]);

    // Informações gerais
    worksheet.addRow(["ID", order._id]);
    worksheet.addRow(["Cliente", order.clientId || ""]);
    worksheet.addRow(["Funcionário", order.employeeId || ""]);
    worksheet.addRow(["Status", this.translateOrderStatus(order.status)]);
    worksheet.addRow([
      "Data de Criação",
      new Date(order.orderDate).toLocaleString(),
    ]);
    worksheet.addRow([
      "Data de Entrega",
      order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleString()
        : "N/A",
    ]);
    worksheet.addRow([]);

    // Informações do produto
    worksheet.addRow(["Informações do Produto"]);
    worksheet.mergeCells("A10:C10");
    worksheet.getCell("A10").font = { bold: true };

    worksheet.addRow([
      "Tipo de Produto",
      this.translateProductType(order.productType),
    ]);
    worksheet.addRow(["Produto", order.product]);

    if (order.productType === "glasses") {
      worksheet.addRow([
        "Tipo de Óculos",
        this.translateGlassesType(order.glassesType),
      ]);
      worksheet.addRow([
        "Armação",
        this.translateGlassesFrame(order.glassesFrame),
      ]);
      worksheet.addRow(["Tipo de Lente", order.lensType || "N/A"]);
    }

    worksheet.addRow([]);

    // Informações de pagamento
    worksheet.addRow(["Informações de Pagamento"]);
    worksheet.mergeCells("A16:C16");
    worksheet.getCell("A16").font = { bold: true };

    worksheet.addRow(["Método de Pagamento", order.paymentMethod]);
    worksheet.addRow(["Valor Total", `R$ ${order.totalPrice.toFixed(2)}`]);

    if (order.installments) {
      worksheet.addRow(["Parcelas", order.installments]);
    }

    if (order.paymentEntry) {
      worksheet.addRow([
        "Valor de Entrada",
        `R$ ${order.paymentEntry.toFixed(2)}`,
      ]);
    }

    worksheet.addRow([]);

    // Dados da prescrição (se existirem)
    if (order.prescriptionData) {
      worksheet.addRow(["Dados da Prescrição"]);
      worksheet.mergeCells("A22:C22");
      worksheet.getCell("A22").font = { bold: true };

      worksheet.addRow(["Médico", order.prescriptionData.doctorName]);
      worksheet.addRow(["Clínica", order.prescriptionData.clinicName]);
      worksheet.addRow([
        "Data da Consulta",
        new Date(order.prescriptionData.appointmentDate).toLocaleDateString(),
      ]);
      worksheet.addRow([]);

      worksheet.addRow(["Olho Esquerdo"]);
      worksheet.addRow(["SPH", order.prescriptionData.leftEye.sph]);
      worksheet.addRow(["CYL", order.prescriptionData.leftEye.cyl]);
      worksheet.addRow(["AXIS", order.prescriptionData.leftEye.axis]);
      worksheet.addRow([]);

      worksheet.addRow(["Olho Direito"]);
      worksheet.addRow(["SPH", order.prescriptionData.rightEye.sph]);
      worksheet.addRow(["CYL", order.prescriptionData.rightEye.cyl]);
      worksheet.addRow(["AXIS", order.prescriptionData.rightEye.axis]);
      worksheet.addRow([]);

      worksheet.addRow(["DNP", order.prescriptionData.nd]);
      worksheet.addRow(["Adição", order.prescriptionData.addition]);
    }

    // Formatação
    worksheet.getCell("B18").numFmt = "R$ #,##0.00";
    if (order.paymentEntry) {
      worksheet.getCell("B20").numFmt = "R$ #,##0.00";
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: buffer as Buffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${filename}.xlsx`,
    };
  }

  private async generateOrdersSummaryPDF(
    summary: {
      date: string;
      totalOrders: number;
      ordersByStatus: {
        pending: number;
        in_production: number;
        ready: number;
        delivered: number;
        cancelled: number;
      };
      totalValue: number;
      ordersByType: {
        glasses: number;
        lensCleaner: number;
      };
      orders: IOrder[];
    },
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
        const reportTitle = title || `Resumo de Pedidos - ${summary.date}`;
        doc.fontSize(20).text(reportTitle, { align: "center" });
        doc.moveDown();

        // Data de geração
        doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString()}`, {
          align: "right",
        });
        doc.moveDown(2);

        // Resumo geral
        doc.fontSize(16).text("Resumo Geral", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Data: ${summary.date}`);
        doc.text(`Total de Pedidos: ${summary.totalOrders}`);
        doc.text(`Valor Total: R$ ${summary.totalValue.toFixed(2)}`);
        doc.moveDown(2);

        // Pedidos por status
        doc.fontSize(16).text("Pedidos por Status", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Pendentes: ${summary.ordersByStatus.pending}`);
        doc.text(`Em Produção: ${summary.ordersByStatus.in_production}`);
        doc.text(`Prontos: ${summary.ordersByStatus.ready}`);
        doc.text(`Entregues: ${summary.ordersByStatus.delivered}`);
        doc.text(`Cancelados: ${summary.ordersByStatus.cancelled}`);
        doc.moveDown(2);

        // Pedidos por tipo
        doc.fontSize(16).text("Pedidos por Tipo", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Óculos: ${summary.ordersByType.glasses}`);
        doc.text(`Limpa Lentes: ${summary.ordersByType.lensCleaner}`);
        doc.moveDown(2);

        // Lista de pedidos
        doc.fontSize(16).text("Lista de Pedidos", { underline: true });
        doc.moveDown();

        // Limitar a lista a 20 pedidos para não sobrecarregar o PDF
        const ordersToShow = summary.orders.slice(0, 20);

        // Tabela de pedidos
        const tableTop = doc.y;
        const tableHeaders = ["ID", "Cliente", "Tipo", "Valor", "Status"];
        const columnWidth = 100;

        // Cabeçalho da tabela
        doc.fontSize(10).font("Helvetica-Bold");
        tableHeaders.forEach((header, i) => {
          doc.text(header, 50 + i * columnWidth, tableTop, {
            width: columnWidth,
            align: "left",
          });
        });

        // Linha separadora
        doc
          .moveTo(50, tableTop + 15)
          .lineTo(50 + tableHeaders.length * columnWidth, tableTop + 15)
          .stroke();

        // Dados
        doc.font("Helvetica");
        let y = tableTop + 25;

        for (const order of ordersToShow) {
          doc.text(`${order._id.substring(0, 8)}...`, 50, y, {
            width: columnWidth,
            align: "left",
          });
          doc.text(
            order.clientId ? `${order.clientId.substring(0, 8)}...` : "-",
            50 + columnWidth,
            y,
            {
              width: columnWidth,
              align: "left",
            }
          );
          doc.text(
            this.translateProductType(order.productType),
            50 + columnWidth * 2,
            y,
            {
              width: columnWidth,
              align: "left",
            }
          );
          doc.text(
            `R$ ${order.totalPrice.toFixed(2)}`,
            50 + columnWidth * 3,
            y,
            {
              width: columnWidth,
              align: "left",
            }
          );
          doc.text(
            this.translateOrderStatus(order.status),
            50 + columnWidth * 4,
            y,
            {
              width: columnWidth,
              align: "left",
            }
          );

          y += 20;

          // Adicionar nova página se necessário
          if (y > doc.page.height - 50) {
            doc.addPage();
            y = 50;
          }
        }

        // Nota sobre limitação
        if (summary.orders.length > 20) {
          doc.moveDown();
          doc.text(
            `Nota: Mostrando apenas os primeiros 20 de ${summary.orders.length} pedidos.`
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generateOrdersSummaryCSV(
    summary: {
      date: string;
      totalOrders: number;
      ordersByStatus: {
        pending: number;
        in_production: number;
        ready: number;
        delivered: number;
        cancelled: number;
      };
      totalValue: number;
      ordersByType: {
        glasses: number;
        lensCleaner: number;
      };
      orders: IOrder[];
    },
    filename: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    // Criar CSV com resumo
    let csv = `"Resumo de Pedidos - ${summary.date}"\n\n`;

    csv += '"Resumo Geral"\n';
    csv += `"Data","${summary.date}"\n`;
    csv += `"Total de Pedidos","${summary.totalOrders}"\n`;
    csv += `"Valor Total","R$ ${summary.totalValue.toFixed(2)}"\n\n`;

    csv += '"Pedidos por Status"\n';
    csv += `"Pendentes","${summary.ordersByStatus.pending}"\n`;
    csv += `"Em Produção","${summary.ordersByStatus.in_production}"\n`;
    csv += `"Prontos","${summary.ordersByStatus.ready}"\n`;
    csv += `"Entregues","${summary.ordersByStatus.delivered}"\n`;
    csv += `"Cancelados","${summary.ordersByStatus.cancelled}"\n\n`;

    csv += '"Pedidos por Tipo"\n';
    csv += `"Óculos","${summary.ordersByType.glasses}"\n`;
    csv += `"Limpa Lentes","${summary.ordersByType.lensCleaner}"\n\n`;

    csv += '"Lista de Pedidos"\n';
    csv +=
      '"ID","Cliente","Tipo","Valor Total","Status","Data de Entrega","Método de Pagamento"\n';

    // Adicionar dados dos pedidos
    for (const order of summary.orders) {
      csv += `"${order._id}",`;
      csv += `"${order.clientId || ""}",`;
      csv += `"${this.translateProductType(order.productType)}",`;
      csv += `"R$ ${order.totalPrice.toFixed(2)}",`;
      csv += `"${this.translateOrderStatus(order.status)}",`;
      csv += `"${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "N/A"}",`;
      csv += `"${order.paymentMethod}"\n`;
    }

    return {
      buffer: Buffer.from(csv),
      contentType: "text/csv",
      filename: `${filename}.csv`,
    };
  }

  private async generateOrderDetailsPDF(
    order: IOrder,
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
        const reportTitle = title || `Detalhes do Pedido - ${order._id}`;
        doc.fontSize(20).text(reportTitle, { align: "center" });
        doc.moveDown();

        // Data de geração
        doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString()}`, {
          align: "right",
        });
        doc.moveDown(2);

        // Informações gerais
        doc.fontSize(16).text("Informações Gerais", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`ID: ${order._id}`);
        doc.text(`Cliente: ${order.clientId || "N/A"}`);
        doc.text(`Funcionário: ${order.employeeId || "N/A"}`);
        doc.text(`Status: ${this.translateOrderStatus(order.status)}`);
        doc.text(
          `Data de Criação: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}`
        );
        doc.text(
          `Data de Entrega: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleString() : "N/A"}`
        );

        if (order.laboratoryId) {
          doc.text(`Laboratório: ${order.laboratoryId}`);
        }

        doc.moveDown(2);

        // Informações do produto
        doc.fontSize(16).text("Informações do Produto", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(
          `Tipo de Produto: ${this.translateProductType(order.productType)}`
        );
        doc.text(`Produto: ${order.product}`);

        if (order.productType === "glasses") {
          doc.text(
            `Tipo de Óculos: ${this.translateGlassesType(order.glassesType)}`
          );
          doc.text(
            `Armação: ${this.translateGlassesFrame(order.glassesFrame)}`
          );
          doc.text(`Tipo de Lente: ${order.lensType || "N/A"}`);
        }

        doc.moveDown(2);

        // Informações de pagamento
        doc.fontSize(16).text("Informações de Pagamento", { underline: true });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Método de Pagamento: ${order.paymentMethod}`);
        doc.text(`Valor Total: R$ ${order.totalPrice.toFixed(2)}`);

        if (order.installments) {
          doc.text(`Parcelas: ${order.installments}`);
        }

        if (order.paymentEntry) {
          doc.text(`Valor de Entrada: R$ ${order.paymentEntry.toFixed(2)}`);
        }

        doc.moveDown(2);

        // Dados da prescrição (se existirem)
        if (order.prescriptionData) {
          doc.fontSize(16).text("Dados da Prescrição", { underline: true });
          doc.moveDown();

          doc.fontSize(12);
          doc.text(`Médico: ${order.prescriptionData.doctorName}`);
          doc.text(`Clínica: ${order.prescriptionData.clinicName}`);
          doc.text(
            `Data da Consulta: ${new Date(order.prescriptionData.appointmentDate).toLocaleDateString()}`
          );
          doc.moveDown();

          doc.text("Olho Esquerdo:");
          doc.text(`SPH: ${order.prescriptionData.leftEye.sph}`);
          doc.text(`CYL: ${order.prescriptionData.leftEye.cyl}`);
          doc.text(`AXIS: ${order.prescriptionData.leftEye.axis}`);
          doc.moveDown();

          doc.text("Olho Direito:");
          doc.text(`SPH: ${order.prescriptionData.rightEye.sph}`);
          doc.text(`CYL: ${order.prescriptionData.rightEye.cyl}`);
          doc.text(`AXIS: ${order.prescriptionData.rightEye.axis}`);
          doc.moveDown();

          doc.text(`DNP: ${order.prescriptionData.nd}`);
          doc.text(`Adição: ${order.prescriptionData.addition}`);
        }

        // Observações (se existirem)
        if (order.observations) {
          doc.moveDown();
          doc.fontSize(16).text("Observações", { underline: true });
          doc.moveDown();
          doc.fontSize(12).text(order.observations);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generateOrderDetailsCSV(
    order: IOrder,
    filename: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    let csv = `"Detalhes do Pedido - ${order._id}"\n\n`;

    // Informações gerais
    csv += `"Informações Gerais"\n`;
    csv += `"ID","${order._id}"\n`;
    csv += `"Cliente","${order.clientId || "N/A"}"\n`;
    csv += `"Funcionário","${order.employeeId || "N/A"}"\n`;
    csv += `"Status","${this.translateOrderStatus(order.status)}"\n`;
    csv += `"Data de Criação","${order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}"\n`;
    csv += `"Data de Entrega","${order.deliveryDate ? new Date(order.deliveryDate).toLocaleString() : "N/A"}"\n`;

    if (order.laboratoryId) {
      csv += `"Laboratório","${order.laboratoryId}"\n`;
    }

    csv += "\n";

    // Informações do produto
    csv += `"Informações do Produto"\n`;
    csv += `"Tipo de Produto","${this.translateProductType(order.productType)}"\n`;
    csv += `"Produto","${order.product}"\n`;

    if (order.productType === "glasses") {
      csv += `"Tipo de Óculos","${this.translateGlassesType(order.glassesType)}"\n`;
      csv += `"Armação","${this.translateGlassesFrame(order.glassesFrame)}"\n`;
      csv += `"Tipo de Lente","${order.lensType || "N/A"}"\n`;
    }

    csv += "\n";

    // Informações de pagamento
    csv += `"Informações de Pagamento"\n`;
    csv += `"Método de Pagamento","${order.paymentMethod}"\n`;
    csv += `"Valor Total","R$ ${order.totalPrice.toFixed(2)}"\n`;

    if (order.installments) {
      csv += `"Parcelas","${order.installments}"\n`;
    }

    if (order.paymentEntry) {
      csv += `"Valor de Entrada","R$ ${order.paymentEntry.toFixed(2)}"\n`;
    }

    csv += "\n";

    // Dados da prescrição (se existirem)
    if (order.prescriptionData) {
      csv += `"Dados da Prescrição"\n`;
      csv += `"Médico","${order.prescriptionData.doctorName}"\n`;
      csv += `"Clínica","${order.prescriptionData.clinicName}"\n`;
      csv += `"Data da Consulta","${new Date(order.prescriptionData.appointmentDate).toLocaleDateString()}"\n`;

      csv += `\n"Olho Esquerdo"\n`;
      csv += `"SPH","${order.prescriptionData.leftEye.sph}"\n`;
      csv += `"CYL","${order.prescriptionData.leftEye.cyl}"\n`;
      csv += `"AXIS","${order.prescriptionData.leftEye.axis}"\n`;

      csv += `\n"Olho Direito"\n`;
      csv += `"SPH","${order.prescriptionData.rightEye.sph}"\n`;
      csv += `"CYL","${order.prescriptionData.rightEye.cyl}"\n`;
      csv += `"AXIS","${order.prescriptionData.rightEye.axis}"\n`;

      csv += "\n";
      csv += `"DNP","${order.prescriptionData.nd}"\n`;
      csv += `"Adição","${order.prescriptionData.addition}"\n`;
    }

    // Observações (se existirem)
    if (order.observations) {
      csv += `\n"Observações"\n`;
      csv += `"${order.observations}"\n`;
    }

    return {
      buffer: Buffer.from(csv),
      contentType: "text/csv",
      filename: `${filename}.csv`,
    };
  }

  private translateProductType(type: string): string {
    const types: Record<string, string> = {
      glasses: "Óculos",
      lensCleaner: "Limpa Lentes",
    };
    return types[type] || type;
  }

  private translateOrderStatus(status: string): string {
    const statuses: Record<string, string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return statuses[status] || status;
  }

  private translateGlassesType(type: string): string {
    const types: Record<string, string> = {
      prescription: "Grau",
      sunglasses: "Sol",
    };
    return types[type] || type;
  }

  private translateGlassesFrame(frame: string): string {
    const frames: Record<string, string> = {
      with: "Com armação",
      no: "Sem armação",
    };
    return frames[frame] || frame;
  }

  private async generateOrdersPDF(
    orders: IOrder[],
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
        const reportTitle = title || "Relatório de Pedidos";
        doc.fontSize(20).text(reportTitle, { align: "center" });
        doc.moveDown();

        // Data de geração
        doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString()}`, {
          align: "right",
        });
        doc.moveDown(2);

        // Cabeçalhos da tabela
        const tableTop = 150;
        const tableHeaders = ["ID", "Cliente", "Tipo", "Valor Total", "Status"];
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

        for (const order of orders) {
          const formattedValue = `R$ ${order.totalPrice.toFixed(2)}`;
          const type = this.translateProductType(order.productType);
          const status = this.translateOrderStatus(order.status);

          doc.text(`${order._id.substring(0, 10)}...`, 50, y, {
            width: columnWidth,
            align: "left",
          });
          doc.text(order.clientId || "", 50 + columnWidth, y, {
            width: columnWidth,
            align: "left",
          });
          doc.text(type, 50 + columnWidth * 2, y, {
            width: columnWidth,
            align: "left",
          });
          doc.text(formattedValue, 50 + columnWidth * 3, y, {
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
        const totalValue = orders.reduce(
          (sum, order) => sum + order.totalPrice,
          0
        );
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(`Total: R$ ${totalValue.toFixed(2)}`, { align: "right" });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generateOrdersCSV(
    orders: IOrder[],
    filename: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const fields = [
      { label: "ID", value: "_id" },
      { label: "Cliente", value: "clientId" },
      { label: "Funcionário", value: "employeeId" },
      {
        label: "Tipo de Produto",
        value: (row: IOrder) => this.translateProductType(row.productType),
      },
      { label: "Produto", value: "product" },
      { label: "Valor Total", value: "totalPrice" },
      {
        label: "Status",
        value: (row: IOrder) => this.translateOrderStatus(row.status),
      },
      {
        label: "Data de Entrega",
        value: (row: IOrder) =>
          row.deliveryDate
            ? new Date(row.deliveryDate).toLocaleDateString()
            : "N/A",
      },
      { label: "Método de Pagamento", value: "paymentMethod" },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(orders);
    const buffer = Buffer.from(csv);

    return {
      buffer,
      contentType: "text/csv",
      filename: `${filename}.csv`,
    };
  }

  private async generateOrdersJSON(
    orders: IOrder[],
    filename: string
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const buffer = Buffer.from(JSON.stringify(orders, null, 2));

    return {
      buffer,
      contentType: "application/json",
      filename: `${filename}.json`,
    };
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
