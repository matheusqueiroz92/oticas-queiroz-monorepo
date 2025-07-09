import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Calendar, Users, CreditCard, Beaker, AlertCircle, DollarSign, BadgeCheck, Ban, Clock } from "lucide-react";
import { useLaboratories } from "@/hooks/useLaboratories";
import { useEmployees } from "@/hooks/useEmployees";
import { Employee } from "@/app/_types/employee";

interface OrderFiltersProps {
  onUpdateFilters: (filters: Record<string, any>) => void;
  hideEmployeeFilter?: boolean;
  hideClientFilter?: boolean;
}

export const OrderFilters = ({ 
  onUpdateFilters, 
  hideEmployeeFilter = false, 
}: OrderFiltersProps) => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState("all");
  const [dateError, setDateError] = useState<string | null>(null);
  
  const { laboratories, isLoading: isLoadingLabs } = useLaboratories();
  const { employees, isLoading: isLoadingEmployees } = useEmployees();

  const getCurrentFilters = () => {
    const filters: Record<string, string> = {
      sort: "-createdAt"
    };
    
    if (selectedPaymentStatus && selectedPaymentStatus !== "all") {
      filters.paymentStatus = selectedPaymentStatus;
    }
    
    if (selectedEmployeeId && selectedEmployeeId !== "all") {
      filters.employeeId = selectedEmployeeId;
    }
    
    if (selectedPaymentMethod && selectedPaymentMethod !== "all") {
      filters.paymentMethod = selectedPaymentMethod;
    }
    
    if (selectedLaboratoryId && selectedLaboratoryId !== "all") {
      filters.laboratoryId = selectedLaboratoryId;
    }
    
    if (dateRange.startDate) {
      filters.startDate = dateRange.startDate;
    }
    
    if (dateRange.endDate) {
      filters.endDate = dateRange.endDate;
    }
    
    return filters;
  };

  const validateDates = () => {
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      
      if (start > end) {
        setDateError("A data inicial não pode ser posterior à data final");
        return false;
      }
    }
    
    setDateError(null);
    return true;
  };

  useEffect(() => {
    if (validateDates()) {
      onUpdateFilters(getCurrentFilters());
    }
  }, [selectedPaymentStatus, selectedEmployeeId, selectedPaymentMethod, selectedLaboratoryId, dateRange.startDate, dateRange.endDate]);

  const handleClearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setSelectedPaymentStatus("all");
    setSelectedEmployeeId("all");
    setSelectedPaymentMethod("all");
    setSelectedLaboratoryId("all");
    setDateError(null);
    
    onUpdateFilters({ sort: "-createdAt" });
  };

  return (
    <div className="bg-card p-6 rounded-md mb-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Filtros Avançados</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleClearFilters}
          className="h-10 text-sm"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Limpar Filtros
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Datas */}
        <div className="space-y-1">
          <Label htmlFor="startDate" className="text-sm">Data Inicial</Label>
          <div className="relative">
            <Input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setDateRange({...dateRange, startDate: e.target.value});
                setDateError(null);
              }}
              className="h-9 pl-7 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
            />
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-300" />
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="endDate" className="text-sm">Data Final</Label>
          <div className="relative">
            <Input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => {
                setDateRange({...dateRange, endDate: e.target.value});
                setDateError(null);
              }}
              className="h-9 pl-7 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
            />
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-300" />
          </div>
        </div>

        {/* Vendedor */}
        {!hideEmployeeFilter && (
          <div className="space-y-1">
            <Label htmlFor="employee" className="text-sm">Vendedor</Label>
            <div className="relative">
              <Select 
                value={selectedEmployeeId} 
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger id="employee" className="h-9 text-sm pl-7 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white">
                  <SelectValue placeholder="Selecione um vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vendedores</SelectItem>
                  {isLoadingEmployees ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : (
                    employees.map((employee: Employee) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {employee.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Users className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-300" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
        {/* Método de Pagamento */}
        <div className="space-y-1">
          <Label htmlFor="paymentMethod" className="text-sm">Método de Pagamento</Label>
          <div className="relative">
            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger id="paymentMethod" className="h-9 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white">
                <SelectValue placeholder="Selecione um método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-500" />Todos os métodos de pagamento</span></SelectItem>
                <SelectItem value="credit"><span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-500" />Cartão de Crédito</span></SelectItem>
                <SelectItem value="debit"><span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-green-500" />Cartão de Débito</span></SelectItem>
                <SelectItem value="cash"><span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-yellow-600" />Dinheiro</span></SelectItem>
                <SelectItem value="pix"><span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-purple-500" />PIX</span></SelectItem>
                <SelectItem value="bank_slip"><span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-orange-500" />Boleto</span></SelectItem>
                <SelectItem value="promissory_note"><span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-500" />Nota Promissória</span></SelectItem>
                <SelectItem value="check"><span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-teal-500" />Cheque</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Laboratório */}
        <div className="space-y-1">
          <Label htmlFor="laboratory" className="text-sm">Laboratório</Label>
          <div className="relative">
            <Select 
              value={selectedLaboratoryId} 
              onValueChange={setSelectedLaboratoryId}
            >
              <SelectTrigger id="laboratory" className="h-9 text-sm pl-7 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white">
                <SelectValue placeholder="Selecione um laboratório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os laboratórios</SelectItem>
                {isLoadingLabs ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : (
                  laboratories.map((lab) => (
                    <SelectItem key={lab._id} value={lab._id}>
                      {lab.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Beaker className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-300" />
          </div>
        </div>

        {/* Status de Pagamento */}
        <div className="space-y-1">
          <Label htmlFor="paymentStatus" className="text-sm">Status de Pagamento</Label>
          <Select
            value={selectedPaymentStatus}
            onValueChange={setSelectedPaymentStatus}
          >
            <SelectTrigger id="paymentStatus" className="h-9 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white">
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all"><span className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-500" />Todos os Status de Pagamento</span></SelectItem>
              <SelectItem value="pending"><span className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-500" />Pendente</span></SelectItem>
              <SelectItem value="partially_paid"><span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-blue-500" />Parcialmente pago</span></SelectItem>
              <SelectItem value="paid"><span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" />Pago</span></SelectItem>
              <SelectItem value="cancelled"><span className="flex items-center gap-2"><Ban className="w-4 h-4 text-red-500" />Cancelado</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {dateError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {dateError}
        </div>
      )}
    </div>
  );
};