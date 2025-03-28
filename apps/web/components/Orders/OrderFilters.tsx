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
import { X, Calendar, Users, CreditCard, Beaker, AlertCircle } from "lucide-react";
import { useLaboratories } from "@/hooks/useLaboratories";
import { useEmployees } from "@/hooks/useEmployees";
import { Employee } from "@/app/types/employee";

export const OrderFilters = ({ onUpdateFilters }: any) => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState("all");
  const [dateError, setDateError] = useState<string | null>(null);
  
  const { laboratories, isLoading: isLoadingLabs } = useLaboratories();
  const { employees, isLoading: isLoadingEmployees } = useEmployees();

  // Função para obter todos os filtros atuais
  const getCurrentFilters = () => {
    const filters: Record<string, string> = {};
    
    if (selectedStatus && selectedStatus !== "all") {
      filters.status = selectedStatus;
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

  // Validar datas antes de aplicar o filtro
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

  // Efeito para aplicar filtros quando valores mudarem
  useEffect(() => {
    if (validateDates()) {
      console.log('Aplicando filtros via OrderFilters:', { 
        status: selectedStatus,
        employeeId: selectedEmployeeId,
        paymentMethod: selectedPaymentMethod,
        laboratoryId: selectedLaboratoryId,
        dateRange 
      });
      
      const newFilters = getCurrentFilters();
      onUpdateFilters(newFilters);
    }
  }, [selectedStatus, selectedEmployeeId, selectedPaymentMethod, selectedLaboratoryId, dateRange.startDate, dateRange.endDate]);

  // Função para limpar filtros
  const handleClearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setSelectedStatus("all");
    setSelectedEmployeeId("all");
    setSelectedPaymentMethod("all");
    setSelectedLaboratoryId("all");
    setDateError(null);
    
    onUpdateFilters({});
  };

  // Lista de métodos de pagamento
  const paymentMethods = [
    { value: "credit", label: "Cartão de Crédito" },
    { value: "debit", label: "Cartão de Débito" },
    { value: "cash", label: "Dinheiro" },
    { value: "pix", label: "PIX" },
    { value: "installment", label: "Parcelado" }
  ];

  return (
    <div className="bg-gray-50 p-3 rounded-md mb-3 border">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Filtros Avançados</h3>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleClearFilters}
          className="h-8 text-sm"
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
              className="h-9 pl-7 text-sm border-gray-200"
            />
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              className="h-9 pl-7 text-sm border-gray-200"
            />
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {/* Status */}
        <div className="space-y-1">
          <Label htmlFor="status" className="text-sm">Status</Label>
          <Select 
            value={selectedStatus} 
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger id="status" className="h-9 text-sm border-gray-200">
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_production">Em Produção</SelectItem>
              <SelectItem value="ready">Pronto</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Vendedor */}
        <div className="space-y-1">
          <Label htmlFor="employee" className="text-sm">Vendedor</Label>
          <div className="relative">
            <Select 
              value={selectedEmployeeId} 
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger id="employee" className="h-9 text-sm pl-7 border-gray-200">
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
            <Users className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {/* Método de Pagamento */}
        <div className="space-y-1">
          <Label htmlFor="paymentMethod" className="text-sm">Método de Pagamento</Label>
          <div className="relative">
            <Select 
              value={selectedPaymentMethod} 
              onValueChange={setSelectedPaymentMethod}
            >
              <SelectTrigger id="paymentMethod" className="h-9 text-sm pl-7 border-gray-200">
                <SelectValue placeholder="Selecione um método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os métodos</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CreditCard className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              <SelectTrigger id="laboratory" className="h-9 text-sm pl-7 border-gray-200">
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
            <Beaker className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
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