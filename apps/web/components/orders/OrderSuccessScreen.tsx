import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, Download } from "lucide-react";
import OrderPdfExporter from "@/components/orders/exports/OrderPdfExporter";
import OrderSicrediBoletoSection from "@/components/orders/OrderSicrediBoletoSection";
import { resolveSicrediCustomerDataFromUser } from "@/app/_utils/resolveSicrediCustomerData";
import type { Customer } from "@/app/_types/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, translatePaymentMethod } from "@/app/_utils/formatters";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { downloadAllOrderBoletosPdf } from "@/app/_services/sicrediService";
import { useToast } from "@/hooks/useToast";

interface OrderSuccessScreenProps {
  form?: any;
  submittedOrder: any;
  selectedCustomer: Customer | null;
  customersData?: Customer[];
  onViewOrdersList: () => void;
  onViewOrderDetails: (id: string) => void;
  onCreateNewOrder: () => void;
  isEdit?: boolean;
}

function getPaymentMethodText(method?: string): string {
  if (!method || typeof method !== "string") return "Não especificado";
  return translatePaymentMethod(method);
}

function resolveSuccessFormData(form: any, submittedOrder: any) {
  const rawValues = form?.getValues?.();
  const fromForm =
    rawValues && typeof rawValues === "object" && !Array.isArray(rawValues)
      ? rawValues
      : null;

  return {
    paymentMethod: fromForm?.paymentMethod || submittedOrder?.paymentMethod || "",
    paymentEntry: fromForm?.paymentEntry ?? submittedOrder?.paymentEntry ?? 0,
    installments: fromForm?.installments ?? submittedOrder?.installments ?? 1,
    emitBoletosNow: fromForm?.emitBoletosNow ?? true,
    orderDate: fromForm?.orderDate || submittedOrder?.orderDate || new Date().toISOString(),
    deliveryDate: fromForm?.deliveryDate || submittedOrder?.deliveryDate || "",
    totalPrice: fromForm?.totalPrice ?? submittedOrder?.totalPrice ?? 0,
    discount: fromForm?.discount ?? submittedOrder?.discount ?? 0,
    finalPrice:
      fromForm?.finalPrice ??
      submittedOrder?.finalPrice ??
      submittedOrder?.totalPrice ??
      0,
    products: fromForm?.products?.length
      ? fromForm.products
      : submittedOrder?.products || [],
    clientId: fromForm?.clientId || submittedOrder?.clientId,
    employeeId: fromForm?.employeeId || submittedOrder?.employeeId,
    prescriptionData: fromForm?.prescriptionData || submittedOrder?.prescriptionData,
  };
}

function resolveClientInfo(
  selectedCustomer: Customer | null,
  submittedOrder: any,
  customersData: Customer[]
) {
  if (selectedCustomer) return selectedCustomer;
  if (submittedOrder?.client) return submittedOrder.client;
  if (typeof submittedOrder?.clientId === "object" && submittedOrder.clientId?.name) {
    return submittedOrder.clientId;
  }
  if (submittedOrder?.clientId && customersData.length > 0) {
    return customersData.find((c) => c._id === submittedOrder.clientId) ?? null;
  }
  return null;
}

function getProductLabel(product: any): string {
  if (typeof product === "object" && product !== null) {
    return product.name || product.productName || "Produto";
  }
  return "Produto";
}

export default function OrderSuccessScreen({
  form,
  submittedOrder,
  selectedCustomer,
  customersData = [],
  onViewOrdersList,
  onCreateNewOrder,
  isEdit = false,
}: OrderSuccessScreenProps) {
  const formData = resolveSuccessFormData(form, submittedOrder);

  const clientInfo = resolveClientInfo(selectedCustomer, submittedOrder, customersData);
  const clientName = clientInfo?.name || "Cliente não identificado";
  const paymentMethod = formData.paymentMethod;
  const isSicredi = paymentMethod === "sicredi_boleto";
  const products = formData.products;

  const sicrediResolved = clientInfo
    ? resolveSicrediCustomerDataFromUser(clientInfo as Customer)
    : { data: {}, isComplete: false, missingFields: ["cliente"] as string[] };

  const emitBoletosNow =
    formData.emitBoletosNow !== false;

  const { toast } = useToast();
  const [boletosCount, setBoletosCount] = useState(0);

  const handleDownloadBoletos = async () => {
    if (!submittedOrder?._id) return;
    try {
      const blob = await downloadAllOrderBoletosPdf(submittedOrder._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `boletos-os-${submittedOrder.serviceOrder || submittedOrder._id}.pdf`;
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

  return (
    <div className="page-shell-wide space-y-4">
      {/* Banner compacto */}
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
        <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-400">
            {isEdit ? "Pedido Atualizado com Sucesso!" : "Pedido Criado com Sucesso!"}
          </h2>
          <p className="text-sm text-green-700 dark:text-green-500 truncate">
            O.S. {submittedOrder?.serviceOrder || "N/A"} · ID{" "}
            {submittedOrder?._id?.substring(0, 8) || "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1 — Resumo do pedido */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Resumo do pedido</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="text-muted-foreground">O.S.</span>
                <p className="font-medium">{submittedOrder?.serviceOrder || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">ID</span>
                <p className="font-medium font-mono text-xs">
                  {submittedOrder?._id?.substring(0, 8) || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Pedido</span>
                <p className="font-medium">
                  {formData.orderDate
                    ? new Date(formData.orderDate).toLocaleDateString("pt-BR")
                    : "N/A"}
                </p>
              </div>
              {formData.deliveryDate && (
                <div>
                  <span className="text-muted-foreground">Entrega</span>
                  <p className="font-medium">
                    {new Date(formData.deliveryDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wide">
                Cliente
              </span>
              <p className="font-medium">{clientName}</p>
              {(clientInfo?.phone || clientInfo?.email) && (
                <p className="text-muted-foreground text-xs mt-0.5">
                  {[clientInfo?.phone, clientInfo?.email].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            {products.length > 0 && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">
                    Produtos ({products.length})
                  </span>
                  <ul className="mt-1 space-y-0.5">
                    {products.slice(0, 5).map((product: any, i: number) => (
                      <li key={i} className="flex justify-between gap-2 text-xs">
                        <span className="truncate">
                          {getProductLabel(product)}
                          {product?.quantity ? ` ×${product.quantity}` : ""}
                        </span>
                        {product?.price != null && (
                          <span className="shrink-0 text-muted-foreground">
                            {formatCurrency(Number(product.price) * (product.quantity || 1))}
                          </span>
                        )}
                      </li>
                    ))}
                    {products.length > 5 && (
                      <li className="text-xs text-muted-foreground">
                        +{products.length - 5} produto(s)
                      </li>
                    )}
                  </ul>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(formData.totalPrice) || 0)}</span>
              </div>
              {Number(formData.discount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto</span>
                  <span>-{formatCurrency(Number(formData.discount))}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span className="text-green-600">
                  {formatCurrency(
                    Number(formData.finalPrice) || Number(formData.totalPrice) || 0
                  )}
                </span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="text-muted-foreground">Pagamento</span>
                <p className="font-medium">{getPaymentMethodText(paymentMethod)}</p>
              </div>
              {Number(formData.paymentEntry) > 0 && (
                <div>
                  <span className="text-muted-foreground">Entrada</span>
                  <p className="font-medium">{formatCurrency(Number(formData.paymentEntry))}</p>
                </div>
              )}
              {Number(formData.installments) > 1 && (
                <div>
                  <span className="text-muted-foreground">Parcelas</span>
                  <p className="font-medium">{formData.installments}x</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Pagamento / Boletos */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {isSicredi ? "Boletos SICREDI" : "Detalhes do pagamento"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isSicredi && submittedOrder?._id ? (
              <OrderSicrediBoletoSection
                embedded
                compact
                mode="success"
                orderId={submittedOrder._id}
                serviceOrder={submittedOrder.serviceOrder}
                deliveryDate={formData.deliveryDate || submittedOrder.deliveryDate}
                finalPrice={
                  Number(formData.finalPrice) || Number(submittedOrder.finalPrice) || 0
                }
                paymentEntry={
                  Number(formData.paymentEntry) || Number(submittedOrder.paymentEntry) || 0
                }
                autoEmitOnMount={emitBoletosNow}
                addressComplete={sicrediResolved.isComplete}
                missingAddressFields={sicrediResolved.missingFields}
                customerDefaults={sicrediResolved.data}
                onBoletosCountChange={setBoletosCount}
              />
            ) : (
              <div className="text-sm space-y-2 text-muted-foreground">
                <p>
                  Forma: <span className="text-foreground font-medium">{getPaymentMethodText(paymentMethod)}</span>
                </p>
                {Number(formData.installments) > 1 && (
                  <p>
                    Parcelas:{" "}
                    <span className="text-foreground font-medium">
                      {formData.installments}x de{" "}
                      {formatCurrency(
                        (Number(formData.finalPrice) - Number(formData.paymentEntry || 0)) /
                          Number(formData.installments)
                      )}
                    </span>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações compactas */}
      <div className="flex flex-wrap gap-2 pt-1">
        {isSicredi && (
          <Button
            variant="outline"
            size="sm"
            disabled={boletosCount === 0}
            title={
              boletosCount === 0
                ? "Os boletos serão habilitados após a emissão automática"
                : undefined
            }
            onClick={handleDownloadBoletos}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Baixar PDF dos boletos
            {boletosCount > 0 ? ` (${boletosCount})` : ""}
          </Button>
        )}
        <OrderPdfExporter
          formData={{
            institutionId: submittedOrder?.institutionId ?? null,
            isInstitutionalOrder: submittedOrder?.isInstitutionalOrder ?? false,
            status: submittedOrder?.status ?? "pending",
            observations: submittedOrder?.observations ?? "",
            laboratoryId: submittedOrder?.laboratoryId,
            serviceOrder: submittedOrder?.serviceOrder || submittedOrder?.serviceNumber,
            ...formData,
            paymentMethod,
            _id: submittedOrder?._id,
          }}
          customer={clientInfo}
          buttonText="Baixar PDF do pedido"
          variant="outline"
          size="sm"
        />
        <Button variant="outline" size="sm" onClick={onViewOrdersList}>
          Ver lista de pedidos
        </Button>
        <Button size="sm" onClick={onCreateNewOrder}>
          Criar novo pedido
        </Button>
      </div>
    </div>
  );
}
