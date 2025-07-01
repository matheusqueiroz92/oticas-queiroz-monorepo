import { useState, useEffect, useCallback } from "react";
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
import { X, Calendar, Users, DollarSign, AlertCircle } from "lucide-react";

interface CustomerFiltersProps {
  onUpdateFilters: (filters: Record<string, any>) => void;
}

export const CustomerFilters = ({ onUpdateFilters }: CustomerFiltersProps) => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [selectedCustomerType, setSelectedCustomerType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPurchaseRange, setSelectedPurchaseRange] = useState("all");
  const [dateError, setDateError] = useState<string | null>(null);

  const getCurrentFilters = useCallback(() => {
    const filters: Record<string, string> = {
      sort: "name"
    };
    
    if (selectedCustomerType && selectedCustomerType !== "all") {
      filters.customerType = selectedCustomerType;
    }
    
    if (selectedStatus && selectedStatus !== "all") {
      filters.status = selectedStatus;
    }
    
    if (selectedPurchaseRange && selectedPurchaseRange !== "all") {
      filters.purchaseRange = selectedPurchaseRange;
    }
    
    if (dateRange.startDate) {
      filters.startDate = dateRange.startDate;
    }
    
    if (dateRange.endDate) {
      filters.endDate = dateRange.endDate;
    }
    
    return filters;
  }, [selectedCustomerType, selectedStatus, selectedPurchaseRange, dateRange.startDate, dateRange.endDate]);

  const validateDates = useCallback(() => {
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
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    if (validateDates()) {
      const newFilters = getCurrentFilters();
      onUpdateFilters(newFilters);
    }
  }, [validateDates, getCurrentFilters, onUpdateFilters]);

  const handleClearFilters = useCallback(() => {
    setDateRange({ startDate: '', endDate: '' });
    setSelectedCustomerType("all");
    setSelectedStatus("all");
    setSelectedPurchaseRange("all");
    setDateError(null);
    
    onUpdateFilters({ sort: "name" });
  }, [onUpdateFilters]);

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
          <Label htmlFor="startDate" className="text-sm">Data de Cadastro (Inicial)</Label>
          <div className="relative">
            <Input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                setDateError(null);
              }}
              className="h-9 pl-7 text-sm border-gray-200"
            />
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="endDate" className="text-sm">Data de Cadastro (Final)</Label>
          <div className="relative">
            <Input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                setDateError(null);
              }}
              className="h-9 pl-7 text-sm border-gray-200"
            />
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {/* Tipo de Cliente */}
        <div className="space-y-1">
          <Label htmlFor="customerType" className="text-sm">Tipo de Cliente</Label>
          <div className="relative">
            <Select 
              value={selectedCustomerType} 
              onValueChange={setSelectedCustomerType}
            >
              <SelectTrigger id="customerType" className="h-9 text-sm pl-7 border-gray-200">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="vip">VIP (5+ compras)</SelectItem>
                <SelectItem value="regular">Regular (1-4 compras)</SelectItem>
                <SelectItem value="new">Novo (sem compras)</SelectItem>
              </SelectContent>
            </Select>
            <Users className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {/* Status */}
        <div className="space-y-1">
          <Label htmlFor="status" className="text-sm">Status</Label>
          <div className="relative">
            <Select 
              value={selectedStatus} 
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger id="status" className="h-9 text-sm pl-7 border-gray-200">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
            <AlertCircle className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Faixa de Compras */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
        <div className="space-y-1">
          <Label htmlFor="purchaseRange" className="text-sm">Faixa de Compras</Label>
          <div className="relative">
            <Select 
              value={selectedPurchaseRange} 
              onValueChange={setSelectedPurchaseRange}
            >
              <SelectTrigger id="purchaseRange" className="h-9 text-sm pl-7 border-gray-200">
                <SelectValue placeholder="Selecione a faixa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as faixas</SelectItem>
                <SelectItem value="0">0 compras</SelectItem>
                <SelectItem value="1-2">1-2 compras</SelectItem>
                <SelectItem value="3-5">3-5 compras</SelectItem>
                <SelectItem value="6-10">6-10 compras</SelectItem>
                <SelectItem value="10+">10+ compras</SelectItem>
              </SelectContent>
            </Select>
            <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Erro de data */}
      {dateError && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {dateError}
        </div>
      )}
    </div>
  );
}; 