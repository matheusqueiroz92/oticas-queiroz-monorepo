import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { Calendar, DollarSign, User } from "lucide-react";
  import type { ICashRegister } from "@/app/types/cash-register";
  import { formatCurrency, formatDate } from "@/app/utils/formatters";
  
  interface CashRegisterInfoCardProps {
    register: ICashRegister;
    title?: string;
  }
  
  export function CashRegisterInfoCard({
    register,
    title = "Dados do Caixa"
  }: CashRegisterInfoCardProps) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            {title}
            <Badge className={`ml-2 ${
              register.status === "open"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
            }`}>
              {register.status === "open" ? "Aberto" : "Fechado"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">
                    Data de Abertura
                  </div>
                  <div className="font-medium">
                    {formatDate(register.openingDate)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Saldo Inicial</div>
                  <div className="font-medium">
                    {formatCurrency(register.openingBalance)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-sm text-gray-500">Saldo Atual</div>
                  <div className="font-medium text-green-600">
                    {formatCurrency(register.currentBalance)}
                  </div>
                </div>
              </div>
            </div>
            {register.observations && (
              <div className="mt-4">
                <div className="text-sm text-gray-500">Observações</div>
                <div className="p-3 bg-gray-50 rounded-md mt-1 text-sm">
                  {register.observations}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }