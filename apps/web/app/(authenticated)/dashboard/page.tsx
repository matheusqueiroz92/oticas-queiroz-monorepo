"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  DollarSign,
  FileText,
  UserPlus,
  AlertCircle,
  ShoppingBag,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const name = Cookies.get("name") || "";
    const role = Cookies.get("role") || "";

    setUserName(name);
    setUserRole(role);
  }, []);

  const isAdmin = userRole === "admin";
  const isEmployee = userRole === "employee";
  const isCustomer = userRole === "customer";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Sistema</CardTitle>
          <CardDescription>
            {userName ? `Olá, ${userName}! ` : ""}
            Acesse as funções do sistema através do menu lateral.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            O sistema de gerenciamento das Óticas Queiroz oferece diversas
            funcionalidades para facilitar o seu trabalho diário.
          </p>
        </CardContent>
      </Card>

      {/* Conteúdo específico para Admin */}
      {isAdmin && (
        <>
          <h2 className="text-xl font-semibold mt-8">Visão Geral da Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vendas Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">R$ 3.540,00</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-emerald-500">↑ 12%</span> em relação a
                  ontem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pedidos em Aberto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">24</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-red-500">↑ 5</span> desde ontem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Funcionários Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <UserPlus className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">8</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Em 3 filiais
                </p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-xl font-semibold mt-6">Top Vendedores</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    name: "João Silva",
                    sales: "R$ 15.240,00",
                    percentage: "32%",
                  },
                  {
                    name: "Maria Oliveira",
                    sales: "R$ 12.180,00",
                    percentage: "25%",
                  },
                  {
                    name: "Carlos Santos",
                    sales: "R$ 8.450,00",
                    percentage: "18%",
                  },
                ].map((seller, index) => (
                  <div
                    key={seller.name}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        {index + 1}
                      </div>
                      <div>{seller.name}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4">{seller.sales}</div>
                      <div className="text-emerald-500">
                        {seller.percentage}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Button variant="ghost" size="sm" asChild className="w-full">
                <Link href="/reports/sales">Ver Relatório Completo</Link>
              </Button>
            </CardFooter>
          </Card>
        </>
      )}

      {/* Conteúdo específico para Funcionários */}
      {isEmployee && (
        <>
          <h2 className="text-xl font-semibold mt-8">Acesso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Link href="/customers/new">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center">
                  <UserPlus className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-medium text-center">Novo Cliente</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/orders/new">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center">
                  <FileText className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-medium text-center">Novo Pedido</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/cash-register">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center">
                  <DollarSign className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-medium text-center">Caixa</h3>
                </CardContent>
              </Card>
            </Link>
          </div>

          <h2 className="text-xl font-semibold mt-8">Últimas Vendas</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    customer: "Ana Beatriz",
                    product: "Óculos de Grau",
                    value: "R$ 750,00",
                    date: "Hoje, 14:30",
                  },
                  {
                    customer: "Pedro Henrique",
                    product: "Óculos de Sol",
                    value: "R$ 520,00",
                    date: "Hoje, 11:15",
                  },
                  {
                    customer: "Luiza Souza",
                    product: "Lentes de Contato",
                    value: "R$ 320,00",
                    date: "Ontem, 16:45",
                  },
                ].map((sale) => (
                  <div
                    key={`${sale.customer}-${sale.product}`}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <div className="font-medium">{sale.customer}</div>
                      <div className="text-sm text-muted-foreground">
                        {sale.product}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{sale.value}</div>
                      <div className="text-sm text-muted-foreground">
                        {sale.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Button variant="ghost" size="sm" asChild className="w-full">
                <Link href="/orders">Ver Todas as Vendas</Link>
              </Button>
            </CardFooter>
          </Card>
        </>
      )}

      {/* Conteúdo específico para Clientes */}
      {isCustomer && (
        <>
          <h2 className="text-xl font-semibold mt-8">Seus Pedidos</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    product: "Óculos de Grau Modelo X",
                    status: "Em Produção",
                    date: "Entrega prevista: 10/03/2025",
                  },
                  {
                    product: "Lentes de Contato Y",
                    status: "Aguardando Retirada",
                    date: "Pronto desde: 25/02/2025",
                  },
                  {
                    product: "Armação de Óculos Z",
                    status: "Concluído",
                    date: "Entregue em: 15/01/2025",
                  },
                ].map((order) => (
                  <div
                    key={`${order.product}-${order.status}`}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <div className="font-medium">{order.product}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.date}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "Em Produção"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "Aguardando Retirada"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Button variant="ghost" size="sm" asChild className="w-full">
                <Link href="/my-orders">Ver Todos os Pedidos</Link>
              </Button>
            </CardFooter>
          </Card>

          <h2 className="text-xl font-semibold mt-8">Situação Financeira</h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Seu Saldo</CardTitle>
              <CardDescription>
                Resumo de suas pendências financeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span>Débito Atual</span>
                  </div>
                  <span className="font-bold text-red-500">R$ 280,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CalendarCheck className="h-5 w-5 text-yellow-500 mr-2" />
                    <span>Próximo Vencimento</span>
                  </div>
                  <span className="font-medium">10/03/2025</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <ShoppingBag className="h-5 w-5 text-green-500 mr-2" />
                    <span>Última Compra</span>
                  </div>
                  <span className="font-medium">20/02/2025</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Button variant="ghost" size="sm" asChild className="w-full">
                <Link href="/my-debts">Ver Extrato Completo</Link>
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
