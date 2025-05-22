import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { DollarSign, ClipboardList } from "lucide-react";
  import type { ICashRegister } from "@/app/_types/cash-register";
  import { formatCurrency, formatDate } from "@/app/_utils/formatters";
  
  interface ActiveCashRegisterCardProps {
    register: ICashRegister;
    onViewDetails: (id: string) => void;
    onCloseCashRegister: (id: string) => void;
  }
  
  export function ActiveCashRegisterCard({ 
    register,
    onViewDetails,
    onCloseCashRegister
  }: ActiveCashRegisterCardProps) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-800 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Caixa Aberto
          </CardTitle>
          <CardDescription>
            Aberto em {formatDate(register.openingDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <div className="text-sm text-gray-500">Saldo Inicial</div>
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(register.openingBalance)}
              </div>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <div className="text-sm text-gray-500">Saldo Atual</div>
              <div className="text-lg font-bold text-green-700">
                {formatCurrency(register.currentBalance)}
              </div>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <div className="text-sm text-gray-500">Total de Vendas</div>
              <div className="text-lg font-bold text-gray-700">
                {formatCurrency(register.sales?.total || 0)}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onViewDetails(register._id)}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Detalhes
          </Button>
          <Button onClick={() => onCloseCashRegister(register._id)}>
            Fechar Caixa
          </Button>
        </CardFooter>
      </Card>
    );
  }