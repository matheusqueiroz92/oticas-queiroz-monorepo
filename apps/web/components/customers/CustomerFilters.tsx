import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Calendar, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface CustomerFiltersProps {
  onUpdateFilters: (filters: Record<string, any>) => void;
  hasDebts?: boolean;
}

export const CustomerFilters = ({ onUpdateFilters, hasDebts: hasDebtsProp }: CustomerFiltersProps) => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [selectedCustomerType, setSelectedCustomerType] = useState("all");
  const [dateError, setDateError] = useState<string | null>(null);
  const [hasDebts, setHasDebts] = useState(hasDebtsProp ?? false);

  const getCurrentFilters = useCallback(() => {
    const filters: Record<string, string> = {
      sort: "name"
    };
    
    if (selectedCustomerType && selectedCustomerType !== "all") {
      filters.customerType = selectedCustomerType;
    }
    
    if (dateRange.startDate) {
      filters.startDate = dateRange.startDate;
    }
    
    if (dateRange.endDate) {
      filters.endDate = dateRange.endDate;
    }
    
    if (hasDebts) {
      filters.hasDebts = 'true';
    } else {
      filters.hasDebts = 'false';
    }
    
    return filters;
  }, [selectedCustomerType, dateRange.startDate, dateRange.endDate, hasDebts]);

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

  useEffect(() => {
    if (typeof hasDebtsProp === 'boolean') {
      setHasDebts(hasDebtsProp);
    }
  }, [hasDebtsProp]);

  const handleClearFilters = useCallback(() => {
    setDateRange({ startDate: '', endDate: '' });
    setSelectedCustomerType("all");
    setDateError(null);
    setHasDebts(false);
    
    onUpdateFilters({ sort: "name" });
  }, [onUpdateFilters]);                                            

  return (
    <div className="bg-card p-6">
      <div className="flex justify-between items-center                                            mb-2">
        <h3 className="text-lg font-medium">Filtros Avançados</h3>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
        >
          <X className="h-4 w-4" />
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
              className="h-9 pl-7 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
            />
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-300" />
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
              className="h-9 pl-7 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
            />
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-300" />
          </div>
        </div>
      </div>

      {/* Filtro de clientes com débitos */}
      <div className="flex items-end pb-1 mt-3">
        <Checkbox id="hasDebts" checked={hasDebts} onCheckedChange={checked => setHasDebts(checked === true)} />
        <Label htmlFor="hasDebts" className="ml-2 text-sm">Apenas clientes com débitos</Label>
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