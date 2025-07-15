"use client";

import { useState, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { IPayment } from "@/app/_types/payment";
import {
  SalesPeriod,
  calculateSalesByPeriod,
  calculateWeeklySales,
  calculatePeriodStats,
  formatSalesValue,
  formatCompactValue,
  getPeriodLabel
} from "@/app/_utils/sales-utils";

interface SalesChartProps {
  payments: IPayment[];
  isLoading?: boolean;
}

export function SalesChart({ payments = [], isLoading = false }: SalesChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<SalesPeriod>(7);

  // Calcular dados do gráfico baseado no período selecionado
  const chartData = useMemo(() => {
    if (!payments.length) return [];
    
    // Para períodos longos, usar dados semanais
    if (selectedPeriod === 180) {
      return calculateWeeklySales(payments, selectedPeriod);
    }
    
    return calculateSalesByPeriod(payments, selectedPeriod);
  }, [payments, selectedPeriod]);

  // Calcular estatísticas do período
  const periodStats = useMemo(() => {
    return calculatePeriodStats(chartData);
  }, [chartData]);

  // Períodos disponíveis
  const periods: { value: SalesPeriod; label: string }[] = [
    { value: 7, label: "7 dias" },
    { value: 30, label: "30 dias" },
    { value: 180, label: "6 meses" }
  ];

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Vendas: <span className="font-semibold text-green-600">{formatSalesValue(data.sales)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Pedidos: <span className="font-semibold text-blue-600">{data.orders}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800/50">
          <CardTitle>Vendas por Período</CardTitle>
          <CardDescription>Análise de vendas ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="flex-1 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[420px] flex flex-col">
      <CardHeader className="border-b border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[var(--primary-blue)]" />
              Vendas por Período
            </CardTitle>
            <CardDescription>
              {getPeriodLabel(selectedPeriod)} - Análise de performance de vendas
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {periods.map(period => (
              <Button
                key={period.value}
                variant={"outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period.value)}
                className={selectedPeriod === period.value ? "bg-[var(--primary-blue)] text-white" : ""}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Estatísticas resumidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 mt-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total de Vendas</p>
            <p className="text-lg font-semibold text-green-600">
              {formatSalesValue(periodStats.totalSales)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total de Pedidos</p>
            <p className="text-lg font-semibold text-blue-600">
              {periodStats.totalOrders}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Média Diária</p>
            <p className="text-lg font-semibold">
              {formatSalesValue(periodStats.averageDailySales)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Crescimento</p>
            <div className="flex items-center gap-1">
              {periodStats.growthPercentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <p className={`text-lg font-semibold ${
                periodStats.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {periodStats.growthPercentage >= 0 ? '+' : ''}{periodStats.growthPercentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Melhor dia */}
        {periodStats.bestDay.sales > 0 && (
          <div className="mb-3">
            <Badge variant="secondary" className="flex items-center gap-2 w-fit">
              <DollarSign className="h-3 w-3" />
              Melhor dia: {periodStats.bestDay.label} - {formatSalesValue(periodStats.bestDay.sales)}
            </Badge>
          </div>
        )}

        {/* Gráfico */}
        <div className="flex-1 min-h-[160px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="label" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis 
                  className="text-muted-foreground"
                  fontSize={12}
                  tickFormatter={formatCompactValue}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma venda encontrada para este período</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 