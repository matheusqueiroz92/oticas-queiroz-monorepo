import { PDFDocument } from "pdf-lib";
import { OrderSicrediPdfService } from "../../../services/OrderSicrediPdfService";
import { SicrediService } from "../../../services/SicrediService";

jest.mock("../../../services/SicrediService");

describe("OrderSicrediPdfService", () => {
  let service: OrderSicrediPdfService;
  let mockGetBoletoPdf: jest.Mock;

  beforeEach(() => {
    mockGetBoletoPdf = jest.fn();
    (SicrediService as jest.Mock).mockImplementation(() => ({
      getBoletoPdf: mockGetBoletoPdf,
    }));
    service = new OrderSicrediPdfService();
  });

  it("should return single PDF when only one boleto exists", async () => {
    const pdfBuffer = Buffer.from("single-pdf");
    mockGetBoletoPdf.mockResolvedValue(pdfBuffer);

    const result = await service.buildBoletosPdf(
      [
        {
          bank_slip: {
            sicredi: { linhaDigitavel: "123", installmentNumber: 1 },
          },
        } as any,
      ],
      "300001"
    );

    expect(result.contentType).toBe("application/pdf");
    expect(result.filename).toBe("boletos-os-300001.pdf");
    expect(result.buffer).toEqual(pdfBuffer);
    expect(mockGetBoletoPdf).toHaveBeenCalledTimes(1);
  });

  it("should merge multiple PDFs into one file", async () => {
    const doc1 = await PDFDocument.create();
    doc1.addPage();
    const doc2 = await PDFDocument.create();
    doc2.addPage();
    doc2.addPage();

    mockGetBoletoPdf
      .mockResolvedValueOnce(Buffer.from(await doc1.save()))
      .mockResolvedValueOnce(Buffer.from(await doc2.save()));

    const result = await service.buildBoletosPdf(
      [
        {
          bank_slip: {
            sicredi: { linhaDigitavel: "111", installmentNumber: 2 },
          },
        } as any,
        {
          bank_slip: {
            sicredi: { linhaDigitavel: "222", installmentNumber: 1 },
          },
        } as any,
      ],
      "300002"
    );

    expect(result.contentType).toBe("application/pdf");
    expect(result.filename).toBe("boletos-os-300002.pdf");
    expect(mockGetBoletoPdf).toHaveBeenCalledTimes(2);

    const merged = await PDFDocument.load(result.buffer);
    expect(merged.getPageCount()).toBe(3);
  });

  it("should throw when no boleto has linha digitavel", async () => {
    await expect(service.buildBoletosPdf([{ bank_slip: {} } as any])).rejects.toThrow(
      "Nenhum boleto emitido com linha digitável para exportar"
    );
  });
});
