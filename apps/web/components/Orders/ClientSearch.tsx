import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import type { Customer } from "@/app/types/customer";
import type { UseFormReturn } from "react-hook-form";
import type { OrderFormValues } from "@/app/types/form-types";
import { useToast } from "@/hooks/useToast";

interface ClientSearchProps {
  customers: Customer[];
  form: UseFormReturn<OrderFormValues, any, undefined>;
  onClientSelect: (clientId: string, name: string) => void;
  fetchAllCustomers: (searchQuery?: string) => Promise<Customer[]>;
  selectedCustomer?: Customer | null;
}

export default function ClientSearch({
  customers,
  form,
  onClientSelect,
  fetchAllCustomers,
  selectedCustomer,
}: ClientSearchProps) {
  const [customerSearch, setCustomerSearch] = useState(selectedCustomer?.name || "");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Adicionar este useEffect para atualizar o campo quando o cliente selecionado mudar
  useEffect(() => {
    if (selectedCustomer?.name) {
      setCustomerSearch(selectedCustomer.name);
    }
  }, [selectedCustomer]);

  // Efeito para buscar clientes quando o usuário digita
  useEffect(() => {
    // Função para buscar clientes usando o método fornecido
    const searchCustomers = async (query: string) => {
      if (!query.trim()) {
        setFilteredCustomers([]);
        return;
      }

      setIsSearching(true);
      try {
        // Buscar clientes usando o método otimizado
        const searchResults = await fetchAllCustomers(query);
        
        // Ordenar os resultados por nome
        const sortedCustomers = [...searchResults].sort((a, b) => 
          (a.name || '').localeCompare(b.name || '')
        );
        
        setFilteredCustomers(sortedCustomers);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        toast({
          variant: "destructive",
          title: "Erro na busca",
          description: "Não foi possível buscar clientes. Tente novamente."
        });
        setFilteredCustomers([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce para não fazer muitas requisições
    const delayDebounceFn = setTimeout(() => {
      if (customerSearch.trim().length >= 2) {
        searchCustomers(customerSearch);
        setShowSuggestions(true);
      } else if (customerSearch.trim()) {
        // Para buscas com 1 caractere, filtra apenas localmente
        const localFiltered = customers.filter((customer) =>
          customer.name?.toLowerCase().includes(customerSearch.toLowerCase())
        );
        setFilteredCustomers(localFiltered);
        setShowSuggestions(true);
      } else {
        setFilteredCustomers([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch, customers, toast, fetchAllCustomers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectCustomer = (customer: Customer) => {
    if (customer._id) {
      onClientSelect(customer._id, customer.name || "");
      setCustomerSearch(customer.name || "");
      setShowSuggestions(false);
    }
  };

  const handleNavigateToNewCustomer = () => {
    if (window) {
      window.localStorage.setItem('pendingOrderFormData', JSON.stringify(form.getValues()));
    }
    window.open('/customers/new', '_blank');
  };

  return (
    <FormField
      control={form.control}
      name="clientId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cliente</FormLabel>
          <div className="relative">
            <Input
              placeholder="Digite o nome do cliente"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onFocus={() => {
                if (customerSearch.trim().length > 0) {
                  setShowSuggestions(true);
                }
              }}
              aria-label="Buscar cliente"
            />
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
              >
                {isSearching ? (
                  <div className="p-3 text-center">
                    <Loader2 className="animate-spin h-5 w-5 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Buscando clientes...</p>
                  </div>
                ) : filteredCustomers.length > 0 ? (
                  <ul className="py-1">
                    {filteredCustomers.map((customer) => (
                      <li key={customer._id} className="p-0">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer"
                          onClick={() => handleSelectCustomer(customer)}
                          aria-label={`Selecionar cliente ${customer.name}`}
                        >
                          {customer.name}
                          {customer.phone && (
                            <span className="block text-xs text-gray-500">
                              {customer.phone}
                            </span>
                          )}
                          {customer.cpf && (
                            <span className="block text-xs text-gray-500">
                              CPF: {customer.cpf}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col p-3">
                    <div className="text-sm text-gray-500 mb-2">
                      Nenhum cliente encontrado com este nome.
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full text-blue-600 hover:text-blue-800"
                      onClick={handleNavigateToNewCustomer}
                    >
                      + Cadastrar novo cliente
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}