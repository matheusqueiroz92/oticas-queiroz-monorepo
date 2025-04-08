import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import type { ICashRegister } from "@/app/types/cash-register";
  import { formatCurrency } from "@/app/utils/formatters";
  
  interface CashRegisterSummaryProps {
    register: ICashRegister;
    title?: string;
    description?: string;
  }
  
  export function CashRegisterSummary({
    register,
    title = "Resumo Financeiro",
    description
  }: CashRegisterSummaryProps) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm">Total de Vendas</span>
              <span className="font-medium text-green-600">
                {formatCurrency(register.sales?.total || 0)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm">Dinheiro</span>
              <span className="font-medium">
                {formatCurrency(register.sales?.cash || 0)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm">Cartão de Crédito</span>
              <span className="font-medium">
                {formatCurrency(register.sales?.credit || 0)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm">Cartão de Débito</span>
              <span className="font-medium">
                {formatCurrency(register.sales?.debit || 0)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm">PIX</span>
              <span className="font-medium">
                {formatCurrency(register.sales?.pix || 0)}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Saldo Final</span>
              <span>{formatCurrency(register.currentBalance)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }