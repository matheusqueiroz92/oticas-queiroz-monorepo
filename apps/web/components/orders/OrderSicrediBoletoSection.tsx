"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Copy,
  RefreshCw,
  Download,
  Ban,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import SicrediBoletoEmitForm from "@/components/orders/SicrediBoletoEmitForm";
import { useSicrediBoleto } from "@/hooks/payments/useSicrediBoleto";
import type { SicrediCustomerData, EmittedSicrediBoletoItem } from "@/app/_types/sicredi";
import type { IPayment } from "@/app/_types/payment";
import { formatCurrency } from "@/app/_utils/formatters";
import { useToast } from "@/hooks/useToast";
import { downloadAllOrderBoletosPdf } from "@/app/_services/sicrediService";
import { api } from "@/app/_services/authService";

interface OrderSicrediBoletoSectionProps {
  orderId: string;
  serviceOrder?: string;
  deliveryDate?: string | Date;
  finalPrice: number;
  paymentEntry?: number;
  autoEmitOnMount?: boolean;
  customerDefaults?: Partial<SicrediCustomerData>;
  addressComplete?: boolean;
  missingAddressFields?: string[];
  existingPayments?: IPayment[];
  embedded?: boolean;
  compact?: boolean;
  mode?: "success" | "details";
  onBoletosCountChange?: (count: number) => void;
}

function mapPaymentToBoletoItem(payment: IPayment): EmittedSicrediBoletoItem | null {
  const sicredi = payment.bank_slip?.sicredi;
  if (!sicredi?.nossoNumero) return null;
  return {
    payment,
    boleto: {
      nossoNumero: sicredi.nossoNumero,
      codigoBarras: sicredi.codigoBarras || "",
      linhaDigitavel: sicredi.linhaDigitavel || "",
      qrCode: sicredi.qrCode,
    },
    installmentNumber: sicredi.installmentNumber,
    installmentTotal: sicredi.installmentTotal,
  };
}

function getBoletoStatusInfo(payment: IPayment) {
  const sicrediStatus = payment.bank_slip?.sicredi?.status;
  if (payment.status === "completed" || sicrediStatus === "PAGO") {
    return { label: "Pago", tone: "paid" as const };
  }
  if (sicrediStatus === "VENCIDO") {
    return { label: "Vencido", tone: "overdue" as const };
  }
  if (sicrediStatus === "CANCELADO" || payment.status === "cancelled") {
    return { label: "Cancelado", tone: "cancelled" as const };
  }
  return { label: sicrediStatus || "Pendente", tone: "pending" as const };
}

function statusBadgeClass(tone: ReturnType<typeof getBoletoStatusInfo>["tone"]) {
  switch (tone) {
    case "paid":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-400";
    case "overdue":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-400";
    case "cancelled":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-400";
  }
}

async function fetchOrderPayments(orderId: string): Promise<IPayment[]> {
  const response = await api.get(`/api/orders/${orderId}/payments`);
  if (Array.isArray(response.data)) return response.data;
  if (response.data?.payments && Array.isArray(response.data.payments)) {
    return response.data.payments;
  }
  return [];
}

export default function OrderSicrediBoletoSection({
  orderId,
  serviceOrder,
  deliveryDate,
  finalPrice,
  paymentEntry = 0,
  autoEmitOnMount = false,
  customerDefaults,
  addressComplete = false,
  missingAddressFields = [],
  existingPayments = [],
  embedded = false,
  compact = false,
  mode = "success",
  onBoletosCountChange,
}: OrderSicrediBoletoSectionProps) {
  const { toast } = useToast();
  const {
    emitBoleto,
    isEmitting,
    checkStatus,
    isCheckingStatus,
    cancelBoleto,
    isCancelling,
    downloadPdf,
  } = useSicrediBoleto(orderId);

  const [boletos, setBoletos] = useState<EmittedSicrediBoletoItem[]>(() =>
    existingPayments
      .map(mapPaymentToBoletoItem)
      .filter((item): item is EmittedSicrediBoletoItem => item !== null)
  );
  const [autoEmitAttempted, setAutoEmitAttempted] = useState(false);
  const [emitModalOpen, setEmitModalOpen] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(mode === "details");

  const boletoAmount = Math.max(0, finalPrice - paymentEntry);
  const dataVencimento =
    deliveryDate instanceof Date
      ? deliveryDate.toISOString().split("T")[0]
      : deliveryDate
        ? new Date(deliveryDate).toISOString().split("T")[0]
        : undefined;

  const loadExistingBoletos = useCallback(async () => {
    if (mode !== "details") return;
    setIsLoadingPayments(true);
    try {
      const payments = await fetchOrderPayments(orderId);
      const sicrediItems = payments
        .filter((p) => p.paymentMethod === "sicredi_boleto")
        .map(mapPaymentToBoletoItem)
        .filter((item): item is EmittedSicrediBoletoItem => item !== null)
        .sort(
          (a, b) =>
            (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0)
        );
      setBoletos(sicrediItems);
    } catch {
      toast({
        title: "Erro ao carregar boletos",
        description: "Não foi possível carregar os boletos do pedido.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPayments(false);
    }
  }, [mode, orderId, toast]);

  useEffect(() => {
    if (mode === "details") {
      void loadExistingBoletos();
    }
  }, [mode, loadExistingBoletos]);

  useEffect(() => {
    onBoletosCountChange?.(boletos.length);
  }, [boletos.length, onBoletosCountChange]);

  const statusSummary = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let overdue = 0;
    for (const item of boletos) {
      const info = getBoletoStatusInfo(item.payment);
      if (info.tone === "paid") paid++;
      else if (info.tone === "overdue") overdue++;
      else if (info.tone === "pending") pending++;
    }
    return { paid, pending, overdue, total: boletos.length };
  }, [boletos]);

  const handleEmit = async (customerData: SicrediCustomerData) => {
    try {
      const result = await emitBoleto({ customerData, dataVencimento });
      const items: EmittedSicrediBoletoItem[] =
        result.boletos?.map((item) => ({
          payment: item.payment,
          boleto: item.boleto,
          installmentNumber: item.installmentNumber,
          installmentTotal: item.installmentTotal,
        })) ?? [
          {
            payment: result.payment,
            boleto: result.boleto,
          },
        ];
      setBoletos(items);
      setEmitModalOpen(false);
      if (mode === "details") {
        await loadExistingBoletos();
      }
    } catch {
      // toast via hook
    }
  };

  useEffect(() => {
    if (
      mode !== "success" ||
      !autoEmitOnMount ||
      autoEmitAttempted ||
      boletos.length > 0 ||
      !addressComplete ||
      !customerDefaults?.nome ||
      !customerDefaults?.cpfCnpj ||
      !customerDefaults?.endereco
    ) {
      return;
    }

    setAutoEmitAttempted(true);
    void handleEmit(customerDefaults as SicrediCustomerData);
  }, [
    mode,
    autoEmitOnMount,
    autoEmitAttempted,
    boletos.length,
    addressComplete,
    customerDefaults,
  ]);

  const handleDownloadAll = async () => {
    try {
      const blob = await downloadAllOrderBoletosPdf(orderId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `boletos-os-${serviceOrder || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Erro ao baixar boletos",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleCheckStatus = async (paymentId: string) => {
    await checkStatus(paymentId);
    if (mode === "details") {
      await loadExistingBoletos();
    }
  };

  const handleRefreshAll = async () => {
    for (const item of boletos) {
      if (item.payment._id) {
        await checkStatus(item.payment._id);
      }
    }
    if (mode === "details") {
      await loadExistingBoletos();
    }
  };

  const renderStatusSummary = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
      <div className="rounded-md border px-2 py-1.5 text-center">
        <div className="flex items-center justify-center gap-1 text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Pagos</span>
        </div>
        <p className="text-lg font-semibold">{statusSummary.paid}</p>
      </div>
      <div className="rounded-md border px-2 py-1.5 text-center">
        <div className="flex items-center justify-center gap-1 text-amber-600">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Pendentes</span>
        </div>
        <p className="text-lg font-semibold">{statusSummary.pending}</p>
      </div>
      <div className="rounded-md border px-2 py-1.5 text-center">
        <div className="flex items-center justify-center gap-1 text-red-600">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Vencidos</span>
        </div>
        <p className="text-lg font-semibold">{statusSummary.overdue}</p>
      </div>
    </div>
  );

  const renderBoletosTable = () => (
    <div className="overflow-x-auto rounded-md border scrollbar-thin">
      <table className="w-full min-w-[520px] text-xs">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground">
            <th className="px-2 py-1.5 text-left font-medium">Parcela</th>
            <th className="px-2 py-1.5 text-left font-medium">Valor</th>
            <th className="px-2 py-1.5 text-left font-medium">Vencimento</th>
            <th className="px-2 py-1.5 text-left font-medium">Status</th>
            <th className="px-2 py-1.5 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {boletos.map((item, index) => {
            const paymentId = item.payment._id;
            const statusInfo = getBoletoStatusInfo(item.payment);
            const dueDate = item.payment.bank_slip?.sicredi?.dataVencimento;
            const parcelLabel =
              item.installmentNumber && item.installmentTotal
                ? `${item.installmentNumber}/${item.installmentTotal}`
                : `${index + 1}`;

            return (
              <tr key={paymentId || index} className="border-b last:border-0">
                <td className="px-2 py-1.5 font-medium">{parcelLabel}</td>
                <td className="px-2 py-1.5">{formatCurrency(item.payment.amount)}</td>
                <td className="px-2 py-1.5">
                  {dueDate ? new Date(dueDate).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-2 py-1.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1 py-0 ${statusBadgeClass(statusInfo.tone)}`}
                  >
                    {statusInfo.label}
                  </Badge>
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex justify-end gap-1">
                    {item.boleto.linhaDigitavel && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Copiar linha digitável"
                        onClick={async () => {
                          await navigator.clipboard.writeText(item.boleto.linhaDigitavel);
                          toast({ title: "Linha digitável copiada" });
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {paymentId && item.boleto.linhaDigitavel && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Baixar PDF"
                        onClick={() => downloadPdf(paymentId, item.boleto.nossoNumero)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {paymentId && statusInfo.tone !== "cancelled" && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Consultar status"
                          onClick={() => handleCheckStatus(paymentId)}
                          disabled={isCheckingStatus}
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${isCheckingStatus ? "animate-spin" : ""}`}
                          />
                        </Button>
                        {statusInfo.tone !== "paid" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Cancelar boleto"
                            onClick={async () => {
                              await cancelBoleto({ paymentId, motivo: "APEDIDODOCLIENTE" });
                              if (mode === "details") {
                                await loadExistingBoletos();
                              } else {
                                setBoletos((prev) =>
                                  prev.filter((b) => b.payment._id !== paymentId)
                                );
                              }
                            }}
                            disabled={isCancelling}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderBoletosList = () => (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {mode === "details" && boletos.length > 0 && renderStatusSummary()}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        {!embedded && mode === "success" && (
          <span className="text-sm font-medium text-muted-foreground">
            {boletos.length} boleto(s) emitido(s)
          </span>
        )}
        {mode === "details" && boletos.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isCheckingStatus}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isCheckingStatus ? "animate-spin" : ""}`} />
            Atualizar status
          </Button>
        )}
        {boletos.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={embedded && mode === "success" ? "ml-auto" : ""}
            onClick={handleDownloadAll}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Baixar PDF ({boletos.length} págs.)
          </Button>
        )}
      </div>

      {(compact || mode === "details") && boletos.length > 0
        ? renderBoletosTable()
        : boletos.map((item, index) => {
            const paymentId = item.payment._id;
            const statusInfo = getBoletoStatusInfo(item.payment);
            const dueDate = item.payment.bank_slip?.sicredi?.dataVencimento;
            const parcelLabel =
              item.installmentNumber && item.installmentTotal
                ? `Parcela ${item.installmentNumber}/${item.installmentTotal}`
                : `Boleto ${index + 1}`;

            return (
              <div key={paymentId || index} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-medium text-sm">{parcelLabel}</span>
                  <Badge variant="outline" className={statusBadgeClass(statusInfo.tone)}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-sm">
                  Valor: {formatCurrency(item.payment.amount)} · Vencimento:{" "}
                  {dueDate ? new Date(dueDate).toLocaleDateString("pt-BR") : "—"}
                </p>
                {item.boleto.linhaDigitavel && (
                  <div className="p-2 bg-muted rounded-md break-all font-mono text-xs">
                    {item.boleto.linhaDigitavel}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {item.boleto.linhaDigitavel && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(item.boleto.linhaDigitavel);
                        toast({ title: "Linha digitável copiada" });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </Button>
                  )}
                  {paymentId && item.boleto.linhaDigitavel && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPdf(paymentId, item.boleto.nossoNumero)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
    </div>
  );

  const renderEmitForm = (inModal = false) => (
    <>
      {!embedded && !inModal && (
        <p className="text-sm text-muted-foreground mb-3">
          Saldo em boletos: {formatCurrency(boletoAmount)}
          {serviceOrder ? ` · O.S. ${serviceOrder}` : ""}
        </p>
      )}
      {autoEmitOnMount && !addressComplete && missingAddressFields.length > 0 && (
        <p className="text-sm text-amber-600 mb-3">
          Complete o cadastro do cliente ({missingAddressFields.join(", ")}) para emissão
          automática.
        </p>
      )}
      <SicrediBoletoEmitForm
        defaultValues={{
          nome: customerDefaults?.nome,
          cpfCnpj: customerDefaults?.cpfCnpj?.replace(/\D/g, ""),
          endereco: customerDefaults?.endereco,
        }}
        customerAddressAvailable={addressComplete}
        onSubmit={handleEmit}
        isLoading={isEmitting}
      />
    </>
  );

  const renderEmitModal = () => (
    <Dialog open={emitModalOpen} onOpenChange={setEmitModalOpen}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-2xl max-h-[90dvh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Emitir boletos SICREDI</DialogTitle>
          <DialogDescription>
            Saldo em boletos: {formatCurrency(boletoAmount)}
            {serviceOrder ? ` · O.S. ${serviceOrder}` : ""}
          </DialogDescription>
        </DialogHeader>
        {renderEmitForm(true)}
      </DialogContent>
    </Dialog>
  );

  if (mode === "details") {
    if (isLoadingPayments) {
      return (
        <Card className="border-blue-200 dark:border-blue-800 mt-4">
          <CardContent className="py-6 text-sm text-muted-foreground text-center">
            Carregando boletos...
          </CardContent>
        </Card>
      );
    }

    if (boletos.length === 0) {
      return (
        <>
          <Card className="border-blue-200 dark:border-blue-800 mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Boletos SICREDI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Nenhum boleto emitido para este pedido.
              </p>
              <Button type="button" onClick={() => setEmitModalOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Emitir boletos SICREDI
              </Button>
            </CardContent>
          </Card>
          {renderEmitModal()}
        </>
      );
    }

    return (
      <>
        <Card className="border-blue-200 dark:border-blue-800 mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Boletos SICREDI ({boletos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>{renderBoletosList()}</CardContent>
        </Card>
        {renderEmitModal()}
      </>
    );
  }

  // mode === "success"
  if (boletos.length > 0) {
    if (embedded) {
      return renderBoletosList();
    }

    return (
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Boletos SICREDI ({boletos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>{renderBoletosList()}</CardContent>
      </Card>
    );
  }

  if (embedded) {
    return renderEmitForm();
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Emitir boletos SICREDI
        </CardTitle>
      </CardHeader>
      <CardContent>{renderEmitForm()}</CardContent>
    </Card>
  );
}
