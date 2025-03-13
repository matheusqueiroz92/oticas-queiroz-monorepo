import { Card, CardContent } from "@/components/ui/card";
import type { ReportFilters } from "@/app/types/report";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/app/utils/formatters";

interface ReportFiltersDisplayProps {
  filters: ReportFilters;
}

export function ReportFiltersDisplay({ filters }: ReportFiltersDisplayProps) {
  // Verificar se há filtros aplicados
  const hasFilters =
    filters.startDate ||
    filters.endDate ||
    (filters.status && filters.status.length > 0) ||
    (filters.paymentMethod && filters.paymentMethod.length > 0) ||
    (filters.productCategory && filters.productCategory.length > 0) ||
    filters.minValue !== undefined ||
    filters.maxValue !== undefined;

  if (!hasFilters) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">
          Nenhum filtro aplicado neste relatório.
        </p>
      </div>
    );
  }

  // Mapear status para exibição amigável
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return statusMap[status] || status;
  };

  // Mapear métodos de pagamento para exibição amigável
  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
      pix: "PIX",
      installment: "Parcelado",
    };
    return methodMap[method] || method;
  };

  // Mapear categorias de produto para exibição amigável
  const getProductCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      grau: "Óculos de Grau",
      solar: "Óculos de Sol",
      lentes: "Lentes",
      acessorios: "Acessórios",
    };
    return categoryMap[category] || category;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filters.startDate && (
            <div>
              <h4 className="text-sm font-medium mb-1">Data Inicial</h4>
              <p className="text-sm">
                {format(new Date(filters.startDate), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          )}

          {filters.endDate && (
            <div>
              <h4 className="text-sm font-medium mb-1">Data Final</h4>
              <p className="text-sm">
                {format(new Date(filters.endDate), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          )}

          {filters.status && filters.status.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Status</h4>
              <div className="flex flex-wrap gap-1">
                {filters.status.map((status) => (
                  <span
                    key={status}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                  >
                    {getStatusLabel(status)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {filters.paymentMethod && filters.paymentMethod.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Formas de Pagamento</h4>
              <div className="flex flex-wrap gap-1">
                {filters.paymentMethod.map((method) => (
                  <span
                    key={method}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                  >
                    {getPaymentMethodLabel(method)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {filters.productCategory && filters.productCategory.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">
                Categorias de Produto
              </h4>
              <div className="flex flex-wrap gap-1">
                {filters.productCategory.map((category) => (
                  <span
                    key={category}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                  >
                    {getProductCategoryLabel(category)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(filters.minValue !== undefined ||
            filters.maxValue !== undefined) && (
            <div>
              <h4 className="text-sm font-medium mb-1">Faixa de Valor</h4>
              <p className="text-sm">
                {filters.minValue !== undefined &&
                filters.maxValue !== undefined
                  ? `De ${formatCurrency(filters.minValue)} até ${formatCurrency(
                      filters.maxValue
                    )}`
                  : filters.minValue !== undefined
                    ? `A partir de ${formatCurrency(filters.minValue)}`
                    : filters.maxValue !== undefined
                      ? `Até ${formatCurrency(filters.maxValue)}`
                      : ""}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
