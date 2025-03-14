import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, ArrowUp, Filter } from "lucide-react";

import {
  paymentMethodOptions,
  orderStatusOptions,
  productCategoryOptions,
} from "@/app/types/report";
import type { ReportFilters } from "@/app/types/report";

interface ReportFiltersDisplayProps {
  filters: ReportFilters;
}

export function ReportFiltersDisplay({ filters }: ReportFiltersDisplayProps) {
  // Verificar se existem filtros aplicados
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filtros Aplicados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Nenhum filtro aplicado neste relatório.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  // Funções para obter o nome a partir do valor
  const getPaymentMethodLabel = (value: string) => {
    const option = paymentMethodOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const getOrderStatusLabel = (value: string) => {
    const option = orderStatusOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const getProductCategoryLabel = (value: string) => {
    const option = productCategoryOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Filter className="mr-2 h-4 w-4" />
          Filtros Aplicados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Período */}
        {(filters.startDate || filters.endDate) && (
          <div>
            <h3 className="text-sm font-medium mb-2">Período</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {filters.startDate && (
                <Badge variant="secondary" className="flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />A partir de:{" "}
                  {format(new Date(filters.startDate), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </Badge>
              )}
              {filters.endDate && (
                <Badge variant="secondary" className="flex items-center">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  Até:{" "}
                  {format(new Date(filters.endDate), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Status dos Pedidos */}
        {filters.status && filters.status.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Status dos Pedidos</h3>
            <div className="flex flex-wrap gap-2">
              {filters.status.map((status) => (
                <Badge key={status} variant="outline">
                  {getOrderStatusLabel(status)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Métodos de Pagamento */}
        {filters.paymentMethod && filters.paymentMethod.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Métodos de Pagamento</h3>
            <div className="flex flex-wrap gap-2">
              {filters.paymentMethod.map((method) => (
                <Badge key={method} variant="outline">
                  {getPaymentMethodLabel(method)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Categorias de Produtos */}
        {filters.productCategory && filters.productCategory.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Categorias de Produtos</h3>
            <div className="flex flex-wrap gap-2">
              {filters.productCategory.map((category) => (
                <Badge key={category} variant="outline">
                  {getProductCategoryLabel(category)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Valores Min/Max */}
        {(filters.minValue !== undefined || filters.maxValue !== undefined) && (
          <div>
            <h3 className="text-sm font-medium mb-2">Faixa de Valor</h3>
            <div className="flex flex-wrap gap-2">
              {filters.minValue !== undefined && (
                <Badge variant="outline">
                  Valor Mínimo: R$ {filters.minValue.toFixed(2)}
                </Badge>
              )}
              {filters.maxValue !== undefined && (
                <Badge variant="outline">
                  Valor Máximo: R$ {filters.maxValue.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
