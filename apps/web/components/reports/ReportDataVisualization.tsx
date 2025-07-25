"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TableIcon, BarChart2, AlertCircle } from "lucide-react";

import type { Report } from "@/app/_types/report";

interface ReportDataVisualizationProps {
  report: Report;
}

export function ReportDataVisualization({
  report,
}: ReportDataVisualizationProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  // Cores para os gráficos
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#A4DE6C",
    "#D0ED57",
  ];

  // Verificar se há dados disponíveis
  if (!report.data) {
    return (
      <Alert className="my-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Não há dados disponíveis para este relatório.
        </AlertDescription>
      </Alert>
    );
  }

  // Renderização baseada no tipo de relatório
  const renderSalesReport = () => {
    const data = report.data as any;

    if (!data || typeof data !== 'object') {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Dados do relatório inválidos ou em formato não suportado.
          </AlertDescription>
        </Alert>
      );
    }

    const periodData = Array.isArray(data.byPeriod) ? data.byPeriod : [];
    const paymentMethodData = data.byPaymentMethod && typeof data.byPaymentMethod === 'object' 
    ? Object.entries(data.byPaymentMethod).map(([name, value]) => ({
        name,
        value: typeof value === 'number' ? value : 0,
      }))
    : [];

    return (
      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="byPeriod">Por Período</TabsTrigger>
          <TabsTrigger value="byPaymentMethod">
            Por Método de Pagamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">
                  {data.totalSales?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </CardTitle>
                <CardDescription>Total de Vendas</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">
                  {data.averageSale?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </CardTitle>
                <CardDescription>Média por Venda</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{data.count || 0}</CardTitle>
                <CardDescription>Número de Vendas</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">
              Distribuição por Método de Pagamento
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="byPeriod">
          <div className="mt-4 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={periodData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Valor"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Quantidade"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="byPaymentMethod">
          <div className="mt-4 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paymentMethodData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                />
                <Legend />
                <Bar dataKey="value" name="Valor" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  const renderInventoryReport = () => {
    const data = report.data as any;

    // Preparar dados para gráficos
    const categoryData = data.byCategory || [];

    return (
      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="byCategory">Por Categoria</TabsTrigger>
          <TabsTrigger value="lowStock">Estoque Baixo</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">
                  {data.totalItems || 0}
                </CardTitle>
                <CardDescription>Total de Itens</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">
                  {data.totalValue?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </CardTitle>
                <CardDescription>Valor Total em Estoque</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="byCategory">
          <div className="mt-4 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                />
                <Legend />
                <Bar dataKey="value" name="Valor" fill="#8884d8" />
                <Bar dataKey="count" name="Quantidade" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="lowStock">
          <div className="mt-4">
            {data.lowStock && data.lowStock.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID do Produto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStock.map((item: any) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-mono">
                        {item.productId}
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-amber-600 font-medium">
                          {item.stock}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                Não há produtos com estoque baixo.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  const renderCustomersReport = () => {
    const data = report.data as any;

    // Preparar dados para gráficos
    const locationData = Object.entries(data.byLocation || {}).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    return (
      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="byLocation">Por Localização</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">
                  {data.totalCustomers || 0}
                </CardTitle>
                <CardDescription>Total de Clientes</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">
                  {data.newCustomers || 0}
                </CardTitle>
                <CardDescription>Novos Clientes</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">
                  {data.recurring || 0}
                </CardTitle>
                <CardDescription>Clientes Recorrentes</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">
                  {data.averagePurchase?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </CardTitle>
                <CardDescription>Compra Média</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="byLocation">
          <div className="mt-4 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {locationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  const renderOrdersReport = () => {
    const data = report.data as any;

    // Preparar dados para gráficos
    const statusData = Object.entries(data.byStatus || {}).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
    const periodData = data.byPeriod || [];

    return (
      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="byStatus">Por Status</TabsTrigger>
          <TabsTrigger value="byPeriod">Por Período</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">
                  {data.totalOrders || 0}
                </CardTitle>
                <CardDescription>Total de Pedidos</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">
                  {data.totalValue?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </CardTitle>
                <CardDescription>Valor Total</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">
                  {data.averageValue?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </CardTitle>
                <CardDescription>Valor Médio por Pedido</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="byStatus">
          <div className="mt-4 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="byPeriod">
          <div className="mt-4 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={periodData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "value") {
                      return value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      });
                    }
                    return value;
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  name="Quantidade"
                  stroke="#82ca9d"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="value"
                  name="Valor"
                  stroke="#8884d8"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  const renderFinancialReport = () => {
    const data = report.data as any;

    // Preparar dados para gráficos
    const categoryData = Object.entries(data.byCategory || {}).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
    const periodData = data.byPeriod || [];

    return (
      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="byCategory">Por Categoria</TabsTrigger>
          <TabsTrigger value="byPeriod">Por Período</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-green-600">
                  {data.revenue?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </CardTitle>
                <CardDescription>Receita</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-red-600">
                  {data.expenses?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </CardTitle>
                <CardDescription>Despesas</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle
                  className={`text-2xl ${data.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {data.profit?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }) || "R$ 0,00"}
                </CardTitle>
                <CardDescription>Lucro</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="byCategory">
          <div className="mt-4 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                />
                <Legend />
                <Bar dataKey="value" name="Valor" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="byPeriod">
          <div className="mt-4 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={periodData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Receita"
                  stroke="#82ca9d"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Despesas"
                  stroke="#ff7300"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Lucro"
                  stroke="#8884d8"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  // Alternar entre visualização de gráfico e tabela
  const toggleViewMode = () => {
    setViewMode(viewMode === "chart" ? "table" : "chart");
  };

  // Renderizar relatório com base no tipo
  const renderReportByType = () => {
    switch (report.type) {
      case "sales":
        return renderSalesReport();
      case "inventory":
        return renderInventoryReport();
      case "customers":
        return renderCustomersReport();
      case "orders":
        return renderOrdersReport();
      case "financial":
        return renderFinancialReport();
      default:
        return (
          <Alert className="my-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Tipo de relatório não suportado.
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleViewMode}
          className="flex items-center gap-2"
        >
          {viewMode === "chart" ? (
            <>
              <TableIcon className="h-4 w-4" />
              Ver como Tabela
            </>
          ) : (
            <>
              <BarChart2 className="h-4 w-4" />
              Ver como Gráfico
            </>
          )}
        </Button>
      </div>

      {renderReportByType()}
    </div>
  );
}
