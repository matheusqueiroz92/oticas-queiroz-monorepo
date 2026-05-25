import { PDFDocument } from "pdf-lib";
import { SicrediService } from "./SicrediService";
import type { IPayment } from "../interfaces/IPayment";

export class OrderSicrediPdfService {
  private sicrediService: SicrediService;

  constructor() {
    this.sicrediService = new SicrediService();
  }

  async buildBoletosPdf(
    payments: IPayment[],
    serviceOrder?: string
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const withLinha = payments
      .filter((p) => p.bank_slip?.sicredi?.linhaDigitavel)
      .sort(
        (a, b) =>
          (a.bank_slip?.sicredi?.installmentNumber ?? 0) -
          (b.bank_slip?.sicredi?.installmentNumber ?? 0)
      );

    if (withLinha.length === 0) {
      throw new Error("Nenhum boleto emitido com linha digitável para exportar");
    }

    if (withLinha.length === 1) {
      const payment = withLinha[0];
      const buffer = await this.sicrediService.getBoletoPdf(
        payment.bank_slip!.sicredi!.linhaDigitavel!
      );
      return {
        buffer,
        filename: this.buildPdfFilename(serviceOrder),
        contentType: "application/pdf",
      };
    }

    const mergedPdf = await PDFDocument.create();

    for (const payment of withLinha) {
      const linha = payment.bank_slip!.sicredi!.linhaDigitavel!;
      const pdfBytes = await this.sicrediService.getBoletoPdf(linha);
      const sourceDoc = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(sourceDoc, sourceDoc.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    const buffer = Buffer.from(await mergedPdf.save());

    return {
      buffer,
      filename: this.buildPdfFilename(serviceOrder),
      contentType: "application/pdf",
    };
  }

  private buildPdfFilename(serviceOrder?: string): string {
    const base = serviceOrder ? `boletos-os-${serviceOrder}` : "boletos-pedido";
    return `${base}.pdf`;
  }
}
