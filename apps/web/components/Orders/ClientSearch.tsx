import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Customer } from "@/app/types/customer";
import type { UseFormReturn } from "react-hook-form";
import type { OrderFormValues } from "@/app/types/form-types";

interface ClientSearchProps {
  customers: Customer[];
  form: UseFormReturn<OrderFormValues, any, undefined>;
  onClientSelect: (clientId: string, name: string) => void;
}

export default function ClientSearch({
  customers,
  form,
  onClientSelect,
}: ClientSearchProps) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers([]);
      return;
    }

    const searchLower = customerSearch.toLowerCase();
    const filtered = customers.filter((customer) =>
      customer.name?.toLowerCase().includes(searchLower)
    );
    setFilteredCustomers(filtered);

    setShowSuggestions(customerSearch.trim().length > 0);
  }, [customerSearch, customers]);

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
        <FormItem className="flex flex-col">
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
                {filteredCustomers.length > 0 ? (
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